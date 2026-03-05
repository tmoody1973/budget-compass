import { NextRequest } from "next/server";
import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { MastraAgent } from "@ag-ui/mastra";
import { mastra } from "../../../mastra";

export const maxDuration = 60;

export const POST = async (req: NextRequest) => {
  // Parse request to check if it's an info request
  const cloned = req.clone();
  let isInfoRequest = false;
  try {
    const body = await cloned.json();
    isInfoRequest = body?.method === "info";
  } catch {
    // Not JSON, proceed normally
  }

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

  // Only filter streaming responses (not /info JSON responses)
  if (!isInfoRequest && response.body && response.headers.get("content-type")?.includes("text/event-stream")) {
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const filteredStream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        let insideThinking = false;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            let text = decoder.decode(value, { stream: true });

            // Handle thinking tags
            if (text.includes("<thinking>")) insideThinking = true;

            if (insideThinking) {
              if (text.includes("</thinking>")) {
                text = text.replace(/<thinking>[\s\S]*?<\/thinking>/g, "");
                insideThinking = false;
              } else {
                continue; // Skip chunks inside thinking
              }
            }

            // Strip any remaining thinking tags
            text = text.replace(/<thinking>[\s\S]*?<\/thinking>/g, "");
            text = text.replace(/<\/?thinking>/g, "");

            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(filteredStream, {
      status: response.status,
      headers: response.headers,
    });
  }

  return response;
};
