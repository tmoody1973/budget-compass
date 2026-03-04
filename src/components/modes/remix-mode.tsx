"use client";

import { useState, useCallback } from "react";
import { useCopilotReadable } from "@copilotkit/react-core";
import { BudgetSlider } from "../budget-slider";
import { ConsequencePanel } from "../consequence-panel";

// 12 budget sections from Milwaukee 2026 proposed budget (convex_seed_data.json)
const INITIAL_SECTIONS = [
  { section: "A", name: "General City Purposes", budget2026Proposed: 810730062 },
  { section: "B", name: "Employee Retirement", budget2026Proposed: 261111343 },
  { section: "C", name: "Capital Improvements", budget2026Proposed: 232605000 },
  { section: "D", name: "City Debt", budget2026Proposed: 272139546 },
  { section: "F", name: "Common Council Contingent Fund", budget2026Proposed: 5000000 },
  { section: "G", name: "Transportation Fund", budget2026Proposed: 41223093 },
  { section: "H", name: "Grant and Aid Fund", budget2026Proposed: 83926856 },
  { section: "I", name: "Economic Development Fund", budget2026Proposed: 15000000 },
  { section: "J", name: "Water Works", budget2026Proposed: 216910988 },
  { section: "K", name: "Sewer Maintenance Fund", budget2026Proposed: 113561748 },
  { section: "M", name: "County Delinquent Tax Fund", budget2026Proposed: 9269370 },
  { section: "N", name: "Settlement Funds", budget2026Proposed: 5000000 },
];

export function RemixMode() {
  const [sections, setSections] = useState(INITIAL_SECTIONS);
  const [originalSections] = useState(INITIAL_SECTIONS);

  const totalBudget = sections.reduce((sum, s) => sum + s.budget2026Proposed, 0);
  const originalTotal = originalSections.reduce(
    (sum, s) => sum + s.budget2026Proposed,
    0,
  );

  // Expose slider state to the simulator agent via CopilotKit
  useCopilotReadable({
    description:
      "Current budget allocation adjustments made by the user in Remix mode",
    value: JSON.stringify({
      totalBudget,
      originalTotal,
      sections: sections.map((s, i) => ({
        section: s.section,
        name: s.name,
        original: originalSections[i].budget2026Proposed,
        current: s.budget2026Proposed,
        change:
          s.budget2026Proposed - originalSections[i].budget2026Proposed,
        changePercent: (
          ((s.budget2026Proposed -
            originalSections[i].budget2026Proposed) /
            originalSections[i].budget2026Proposed) *
          100
        ).toFixed(1),
      })),
    }),
  });

  const handleSliderChange = useCallback(
    (index: number, newAmount: number) => {
      setSections((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], budget2026Proposed: newAmount };
        return updated;
      });
    },
    [],
  );

  const handleReset = useCallback(() => {
    setSections(INITIAL_SECTIONS);
  }, []);

  const budgetDelta = totalBudget - originalTotal;

  return (
    <div className="flex h-full gap-6">
      {/* Left: Sliders */}
      <div className="w-1/2 overflow-y-auto pr-2">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-head text-xl font-bold text-mke-blue">
            Budget Allocations
          </h2>
          <button
            onClick={handleReset}
            className="rounded border-2 border-mke-dark bg-white px-3 py-1 text-sm font-bold shadow-[2px_2px_0px_0px_#1A1A2E] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          >
            Reset
          </button>
        </div>

        {/* Total budget display */}
        <div className="mb-4 rounded-lg border-2 border-mke-dark bg-white p-3 shadow-[4px_4px_0px_0px_#1A1A2E]">
          <div className="flex justify-between">
            <span className="font-bold">Total Budget</span>
            <span
              className={`font-bold ${
                budgetDelta !== 0
                  ? budgetDelta > 0
                    ? "text-mke-green"
                    : "text-mke-danger"
                  : "text-mke-dark"
              }`}
            >
              ${(totalBudget / 1_000_000).toFixed(0)}M
            </span>
          </div>
          {budgetDelta !== 0 && (
            <div className="mt-1 text-right text-xs font-bold">
              <span
                className={
                  budgetDelta > 0 ? "text-mke-green" : "text-mke-danger"
                }
              >
                {budgetDelta > 0 ? "+" : ""}$
                {(budgetDelta / 1_000_000).toFixed(1)}M from original
              </span>
            </div>
          )}
        </div>

        {/* Section sliders */}
        {sections.map((section, i) => (
          <BudgetSlider
            key={section.section}
            sectionName={section.name}
            sectionLetter={section.section}
            currentAmount={section.budget2026Proposed}
            originalAmount={originalSections[i].budget2026Proposed}
            totalBudget={totalBudget}
            onChange={(val) => handleSliderChange(i, val)}
          />
        ))}
      </div>

      {/* Right: Consequence panel */}
      <ConsequencePanel className="w-1/2 h-full" />
    </div>
  );
}
