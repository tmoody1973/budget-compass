import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const generateVoiceBriefingTool = createTool({
  id: "generate-voice-briefing",
  description:
    "Generate a spoken budget briefing script. The frontend will convert this to audio. Structure the script as a clear, conversational briefing suitable for listening.",
  inputSchema: z.object({
    topic: z
      .string()
      .describe(
        "The briefing topic, e.g. 'Police Department Budget' or 'Tax Levy Overview'",
      ),
    script: z
      .string()
      .describe(
        "The full briefing script text, written for spoken delivery. Use short sentences, natural phrasing, and clear transitions. Include key numbers and context.",
      ),
    duration: z
      .enum(["short", "medium", "long"])
      .describe(
        "Target briefing length: short (30s), medium (1-2min), long (3-5min)",
      ),
    keyFacts: z
      .array(
        z.object({
          fact: z.string(),
          value: z.string(),
        }),
      )
      .describe("Key facts mentioned in the briefing for visual display"),
  }),
  outputSchema: z.object({
    script: z.string(),
    status: z.string(),
  }),
  execute: async (input) => {
    return {
      script: input.script,
      status: "ready",
    };
  },
});
