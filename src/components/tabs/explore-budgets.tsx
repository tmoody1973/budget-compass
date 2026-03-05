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
/* Budget data by jurisdiction                                        */
/* ------------------------------------------------------------------ */

const CITY_TOTAL = 1_004_574_422;
const MPS_TOTAL = 1_594_651_300;
const COUNTY_TOTAL = 1_385_000_000;
const ALL_THREE_TOTAL = CITY_TOTAL + MPS_TOTAL + COUNTY_TOTAL;

const JURISDICTION_COLORS: Record<string, string> = {
  city: "#2563eb",
  mps: "#e11d48",
  county: "#7c3aed",
};

const JURISDICTION_RATES: Record<string, number> = {
  city: taxRatesData.jurisdictions.find((j) => j.id === "city")!.rate,
  mps: taxRatesData.jurisdictions.find((j) => j.id === "mps")!.rate,
  county: taxRatesData.jurisdictions.find((j) => j.id === "county")!.rate,
};

/** City drill-down from serviceGroups in tax-rates-2026.json */
function getCityChildren() {
  return taxRatesData.serviceGroups.map((g) => {
    const groupBudget = g.departments.reduce((s, d) => s + d.budget, 0);
    return {
      name: g.name,
      value: groupBudget,
      color: g.color,
      children: g.departments.map((d) => ({
        name: d.name,
        value: d.budget,
      })),
    };
  });
}

/** MPS drill-down — simplified categories */
const MPS_CHILDREN = [
  { name: "Instruction & Support", value: 850_000_000 },
  { name: "Operations & Maintenance", value: 280_000_000 },
  { name: "Administration", value: 200_000_000 },
  { name: "Other Programs", value: 264_651_300 },
];

/** County drill-down — functional areas */
const COUNTY_CHILDREN = [
  { name: "Health & Human Services", value: 398_400_000 },
  { name: "Transportation", value: 284_100_000 },
  { name: "General Government", value: 204_900_000 },
  { name: "Courts & Judiciary", value: 115_500_000 },
  { name: "Parks, Culture & Recreation", value: 107_800_000 },
  { name: "Public Safety & Law Enforcement", value: 89_200_000 },
  { name: "Land Use & Debt", value: 82_200_000 },
  { name: "Administration", value: 54_700_000 },
  { name: "Economic Development", value: 37_600_000 },
  { name: "Legislative & Executive", value: 2_700_000 },
];

type DrillLevel = "root" | "jurisdiction" | "group";

