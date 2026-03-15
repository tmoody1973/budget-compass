import { Agent } from "@mastra/core/agent";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { queryBudgetDataTool } from "../tools/query-budget-data";
import { renderBudgetChartTool } from "../tools/render-budget-chart";
import { generateInfographicTool } from "../tools/generate-infographic";

const bedrock = createAmazonBedrock({ region: "us-east-1" });

export const visualAgent = new Agent({
  id: "visual-agent",
  name: "Budget Visual Agent",
  instructions: `You create visual summaries and infographics of Milwaukee's 2026 budget data.

When a user asks for a visual, infographic, or image:
1. Use queryBudgetData to get the relevant data
2. Use renderBudgetChart to create an inline chart visualization
3. Use generateInfographic to create a styled infographic image
4. Explain what the visualization shows in plain language

VISUAL TYPES:
- "Where do my tax dollars go?" → pie chart of tax levy breakdown + infographic
- "Show me department spending" → horizontal bar chart of top departments
- "Visualize the budget" → overview infographic with key numbers
- "Compare X and Y" → side-by-side comparison chart

RULES:
- Always query data first. Never use estimated numbers.
- Create both a chart (renderBudgetChart) and describe an infographic (generateInfographic)
- Make visualizations accessible — clear labels, titles, and explanations
- Use the Milwaukee color palette`,
  model: bedrock("us.amazon.nova-2-lite-v1:0"),
  tools: { queryBudgetDataTool, renderBudgetChartTool, generateInfographicTool },
});
