"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import { BudgetChart } from "../budget-chart";

const STARTER_QUESTIONS = [
  "What is Milwaukee's total 2026 budget?",
  "Compare police and fire department spending",
  "How has the library budget changed?",
  "Where do my property tax dollars go?",
];

export function AskMode() {
  // Register Generative UI action
  useCopilotAction({
    name: "render-budget-chart",
    description: "Render a budget visualization chart",
    parameters: [
      { name: "chartType", type: "string", description: "Type of chart: bar, line, pie, or treemap" },
      { name: "title", type: "string", description: "Chart title" },
      {
        name: "data",
        type: "object[]",
        description: "Array of data points for the chart",
        attributes: [
          { name: "label", type: "string", description: "Data point label" },
          { name: "value", type: "number", description: "Data point value" },
          { name: "color", type: "string", description: "Optional color", required: false },
        ],
      },
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
    handler: () => {},
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

      {/* Starter questions */}
      <div className="mt-3 flex flex-wrap gap-2">
        {STARTER_QUESTIONS.map((q) => (
          <button
            key={q}
            className="rounded-lg border-2 border-mke-dark bg-white px-3 py-1.5 text-sm font-medium text-mke-dark shadow-[2px_2px_0px_0px_#1A1A2E] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#1A1A2E]"
            onClick={() => {
              const textarea = document.querySelector(
                ".copilot-chat-mke textarea",
              ) as HTMLTextAreaElement | null;
              if (textarea) {
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                  window.HTMLTextAreaElement.prototype,
                  "value",
                )?.set;
                nativeInputValueSetter?.call(textarea, q);
                textarea.dispatchEvent(new Event("input", { bubbles: true }));
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
