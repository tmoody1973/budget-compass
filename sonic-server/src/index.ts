/**
 * Budget Compass Sonic Bridge Server
 *
 * Express + Socket.IO server bridging browser audio to Amazon Nova Sonic
 * via bidirectional HTTP/2 streaming with mid-conversation tool calling.
 *
 * Architecture:
 *   Browser ↔ Socket.IO ↔ this server ↔ HTTP/2 bidi stream ↔ Nova Sonic
 *
 * Key insight from AWS docs: The `body` param of
 * InvokeModelWithBidirectionalStreamCommand must be an AsyncIterable
 * yielding { chunk: { bytes: Uint8Array } }. We use an EventQueue that
 * lets us push events dynamically during the session.
 *
 * @see https://docs.aws.amazon.com/nova/latest/userguide/speech-bidirection.html
 */

import express from "express";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import cors from "cors";
import crypto from "crypto";
import {
  BedrockRuntimeClient,
  InvokeModelWithBidirectionalStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { NodeHttp2Handler } from "@smithy/node-http-handler";

import {
  sessionStartEvent,
  promptStartEvent,
  systemPromptEvents,
  contextEvents,
  audioContentStart,
  audioInputEvent,
  toolResultEvents,
  closeEvents,
  encodeEvent,
} from "./events.js";
import { TOOL_DEFINITIONS, executeTool } from "./tools.js";
import { getSystemPrompt, getBudgetContext } from "./prompts.js";

/* ------------------------------------------------------------------ */
/* EventChannel — async generator with push/close for bidi streaming    */
/* ------------------------------------------------------------------ */

interface EventChannel {
  iterable: AsyncGenerator<{ chunk: { bytes: Uint8Array } }>;
  push: (encoded: { chunk: { bytes: Uint8Array } }) => void;
  close: () => void;
}

interface EventTrace {
  kind: string;
  bytes: number;
  preview: string;
  ts: string;
}

function normalizeBase64Audio(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const stripped = input
    .replace(/^data:audio\/[^;]+;base64,/, "")
    .replace(/\s+/g, "");
  if (!stripped) return null;
  if (stripped.length % 4 !== 0) return null;
  if (/[^A-Za-z0-9+/=]/.test(stripped)) return null;

  try {
    // Canonicalize and verify it's decodable base64 before forwarding to Bedrock.
    return Buffer.from(stripped, "base64").toString("base64");
  } catch {
    return null;
  }
}

function createEventChannel(): EventChannel {
  const queue: Array<{ chunk: { bytes: Uint8Array } }> = [];
  let resolver: (() => void) | null = null;
  let closed = false;

  async function* generator() {
    while (true) {
      while (queue.length > 0) {
        yield queue.shift()!;
      }
      if (closed) return;
      await new Promise<void>((r) => { resolver = r; });
    }
  }

  function push(encoded: { chunk: { bytes: Uint8Array } }) {
    queue.push(encoded);
    if (resolver) {
      const r = resolver;
      resolver = null;
      r();
    }
  }

  function close() {
    closed = true;
    if (resolver) {
      const r = resolver;
      resolver = null;
      r();
    }
  }

  return { iterable: generator(), push, close };
}

/* ------------------------------------------------------------------ */
/* Express + Socket.IO setup                                            */
/* ------------------------------------------------------------------ */

const PORT = parseInt(process.env.PORT ?? process.env.SONIC_PORT ?? "3001", 10);
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  process.env.PRODUCTION_URL,
].filter(Boolean) as string[];

const app = express();
app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json());

const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: { origin: ALLOWED_ORIGINS, methods: ["GET", "POST"] },
  maxHttpBufferSize: 1e6, // 1MB for audio chunks
});

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "sonic-bridge" });
});

/* ------------------------------------------------------------------ */
/* Bedrock client with HTTP/2                                           */
/* ------------------------------------------------------------------ */

function createBedrockClient() {
  return new BedrockRuntimeClient({
    region: process.env.AWS_REGION ?? "us-east-1",
    requestHandler: new NodeHttp2Handler({
      requestTimeout: 300_000,
      sessionTimeout: 300_000,
    }),
  });
}

