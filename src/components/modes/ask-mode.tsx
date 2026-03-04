"use client";

import { CopilotChat } from "@copilotkit/react-ui";
import { useCopilotAction } from "@copilotkit/react-core";
import { BudgetChart } from "../budget-chart";

const STARTER_QUESTIONS = [
  "How much do we spend on police?",
  "Show me the top 5 departments by budget",
  "Compare parks vs library funding",
  "What percentage goes to public safety?",
];

export function AskMode() {
  // Register Generative UI action — CopilotKit intercepts the
  // render-budget-chart tool call and renders this component inline
  useCopilotAction({
    name: "render-budget-chart",
    description: "Render a budget visualization chart",
    parameters: [
      { name: "chartType", type: "string", description: "Type of chart: bar, line, pie, or treemap" },
      { name: "title", type: "string", description: "Chart title" },
      { name: "data", type: "object[]", description: "Array of {label, value, color?} data points" },
      { name: "xLabel", type: "string", description: "X-axis label", required: false },
      { name: "yLabel", type: "string", description: "Y-axis label", required: false },
      { name: "unit", type: "string", description: "Value unit ($ or %)", required: false },
    ],
    render: ({ args }) => {
      if (!args.title || !args.data) return <></>;
      return (
        <BudgetChart
          chartType={(args.chartType as "bar" | "line" | "pie" | "treemap") ?? "bar"}
          title={args.title as string}
          data={args.data as { label: string; value: number; color?: string }[]}
          xLabel={args.xLabel as string | undefined}
          yLabel={args.yLabel as string | undefined}
          unit={args.unit as string | undefined}
        />
      );
    },
    handler: () => {
      // No-op: this action is render-only, the chart is displayed via Generative UI
    },
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden">
        <CopilotChat
          labels={{
            title: "Budget Compass",
            initial: "Ask anything about Milwaukee's $1.4B city budget.",
            placeholder: "e.g., How much do we spend on police?",
          }}
          className="copilot-chat-mke h-full"
        />
      </div>

      {/* Starter question buttons */}
      <div className="mt-3 flex flex-wrap gap-2">
        {STARTER_QUESTIONS.map((q) => (
          <button
            key={q}
            className="rounded-lg border-2 border-mke-dark bg-white px-3 py-1.5 text-sm font-medium text-mke-dark shadow-[2px_2px_0px_0px_#1A1A2E] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#1A1A2E]"
            onClick={(e) => {
              // Find the CopilotKit textarea and set its value, then submit
              const textarea = document.querySelector(
                ".copilot-chat-mke textarea",
              ) as HTMLTextAreaElement | null;
              if (textarea) {
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                  window.HTMLTextAreaElement.prototype,
                  "value",
                )?.set;
                nativeInputValueSetter?.call(textarea, q);
                textarea.dispatchEvent(
                  new Event("input", { bubbles: true }),
                );
                // Trigger submit after a brief delay to let state update
                setTimeout(() => {
                  const form = textarea.closest("form");
                  if (form) {
                    form.dispatchEvent(
                      new Event("submit", { bubbles: true, cancelable: true }),
                    );
                  }
                }, 100);
              }
            }}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
