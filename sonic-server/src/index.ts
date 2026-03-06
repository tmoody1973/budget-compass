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
/* EventQueue — AsyncIterable for dynamic event pushing                 */
/* ------------------------------------------------------------------ */

class EventQueue {
  private queue: Array<{ chunk: { bytes: Uint8Array } }> = [];
  private resolver: ((value: IteratorResult<any>) => void) | null = null;
  private closed = false;

  push(event: Record<string, unknown>) {
    const encoded = encodeEvent(event);
    if (this.resolver) {
      const resolve = this.resolver;
      this.resolver = null;
      resolve({ done: false, value: encoded });
    } else {
      this.queue.push(encoded);
    }
  }

  close() {
    this.closed = true;
    if (this.resolver) {
      this.resolver({ done: true, value: undefined });
      this.resolver = null;
    }
  }

  [Symbol.asyncIterator]() {
    return {
      next: (): Promise<IteratorResult<any>> => {
        if (this.queue.length > 0) {
          return Promise.resolve({ done: false, value: this.queue.shift()! });
        }
        if (this.closed) {
          return Promise.resolve({ done: true, value: undefined });
        }
        return new Promise((resolve) => {
          this.resolver = resolve;
        });
      },
    };
  }
}

/* ------------------------------------------------------------------ */
/* Express + Socket.IO setup                                            */
/* ------------------------------------------------------------------ */

const PORT = parseInt(process.env.SONIC_PORT ?? "3001", 10);
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

  let eventQueue: EventQueue | null = null;
  let isStreaming = false;
  let promptName = "";
  let audioContentName = "";

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
    eventQueue = new EventQueue();
    isStreaming = true;

    // Queue initial event sequence BEFORE sending the command
    // 1. Session start
    eventQueue.push(sessionStartEvent());

    // 2. Prompt start with tools + voice config
    eventQueue.push(
      promptStartEvent(promptName, TOOL_DEFINITIONS, { voiceId })
    );

    // 3. System prompt
    for (const evt of systemPromptEvents(promptName, getSystemPrompt(persona))) {
      eventQueue.push(evt);
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
        eventQueue.push(evt);
      }
    }

    // 5. Start audio input stream
    eventQueue.push(audioContentStart(promptName, audioContentName));

    socket.emit("sonic:ready");

    try {
      const command = new InvokeModelWithBidirectionalStreamCommand({
        modelId: "amazon.nova-sonic-v1:0",
        body: eventQueue as any, // AsyncIterable<{chunk:{bytes:Uint8Array}}>
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
              if (eventQueue) {
                for (const evt of toolResultEvents(promptName, currentToolUseId, result)) {
                  eventQueue.push(evt);
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
      console.error("[sonic] Session error:", err?.message);
      socket.emit("sonic:error", { message: err?.message ?? "Session error" });
    } finally {
      isStreaming = false;
      eventQueue?.close();
      eventQueue = null;
    }
  });

  // Forward browser audio to Bedrock via EventQueue
  socket.on("sonic:audio", (data: { audio: string }) => {
    if (!isStreaming || !eventQueue) return;
    eventQueue.push(
      audioInputEvent(promptName, audioContentName, data.audio)
    );
  });

  // Clean shutdown
  socket.on("sonic:stop", () => {
    console.log(`[sonic] Stopping session for ${socket.id}`);
    isStreaming = false;
    if (eventQueue) {
      try {
        for (const evt of closeEvents(promptName, audioContentName)) {
          eventQueue.push(evt);
        }
      } catch {
        // best-effort
      }
      // Give a brief moment for close events to flush, then close the queue
      setTimeout(() => {
        eventQueue?.close();
        eventQueue = null;
      }, 500);
    }
    socket.emit("sonic:end");
  });

  socket.on("disconnect", () => {
    console.log(`[sonic] Client disconnected: ${socket.id}`);
    isStreaming = false;
    eventQueue?.close();
    eventQueue = null;
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
