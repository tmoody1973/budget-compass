import { NextRequest } from "next/server";
import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { MastraAgent } from "@ag-ui/mastra";
import { mastra } from "../../../mastra";

export const maxDuration = 60;

export const POST = async (req: NextRequest) => {
  const mastraAgents = MastraAgent.getLocalAgents({
    mastra,
    resourceId: "queryRouter",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const runtime = new CopilotRuntime({ agents: mastraAgents as any });

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: new ExperimentalEmptyAdapter(),
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
