import { NextRequest } from "next/server";
import { mastra } from "../../../mastra";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const agent = mastra.getAgent("budgetAgent");
  const result = await agent.stream(messages);

  const reader = result.textStream.getReader();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let insideThinking = false;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          let text = value;

          // Strip thinking tags
          if (text.includes("<thinking>")) insideThinking = true;
          if (insideThinking) {
            if (text.includes("</thinking>")) {
              text = text.replace(/<thinking>[\s\S]*?<\/thinking>/g, "");
              insideThinking = false;
            } else {
              continue;
            }
          }
          text = text.replace(/<thinking>[\s\S]*?<\/thinking>/g, "");
          text = text.replace(/<\/?thinking>/g, "");

          // Strip code fences that Nova might wrap around OpenUI Lang
          text = text.replace(/```openui-lang\n?/g, "");
          text = text.replace(/```openui\n?/g, "");
          text = text.replace(/```\n?$/g, "");

          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
