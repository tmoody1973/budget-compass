"use client";

import { CopilotChat } from "@copilotkit/react-ui";
import { useCopilotAction } from "@copilotkit/react-core";
import { BudgetChart } from "./budget-chart";

interface ConsequencePanelProps {
  className?: string;
}

export function ConsequencePanel({ className }: ConsequencePanelProps) {
  useCopilotAction({
    name: "render-budget-chart",
    render: ({ args }) => (
      <BudgetChart
        chartType={args.chartType as "bar" | "line" | "pie" | "treemap"}
        title={args.title as string}
        data={args.data as { label: string; value: number; color?: string }[]}
        xLabel={args.xLabel as string | undefined}
        yLabel={args.yLabel as string | undefined}
        unit={args.unit as string | undefined}
      />
    ),
  });

  return (
    <div className={`copilot-chat-mke ${className ?? ""}`}>
      <CopilotChat
        labels={{
          title: "Impact Analysis",
          initial:
            "Adjust the sliders to see how budget changes affect Milwaukee services and residents.",
          placeholder: "Ask about the impact of your changes...",
        }}
        className="h-full"
      />
    </div>
  );
}
