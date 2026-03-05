"use client";

import { useState, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { useBudget } from "@/contexts/budget-context";
import taxRatesData from "../../../data/tax-rates-2026.json";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmt(n: number, decimals = 2): string {
  if (Math.abs(n) < 0.01) return "$0.00";
  return (
    "$" +
    n.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );
}

function fmtCompact(n: number): string {
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(0) + "K";
  return "$" + n.toFixed(0);
}

/* ------------------------------------------------------------------ */
/* Derived constants from JSON                                        */
/* ------------------------------------------------------------------ */

const GCP_TOTAL_BUDGET = taxRatesData.serviceGroups
  .flatMap((g) => g.departments)
  .reduce((s, d) => s + d.budget, 0);

const totalCityLevy = taxRatesData.cityBudgetSections.reduce(
  (s, b) => s + b.levy,
  0,
);

const gcpSection = taxRatesData.cityBudgetSections.find(
  (s) => s.id === "gcp",
)!;

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export function TaxReceipt() {
  const { assessedValue, totalTax, grossRate, jurisdictions } = useBudget();

  const [expandedJurisdiction, setExpandedJurisdiction] = useState<
    string | null
  >(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [cityView, setCityView] = useState<"services" | "sections">(
    "services",
  );

  /* City-level calculations */
  const cityJurisdiction = jurisdictions.find((j) => j.id === "city")!;
  const cityTax = cityJurisdiction.yourShare;
  const gcpShare = gcpSection.levy / totalCityLevy;
  const gcpTax = cityTax * gcpShare;

  /* Service groups with per-department share of the user's GCP tax */
  const groups = useMemo(() => {
    return taxRatesData.serviceGroups.map((g) => {
      const groupBudget = g.departments.reduce((s, d) => s + d.budget, 0);
      const budgetShare = groupBudget / GCP_TOTAL_BUDGET;
      const yourShare = gcpTax * budgetShare;
      const depts = g.departments
        .map((d) => {
          const deptShare = d.budget / GCP_TOTAL_BUDGET;
          return {
            ...d,
            yourShare: gcpTax * deptShare,
            pctOfGCP: deptShare * 100,
          };
        })
        .sort((a, b) => b.yourShare - a.yourShare);
      return {
        ...g,
        groupBudget,
        budgetShare,
        yourShare,
        depts,
        pctOfGCP: budgetShare * 100,
      };
    });
  }, [gcpTax]);

  /* ECharts stacked bar */
  const stackedBarOption = {
    tooltip: {
      trigger: "item" as const,
      formatter: (p: any) =>
        `${p.seriesName}: $${p.value.toFixed(2)} (${((p.value / totalTax) * 100).toFixed(0)}%)`,
    },
    grid: { left: 0, right: 0, top: 0, bottom: 0 },
    xAxis: { type: "value" as const, show: false, max: totalTax },
    yAxis: { type: "category" as const, show: false, data: ["Tax"] },
    series: jurisdictions.map((j) => ({
      name: j.shortName,
      type: "bar" as const,
      stack: "total",
      data: [j.yourShare],
      itemStyle: { color: j.color },
      barWidth: 28,
    })),
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* ---- Total Tax Summary ---- */}
      <div className="rounded-xl border-2 border-gray-900 bg-gray-900 p-5 text-white shadow-[4px_4px_0px_0px_#111]">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Your Total Property Tax
            </div>
            <div className="text-4xl font-extrabold tracking-tight">
              {fmt(totalTax)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white/90">
              ${grossRate}
              <span className="text-xs text-gray-400">/1K</span>
            </div>
            <div className="text-[10px] text-gray-500">combined rate</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: "Per month", value: totalTax / 12 },
            { label: "Per week", value: totalTax / 52 },
            { label: "Per day", value: totalTax / 365 },
          ].map((x) => (
            <div
              key={x.label}
              className="rounded-lg bg-white/10 py-2 text-center"
            >
              <div className="text-base font-bold">{fmt(x.value)}</div>
              <div className="text-[10px] text-gray-400">{x.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ---- Stacked Bar: Where Every Dollar Goes ---- */}
      <div className="rounded-xl border-2 border-gray-900 bg-white p-4 shadow-[4px_4px_0px_0px_#111]">
        <h2 className="mb-2 text-sm font-bold text-gray-900">
          Where Every Dollar Goes
        </h2>
        <ReactECharts
          option={stackedBarOption}
          style={{ height: 36 }}
          opts={{ renderer: "svg" }}
        />
        <div className="mt-2 flex flex-wrap justify-between gap-2">
          {jurisdictions.map((j) => (
            <div
              key={j.id}
              className="flex items-center gap-1 text-[10px] text-gray-500"
            >
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-sm"
                style={{ backgroundColor: j.color }}
              />
              {j.shortName} {j.pct.toFixed(0)}%
            </div>
          ))}
        </div>
      </div>

      {/* ---- Jurisdiction Cards ---- */}
      {jurisdictions.map((j) => {
        const isExpanded = expandedJurisdiction === j.id;
        const isCityExpanded = j.id === "city" && isExpanded;

        return (
          <div
            key={j.id}
            className="overflow-hidden rounded-xl border-2 border-gray-900 bg-white shadow-[4px_4px_0px_0px_#111] transition-colors"
          >
            {/* Header button */}
            <button
              onClick={() => {
                setExpandedJurisdiction(isExpanded ? null : j.id);
                if (j.id !== "city") setExpandedGroup(null);
              }}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{j.icon}</span>
                <div>
                  <div className="text-sm font-bold text-gray-900">
                    {j.name}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    ${j.rate.toFixed(2)}/1K &middot; {j.pct.toFixed(0)}% of
                    your bill
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div
                    className="text-lg font-bold"
                    style={{ color: j.color }}
                  >
                    {fmt(j.yourShare)}
                  </div>
                  <div className="text-[9px] text-gray-400">
                    {fmt(j.monthly)}/mo
                  </div>
                </div>
                <span
                  className="text-sm transition-transform duration-200"
                  style={{
                    color: j.color,
                    transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
                  }}
                >
                  &#x25BE;
                </span>
              </div>
            </button>

            {/* Non-city expansion */}
            {isExpanded && j.id !== "city" && (
              <div className="border-t border-gray-100 px-4 pb-4 pt-3 text-xs leading-relaxed text-gray-600">
                {j.detail}
              </div>
            )}

            {/* City expansion with department breakdown */}
            {isCityExpanded && (
              <div className="border-t border-gray-100 px-3 pb-4 pt-3">
                {/* Toggle: services vs sections */}
                <div className="mb-3 flex gap-1 rounded-lg bg-gray-100 p-0.5">
                  {(
                    [
                      { id: "services", label: "By Service Area" },
                      { id: "sections", label: "By Budget Section" },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setCityView(t.id)}
                      className={`flex-1 rounded-md py-1.5 text-[11px] font-semibold transition-colors ${
                        cityView === t.id
                          ? "bg-white text-blue-800 shadow-sm"
                          : "text-gray-500"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* --- BY SERVICE AREA --- */}
                {cityView === "services" && (
                  <div className="space-y-1.5">
                    {groups.map((g) => {
                      const isGroupOpen = expandedGroup === g.name;
                      return (
                        <div
                          key={g.name}
                          className="overflow-hidden rounded-lg border border-gray-200"
                        >
                          <button
                            onClick={() =>
                              setExpandedGroup(isGroupOpen ? null : g.name)
                            }
                            className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base">{g.icon}</span>
                              <div>
                                <div className="text-xs font-bold text-gray-900">
                                  {g.name}
                                </div>
                                <div className="text-[9px] text-gray-400">
                                  {g.depts.length} depts &middot;{" "}
                                  {g.pctOfGCP.toFixed(0)}% of city operations
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className="text-sm font-bold"
                                style={{ color: g.color }}
                              >
                                {fmt(g.yourShare)}
                              </span>
                              <span
                                className="text-xs transition-transform duration-200"
                                style={{
                                  color: g.color,
                                  transform: isGroupOpen
                                    ? "rotate(180deg)"
                                    : "rotate(0)",
                                }}
                              >
                                &#x25BE;
                              </span>
                            </div>
                          </button>

                          {isGroupOpen && (
                            <div className="px-3 pb-3">
                              {g.depts.map((d, i) => {
                                const maxShare = g.depts[0].yourShare;
                                const barW =
                                  maxShare > 0
                                    ? Math.max(
                                        3,
                                        (d.yourShare / maxShare) * 100,
                                      )
                                    : 0;
                                return (
                                  <div
                                    key={d.name}
                                    className={`py-1.5 ${i > 0 ? "border-t border-gray-100" : ""}`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <span className="text-[11px] font-semibold text-gray-800">
                                        {d.name}
                                      </span>
                                      <div className="shrink-0 text-right">
                                        <div className="text-xs font-bold text-gray-900">
                                          {fmt(d.yourShare)}
                                        </div>
                                        <div className="text-[8px] text-gray-400">
                                          {fmtCompact(d.budget)} budget
                                        </div>
                                      </div>
                                    </div>
                                    <div className="mt-1 h-[3px] overflow-hidden rounded-full bg-gray-100">
                                      <div
                                        className="h-full rounded-full transition-all duration-300"
                                        style={{
                                          width: `${barW}%`,
                                          backgroundColor: g.color,
                                        }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Other city obligations */}
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="mb-2 text-[11px] font-bold text-gray-600">
                        Other City Obligations
                      </div>
                      {taxRatesData.cityBudgetSections
                        .filter((s) => s.id !== "gcp")
                        .map((s) => {
                          const sectionShare = s.levy / totalCityLevy;
                          const yourShare = cityTax * sectionShare;
                          return (
                            <div
                              key={s.id}
                              className="flex justify-between py-1 text-[11px]"
                            >
                              <span className="text-gray-500">{s.name}</span>
                              <span className="font-semibold">
                                {fmt(yourShare)}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* --- BY BUDGET SECTION --- */}
                {cityView === "sections" && (
                  <div>
                    {taxRatesData.cityBudgetSections.map((s) => {
                      const sectionShare = s.levy / totalCityLevy;
                      const yourShare = cityTax * sectionShare;
                      return (
                        <div
                          key={s.id}
                          className="flex items-center justify-between border-b border-gray-100 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block h-2 w-2 shrink-0 rounded-sm"
                              style={{ backgroundColor: s.color }}
                            />
                            <div>
                              <div className="text-xs font-semibold">
                                {s.name}
                              </div>
                              <div className="text-[9px] text-gray-400">
                                {fmtCompact(s.levy)} levy &middot;{" "}
                                {(sectionShare * 100).toFixed(1)}%
                              </div>
                            </div>
                          </div>
                          <div className="text-[13px] font-bold">
                            {fmt(yourShare)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* ---- Tax Credits Note ---- */}
      <div className="rounded-xl border-2 border-green-300 bg-green-50 p-4">
        <div className="mb-1 text-xs font-bold text-green-800">
          Your bill may be lower
        </div>
        <div className="text-[11px] leading-relaxed text-green-700">
          Wisconsin provides three tax credits that can reduce your bill:{" "}
          <strong>School Levy Tax Credit</strong>,{" "}
          <strong>First Dollar Credit</strong>, and{" "}
          <strong>Lottery &amp; Gaming Credit</strong> (for primary residences).
          These are applied automatically on your tax bill.
        </div>
      </div>

      {/* ---- Methodology Footer ---- */}
      <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-4 text-[10px] leading-relaxed text-gray-500">
        <div className="mb-1 text-[11px] font-bold text-gray-600">
          How This Is Calculated
        </div>
        <div>
          <strong>Total Tax</strong> = (Assessed Value / 1,000) x ${grossRate}{" "}
          combined mill rate
        </div>
        <div>
          <strong>Entity Share</strong> = (Assessed Value / 1,000) x Entity Rate
        </div>
        <div>
          <strong>Department Share</strong> = (Dept Budget / Total GCP Budget) x
          Your City GCP portion
        </div>
        <div className="mt-2">
          Combined rate of ${grossRate}/1K from the 2025 assessment year (2026
          budget year). Entity shares per the City Comptroller&apos;s Office.
          City department detail from the 2026 Proposed Executive Budget. Median
          home value: ~$166,000 (2025 assessment).
        </div>
        <div className="mt-1 italic">
          Sources: City of Milwaukee Comptroller&apos;s Office, 2026 Proposed
          Budget
        </div>
      </div>
    </div>
  );
}
