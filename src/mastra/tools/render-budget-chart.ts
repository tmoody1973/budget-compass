import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const renderBudgetChartTool = createTool({
  id: "render-budget-chart",
  description: `Render an interactive chart inline in the chat. Call AFTER getting verified data from queryBudgetData. Never pass estimated numbers to this tool.`,
  inputSchema: z.object({
    chartType: z
      .enum(["bar", "line", "pie", "treemap"])
      .describe("Best chart type for this data"),
    title: z.string().describe("Chart title"),
    data: z.array(
      z.object({
        label: z.string(),
        value: z.number(),
        color: z.string().optional(),
      })
    ),
    xLabel: z.string().optional(),
    yLabel: z.string().optional(),
    unit: z.string().optional().describe("e.g. $, %, FTEs"),
  }),
  outputSchema: z.object({
    rendered: z.boolean(),
  }),
  execute: async () => {
    // CopilotKit intercepts this tool call via AG-UI protocol
    // and renders the chart component on the frontend.
    // The actual rendering happens client-side; this is a no-op server-side.
    return { rendered: true };
  },
});
