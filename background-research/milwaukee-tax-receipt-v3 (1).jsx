import { useState, useMemo } from "react";

// ============================================================
// FULL COMBINED TAX BILL — ALL 5 TAXING JURISDICTIONS
// 2025 tax year (bills mailed Dec 2024). Combined rate: $22.93/1K
// Source: City Comptroller's Office, Urban Milwaukee, MPS referendum data
// ============================================================

const COMBINED_RATE = 22.93; // Total mill rate per $1,000 assessed value

// Five taxing entities — rates derived from Comptroller's published shares
// MPS 43%, City 34%, County 14%, MMSD 5%, MATC 4%
const JURISDICTIONS = [
  {
    id: "mps",
    name: "Milwaukee Public Schools",
    shortName: "MPS",
    rate: 9.86,
    color: "#e11d48",
    icon: "🎓",
    desc: "K-12 education for ~70,000 students across 130+ schools. Includes $140M referendum increase approved April 2024.",
    detail: "Largest share of your tax bill. Funds teacher salaries, school operations, special education, transportation, building maintenance, and extracurricular programs.",
    fundingNote: "MPS levy grew 29.5% in 2024 due to the voter-approved referendum to address a $200M budget shortfall.",
  },
  {
    id: "city",
    name: "City of Milwaukee",
    shortName: "City",
    rate: 7.80,
    color: "#2563eb",
    icon: "🏛️",
    desc: "Police, fire, public works, libraries, health, and all city services.",
    detail: "Funds city government operations across 21+ departments.",
    expandable: true,
  },
  {
    id: "county",
    name: "Milwaukee County",
    shortName: "County",
    rate: 3.21,
    color: "#7c3aed",
    icon: "🏞️",
    desc: "Parks, transit, courts, behavioral health, and county services.",
    detail: "Funds the county park system (15,000+ acres), Milwaukee County Transit System, county courts, medical examiner, child support, and human services programs.",
  },
  {
    id: "mmsd",
    name: "Milwaukee Metropolitan Sewerage District",
    shortName: "MMSD",
    rate: 1.15,
    color: "#0891b2",
    icon: "💧",
    desc: "Wastewater treatment, flood management, and water quality.",
    detail: "Operates the Jones Island and South Shore water reclamation facilities, manages the deep tunnel system, and works to keep Lake Michigan and local waterways clean.",
  },
  {
    id: "matc",
    name: "Milwaukee Area Technical College",
    shortName: "MATC",
    rate: 0.91,
    color: "#059669",
    icon: "📚",
    desc: "Workforce training, associate degrees, and continuing education.",
    detail: "Serves 30,000+ students at 4 campuses offering 170+ programs in healthcare, IT, skilled trades, and business. Provides affordable pathways to careers.",
  },
];

// Verify total
const RATE_SUM = JURISDICTIONS.reduce((s, j) => s + j.rate, 0);

// ============================================================
// CITY OF MILWAUKEE DETAIL — 2026 Proposed Budget
// ============================================================
const CITY_LEVY = 333875022;
const CITY_RATE = 7.52; // 2026 proposed rate
const GCP_LEVY = 144523699;
const GCP_RATE = 3.26;
const GCP_TOTAL_BUDGET = 810730062;

const CITY_BUDGET_SECTIONS = [
  { id: "gcp", name: "General City Purposes", levy: 144523699, rate: 3.26, color: "#2563eb" },
  { id: "debt", name: "City Debt Service", levy: 106674678, rate: 2.40, color: "#dc2626" },
  { id: "retirement", name: "Employee Retirement", levy: 76771645, rate: 1.73, color: "#7c3aed" },
  { id: "contingent", name: "Council Contingent Fund", levy: 5000000, rate: 0.11, color: "#d97706" },
  { id: "capital", name: "Capital Improvements", levy: 905000, rate: 0.02, color: "#059669" },
];

