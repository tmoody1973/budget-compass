"use client";

import { CopilotChat } from "@copilotkit/react-ui";
import { useCopilotAction } from "@copilotkit/react-core";
import { AudioPlayer } from "../audio-player";
import { BudgetChart } from "../budget-chart";

const PRESET_PROMPTS = [
  { label: "Give me a budget overview briefing", icon: "\ud83d\udccb" },
  { label: "Brief me on the police department budget", icon: "\ud83d\ude94" },
  { label: "What should I know about property taxes?", icon: "\ud83c\udfe0" },
  { label: "Brief me on capital improvements", icon: "\ud83c\udfd7\ufe0f" },
];

export function HearMode() {
  // Register voice briefing Generative UI
  useCopilotAction({
    name: "generate-voice-briefing",
    description: "Generate an audio briefing about a budget topic",
    parameters: [
      { name: "topic", type: "string", description: "The briefing topic" },
      {
        name: "script",
        type: "string",
        description: "The full briefing script text",
      },
      {
        name: "duration",
        type: "string",
        description: "Target briefing length: short, medium, or long",
      },
      {
        name: "keyFacts",
        type: "object[]",
        description: "Key facts for visual display",
      },
    ],
    handler: async () => {
      return "Briefing generated";
    },
    render: ({ args, status }) => {
      if (status === "executing") {
        return (
          <div className="my-3 animate-pulse rounded-lg border-2 border-mke-dark bg-white p-4 shadow-[4px_4px_0px_0px_#1A1A2E]">
            <span className="font-bold text-mke-blue">
              Preparing your briefing...
            </span>
          </div>
        );
      }
      return (
        <AudioPlayer
          script={(args?.script as string) || ""}
          topic={(args?.topic as string) || "Budget Briefing"}
          keyFacts={
            args?.keyFacts as Array<{ fact: string; value: string }> | undefined
          }
        />
      );
    },
  });

  // Register chart rendering action
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
        description: "Array of {label, value, color?} data points",
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

  function sendPresetMessage(message: string) {
    const textarea = document.querySelector(
      ".copilot-chat-mke-hear textarea",
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
      {/* Topic preset buttons */}
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
            title: "Budget Briefings",
            initial:
              "Choose a topic or ask for a budget briefing. I'll create an audio summary you can listen to.",
            placeholder: "e.g., Brief me on the library budget",
          }}
          className="copilot-chat-mke-hear h-full"
        />
      </div>
    </div>
  );
}
