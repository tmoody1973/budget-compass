import { NextRequest } from "next/server";
import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { MastraAgent } from "@ag-ui/mastra";
import { mastra } from "../../../mastra";

export const maxDuration = 60;

/**
 * Strip Nova's spontaneous <thinking>...</thinking> tags from SSE stream.
 * Nova v1 models emit these as plain text — not a structured reasoning block.
 */
function stripThinkingTags(stream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  let insideThinking = false;

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });

      // Process complete lines (SSE is line-based)
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // Keep incomplete line in buffer

      for (const line of lines) {
        let processed = line;

        // Check for thinking tags in the line
        if (processed.includes("<thinking>")) {
          insideThinking = true;
        }

        if (insideThinking) {
          if (processed.includes("</thinking>")) {
            // Remove everything up to and including </thinking>
            processed = processed.replace(/<thinking>[\s\S]*?<\/thinking>/g, "");
            insideThinking = false;
          } else {
            // Skip entire line — we're inside a thinking block
            continue;
          }
        }

        // Also strip any remaining thinking tags that fit on one line
        processed = processed.replace(/<thinking>[\s\S]*?<\/thinking>/g, "");
        // Strip orphaned opening/closing tags
        processed = processed.replace(/<\/?thinking>/g, "");

        if (processed.trim() || line === "") {
          controller.enqueue(encoder.encode(processed + "\n"));
        }
      }
    },
    flush(controller) {
      if (buffer) {
        const cleaned = buffer
          .replace(/<thinking>[\s\S]*?<\/thinking>/g, "")
          .replace(/<\/?thinking>/g, "");
        if (cleaned.trim()) {
          controller.enqueue(encoder.encode(cleaned));
        }
      }
    },
  }).readable;
}

export const POST = async (req: NextRequest) => {
  const mastraAgents = MastraAgent.getLocalAgents({
    mastra,
    resourceId: "budgetAgent",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const runtime = new CopilotRuntime({ agents: mastraAgents as any });

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: new ExperimentalEmptyAdapter(),
    endpoint: "/api/copilotkit",
  });

  const response = await handleRequest(req);

  // If streaming, filter out <thinking> tags
  if (response.body) {
    const filteredBody = stripThinkingTags(response.body);
    return new Response(filteredBody, {
      status: response.status,
      headers: response.headers,
    });
  }

  return response;
};
