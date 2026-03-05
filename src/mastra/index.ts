import { Mastra } from "@mastra/core/mastra";
import { budgetAgent } from "./agents/budget-agent";

export const mastra = new Mastra({
  agents: {
    budgetAgent,
  },
});
