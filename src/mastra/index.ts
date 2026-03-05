import { Mastra } from "@mastra/core/mastra";
import { queryRouter } from "./agents/query-router";
import { qaAgent } from "./agents/qa-agent";
import { analystAgent } from "./agents/analyst-agent";
import { simulatorAgent } from "./agents/simulator-agent";
import { visualAgent } from "./agents/visual-agent";
import { voiceAgent } from "./agents/voice-agent";

export const mastra = new Mastra({
  agents: {
    queryRouter,
    qaAgent,
    analystAgent,
    simulatorAgent,
    visualAgent,
    voiceAgent,
  },
});
