import { Mastra } from "@mastra/core/mastra";
import { registerCopilotKit } from "@ag-ui/mastra/copilotkit";
import { queryRouter } from "./agents/query-router";
import { qaAgent } from "./agents/qa-agent";
import { analystAgent } from "./agents/analyst-agent";

export const mastra = new Mastra({
  agents: {
    queryRouter,
    qaAgent,
    analystAgent,
  },
  server: {
    cors: {
      origin: "*",
      allowMethods: ["*"],
      allowHeaders: ["*"],
    },
    apiRoutes: [
      registerCopilotKit({
        path: "/copilotkit",
        resourceId: "queryRouter",
      }),
    ],
  },
  bundler: {
    externals: ["@copilotkit/runtime"],
  },
});
