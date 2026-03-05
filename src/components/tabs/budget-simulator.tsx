"use client";

import { useState } from "react";
import { useBudget } from "@/contexts/budget-context";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const BASE_CITY_LEVY = 336_800_000;
const CITY_RATE = 7.61; // per $1,000 assessed value

interface Department {
  name: string;
  budget: number;
  revenue: number;
}

interface ServiceGroup {
  name: string;
  icon: string;
  color: string;
  budget: number;
  departments: Department[];
  hint: string;
}

const SERVICE_GROUPS: ServiceGroup[] = [
  {
    name: "Public Safety",
    icon: "\ud83d\udee1\ufe0f",
    color: "#dc2626",
    budget: 508_207_313,
    departments: [
      { name: "Police Department", budget: 310_135_835, revenue: 7_674_000 },
      { name: "Fire Department", budget: 165_408_632, revenue: 9_458_000 },
      { name: "Emergency Communications (911)", budget: 27_171_944, revenue: 0 },
      { name: "Fire & Police Commission", budget: 5_490_902, revenue: 0 },
    ],
    hint: "Affects police patrol staffing, fire response times, 911 operations",
  },
  {
    name: "Infrastructure & Public Works",
    icon: "\ud83c\udfd7\ufe0f",
    color: "#0369a1",
    budget: 165_311_503,
    departments: [
      { name: "DPW Operations", budget: 108_435_714, revenue: 86_900_000 },
      { name: "DPW Infrastructure Services", budget: 52_806_892, revenue: 31_200_000 },
      { name: "DPW Administrative Services", budget: 4_068_897, revenue: 235_000 },
    ],
    hint: "Affects road repair, snow plowing, trash collection, water service",
  },
  {
    name: "Community Services",
    icon: "\ud83c\udfe0\ufe0f",
    color: "#059669",
    budget: 89_959_741,
    departments: [
      { name: "Library", budget: 33_022_606, revenue: 1_150_000 },
      { name: "Neighborhood Services", budget: 25_881_545, revenue: 15_600_000 },
      { name: "Health Department", budget: 22_682_951, revenue: 11_700_000 },
      { name: "City Development", budget: 8_372_639, revenue: 1_375_000 },
    ],
    hint: "Affects libraries, health clinics, neighborhood programs, city development",
  },
  {
    name: "Government Operations",
    icon: "\ud83c\udfdb\ufe0f",
    color: "#6b21a8",
    budget: 89_371_597,
    departments: [
      { name: "Administration", budget: 26_253_863, revenue: 643_000 },
      { name: "Common Council / City Clerk", budget: 12_721_410, revenue: 4_000_000 },
      { name: "City Attorney", budget: 9_356_963, revenue: 550_000 },
      { name: "Employee Relations", budget: 6_395_445, revenue: 2_320_000 },
      { name: "Comptroller", budget: 5_877_969, revenue: 285_600 },
      { name: "Assessor's Office", budget: 5_676_889, revenue: 1_000_000 },
      { name: "Election Commission", budget: 5_247_509, revenue: 0 },
      { name: "City Treasurer", budget: 4_781_182, revenue: 650_000 },
      { name: "Municipal Court", budget: 3_890_813, revenue: 600_500 },
      { name: "Mayor's Office", budget: 2_108_535, revenue: 0 },
      { name: "Port Milwaukee", budget: 7_060_819, revenue: 6_300_000 },
    ],
    hint: "Affects city administration, courts, elections, assessor operations",
  },
];

