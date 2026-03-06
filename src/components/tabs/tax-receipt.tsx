"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
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

const MPS_OFFICE_TOTAL = (taxRatesData as any).mpsOffices.reduce(
  (s: number, o: any) => s + o.budget,
  0,
);

const MPS_FUND_TOTAL = (taxRatesData as any).mpsFundGroups.reduce(
  (s: number, f: any) => s + f.budget,
  0,
);

const COUNTY_DEPT_TOTAL = (taxRatesData as any).countyDepartments.reduce(
  (s: number, d: any) => s + d.budget,
  0,
);

/* ------------------------------------------------------------------ */
/* Shared card style                                                  */
/* ------------------------------------------------------------------ */

const cardBase =
  "rounded-xl border-2 border-gray-900 shadow-[4px_4px_0px_0px_#111] transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-[4px_6px_0px_0px_#111]";

/* ------------------------------------------------------------------ */
/* DepartmentRows — reusable for MPS/County/City breakdowns           */
/* ------------------------------------------------------------------ */

function DepartmentRows({
  items,
  color,
  total,
  yourTax,
  jurisdiction,
}: {
  items: { name: string; budget: number; desc?: string }[];
  color: string;
  total: number;
  yourTax: number;
  jurisdiction: string;
}) {
  const maxBudget = Math.max(...items.map((d) => d.budget));
  const [activeExplain, setActiveExplain] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [loadingExplain, setLoadingExplain] = useState<string | null>(null);

  const handleExplain = useCallback(
    async (name: string, budget: number, share: number) => {
      if (activeExplain === name) {
        setActiveExplain(null);
        return;
      }
      setActiveExplain(name);
      if (explanations[name]) return;
      setLoadingExplain(name);
      try {
        const res = await fetch("/api/receipt-explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            item: name,
            budget,
            yourShare: share,
            jurisdiction,
          }),
        });
        const data = await res.json();
        if (data.explanation) {
          setExplanations((prev) => ({ ...prev, [name]: data.explanation }));
        }
      } catch {
        // silently fail — no explanation shown
      } finally {
        setLoadingExplain(null);
      }
    },
    [activeExplain, explanations, jurisdiction],
  );

  return (
    <div className="space-y-0">
      {items.map((d, i) => {
        const share = (d.budget / total) * yourTax;
        const barW = maxBudget > 0 ? Math.max(3, (d.budget / maxBudget) * 100) : 0;
        return (
          <div
            key={d.name}
            className={`py-1.5 ${i > 0 ? "border-t border-gray-100" : ""}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-gray-800">
                  {d.name}
                </span>
                <button
                  onClick={() => handleExplain(d.name, d.budget, share)}
                  className="flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-full border border-gray-300 text-[8px] font-bold text-gray-400 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-500"
                  title="Explain this item"
                >
                  {loadingExplain === d.name ? (
                    <span className="inline-block h-2 w-2 animate-spin rounded-full border border-blue-400 border-t-transparent" />
                  ) : (
                    "?"
                  )}
                </button>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-xs font-bold text-gray-900">
                  {fmt(share)}
                </div>
                <div className="text-[8px] text-gray-400">
                  {fmtCompact(d.budget)} budget
                </div>
              </div>
            </div>
            {activeExplain === d.name && explanations[d.name] && (
              <div className="mt-1.5 rounded-md bg-blue-50 px-2.5 py-2 text-[10px] leading-relaxed text-blue-900">
                {explanations[d.name]}
                <div className="mt-1 text-right text-[8px] text-gray-400">
                  Powered by Nova
                </div>
              </div>
            )}
            <div className="mt-1 h-[3px] overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${barW}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* AI Insights Card                                                   */
/* ------------------------------------------------------------------ */

function AIInsightsCard({
  assessedValue,
  totalTax,
  persona,
  jurisdictions,
  onStoryReady,
}: {
  assessedValue: number;
  totalTax: number;
  persona: string;
  jurisdictions: any[];
  onStoryReady: (story: string) => void;
}) {
  const [story, setStory] = useState<string>("");
  const [didYouKnow, setDidYouKnow] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Static fallbacks
  const fallbackStory = useMemo(() => {
    const daily = totalTax / 365;
    const monthly = totalTax / 12;
    const mpsJ = jurisdictions.find((j: any) => j.id === "mps");
    const cityJ = jurisdictions.find((j: any) => j.id === "city");
    const biggestJ = jurisdictions[0];
    return `Your home is assessed at $${assessedValue.toLocaleString()}, and your total annual property tax comes to ${fmt(totalTax)} — that's ${fmt(monthly)} per month or about ${fmt(daily)} per day, roughly the cost of a coffee.\n\nThe biggest slice of your bill goes to ${biggestJ?.shortName || "MPS"}, which receives ${biggestJ?.pct?.toFixed(0) || "43"}% of every dollar. ${mpsJ ? `MPS's share grew after the 2024 voter-approved referendum that expanded school funding.` : ""} All five tax rates actually dropped this year, but rising assessed values mean your bill may still have increased.\n\nYour taxes fund schools, public safety, parks, libraries, and the infrastructure that keeps Milwaukee running. ${cityJ ? `Of your city portion, about 51% goes to Police and Fire services.` : ""} Understanding where your money goes is the first step to civic engagement.`;
  }, [assessedValue, totalTax, jurisdictions]);

  const fallbackFacts = useMemo(
    () => [
      "Milwaukee County's 0.4% sales tax, approved in 2023, generates ~$170M annually and helps offset property tax increases.",
      "MPS spends approximately $16,000 per pupil — above the national average of $14,347 — funded largely through the property tax levy.",
      "All five Milwaukee taxing jurisdictions lowered their mill rates in 2026, but total levy collections still grew due to rising property values.",
    ],
    [],
  );

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled && loading) {
        setLoading(false);
        setError(true);
        setStory(fallbackStory);
        setDidYouKnow(fallbackFacts);
        onStoryReady(fallbackStory);
      }
    }, 8000);

    fetch("/api/receipt-insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assessedValue,
        totalTax,
        persona,
        jurisdictions: jurisdictions.map((j: any) => ({
          id: j.id,
          shortName: j.shortName,
          rate: j.rate,
          yourShare: j.yourShare,
          pct: j.pct,
        })),
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          const s = data.story || fallbackStory;
          const facts =
            data.didYouKnow?.length > 0 ? data.didYouKnow : fallbackFacts;
          setStory(s);
          setDidYouKnow(facts);
          setLoading(false);
          onStoryReady(s);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStory(fallbackStory);
          setDidYouKnow(fallbackFacts);
          setLoading(false);
          setError(true);
          onStoryReady(fallbackStory);
        }
      });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [assessedValue, totalTax, persona]);

  return (
    <div
      className={`${cardBase} bg-gradient-to-br from-amber-50 to-orange-50 p-4`}
    >
      {/* Your Tax Story */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg">{"\ud83d\udcd6"}</span>
        <h3 className="text-sm font-bold text-amber-900">Your Tax Story</h3>
        {error && (
          <span className="ml-auto text-[9px] text-amber-600">
            pre-computed
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-lg bg-amber-200/50"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {story.split("\n").filter(Boolean).map((para, i) => (
              <p
                key={i}
                className="rounded-lg bg-white/70 px-3 py-2 text-xs leading-relaxed text-amber-900"
              >
                {para}
              </p>
            ))}
          </div>

          {/* Did You Know */}
          {didYouKnow.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 flex items-center gap-1.5">
                <span className="text-sm">{"\ud83d\udca1"}</span>
                <h4 className="text-xs font-bold text-amber-800">
                  Did You Know?
                </h4>
              </div>
              <div className="flex flex-col gap-2">
                {didYouKnow.map((fact, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-white/80 px-3 py-2 text-[11px] leading-relaxed text-amber-900 shadow-sm"
                  >
                    {fact}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Powered by Amazon Nova badge */}
          <div className="mt-3 text-right text-[9px] text-amber-600/60">
            Powered by Amazon Nova
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Component                                                     */
/* ------------------------------------------------------------------ */

export function TaxReceipt() {
  const { assessedValue, totalTax, grossRate, jurisdictions, persona } =
    useBudget();

  const [expandedJurisdiction, setExpandedJurisdiction] = useState<
    string | null
  >(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [cityView, setCityView] = useState<"services" | "sections">(
    "services",
  );
  const [mpsView, setMpsView] = useState<"offices" | "funds">("offices");

  // Lifted story state for voice button
  const [storyText, setStoryText] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const handleBriefMe = useCallback(() => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }
    const text =
      storyText ||
      `Your total annual property tax is ${fmt(totalTax)}, about ${fmt(totalTax / 12)} per month.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsPlaying(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  }, [storyText, isPlaying, totalTax]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  /* City-level calculations */
  const cityJurisdiction = jurisdictions.find((j) => j.id === "city")!;
  const cityTax = cityJurisdiction.yourShare;
  const gcpShare = gcpSection.levy / totalCityLevy;
  const gcpTax = cityTax * gcpShare;

  /* MPS-level calculations */
  const mpsJurisdiction = jurisdictions.find((j) => j.id === "mps")!;
  const mpsTax = mpsJurisdiction.yourShare;

  /* County-level calculations */
  const countyJurisdiction = jurisdictions.find((j) => j.id === "county")!;
  const countyTax = countyJurisdiction.yourShare;

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

  /* Background tints per jurisdiction */
  const bgTints: Record<string, string> = {
    city: "bg-blue-50/60",
    mps: "bg-rose-50/60",
    county: "bg-violet-50/60",
    mmsd: "bg-cyan-50/60",
    matc: "bg-emerald-50/60",
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {/* ================ BENTO GRID ================ */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* ---- Hero: Total Tax Summary (full width) ---- */}
        <div
          className={`${cardBase} col-span-1 bg-gray-900 p-5 text-white md:col-span-2 lg:col-span-3`}
        >
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Your Total Property Tax
              </div>
              <div className="text-4xl font-extrabold tracking-tight">
                {fmt(totalTax)}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleBriefMe}
                className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-white/20"
              >
                {isPlaying ? (
                  <>
                    <span className="text-sm">{"\u23f8\ufe0f"}</span> Pause
                  </>
                ) : (
                  <>
                    <span className="text-sm">{"\ud83c\udfa7"}</span> Brief me
                  </>
                )}
              </button>
              <div className="text-right">
                <div className="text-2xl font-bold text-white/90">
                  ${grossRate}
                  <span className="text-xs text-gray-400">/1K</span>
                </div>
                <div className="text-[10px] text-gray-500">combined rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* ---- Stacked Bar (2 col) ---- */}
        <div
          className={`${cardBase} col-span-1 bg-white p-4 md:col-span-2`}
        >
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

        {/* ---- Daily/Monthly/Weekly (1 col, tall) ---- */}
        <div
          className={`${cardBase} col-span-1 bg-gray-900 p-4 text-white`}
        >
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
            What You Pay
          </h3>
          <div className="flex flex-col gap-3">
            {[
              { label: "Per month", value: totalTax / 12 },
              { label: "Per week", value: totalTax / 52 },
              { label: "Per day", value: totalTax / 365 },
            ].map((x) => (
              <div
                key={x.label}
                className="rounded-lg bg-white/10 px-3 py-3 text-center"
              >
                <div className="text-xl font-bold">{fmt(x.value)}</div>
                <div className="text-[10px] text-gray-400">{x.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ---- Top 3 jurisdiction cards (1 col each) ---- */}
        {jurisdictions.slice(0, 3).map((j) => (
          <div
            key={j.id}
            className={`${cardBase} col-span-1 ${bgTints[j.id] || "bg-white"} p-4`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{j.icon}</span>
              <div>
                <div className="text-sm font-bold text-gray-900">
                  {j.shortName}
                </div>
                <div className="text-[10px] text-gray-400">
                  ${j.rate.toFixed(2)}/1K &middot; {j.pct.toFixed(0)}% of bill
                </div>
              </div>
            </div>
            <div className="mt-2 text-2xl font-extrabold" style={{ color: j.color }}>
              {fmt(j.yourShare)}
            </div>
            <div className="text-[9px] text-gray-400">{fmt(j.monthly)}/mo</div>
          </div>
        ))}

        {/* ---- AI Insights (spans full width on lg) ---- */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3">
          <AIInsightsCard
            assessedValue={assessedValue}
            totalTax={totalTax}
            persona={persona}
            jurisdictions={jurisdictions}
            onStoryReady={setStoryText}
          />
        </div>

        {/* ---- City Detail (2 col) ---- */}
        <div
          className={`${cardBase} col-span-1 ${bgTints.city} overflow-hidden md:col-span-2`}
        >
          <button
            onClick={() =>
              setExpandedJurisdiction(
                expandedJurisdiction === "city" ? null : "city",
              )
            }
            className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-blue-100/40"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🏛️</span>
              <div>
                <div className="text-sm font-bold text-gray-900">
                  City of Milwaukee Detail
                </div>
                <div className="text-[10px] text-gray-400">
                  {taxRatesData.serviceGroups.flatMap((g) => g.departments).length}{" "}
                  departments across {taxRatesData.serviceGroups.length} service
                  areas
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-blue-600">
                {fmt(cityTax)}
              </span>
              <span
                className="text-sm text-blue-600 transition-transform duration-200"
                style={{
                  transform:
                    expandedJurisdiction === "city"
                      ? "rotate(180deg)"
                      : "rotate(0)",
                }}
              >
                &#x25BE;
              </span>
            </div>
          </button>

          {expandedJurisdiction === "city" && (
            <div className="border-t border-gray-200 px-3 pb-4 pt-3">
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

        {/* ---- MPS Detail (1 col) ---- */}
        <div
          className={`${cardBase} col-span-1 ${bgTints.mps} overflow-hidden`}
        >
          <button
            onClick={() =>
              setExpandedJurisdiction(
                expandedJurisdiction === "mps" ? null : "mps",
              )
            }
            className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-rose-100/40"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🎓</span>
              <div>
                <div className="text-sm font-bold text-gray-900">
                  MPS Detail
                </div>
                <div className="text-[10px] text-gray-400">
                  15 offices &middot; 7 fund groups
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-rose-600">
                {fmt(mpsTax)}
              </span>
              <span
                className="text-sm text-rose-600 transition-transform duration-200"
                style={{
                  transform:
                    expandedJurisdiction === "mps"
                      ? "rotate(180deg)"
                      : "rotate(0)",
                }}
              >
                &#x25BE;
              </span>
            </div>
          </button>

          {expandedJurisdiction === "mps" && (
            <div className="border-t border-gray-200 px-3 pb-4 pt-3">
              {/* Toggle: offices vs fund groups */}
              <div className="mb-3 flex gap-1 rounded-lg bg-gray-100 p-0.5">
                {(
                  [
                    { id: "offices", label: "By Office" },
                    { id: "funds", label: "By Fund Group" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setMpsView(t.id)}
                    className={`flex-1 rounded-md py-1.5 text-[11px] font-semibold transition-colors ${
                      mpsView === t.id
                        ? "bg-white text-rose-800 shadow-sm"
                        : "text-gray-500"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {mpsView === "offices" && (
                <DepartmentRows
                  items={(taxRatesData as any).mpsOffices}
                  color="#e11d48"
                  total={MPS_OFFICE_TOTAL}
                  yourTax={mpsTax}
                  jurisdiction="Milwaukee Public Schools"
                />
              )}

              {mpsView === "funds" && (
                <DepartmentRows
                  items={(taxRatesData as any).mpsFundGroups}
                  color="#e11d48"
                  total={MPS_FUND_TOTAL}
                  yourTax={mpsTax}
                  jurisdiction="Milwaukee Public Schools"
                />
              )}
            </div>
          )}
        </div>

        {/* ---- County Detail (1 col) ---- */}
        <div
          className={`${cardBase} col-span-1 ${bgTints.county} overflow-hidden md:col-span-1`}
        >
          <button
            onClick={() =>
              setExpandedJurisdiction(
                expandedJurisdiction === "county" ? null : "county",
              )
            }
            className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-violet-100/40"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🏞️</span>
              <div>
                <div className="text-sm font-bold text-gray-900">
                  County Detail
                </div>
                <div className="text-[10px] text-gray-400">
                  10 functional areas
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-violet-600">
                {fmt(countyTax)}
              </span>
              <span
                className="text-sm text-violet-600 transition-transform duration-200"
                style={{
                  transform:
                    expandedJurisdiction === "county"
                      ? "rotate(180deg)"
                      : "rotate(0)",
                }}
              >
                &#x25BE;
              </span>
            </div>
          </button>

          {expandedJurisdiction === "county" && (
            <div className="border-t border-gray-200 px-3 pb-4 pt-3">
              <DepartmentRows
                items={(taxRatesData as any).countyDepartments}
                color="#7c3aed"
                total={COUNTY_DEPT_TOTAL}
                yourTax={countyTax}
                jurisdiction="Milwaukee County"
              />
            </div>
          )}
        </div>

        {/* ---- Remaining jurisdictions (MMSD, MATC) ---- */}
        {jurisdictions.slice(3).map((j) => (
          <div
            key={j.id}
            className={`${cardBase} col-span-1 ${bgTints[j.id] || "bg-white"} p-4`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{j.icon}</span>
              <div>
                <div className="text-sm font-bold text-gray-900">
                  {j.name}
                </div>
                <div className="text-[10px] text-gray-400">
                  ${j.rate.toFixed(2)}/1K &middot; {j.pct.toFixed(0)}% of bill
                </div>
              </div>
            </div>
            <div
              className="mt-2 text-xl font-extrabold"
              style={{ color: j.color }}
            >
              {fmt(j.yourShare)}
            </div>
            <div className="mt-1 text-[10px] leading-relaxed text-gray-500">
              {j.detail}
            </div>
          </div>
        ))}

        {/* ---- Tax Credits (full width) ---- */}
        <div
          className={`${cardBase} col-span-1 border-green-300 bg-green-50 p-4 md:col-span-2 lg:col-span-3`}
        >
          <div className="mb-1 text-xs font-bold text-green-800">
            Your bill may be lower
          </div>
          <div className="text-[11px] leading-relaxed text-green-700">
            Wisconsin provides three tax credits that can reduce your bill:{" "}
            <strong>School Levy Tax Credit</strong>,{" "}
            <strong>First Dollar Credit</strong>, and{" "}
            <strong>Lottery &amp; Gaming Credit</strong> (for primary
            residences). These are applied automatically on your tax bill.
          </div>
        </div>

        {/* ---- Methodology (full width) ---- */}
        <div
          className={`${cardBase} col-span-1 border-gray-200 bg-gray-50 p-4 text-[10px] leading-relaxed text-gray-500 md:col-span-2 lg:col-span-3`}
        >
          <div className="mb-1 text-[11px] font-bold text-gray-600">
            How This Is Calculated
          </div>
          <div>
            <strong>Total Tax</strong> = (Assessed Value / 1,000) x ${grossRate}{" "}
            combined mill rate
          </div>
          <div>
            <strong>Entity Share</strong> = (Assessed Value / 1,000) x Entity
            Rate
          </div>
          <div>
            <strong>Department Share</strong> = (Dept Budget / Total Budget) x
            Your jurisdiction portion
          </div>
          <div className="mt-2">
            Combined rate of ${grossRate}/1K from the 2025 assessment year (2026
            budget year). Entity shares per the City Comptroller&apos;s Office.
            City department detail from the 2026 Proposed Executive Budget.
            MPS data from 2025-26 Superintendent&apos;s Proposed Budget.
            County data from 2026 Adopted Operating Budget.
          </div>
          <div className="mt-1 italic">
            Sources: City of Milwaukee Comptroller&apos;s Office, MPS, Milwaukee County, Wisconsin Policy Forum
          </div>
        </div>
      </div>
    </div>
  );
}