const SERVICE_GROUPS = [
  {
    name: "Public Safety",
    icon: "🛡️",
    color: "#dc2626",
    lightColor: "#fef2f2",
    departments: [
      { name: "Police Department", budget: 310135835, revenue: 7674000, desc: "Patrol, investigations, community policing" },
      { name: "Fire Department", budget: 165408632, revenue: 9458000, desc: "Fire suppression, EMS, rescue, hazmat" },
      { name: "Emergency Communications (911)", budget: 27171944, revenue: 0, desc: "911 dispatch center operations" },
      { name: "Fire & Police Commission", budget: 5490902, revenue: 0, desc: "Oversight, hiring, discipline" },
    ],
  },
  {
    name: "Infrastructure & Public Works",
    icon: "🏗️",
    color: "#0369a1",
    lightColor: "#f0f9ff",
    departments: [
      { name: "DPW Operations (Sanitation, Fleet, Forestry)", budget: 108435714, revenue: 86900000, desc: "Garbage, recycling, snow removal, street lights, forestry" },
      { name: "DPW Infrastructure Services", budget: 52806892, revenue: 31200000, desc: "Street, sewer, bridge maintenance & construction" },
      { name: "DPW Administrative Services", budget: 4068897, revenue: 235000, desc: "Departmental management and support" },
    ],
  },
  {
    name: "Community Services",
    icon: "🏘️",
    color: "#059669",
    lightColor: "#f0fdf4",
    departments: [
      { name: "Library", budget: 33022606, revenue: 1150000, desc: "15 branches, programs, digital access" },
      { name: "Neighborhood Services", budget: 25881545, revenue: 15600000, desc: "Building inspection, code enforcement" },
      { name: "Health Department", budget: 22682951, revenue: 11700000, desc: "Public health, disease prevention, vital records" },
      { name: "City Development", budget: 8372639, revenue: 1375000, desc: "Housing, economic development, planning" },
    ],
  },
  {
    name: "Government Operations",
    icon: "🏛️",
    color: "#6b21a8",
    lightColor: "#faf5ff",
    departments: [
      { name: "Administration", budget: 26253863, revenue: 643000, desc: "IT, budget, procurement, innovation" },
      { name: "Common Council / City Clerk", budget: 12721410, revenue: 4000000, desc: "Legislative body, records, licenses" },
      { name: "City Attorney", budget: 9356963, revenue: 550000, desc: "Legal counsel, litigation" },
      { name: "Employee Relations", budget: 6395445, revenue: 2320000, desc: "HR, labor relations, benefits" },
      { name: "Comptroller", budget: 5877969, revenue: 285600, desc: "Accounting, payroll, financial reporting" },
      { name: "Assessor's Office", budget: 5676889, revenue: 1000000, desc: "Property valuation" },
      { name: "Election Commission", budget: 5247509, revenue: 0, desc: "Elections, voter registration" },
      { name: "City Treasurer", budget: 4781182, revenue: 650000, desc: "Tax collection, investments" },
      { name: "Municipal Court", budget: 3890813, revenue: 600500, desc: "Traffic, ordinance violations" },
      { name: "Mayor's Office", budget: 2108535, revenue: 0, desc: "Executive leadership, policy" },
      { name: "Port Milwaukee", budget: 7060819, revenue: 6300000, desc: "Harbor operations, commerce" },
    ],
  },
];