const TOTAL_EXPENDITURES = SERVICE_GROUPS.reduce((s, g) => s + g.budget, 0);

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function fmt(n: number): string {
  return "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtSigned(n: number): string {
  const prefix = n >= 0 ? "+" : "-";
  return prefix + "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtCompact(n: number): string {
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(0) + "K";
  return "$" + n.toFixed(0);
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

type SliderState = Record<string, number>;

export function BudgetSimulator() {
  const { assessedValue } = useBudget();

  const [sliders, setSliders] = useState<SliderState>(() => {
    const init: SliderState = {};
    SERVICE_GROUPS.forEach((g) => (init[g.name] = 0));
    return init;
  });

  // Base city tax for this user
  const baseCityTax = (assessedValue / 1000) * CITY_RATE;

  // Calculate weighted change across all groups
  // Each group's weight = its budget / total expenditures
  const weightedChange = SERVICE_GROUPS.reduce((sum, group) => {
    const weight = group.budget / TOTAL_EXPENDITURES;
    const sliderPct = sliders[group.name] / 100;
    return sum + weight * sliderPct;
  }, 0);

  const newCityTax = baseCityTax * (1 + weightedChange);
  const taxDelta = newCityTax - baseCityTax;
  const newLevy = BASE_CITY_LEVY * (1 + weightedChange);

  const anyChanged = Object.values(sliders).some((v) => v !== 0);

  function resetAll() {
    const init: SliderState = {};
    SERVICE_GROUPS.forEach((g) => (init[g.name] = 0));
    setSliders(init);
  }

  function setSlider(name: string, value: number) {
    setSliders((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="rounded-lg border-2 border-gray-900 bg-white p-6 shadow-[4px_4px_0px_0px_#111]">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-900">
              {"\ud83c\udf9b\ufe0f"} Budget Simulator
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Drag the sliders to remix Milwaukee{"'"}s budget and see your tax impact
            </p>
          </div>
          {anyChanged && (
            <button
              onClick={resetAll}
              className="rounded-lg border-2 border-gray-900 bg-gray-100 px-4 py-2 text-sm font-bold shadow-[2px_2px_0px_0px_#111] transition-all hover:bg-gray-200 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Reset All
            </button>
          )}
        </div>

        {/* Tax impact summary */}
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
          <div className="rounded-lg border-2 border-gray-900 bg-blue-50 px-5 py-4 shadow-[2px_2px_0px_0px_#111]">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
              Your adjusted city tax
            </div>
            <div className="mt-1 text-3xl font-black text-blue-900">
              {fmt(newCityTax)}<span className="text-base font-bold text-gray-500">/yr</span>
            </div>
          </div>

          <div
            className={`rounded-lg border-2 border-gray-900 px-5 py-4 shadow-[2px_2px_0px_0px_#111] ${
              taxDelta > 0.5
                ? "bg-red-50"
                : taxDelta < -0.5
                  ? "bg-green-50"
                  : "bg-gray-50"
            }`}
          >
            <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
              Change from current
            </div>
            <div
              className={`mt-1 text-3xl font-black ${
                taxDelta > 0.5
                  ? "text-red-600"
                  : taxDelta < -0.5
                    ? "text-green-600"
                    : "text-gray-400"
              }`}
            >
              {taxDelta > 0.5 || taxDelta < -0.5
                ? fmtSigned(taxDelta)
                : "$0"}
              <span className="text-base font-bold text-gray-500">/yr</span>
            </div>
          </div>

          <div className="rounded-lg border-2 border-gray-900 bg-gray-50 px-5 py-4 shadow-[2px_2px_0px_0px_#111]">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
              Adjusted city levy
            </div>
            <div className="mt-1 text-2xl font-black text-gray-900">
              {fmtCompact(newLevy)}
            </div>
          </div>
        </div>

        {/* Change gauge bar */}
        {anyChanged && (
          <div className="mt-4">
            <div className="relative h-4 w-full overflow-hidden rounded-full border-2 border-gray-900 bg-gray-100">
              {/* Center marker */}
              <div className="absolute left-1/2 top-0 z-10 h-full w-0.5 -translate-x-1/2 bg-gray-900" />
              {/* Fill bar */}
              <div
                className={`absolute top-0 h-full transition-all ${
                  weightedChange >= 0 ? "bg-red-400" : "bg-green-400"
                }`}
                style={{
                  left: weightedChange >= 0 ? "50%" : `${50 + weightedChange * 250}%`,
                  width: `${Math.min(Math.abs(weightedChange) * 250, 50)}%`,
                }}
              />
            </div>
            <div className="mt-1 flex justify-between text-xs font-bold text-gray-400">
              <span>-20%</span>
              <span>0%</span>
              <span>+20%</span>
            </div>
          </div>
        )}
      </div>

      {/* Slider rows */}
      {SERVICE_GROUPS.map((group) => {
        const pct = sliders[group.name];
        const adjustedBudget = group.budget * (1 + pct / 100);
        const groupWeight = group.budget / TOTAL_EXPENDITURES;
        const groupTaxShare = baseCityTax * groupWeight;
        const groupTaxDelta = groupTaxShare * (pct / 100);

        return (
          <div
            key={group.name}
            className="rounded-lg border-2 border-gray-900 bg-white p-5 shadow-[4px_4px_0px_0px_#111]"
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-gray-900 text-xl"
                  style={{ backgroundColor: group.color + "18" }}
                >
                  {group.icon}
                </span>
                <div>
                  <h3 className="text-lg font-black text-gray-900">{group.name}</h3>
                  <p className="text-xs text-gray-500">{group.hint}</p>
                </div>
              </div>

              {/* Per-slider tax delta */}
              <div className="text-right">
                <div
                  className={`text-lg font-black ${
                    groupTaxDelta > 0.5
                      ? "text-red-600"
                      : groupTaxDelta < -0.5
                        ? "text-green-600"
                        : "text-gray-400"
                  }`}
                >
                  {Math.abs(groupTaxDelta) > 0.5 ? fmtSigned(groupTaxDelta) : "$0"}
                  <span className="text-xs font-bold text-gray-400">/yr</span>
                </div>
                <div className="text-xs text-gray-400">your share</div>
              </div>
            </div>

            {/* Budget amounts */}
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
              <div>
                <span className="font-bold text-gray-500">Current: </span>
                <span className="font-black text-gray-900">{fmtCompact(group.budget)}</span>
              </div>
              <div>
                <span className="font-bold text-gray-500">Adjusted: </span>
                <span
                  className={`font-black ${
                    pct > 0 ? "text-red-600" : pct < 0 ? "text-green-600" : "text-gray-900"
                  }`}
                >
                  {fmtCompact(adjustedBudget)}
                </span>
              </div>
              <div className="text-xs text-gray-400">
                {(groupWeight * 100).toFixed(1)}% of city spending
              </div>
            </div>

            {/* Slider */}
            <div className="mt-4 flex items-center gap-3">
              <span className="w-10 text-right text-xs font-bold text-gray-400">-20%</span>
              <div className="relative flex-1">
                <input
                  type="range"
                  min={-20}
                  max={20}
                  step={1}
                  value={pct}
                  onChange={(e) => setSlider(group.name, Number(e.target.value))}
                  className="w-full cursor-pointer accent-gray-900"
                  style={{
                    accentColor: group.color,
                  }}
                />
                {/* Center tick */}
                <div className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-gray-300" />
              </div>
              <span className="w-10 text-xs font-bold text-gray-400">+20%</span>
              <span
                className={`w-14 text-center text-sm font-black ${
                  pct > 0 ? "text-red-600" : pct < 0 ? "text-green-600" : "text-gray-500"
                }`}
              >
                {pct > 0 ? "+" : ""}{pct}%
              </span>
              {pct !== 0 && (
                <button
                  onClick={() => setSlider(group.name, 0)}
                  className="rounded border-2 border-gray-900 bg-gray-100 px-2 py-0.5 text-xs font-bold shadow-[1px_1px_0px_0px_#111] hover:bg-gray-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Disclaimer */}
      <p className="text-center text-xs text-gray-400">
        This is a simplified model for illustration purposes. Actual budget changes involve complex
        trade-offs, revenue offsets, and policy considerations beyond what this simulator captures.
      </p>
    </div>
  );
}
