"use client";

import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CopilotKit
      runtimeUrl={
        process.env.NEXT_PUBLIC_MASTRA_URL ?? "http://localhost:4111/copilotkit"
      }
      agent="queryRouter"
    >
      {children}
    </CopilotKit>
  );
}