/* ------------------------------------------------------------------ */
/* Socket.IO connection handler                                         */
/* ------------------------------------------------------------------ */

io.on("connection", (socket) => {
  console.log(`[sonic] Client connected: ${socket.id}`);

  let channel: EventChannel | null = null;
  let isStreaming = false;
  let promptName = "";
  let audioContentName = "";
  const recentEvents: EventTrace[] = [];

  const rememberEvent = (kind: string, event: Record<string, unknown>) => {
    const serialized = JSON.stringify(event);
    recentEvents.push({
      kind,
      bytes: Buffer.byteLength(serialized, "utf8"),
      preview: serialized.slice(0, 220),
      ts: new Date().toISOString(),
    });
    if (recentEvents.length > 12) {
      recentEvents.shift();
    }
  };

  const pushEvent = (kind: string, evt: Record<string, unknown>) => {
    if (!channel) return;
    rememberEvent(kind, evt);
    channel.push(encodeEvent(evt));
  };

  socket.on("sonic:start", async (config: {
    persona?: string;
    voiceId?: string;
    assessedValue?: number;
    totalTax?: number;
    jurisdictions?: any[];
  }) => {
    const persona = config.persona ?? "citizen";
    const voiceId = config.voiceId ?? "tiffany";
    promptName = crypto.randomUUID();
    audioContentName = crypto.randomUUID();

    console.log(`[sonic] Starting session for ${socket.id}, persona: ${persona}, voice: ${voiceId}`);

    const bedrockClient = createBedrockClient();
    channel = createEventChannel();
    isStreaming = true;

    // Queue initial event sequence BEFORE sending the command
    // 1. Session start
    pushEvent("sessionStart", sessionStartEvent());

    // 2. Prompt start with tools + voice config
    pushEvent(
      "promptStart",
      promptStartEvent(promptName, TOOL_DEFINITIONS, { voiceId })
    );

    // 3. System prompt
    for (const evt of systemPromptEvents(promptName, getSystemPrompt(persona))) {
      pushEvent("systemPrompt", evt);
    }

    // 4. Budget context (if provided)
    if (config.assessedValue && config.totalTax) {
      for (const evt of contextEvents(
        promptName,
        getBudgetContext({
          assessedValue: config.assessedValue,
          totalTax: config.totalTax,
          jurisdictions: config.jurisdictions ?? [],
        })
      )) {
        pushEvent("context", evt);
      }
    }

    // 5. Start audio input stream
    pushEvent("audioContentStart", audioContentStart(promptName, audioContentName));

    socket.emit("sonic:ready");

    try {
      const command = new InvokeModelWithBidirectionalStreamCommand({
        modelId: "amazon.nova-sonic-v1:0",
        body: channel.iterable as any, // AsyncGenerator<{chunk:{bytes:Uint8Array}}>
      });

      const response = await bedrockClient.send(command);

      if (!response.body) {
        socket.emit("sonic:error", { message: "No response body from Bedrock" });
        return;
      }

      // Process output events from Bedrock
      let currentToolUseId = "";
      let currentToolName = "";
      let toolInputBuffer = "";

      for await (const rawChunk of response.body as AsyncIterable<any>) {
        if (!isStreaming) break;

        try {
          // Decode: { chunk: { bytes: Uint8Array } } → JSON event
          let event: any;
          if (rawChunk?.chunk?.bytes) {
            const text = new TextDecoder().decode(rawChunk.chunk.bytes);
            const parsed = JSON.parse(text);
            event = parsed?.event ?? parsed;
          } else {
            event = rawChunk;
          }

          if (!event) continue;

          // Audio output
          if (event.audioOutput) {
            socket.emit("sonic:audio", {
              audio: event.audioOutput.content,
            });
          }

          // Text output (assistant transcript)
          if (event.textOutput) {
            socket.emit("sonic:transcript", {
              text: event.textOutput.content,
              role: "assistant",
            });
          }

          // contentStart with type AUDIO + role USER = user speech transcript follows
          // (Nova Sonic sends user transcript as textOutput too)

          // Tool use event
          if (event.toolUse) {
            currentToolUseId = event.toolUse.toolUseId ?? "";
            currentToolName = event.toolUse.toolName ?? "";
            toolInputBuffer = event.toolUse.content ?? "";

            socket.emit("sonic:tool-use", {
              toolName: currentToolName,
              status: "start",
            });
          }

          // contentEnd with stopReason
          if (event.contentEnd) {
            const stopReason = event.contentEnd.stopReason;

            if (stopReason === "TOOL_USE" && currentToolUseId) {
              socket.emit("sonic:tool-use", {
                toolName: currentToolName,
                status: "executing",
              });

              // Parse tool input and execute
              let toolInput: Record<string, unknown> = {};
              try {
                toolInput = JSON.parse(toolInputBuffer || "{}");
              } catch {
                toolInput = {};
              }

              console.log(`[sonic] Executing tool: ${currentToolName}`, JSON.stringify(toolInput).slice(0, 200));
              const result = await executeTool(currentToolName, toolInput);
              console.log(`[sonic] Tool result: ${result.length} chars`);

              // Send tool result back into the stream
              if (channel) {
                for (const evt of toolResultEvents(promptName, currentToolUseId, result)) {
                  pushEvent("toolResult", evt);
                }
              }

              socket.emit("sonic:tool-use", {
                toolName: currentToolName,
                status: "complete",
              });

              currentToolUseId = "";
              currentToolName = "";
              toolInputBuffer = "";
            }
          }

          // completionEnd — turn is done
          if (event.completionEnd) {
            socket.emit("sonic:turn-end");
          }

          // Usage stats
          if (event.usageEvent) {
            console.log(`[sonic] Tokens — in: ${event.usageEvent.totalInputTokens}, out: ${event.usageEvent.totalOutputTokens}`);
          }

        } catch (eventErr: any) {
          console.error("[sonic] Error processing output event:", eventErr?.message);
        }
      }

      // Stream ended naturally
      socket.emit("sonic:end");

    } catch (err: any) {
      const details = {
        name: err?.name,
        message: err?.message,
        metadata: err?.$metadata,
        requestId: err?.$metadata?.requestId,
        statusCode: err?.$metadata?.httpStatusCode,
        lastEvents: recentEvents,
      };
      console.error("[sonic] Session error:", JSON.stringify(details));
      socket.emit("sonic:error", {
        message: err?.message ?? "Session error",
        code: err?.name ?? "UnknownError",
        requestId: err?.$metadata?.requestId,
        lastEvent: recentEvents[recentEvents.length - 1] ?? null,
      });
    } finally {
      isStreaming = false;
      channel?.close();
      channel = null;
    }
  });

  // Forward browser audio to Bedrock via EventChannel
  socket.on("sonic:audio", (data: { audio: string }) => {
    if (!isStreaming || !channel) return;
    const normalizedAudio = normalizeBase64Audio(data?.audio);
    if (!normalizedAudio) {
      console.warn("[sonic] Dropping invalid audio chunk (non-base64 or empty)");
      return;
    }
    pushEvent("audioInput", audioInputEvent(promptName, audioContentName, normalizedAudio));
  });

  // Clean shutdown
  socket.on("sonic:stop", () => {
    console.log(`[sonic] Stopping session for ${socket.id}`);
    isStreaming = false;
    if (channel) {
      try {
        for (const evt of closeEvents(promptName, audioContentName)) {
          pushEvent("close", evt);
        }
      } catch {
        // best-effort
      }
      // Give a brief moment for close events to flush, then close the channel
      setTimeout(() => {
        channel?.close();
        channel = null;
      }, 500);
    }
    socket.emit("sonic:end");
  });

  socket.on("disconnect", () => {
    console.log(`[sonic] Client disconnected: ${socket.id}`);
    isStreaming = false;
    channel?.close();
    channel = null;
  });
});

/* ------------------------------------------------------------------ */
/* Start server                                                         */
/* ------------------------------------------------------------------ */

httpServer.listen(PORT, () => {
  console.log(`[sonic] Bridge server running on port ${PORT}`);
  console.log(`[sonic] Allowed origins: ${ALLOWED_ORIGINS.join(", ")}`);
  console.log(`[sonic] AWS region: ${process.env.AWS_REGION ?? "us-east-1"}`);
});