// ============================================================
// Helpers
// ============================================================
function fmt(n, decimals = 2) {
  if (Math.abs(n) < 0.01) return "$0.00";
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function fmtCompact(n) {
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(0) + "K";
  return "$" + n.toFixed(0);
}

function BarSegment({ pct, color }) {
  return <div style={{ width: `${Math.max(pct, 0.8)}%`, height: "100%", background: color, transition: "width 0.4s ease" }} />;
}

function humanize(annual) {
  if (annual < 12) return `${fmt(annual / 12)}/mo`;
  if (annual < 52) return `${fmt(annual / 52)}/wk`;
  if (annual < 200) return `${fmt(annual / 12)}/mo`;
  return `${fmt(annual / 12)}/mo`;
}

// ============================================================
// Main Component
// ============================================================
export default function MilwaukeeTaxReceipt() {
  const [assessedValue, setAssessedValue] = useState(166000);
  const [inputValue, setInputValue] = useState("166,000");
  const [expandedJurisdiction, setExpandedJurisdiction] = useState(null);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [cityView, setCityView] = useState("services"); // services | sections

  const handleInput = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    const num = parseInt(raw) || 0;
    setAssessedValue(num);
    setInputValue(num > 0 ? num.toLocaleString("en-US") : "");
  };

  const totalTax = (assessedValue / 1000) * COMBINED_RATE;
  const cityTax = (assessedValue / 1000) * JURISDICTIONS.find((j) => j.id === "city").rate;
  const gcpTax = cityTax * (GCP_RATE / CITY_BUDGET_SECTIONS.reduce((s, b) => s + b.rate, 0));

  const jurisdictionData = JURISDICTIONS.map((j) => ({
    ...j,
    yourShare: (assessedValue / 1000) * j.rate,
    pct: (j.rate / COMBINED_RATE) * 100,
  }));

  // City department groups
  const groups = useMemo(() => {
    return SERVICE_GROUPS.map((g) => {
      const groupBudget = g.departments.reduce((s, d) => s + d.budget, 0);
      const budgetShare = groupBudget / GCP_TOTAL_BUDGET;
      const yourShare = gcpTax * budgetShare;
      const depts = g.departments
        .map((d) => {
          const deptShare = d.budget / GCP_TOTAL_BUDGET;
          return { ...d, yourShare: gcpTax * deptShare, pctOfGCP: deptShare * 100 };
        })
        .sort((a, b) => b.yourShare - a.yourShare);
      return { ...g, groupBudget, budgetShare, yourShare, depts, pctOfGCP: budgetShare * 100 };
    });
  }, [gcpTax]);

  const presets = [
    { label: "$100K", v: 100000 },
    { label: "$166K", v: 166000, note: "median" },
    { label: "$200K", v: 200000 },
    { label: "$250K", v: 250000 },
    { label: "$350K", v: 350000 },
  ];

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", maxWidth: 720, margin: "0 auto", padding: "20px 16px", background: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1d4ed8 100%)", borderRadius: 16, padding: "24px 20px", marginBottom: 20, color: "white" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", opacity: 0.6 }}>City of Milwaukee</div>
        <h1 style={{ margin: "4px 0 6px", fontSize: 22, fontWeight: 800 }}>Your Complete Property Tax Receipt</h1>
        <p style={{ margin: 0, fontSize: 12, opacity: 0.75, lineHeight: 1.5 }}>
          Your tax bill funds 5 local governments. See exactly where every dollar goes — from schools to sewers.
        </p>
      </div>

      {/* Input */}
      <div style={{ background: "white", borderRadius: 12, padding: 16, marginBottom: 16, border: "1px solid #e2e8f0" }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6, display: "block" }}>Your Assessed Property Value</label>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 18, fontWeight: 700, color: "#94a3b8" }}>$</span>
          <input type="text" value={inputValue} onChange={handleInput}
            style={{ width: "100%", padding: "10px 12px 10px 26px", fontSize: 20, fontWeight: 700, border: "2px solid #e2e8f0", borderRadius: 8, boxSizing: "border-box", outline: "none" }}
            onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
            onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
          />
        </div>
        <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
          {presets.map((p) => (
            <button key={p.v} onClick={() => { setAssessedValue(p.v); setInputValue(p.v.toLocaleString()); }}
              style={{ padding: "4px 12px", borderRadius: 16, border: assessedValue === p.v ? "2px solid #2563eb" : "1px solid #cbd5e1",
                background: assessedValue === p.v ? "#eff6ff" : "white", color: assessedValue === p.v ? "#2563eb" : "#64748b",
                fontWeight: 600, fontSize: 11, cursor: "pointer" }}>
              {p.label}{p.note ? <span style={{ fontSize: 9, opacity: 0.7 }}> ({p.note})</span> : null}
            </button>
          ))}
        </div>
      </div>

      {/* TOTAL TAX BILL */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", borderRadius: 14, padding: 20, marginBottom: 16, color: "white" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.5, fontWeight: 500, letterSpacing: 1, textTransform: "uppercase" }}>Your Total Property Tax</div>
            <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1 }}>{fmt(totalTax)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 22, fontWeight: 700, opacity: 0.9 }}>${COMBINED_RATE}<span style={{ fontSize: 12, opacity: 0.6 }}>/1K</span></div>
            <div style={{ fontSize: 10, opacity: 0.4 }}>combined rate</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
          {[
            { l: "Per month", v: totalTax / 12 },
            { l: "Per week", v: totalTax / 52 },
            { l: "Per day", v: totalTax / 365 },
          ].map((x) => (
            <div key={x.l} style={{ flex: 1, textAlign: "center", background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 4px" }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{fmt(x.v)}</div>
              <div style={{ fontSize: 10, opacity: 0.45 }}>{x.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* STACKED BAR — all 5 entities */}
      <div style={{ background: "white", borderRadius: 12, padding: 16, marginBottom: 6, border: "1px solid #e2e8f0" }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Where Every Dollar Goes</h2>
        <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 28, marginBottom: 8 }}>
          {jurisdictionData.map((j) => (
            <BarSegment key={j.id} pct={j.pct} color={j.color} />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
          {jurisdictionData.map((j) => (
            <div key={j.id} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#64748b" }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: j.color, flexShrink: 0 }} />
              {j.shortName} {j.pct.toFixed(0)}%
            </div>
          ))}
        </div>
      </div>

      {/* JURISDICTION CARDS */}
      {jurisdictionData.map((j) => {
        const isExpanded = expandedJurisdiction === j.id;
        const isCityExpanded = j.id === "city" && isExpanded;

        return (
          <div key={j.id} style={{ background: "white", borderRadius: 12, marginBottom: 8, border: isExpanded ? `2px solid ${j.color}22` : "1px solid #e2e8f0", overflow: "hidden", transition: "border 0.2s" }}>
            {/* Jurisdiction Header */}
            <button
              onClick={() => {
                setExpandedJurisdiction(isExpanded ? null : j.id);
                if (j.id !== "city") setExpandedGroup(null);
              }}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "14px 16px",
                background: isExpanded ? `${j.color}08` : "white", border: "none", cursor: "pointer", transition: "background 0.15s" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>{j.icon}</span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{j.name}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8" }}>
                    ${j.rate.toFixed(2)}/1K · {j.pct.toFixed(0)}% of your bill
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: j.color }}>{fmt(j.yourShare)}</div>
                  <div style={{ fontSize: 9, color: "#94a3b8" }}>{humanize(j.yourShare)}</div>
                </div>
                <span style={{ fontSize: 14, color: j.color, transform: isExpanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▾</span>
              </div>
            </button>

            {/* Expanded: non-city jurisdiction detail */}
            {isExpanded && j.id !== "city" && (
              <div style={{ padding: "0 16px 14px", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 10 }}>
                  {j.detail}
                  {j.fundingNote && (
                    <div style={{ marginTop: 8, padding: "8px 10px", background: "#fef3c7", borderRadius: 6, fontSize: 11, color: "#92400e" }}>
                      ⚠️ {j.fundingNote}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Expanded: CITY detail with full department breakdown */}
            {isCityExpanded && (
              <div style={{ padding: "0 12px 14px" }}>
                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 10 }}>
                  {/* City sub-view toggle */}
                  <div style={{ display: "flex", gap: 4, marginBottom: 10, background: "#f1f5f9", borderRadius: 6, padding: 2 }}>
                    {[{ id: "services", label: "By Service Area" }, { id: "sections", label: "By Budget Section" }].map((t) => (
                      <button key={t.id} onClick={() => setCityView(t.id)}
                        style={{ flex: 1, padding: "6px 0", borderRadius: 5, border: "none", fontWeight: 600, fontSize: 11, cursor: "pointer",
                          background: cityView === t.id ? "white" : "transparent", color: cityView === t.id ? "#1e40af" : "#64748b",
                          boxShadow: cityView === t.id ? "0 1px 2px rgba(0,0,0,0.08)" : "none" }}>
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* === BY SERVICE AREA === */}
                  {cityView === "services" && (
                    <div>
                      {/* GCP bar */}
                      <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", height: 18, marginBottom: 10 }}>
                        {groups.map((g) => <BarSegment key={g.name} pct={g.pctOfGCP} color={g.color} />)}
                      </div>

                      {/* Service group cards */}
                      {groups.map((g) => {
                        const isGroupExpanded = expandedGroup === g.name;
                        return (
                          <div key={g.name} style={{ borderRadius: 8, marginBottom: 6, border: "1px solid #f1f5f9", overflow: "hidden" }}>
                            <button onClick={() => setExpandedGroup(isGroupExpanded ? null : g.name)}
                              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "10px 12px",
                                background: isGroupExpanded ? g.lightColor : "#fafafa", border: "none", cursor: "pointer" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 16 }}>{g.icon}</span>
                                <div style={{ textAlign: "left" }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{g.name}</div>
                                  <div style={{ fontSize: 9, color: "#94a3b8" }}>{g.depts.length} depts · {g.pctOfGCP.toFixed(0)}% of city operations</div>
                                </div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 14, fontWeight: 700, color: g.color }}>{fmt(g.yourShare)}</span>
                                <span style={{ fontSize: 12, color: g.color, transform: isGroupExpanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▾</span>
                              </div>
                            </button>

                            {isGroupExpanded && (
                              <div style={{ padding: "2px 12px 10px" }}>
                                {g.depts.map((d, i) => {
                                  const maxShare = g.depts[0].yourShare;
                                  const barW = maxShare > 0 ? Math.max(3, (d.yourShare / maxShare) * 100) : 0;
                                  return (
                                    <div key={i} style={{ padding: "6px 0", borderTop: i > 0 ? "1px solid #f1f5f9" : "none" }}>
                                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                                        <div>
                                          <span style={{ fontSize: 11, fontWeight: 600, color: "#1e293b" }}>{d.name}</span>
                                          <div style={{ fontSize: 9, color: "#94a3b8" }}>{d.desc}</div>
                                        </div>
                                        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 8 }}>
                                          <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{fmt(d.yourShare)}</div>
                                          <div style={{ fontSize: 8, color: "#94a3b8" }}>{fmtCompact(d.budget)} budget</div>
                                        </div>
                                      </div>
                                      <div style={{ background: "#f1f5f9", borderRadius: 3, height: 3, overflow: "hidden" }}>
                                        <div style={{ width: `${barW}%`, height: "100%", background: g.color, borderRadius: 3, transition: "width 0.3s" }} />
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
                      <div style={{ marginTop: 6, padding: "10px 12px", background: "#fafafa", borderRadius: 8, border: "1px solid #f1f5f9" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Other City Obligations</div>
                        {CITY_BUDGET_SECTIONS.filter((s) => s.id !== "gcp").map((s) => {
                          const share = (assessedValue / 1000) * s.rate * (JURISDICTIONS.find(j => j.id === "city").rate / CITY_BUDGET_SECTIONS.reduce((sum, b) => sum + b.rate, 0));
                          return (
                            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 11 }}>
                              <span style={{ color: "#64748b" }}>{s.name}</span>
                              <span style={{ fontWeight: 600 }}>{fmt(share)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* === BY BUDGET SECTION === */}
                  {cityView === "sections" && (
                    <div>
                      <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", height: 18, marginBottom: 10 }}>
                        {CITY_BUDGET_SECTIONS.map((s) => (
                          <BarSegment key={s.id} pct={(s.levy / CITY_LEVY) * 100} color={s.color} />
                        ))}
                      </div>
                      {CITY_BUDGET_SECTIONS.map((s) => {
                        const share = cityTax * (s.rate / CITY_BUDGET_SECTIONS.reduce((sum, b) => sum + b.rate, 0));
                        return (
                          <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 600 }}>{s.name}</div>
                                <div style={{ fontSize: 9, color: "#94a3b8" }}>{fmtCompact(s.levy)} levy · {((s.levy / CITY_LEVY) * 100).toFixed(1)}%</div>
                              </div>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{fmt(share)}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Tax credits note */}
      <div style={{ background: "#f0fdf4", borderRadius: 10, padding: 14, marginTop: 12, marginBottom: 12, border: "1px solid #bbf7d0" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#166534", marginBottom: 4 }}>💡 Your bill may be lower</div>
        <div style={{ fontSize: 11, color: "#15803d", lineHeight: 1.5 }}>
          Wisconsin provides three tax credits that can reduce your bill: <strong>School Levy Tax Credit</strong>, <strong>First Dollar Credit</strong>, and <strong>Lottery & Gaming Credit</strong> (for primary residences). These are applied automatically on your tax bill.
        </div>
      </div>

      {/* Methodology */}
      <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14, border: "1px solid #e2e8f0", fontSize: 10, color: "#64748b", lineHeight: 1.6 }}>
        <div style={{ fontWeight: 700, fontSize: 11, color: "#475569", marginBottom: 4 }}>How This Is Calculated</div>
        <div><strong>Total Tax</strong> = (Assessed Value ÷ 1,000) × ${COMBINED_RATE} combined mill rate</div>
        <div><strong>Entity Share</strong> = (Assessed Value ÷ 1,000) × Entity Rate</div>
        <div><strong>Department Share</strong> = (Dept Budget ÷ Total GCP Budget) × Your City GCP portion</div>
        <div style={{ marginTop: 6 }}>
          Combined rate of ${COMBINED_RATE}/1K is from the 2025 tax year (bills mailed Dec 2024). Entity shares (MPS 43%, City 34%, County 14%, MMSD 5%, MATC 4%) per the City Comptroller's Office. City department detail from the 2026 Proposed Executive Budget. Median home value: ~$166,500 (2024 assessment).
        </div>
        <div style={{ marginTop: 4, fontStyle: "italic" }}>
          Sources: City of Milwaukee Comptroller's Office, 2026 Proposed Budget, Milwaukee Neighborhood News Service
        </div>
      </div>
    </div>
  );
}
