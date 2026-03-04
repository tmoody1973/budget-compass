import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const generateInfographicTool = createTool({
  id: "generate-infographic",
  description:
    "Generate an AI infographic image summarizing budget data. Call AFTER querying data with queryBudgetData. Provide a clear description of what the infographic should show.",
  inputSchema: z.object({
    title: z.string().describe("Infographic title"),
    description: z
      .string()
      .describe(
        "Detailed description of what the infographic should visualize",
      ),
    dataPoints: z
      .array(
        z.object({
          label: z.string(),
          value: z.number(),
          unit: z.string().optional(),
        }),
      )
      .describe("Key data points to include in the infographic"),
    style: z
      .enum([
        "budget-overview",
        "department-comparison",
        "tax-breakdown",
        "trend-analysis",
      ])
      .describe("Visual style for the infographic"),
  }),
  outputSchema: z.object({
    imageUrl: z.string().optional(),
    status: z.string(),
    description: z.string(),
  }),
  execute: async (input) => {
    // TODO: Integrate with Nova 2 Omni for actual image generation
    // For now, return the structured data that would be used
    return {
      status: "generated",
      description: `Infographic: ${input.title} - ${input.description}`,
      imageUrl: undefined,
    };
  },
});
