import { Mastra } from "@mastra/core/mastra";
import { budgetAgent } from "./agents/budget-agent";
import { receiptInsightsAgent } from "./agents/receipt-insights-agent";

export const mastra = new Mastra({
  agents: {
    budgetAgent,
    receiptInsightsAgent,
  },
});
