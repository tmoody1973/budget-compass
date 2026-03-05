"use client";

import { CopilotChat } from "@copilotkit/react-ui";
import { useCopilotAction } from "@copilotkit/react-core";
import { BudgetChart } from "../budget-chart";

const PRESET_PROMPTS = [
  { label: "Where do my tax dollars go?", icon: "\ud83d\udcb0" },
  { label: "Top 10 departments by spending", icon: "\ud83d\udcca" },
  { label: "Budget overview infographic", icon: "\ud83c\udfa8" },
  { label: "Year-over-year changes", icon: "\ud83d\udcc8" },
];

export function SeeMode() {
  // Register chart rendering action (same as AskMode)
  useCopilotAction({
    name: "render-budget-chart",
    description: "Render a budget visualization chart",
    parameters: [
      {
        name: "chartType",
        type: "string",
        description: "Type of chart: bar, line, pie, or treemap",
      },
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
      {
        name: "xLabel",
        type: "string",
        description: "X-axis label",
        required: false,
      },
      {
        name: "yLabel",
        type: "string",
        description: "Y-axis label",
        required: false,
      },
      {
        name: "unit",
        type: "string",
        description: "Value unit ($ or %)",
        required: false,
      },
    ],
    render: ({ args }) => {
      if (!args.title || !args.data) return <></>;
      return (
        <BudgetChart
          chartType={
            (args.chartType as "bar" | "line" | "pie" | "treemap") ?? "bar"
          }
          title={args.title as string}
          data={args.data as { label: string; value: number; color?: string }[]}
          xLabel={args.xLabel as string | undefined}
          yLabel={args.yLabel as string | undefined}
          unit={args.unit as string | undefined}
        />
      );
    },
    handler: () => {
      // No-op: chart is rendered via Generative UI
    },
  });

  // Register infographic rendering action
  useCopilotAction({
    name: "generate-infographic",
    description: "Generate a budget infographic visualization",
    parameters: [
      { name: "title", type: "string" },
      { name: "description", type: "string" },
      {
        name: "dataPoints",
        type: "object[]",
        description: "Data points for the infographic",
        attributes: [
          { name: "label", type: "string", description: "Label" },
          { name: "value", type: "number", description: "Value" },
          { name: "unit", type: "string", description: "Unit", required: false },
        ],
      },
      { name: "style", type: "string" },
    ],
    handler: async () => {
      return "Infographic generated";
    },
    render: ({ args, status }) => (
      <div className="my-3 rounded-lg border-2 border-mke-dark bg-white p-4 shadow-[4px_4px_0px_0px_#1A1A2E]">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-lg">{"\ud83c\udfa8"}</span>
          <h3 className="font-bold text-mke-blue">
            {(args?.title as string) || "Budget Infographic"}
          </h3>
        </div>
        {status === "executing" ? (
          <div className="flex h-48 animate-pulse items-center justify-center rounded bg-mke-cream">
            <span className="font-bold text-mke-blue">
              Generating infographic...
            </span>
          </div>
        ) : (
          <div className="rounded bg-mke-cream p-4">
            <p className="mb-3 text-sm text-mke-dark">
              {args?.description as string}
            </p>
            {args?.dataPoints && (
              <div className="grid grid-cols-2 gap-2">
                {(
                  args.dataPoints as {
                    label: string;
                    value: number;
                    unit?: string;
                  }[]
                ).map(
                  (
                    dp: { label: string; value: number; unit?: string },
                    i: number,
                  ) => (
                    <div
                      key={i}
                      className="rounded border border-mke-dark bg-white p-2 text-center"
                    >
                      <div className="text-xs text-gray-500">{dp.label}</div>
                      <div className="font-bold text-mke-blue">
                        {dp.unit === "$"
                          ? `$${(dp.value / 1_000_000).toFixed(1)}M`
                          : dp.value}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        )}
      </div>
    ),
  });

  function sendPresetMessage(message: string) {
    const textarea = document.querySelector(
      ".copilot-chat-mke-see textarea",
    ) as HTMLTextAreaElement | null;
    if (textarea) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value",
      )?.set;
      nativeInputValueSetter?.call(textarea, message);
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
  }

  return (
    <div className="flex h-full flex-col">
      {/* Preset visualization buttons */}
      <div className="mb-4 flex flex-wrap gap-2">
        {PRESET_PROMPTS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => sendPresetMessage(preset.label)}
            className="rounded-lg border-2 border-mke-dark bg-white px-2 py-1.5 text-xs font-bold shadow-[3px_3px_0px_0px_#1A1A2E] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_#1A1A2E] sm:px-3 sm:py-2 sm:text-sm"
          >
            {preset.icon} {preset.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        <CopilotChat
          labels={{
            title: "Budget Visualizer",
            initial:
              "Describe what you'd like to visualize about Milwaukee's budget. I'll create charts and infographics for you.",
            placeholder: "e.g., Show me where my property taxes go",
          }}
          className="copilot-chat-mke-see h-full"
        />
      </div>
    </div>
  );
}