interface BreadcrumbItem {
  label: string;
  level: DrillLevel;
  jurisdictionId?: string;
  groupName?: string;
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export function ExploreBudgets() {
  const { assessedValue, jurisdictions } = useBudget();

  const [drillPath, setDrillPath] = useState<BreadcrumbItem[]>([
    { label: "All Budgets", level: "root" },
  ]);

  const currentLevel = drillPath[drillPath.length - 1];

  /** Compute your personal tax share for a given budget amount in a jurisdiction */
  function yourShare(budgetAmount: number, jurisdictionId: string): number {
    const rate = JURISDICTION_RATES[jurisdictionId] ?? 0;
    const totalBudget =
      jurisdictionId === "city"
        ? CITY_TOTAL
        : jurisdictionId === "mps"
          ? MPS_TOTAL
          : COUNTY_TOTAL;
    const yourJurisdictionTax = (assessedValue / 1000) * rate;
    return (budgetAmount / totalBudget) * yourJurisdictionTax;
  }

  /** Build treemap data based on current drill level */
  const treemapData = useMemo(() => {
    if (currentLevel.level === "root") {
      return [
        {
          name: "City of Milwaukee",
          value: CITY_TOTAL,
          itemStyle: { color: JURISDICTION_COLORS.city },
          jurisdictionId: "city",
        },
        {
          name: "Milwaukee Public Schools",
          value: MPS_TOTAL,
          itemStyle: { color: JURISDICTION_COLORS.mps },
          jurisdictionId: "mps",
        },
        {
          name: "Milwaukee County",
          value: COUNTY_TOTAL,
          itemStyle: { color: JURISDICTION_COLORS.county },
          jurisdictionId: "county",
        },
      ];
    }

    if (currentLevel.level === "jurisdiction") {
      const jid = currentLevel.jurisdictionId!;
      const baseColor = JURISDICTION_COLORS[jid];

      if (jid === "city") {
        return getCityChildren().map((g, i) => ({
          name: g.name,
          value: g.value,
          itemStyle: { color: g.color },
          jurisdictionId: jid,
          groupName: g.name,
          hasChildren: true,
        }));
      }

      if (jid === "mps") {
        return MPS_CHILDREN.map((c, i) => ({
          name: c.name,
          value: c.value,
          itemStyle: { color: adjustColor(baseColor, i * 15) },
          jurisdictionId: jid,
        }));
      }

      if (jid === "county") {
        return COUNTY_CHILDREN.map((c, i) => ({
          name: c.name,
          value: c.value,
          itemStyle: { color: adjustColor(baseColor, i * 10) },
          jurisdictionId: jid,
        }));
      }
    }

    if (currentLevel.level === "group" && currentLevel.jurisdictionId === "city") {
      const group = taxRatesData.serviceGroups.find(
        (g) => g.name === currentLevel.groupName,
      );
      if (group) {
        const groupColor = group.color;
        return group.departments.map((d, i) => ({
          name: d.name,
          value: d.budget,
          itemStyle: { color: adjustColor(groupColor, i * 12) },
          jurisdictionId: "city",
        }));
      }
    }

    return [];
  }, [currentLevel]);

  /** ECharts option */
  const chartOption = useMemo(() => {
    const activeJurisdictionId =
      currentLevel.level === "root"
        ? null
        : currentLevel.jurisdictionId ?? null;

    return {
      tooltip: {
        formatter: (params: any) => {
          const d = params.data;
          const budget = fmtCompact(d.value);
          const jid = d.jurisdictionId ?? activeJurisdictionId;
          const share = jid ? fmt(yourShare(d.value, jid)) : "";
          const pct = ((d.value / ALL_THREE_TOTAL) * 100).toFixed(1);
          return `
            <div style="font-weight:700;font-size:14px;margin-bottom:4px">${d.name}</div>
            <div>Budget: <b>${budget}</b></div>
            ${jid ? `<div>Your share: <b>${share}/yr</b></div>` : ""}
            <div style="color:#666;font-size:11px">${pct}% of combined budgets</div>
          `;
        },
      },
      series: [
        {
          type: "treemap",
          data: treemapData,
          roam: false,
          nodeClick: false,
          width: "100%",
          height: "100%",
          breadcrumb: { show: false },
          label: {
            show: true,
            formatter: (params: any) => {
              const d = params.data;
              const jid = d.jurisdictionId ?? activeJurisdictionId;
              const share = jid ? fmt(yourShare(d.value, jid)) : "";
              return [
                `{name|${d.name}}`,
                `{budget|${fmtCompact(d.value)}}`,
                jid ? `{share|You pay ${share}/yr}` : "",
              ]
                .filter(Boolean)
                .join("\n");
            },
            rich: {
              name: {
                fontSize: 14,
                fontWeight: "bold",
                color: "#fff",
                lineHeight: 20,
              },
              budget: {
                fontSize: 12,
                color: "rgba(255,255,255,0.85)",
                lineHeight: 18,
              },
              share: {
                fontSize: 11,
                color: "rgba(255,255,255,0.7)",
                lineHeight: 16,
              },
            },
          },
          itemStyle: {
            borderColor: "#111",
            borderWidth: 2,
            gapWidth: 3,
          },
          levels: [
            {
              itemStyle: {
                borderColor: "#111",
                borderWidth: 3,
                gapWidth: 4,
              },
            },
          ],
        },
      ],
    };
  }, [treemapData, assessedValue]);

  /** Handle treemap click for drill-down */
  function handleChartClick(params: any) {
    const d = params.data;
    if (!d) return;

    if (currentLevel.level === "root" && d.jurisdictionId) {
      const label =
        d.jurisdictionId === "city"
          ? "City of Milwaukee"
          : d.jurisdictionId === "mps"
            ? "Milwaukee Public Schools"
            : "Milwaukee County";
      setDrillPath([
        ...drillPath,
        {
          label,
          level: "jurisdiction",
          jurisdictionId: d.jurisdictionId,
        },
      ]);
    } else if (
      currentLevel.level === "jurisdiction" &&
      d.hasChildren &&
      d.groupName
    ) {
      setDrillPath([
        ...drillPath,
        {
          label: d.groupName,
          level: "group",
          jurisdictionId: currentLevel.jurisdictionId,
          groupName: d.groupName,
        },
      ]);
    }
  }

  /** Navigate breadcrumb */
  function navigateTo(index: number) {
    setDrillPath(drillPath.slice(0, index + 1));
  }

  /** Compute summary stats for the current view */
  const viewTotal = treemapData.reduce((s, d) => s + d.value, 0);
  const activeJid =
    currentLevel.level !== "root" ? currentLevel.jurisdictionId : null;
  const viewYourTotal = activeJid
    ? yourShare(viewTotal, activeJid)
    : jurisdictions
        .filter((j) => ["city", "mps", "county"].includes(j.id))
        .reduce((s, j) => s + j.yourShare, 0);

  return (
    <div className="space-y-4">
      {/* Breadcrumb nav */}
      <div className="flex items-center gap-1 rounded-lg border-2 border-gray-900 bg-white px-4 py-3 shadow-[4px_4px_0px_0px_#111]">
        {drillPath.map((crumb, i) => (
          <span key={i} className="flex items-center">
            {i > 0 && (
              <span className="mx-1 text-gray-400 font-bold">&gt;</span>
            )}
            {i < drillPath.length - 1 ? (
              <button
                onClick={() => navigateTo(i)}
                className="text-sm font-bold text-blue-600 hover:underline"
              >
                {crumb.label}
              </button>
            ) : (
              <span className="text-sm font-bold text-gray-900">
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </div>

      {/* Summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-gray-900 bg-white px-4 py-3 shadow-[4px_4px_0px_0px_#111]">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Combined Budget
          </span>
          <p className="text-xl font-black text-gray-900">
            {fmtCompact(viewTotal)}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Your Annual Share
          </span>
          <p className="text-xl font-black text-blue-900">
            {fmt(viewYourTotal)}
          </p>
        </div>
        {currentLevel.level !== "root" && (
          <button
            onClick={() => navigateTo(drillPath.length - 2)}
            className="rounded-lg border-2 border-gray-900 bg-gray-100 px-3 py-1.5 text-sm font-bold shadow-[2px_2px_0px_0px_#111] hover:bg-gray-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#111]"
          >
            Back
          </button>
        )}
      </div>

      {/* Treemap */}
      <div className="rounded-lg border-2 border-gray-900 bg-white p-2 shadow-[4px_4px_0px_0px_#111]">
        <ReactECharts
          option={chartOption}
          style={{ height: 480 }}
          onEvents={{ click: handleChartClick }}
        />
      </div>

      {/* Drill hint */}
      {currentLevel.level === "root" && (
        <p className="text-center text-xs font-medium text-gray-500">
          Click a jurisdiction to explore its budget breakdown
        </p>
      )}
      {currentLevel.level === "jurisdiction" &&
        currentLevel.jurisdictionId === "city" && (
          <p className="text-center text-xs font-medium text-gray-500">
            Click a service group to see individual departments
          </p>
        )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Color utility                                                      */
/* ------------------------------------------------------------------ */

/** Lighten/shift a hex color by an amount */
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  let r = (num >> 16) + amount;
  let g = ((num >> 8) & 0x00ff) + amount;
  let b = (num & 0x0000ff) + amount;
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
