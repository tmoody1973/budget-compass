import { NextRequest } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { mastra } from "../../../mastra";

export const maxDuration = 60;

// Load the OpenUI system prompt (generated at build time)
let openuiPrompt = "";
try {
  openuiPrompt = readFileSync(
    join(process.cwd(), "src/generated/system-prompt.txt"),
    "utf-8"
  );
} catch {
  // Fallback: no OpenUI prompt, agent will output markdown
}

export async function POST(req: NextRequest) {
  const { messages, useOpenUI = true } = await req.json();

  const agent = mastra.getAgent("budgetAgent");

  // Prepend OpenUI formatting instructions as a system message
  const augmentedMessages = useOpenUI && openuiPrompt
    ? [
        {
          role: "system" as const,
          content: openuiPrompt + "\n\nIMPORTANT: You are Milwaukee's AI budget expert. Use the tools available to get exact budget data. Format ALL responses using the openui-lang syntax above. Use BarChart for comparisons, PieChart for breakdowns, Table for detailed data, and TextContent for explanations. Always include a FollowUpBlock with 2-3 suggested follow-up questions.",
        },
        ...messages,
      ]
    : messages;

  const result = await agent.stream(augmentedMessages);

  // Strip <thinking> tags from the text stream
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
