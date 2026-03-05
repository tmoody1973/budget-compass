# MKE Budget Compass Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Budget Compass from a chatbot into a 4-tab interactive civic tool with personalized tax receipt, budget treemaps, simulator, AI chat, and Nova Sonic voice — all grounded in verified data from City, MPS, and County budgets.

**Architecture:** Tab-based Next.js app with shared BudgetContext (assessed value, persona, language). **Dual data strategy:** verified numbers flow from JSON seed files → Convex DB → Mastra agent tools (guaranteed accuracy), while narrative context and policy analysis flow from PDF documents → Amazon Bedrock Knowledge Bases → agent RAG tool (contextual explanations). Nova models power all AI interactions. ECharts replaces Recharts for animated treemaps and drill-downs. Nova Sonic provides 3 voice modes (briefing, tour, conversation).

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Apache ECharts (`echarts-for-react`), Convex, Mastra, Amazon Nova 2 Lite/Pro/Sonic, **Amazon Bedrock Knowledge Bases** (S3 + OpenSearch Serverless), Clerk, MPROP CKAN API, Vercel.

**AWS Services Used:**
- Amazon Bedrock (Nova 2 Lite, Nova Pro, Nova Sonic) — AI models
- Amazon Bedrock Knowledge Bases — RAG pipeline for budget narratives and policy briefs
- Amazon S3 — Document storage for Knowledge Base source documents
- Amazon OpenSearch Serverless — Vector store for Knowledge Base embeddings

**Timeline:** 11 days (March 5–16, 2026)

**Design Doc:** `docs/plans/2026-03-05-budget-compass-redesign-design.md`

---

## Phase 1: Data Foundation (Tasks 1–5)

Everything else depends on accurate data. Do this first.

---

### Task 1: Research and Verify Mill Rates

**Files:**
- Create: `data/tax-rates-2026.json`

**Step 1: Research all 5 jurisdiction rates**

Search published sources for 2026 tax year (bills mailed Dec 2025) mill rates:
- City of Milwaukee: $7.64/1K (confirmed — Urban Milwaukee, Nov 2025)
- MPS: ~$9.46/1K (Journal Sentinel, Oct 2025 — verify)
- Milwaukee County: search for adopted 2026 rate
- MMSD: search for 2025-26 rate
- MATC: search for 2025-26 rate

Use web search to find Journal Sentinel, Urban Milwaukee, City Comptroller, and Wisconsin DOR sources. Cross-reference at least 2 sources per rate.

**Step 2: Create the single source of truth file**

```json
{
  "taxYear": 2026,
  "effectiveDate": "2025-12-01",
  "lastVerified": "2026-03-05",
  "notes": "Rates from adopted budgets. Combined rate calculated from individual rates.",
  "combinedRate": 0,
  "jurisdictions": [
    {
      "id": "mps",
      "name": "Milwaukee Public Schools",
      "shortName": "MPS",
      "rate": 0,
      "source": "",
      "sourceUrl": "",
      "sourceDate": "",
      "icon": "🎓",
      "color": "#e11d48",
      "desc": "K-12 education for ~66,000 students across 130+ schools",
      "detail": "Largest share of your tax bill. Funds teacher salaries, school operations, special education, transportation, building maintenance, and extracurricular programs.",
      "fundingNote": "MPS levy grew significantly due to voter-approved 2024 referendum to address budget shortfall."
    },
    {
      "id": "city",
      "name": "City of Milwaukee",
      "shortName": "City",
      "rate": 7.64,
      "source": "Common Council adoption, Urban Milwaukee",
      "sourceUrl": "https://urbanmilwaukee.com/pressrelease/common-council-adopts-amended-2026-city-budget/",
      "sourceDate": "2025-11-07",
      "icon": "🏛️",
      "color": "#2563eb",
      "desc": "Police, fire, public works, libraries, health, and all city services",
      "detail": "Funds city government operations across 21+ departments.",
      "expandable": true
    },
    {
      "id": "county",
      "name": "Milwaukee County",
      "shortName": "County",
      "rate": 0,
      "source": "",
      "sourceUrl": "",
      "sourceDate": "",
      "icon": "🏞️",
      "color": "#7c3aed",
      "desc": "Parks, transit, courts, behavioral health, and county services",
      "detail": "Funds the county park system (15,000+ acres), Milwaukee County Transit System, county courts, medical examiner, and human services programs."
    },
    {
      "id": "mmsd",
      "name": "Milwaukee Metropolitan Sewerage District",
      "shortName": "MMSD",
      "rate": 0,
      "source": "",
      "sourceUrl": "",
      "sourceDate": "",
      "icon": "💧",
      "color": "#0891b2",
      "desc": "Wastewater treatment, flood management, and water quality",
      "detail": "Operates the Jones Island and South Shore water reclamation facilities, manages the deep tunnel system."
    },
    {
      "id": "matc",
      "name": "Milwaukee Area Technical College",
      "shortName": "MATC",
      "rate": 0,
      "source": "",
      "sourceUrl": "",
      "sourceDate": "",
      "icon": "📚",
      "color": "#059669",
      "desc": "Workforce training, associate degrees, and continuing education",
      "detail": "Serves 30,000+ students at 4 campuses offering 170+ programs."
    }
  ],
  "cityBudgetSections": [
    { "id": "gcp", "name": "General City Purposes", "levy": 144523699, "color": "#2563eb" },
    { "id": "debt", "name": "City Debt Service", "levy": 106674678, "color": "#dc2626" },
    { "id": "retirement", "name": "Employee Retirement", "levy": 76771645, "color": "#7c3aed" },
    { "id": "contingent", "name": "Council Contingent Fund", "levy": 5000000, "color": "#d97706" },
    { "id": "capital", "name": "Capital Improvements", "levy": 905000, "color": "#059669" }
  ],
  "serviceGroups": [
    {
      "name": "Public Safety",
      "icon": "🛡️",
      "color": "#dc2626",
      "departments": [
        { "name": "Police Department", "budget": 310135835, "revenue": 7674000 },
        { "name": "Fire Department", "budget": 165408632, "revenue": 9458000 },
        { "name": "Emergency Communications (911)", "budget": 27171944, "revenue": 0 },
        { "name": "Fire & Police Commission", "budget": 5490902, "revenue": 0 }
      ]
    },
    {
      "name": "Infrastructure & Public Works",
      "icon": "🏗️",
      "color": "#0369a1",
      "departments": [
        { "name": "DPW Operations", "budget": 108435714, "revenue": 86900000 },
        { "name": "DPW Infrastructure Services", "budget": 52806892, "revenue": 31200000 },
        { "name": "DPW Administrative Services", "budget": 4068897, "revenue": 235000 }
      ]
    },
    {
      "name": "Community Services",
      "icon": "🏘️",
      "color": "#059669",
      "departments": [
        { "name": "Library", "budget": 33022606, "revenue": 1150000 },
        { "name": "Neighborhood Services", "budget": 25881545, "revenue": 15600000 },
        { "name": "Health Department", "budget": 22682951, "revenue": 11700000 },
        { "name": "City Development", "budget": 8372639, "revenue": 1375000 }
      ]
    },
    {
      "name": "Government Operations",
      "icon": "🏛️",
      "color": "#6b21a8",
      "departments": [
        { "name": "Administration", "budget": 26253863, "revenue": 643000 },
        { "name": "Common Council / City Clerk", "budget": 12721410, "revenue": 4000000 },
        { "name": "City Attorney", "budget": 9356963, "revenue": 550000 },
        { "name": "Employee Relations", "budget": 6395445, "revenue": 2320000 },
        { "name": "Comptroller", "budget": 5877969, "revenue": 285600 },
        { "name": "Assessor's Office", "budget": 5676889, "revenue": 1000000 },
        { "name": "Election Commission", "budget": 5247509, "revenue": 0 },
        { "name": "City Treasurer", "budget": 4781182, "revenue": 650000 },
        { "name": "Municipal Court", "budget": 3890813, "revenue": 600500 },
        { "name": "Mayor's Office", "budget": 2108535, "revenue": 0 },
        { "name": "Port Milwaukee", "budget": 7060819, "revenue": 6300000 }
      ]
    }
  ]
}
```

Fill in the `0` values with verified rates. Calculate `combinedRate` as sum of all 5 jurisdiction rates.

**Step 3: Verify math**

For a $166,000 home (median):
- Total tax = (166000 / 1000) * combinedRate
- Each jurisdiction share = (166000 / 1000) * jurisdiction rate
- Percentages = jurisdiction rate / combinedRate * 100

Verify the total is reasonable (should be ~$3,500-$4,000 annually).

**Step 4: Commit**

```bash
git add data/tax-rates-2026.json
git commit -m "feat: add verified 2026 mill rates from published sources"
```

---

### Task 2: Extract and Seed MPS Summary Data

**Files:**
- Create: `data/mps-seed.json`
- Modify: `convex/schema.ts`
- Create: `convex/mps.ts` (queries)
- Modify: `convex/seed.ts`

**Step 1: Add MPS tables to Convex schema**

Modify `convex/schema.ts` — add after the existing `departmentNarratives` table:

```typescript
// MPS Budget Tables
mpsOverview: defineTable({
  fiscalYear: v.string(),
  totalBudget: v.number(),
  totalRevenue: v.number(),
  totalExpenditure: v.number(),
  totalStudents: v.number(),
  totalStaff: v.number(),
  totalSchools: v.number(),
  budgetType: v.string(),
  superintendent: v.string(),
}),

mpsFundGroups: defineTable({
  name: v.string(),
  revenueActual2024: v.optional(v.number()),
  revenueBudget2025: v.optional(v.number()),
  revenueBudget2026: v.optional(v.number()),
  expenditureActual2024: v.optional(v.number()),
  expenditureBudget2025: v.optional(v.number()),
  expenditureBudget2026: v.optional(v.number()),
  revenueDifference: v.optional(v.number()),
  expenditureDifference: v.optional(v.number()),
  revenuePercentChange: v.optional(v.number()),
  expenditurePercentChange: v.optional(v.number()),
}).index("by_name", ["name"]),

mpsOffices: defineTable({
  name: v.string(),
  actual2024: v.optional(v.number()),
  fteBudget2025: v.optional(v.number()),
  budget2025: v.optional(v.number()),
  fteBudget2026: v.optional(v.number()),
  budget2026: v.optional(v.number()),
  differenceFte: v.optional(v.number()),
  differenceBudget: v.optional(v.number()),
}).index("by_name", ["name"]),

mpsExpenditures: defineTable({
  objectClass: v.string(),
  actual2024: v.optional(v.number()),
  fteBudget2025: v.optional(v.number()),
  budget2025: v.optional(v.number()),
  fteBudget2026: v.optional(v.number()),
  budget2026: v.optional(v.number()),
  differenceFte: v.optional(v.number()),
  differenceBudget: v.optional(v.number()),
}).index("by_class", ["objectClass"]),

mpsPositions: defineTable({
  positionType: v.string(),
  fte2025: v.optional(v.number()),
  fte2026: v.optional(v.number()),
  differenceFte: v.optional(v.number()),
  percentChange: v.optional(v.number()),
}).index("by_type", ["positionType"]),

mpsEnrollment: defineTable({
  schoolType: v.string(),
  fy20: v.optional(v.number()),
  fy21: v.optional(v.number()),
  fy22: v.optional(v.number()),
  fy23: v.optional(v.number()),
  fy24: v.optional(v.number()),
  fy25: v.optional(v.number()),
  fy26: v.optional(v.number()),
}).index("by_type", ["schoolType"]),

mpsForecast: defineTable({
  lineItem: v.string(),
  category: v.string(),
  fy25: v.optional(v.number()),
  fy26: v.optional(v.number()),
  fy27: v.optional(v.number()),
  fy28: v.optional(v.number()),
  fy29: v.optional(v.number()),
  fy30: v.optional(v.number()),
  changeFy30VsFy25: v.optional(v.number()),
}).index("by_category", ["category"]),
```

**Step 2: Create MPS seed data JSON**

Create `data/mps-seed.json` using numbers extracted from the MPS Budget Summary PDF (already read in this session). Key data points:

- **Overview:** $1,548,971,230 total budget, ~66,000 students, 9,500+ staff, 130+ schools
- **Fund Groups (revenue):** School Operations $1,212.9M, Grants $175.7M, Nutrition $62.7M, MKE Rec $39.4M, Debt $27.8M, Capital Trust $27.8M, Construction $2.7M
- **Fund Groups (expenditure):** School Operations $1,212.9M, Grants $175.7M, Nutrition $62.7M, MKE Rec $39.4M, Debt $27.8M, Capital Trust $27.8M, Construction $2.7M
- **Offices:** Schools $882.7M, Operations $301.4M, Academics $146.4M, District Wide $56.5M, Families/Communities $49.3M, Office of Schools $31.7M, Human Resources $27.6M, Pass Through Private $24.6M, Finance $17.0M, Communications $2.8M, Accountability $2.5M, Superintendent $2.3M, Legal $2.2M, Board Governance $1.6M, Board of Directors $0.4M
- **Expenditures:** Salaries $626.9M, Benefits $355.9M, Purchased Services $376.6M, Other Wages $29.4M, Supplies $87.0M, Equipment $10.0M, Other $63.1M
- **Positions:** Teachers 4,511.2, Ed Assistants 1,319.5, Admin 525.7, Building Services 378.3, Clerical 341.0, Food Service 330.0, Health Assistants 298.9, Cert Administrators 286.7, Safety Aides 266.1, Engineers 246.4, Social Workers 185.3, Psychologists 171.3, Trades 154.0, Asst Principals 148.0, Principals 125.0, Food Service Mgr 122.0, Nurses 73.0, Therapists 50.0, Bookkeepers 34.0, Social Worker Asst 23.8
- **Enrollment:** FY20 74,678 → FY21 71,826 → FY22 68,590 → FY23 67,026 → FY24 66,591 → FY25 65,924 → FY26 est 65,365
- **Forecast:** Revenue FY25 $1,168.1M → FY30 $1,322.8M; Expenditure FY25 $1,168.1M → FY30 $1,379.8M; Cumulative deficit by FY30: ($144.7M)

**Step 3: Create MPS Convex queries**

Create `convex/mps.ts`:

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getOverview = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("mpsOverview").first();
  },
});

export const getFundGroups = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("mpsFundGroups").collect();
  },
});

export const getOffices = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("mpsOffices").collect();
  },
});

export const getExpenditures = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("mpsExpenditures").collect();
  },
});

export const getPositions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("mpsPositions").collect();
  },
});

export const getEnrollment = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("mpsEnrollment").collect();
  },
});

export const getForecast = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("mpsForecast").collect();
  },
});
```

**Step 4: Add MPS seeding to seed script**

Modify `convex/seed.ts` (or create `scripts/seed-mps.ts`) to load `data/mps-seed.json` into the new tables. Use the same `transformKeys()` null-stripping pattern from the existing seed script.

**Step 5: Deploy schema and seed data**

```bash
npx convex dev --once  # Deploy schema
npx convex run seed:seedMPS  # Seed MPS data
```

**Step 6: Commit**

```bash
git add data/mps-seed.json convex/schema.ts convex/mps.ts convex/seed.ts
git commit -m "feat: add MPS budget data (overview, offices, expenditures, positions, enrollment, forecast)"
```

---

### Task 3: Extract and Seed County Summary Data

**Files:**
- Create: `data/county-seed.json`
- Modify: `convex/schema.ts`
- Create: `convex/county.ts` (queries)
- Modify: `convex/seed.ts`

**Step 1: Read County budget summary pages**

Read pages 47-70 of `county-budget-docs/2026-Adopted-Operating-Budget-.pdf` to extract:
- Total budget and tax levy
- Expenditure/revenue by functional area (Legislative, Admin, Courts, Public Safety, Transportation, Health, Parks, Debt, Non-Departmental)
- Total funded FTEs
- Tax levy summary

**Step 2: Add County tables to Convex schema**

Add to `convex/schema.ts`:

```typescript
// County Budget Tables
countyOverview: defineTable({
  fiscalYear: v.string(),
  totalBudget: v.optional(v.number()),
  totalTaxLevy: v.optional(v.number()),
  totalPositions: v.optional(v.number()),
  countyExecutive: v.string(),
}),

countyDepartments: defineTable({
  functionalArea: v.string(),
  department: v.string(),
  departmentCode: v.optional(v.string()),
  totalBudget: v.optional(v.number()),
  taxLevy: v.optional(v.number()),
  totalPositions: v.optional(v.number()),
  description: v.optional(v.string()),
}).index("by_functional_area", ["functionalArea"])
  .index("by_department", ["department"]),

countyExpenditures: defineTable({
  category: v.string(),
  amount2025: v.optional(v.number()),
  amount2026: v.optional(v.number()),
  difference: v.optional(v.number()),
  percentChange: v.optional(v.number()),
}).index("by_category", ["category"]),
```

**Step 3: Create seed data and queries**

Create `data/county-seed.json` with extracted data.
Create `convex/county.ts` with `getOverview`, `getDepartments`, `getExpenditures` queries.

**Step 4: Deploy and seed**

```bash
npx convex dev --once
npx convex run seed:seedCounty
```

**Step 5: Commit**

```bash
git add data/county-seed.json convex/schema.ts convex/county.ts convex/seed.ts
git commit -m "feat: add County budget data (overview, departments by function, expenditures)"
```

---

### Task 4: Install ECharts and Remove Recharts

**Files:**
- Modify: `package.json`
- Modify: `src/components/budget-chart.tsx`

**Step 1: Install ECharts**

```bash
npm install echarts echarts-for-react
npm uninstall recharts
```

**Step 2: Rewrite BudgetChart component with ECharts**

Modify `src/components/budget-chart.tsx`:

```typescript
"use client";

import ReactECharts from "echarts-for-react";

const MKE_COLORS = [
  "#0A3161", "#D4A574", "#2E8B57", "#C41E3A", "#5B8BA0", "#8B6914",
];

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface BudgetChartProps {
  chartType: "bar" | "line" | "pie" | "treemap";
  title: string;
  data: ChartData[];
  xLabel?: string;
  yLabel?: string;
  unit?: string;
}

const formatValue = (value: number, unit?: string) => {
  if (unit === "$" || !unit) {
    if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
    if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  }
  if (unit === "%") return `${value.toFixed(1)}%`;
  return `${value.toLocaleString()} ${unit}`;
};

export function BudgetChart({ chartType, title, data, xLabel, yLabel, unit }: BudgetChartProps) {
  const colors = data.map((d, i) => d.color ?? MKE_COLORS[i % MKE_COLORS.length]);

  const getOption = () => {
    switch (chartType) {
      case "bar":
        return {
          tooltip: {
            trigger: "axis",
            formatter: (params: any) => {
              const p = params[0];
              return `${p.name}: ${formatValue(p.value, unit)}`;
            },
          },
          xAxis: { type: "category", data: data.map(d => d.label), name: xLabel },
          yAxis: {
            type: "value",
            name: yLabel,
            axisLabel: { formatter: (v: number) => formatValue(v, unit) },
          },
          series: [{
            type: "bar",
            data: data.map((d, i) => ({
              value: d.value,
              itemStyle: { color: colors[i], borderColor: "#1A1A2E", borderWidth: 1 },
            })),
            animationDuration: 800,
            animationEasing: "elasticOut",
          }],
        };

      case "pie":
        return {
          tooltip: {
            formatter: (p: any) => `${p.name}: ${formatValue(p.value, unit)} (${p.percent}%)`,
          },
          series: [{
            type: "pie",
            radius: ["30%", "70%"],
            data: data.map((d, i) => ({
              name: d.label,
              value: d.value,
              itemStyle: { color: colors[i], borderColor: "#1A1A2E", borderWidth: 2 },
            })),
            animationType: "scale",
            animationDuration: 800,
            label: { formatter: "{b}: {d}%" },
          }],
        };

      case "line":
        return {
          tooltip: { trigger: "axis" },
          xAxis: { type: "category", data: data.map(d => d.label), name: xLabel },
          yAxis: {
            type: "value",
            name: yLabel,
            axisLabel: { formatter: (v: number) => formatValue(v, unit) },
          },
          series: [{
            type: "line",
            data: data.map(d => d.value),
            smooth: true,
            lineStyle: { color: "#0A3161", width: 3 },
            areaStyle: { color: "rgba(10, 49, 97, 0.1)" },
            animationDuration: 1000,
          }],
        };

      case "treemap":
        return {
          tooltip: {
            formatter: (p: any) => `${p.name}: ${formatValue(p.value, unit)}`,
          },
          series: [{
            type: "treemap",
            data: data.map((d, i) => ({
              name: d.label,
              value: d.value,
              itemStyle: { color: colors[i], borderColor: "#1A1A2E", borderWidth: 2 },
            })),
            label: {
              show: true,
              formatter: (p: any) => `${p.name}\n${formatValue(p.value, unit)}`,
              fontSize: 12,
              fontWeight: "bold",
            },
            breadcrumb: { show: false },
            animationDuration: 800,
          }],
        };

      default:
        return {};
    }
  };

  return (
    <div className="rounded-lg border-2 border-mke-dark bg-white p-4 shadow-[4px_4px_0px_0px_#1A1A2E]">
      <h3 className="mb-3 font-head text-lg font-bold text-mke-blue">{title}</h3>
      <ReactECharts option={getOption()} style={{ height: 300 }} />
    </div>
  );
}
```

**Step 3: Verify the app still builds**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add package.json package-lock.json src/components/budget-chart.tsx
git commit -m "feat: replace Recharts with ECharts for animated charts and treemaps"
```

---

### Task 5: Create Shared BudgetContext

**Files:**
- Create: `src/contexts/budget-context.tsx`
- Modify: `src/app/providers.tsx`

**Step 1: Create the context**

Create `src/contexts/budget-context.tsx`:

```typescript
"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import taxRatesData from "../../data/tax-rates-2026.json";

type Persona = "resident" | "student" | "journalist";
type Language = "en" | "es";

interface PropertyDetails {
  address?: string;
  aldermanicDistrict?: string;
  policeDistrict?: string;
  fireStation?: string;
}

interface TaxJurisdiction {
  id: string;
  name: string;
  shortName: string;
  rate: number;
  source: string;
  icon: string;
  color: string;
  desc: string;
  detail: string;
  yourShare: number;
  pct: number;
  monthly: number;
  daily: number;
}

interface BudgetContextType {
  // User state
  assessedValue: number;
  setAssessedValue: (value: number) => void;
  persona: Persona;
  setPersona: (persona: Persona) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  propertyDetails: PropertyDetails;
  setPropertyDetails: (details: PropertyDetails) => void;
  isLanded: boolean;
  setIsLanded: (landed: boolean) => void;

  // Computed
  totalTax: number;
  jurisdictions: TaxJurisdiction[];
  combinedRate: number;
}

const BudgetContext = createContext<BudgetContextType | null>(null);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [assessedValue, setAssessedValue] = useState(166000);
  const [persona, setPersona] = useState<Persona>("resident");
  const [language, setLanguage] = useState<Language>("en");
  const [propertyDetails, setPropertyDetails] = useState<PropertyDetails>({});
  const [isLanded, setIsLanded] = useState(false);

  const combinedRate = taxRatesData.combinedRate;
  const totalTax = (assessedValue / 1000) * combinedRate;

  const jurisdictions: TaxJurisdiction[] = taxRatesData.jurisdictions.map((j) => {
    const yourShare = (assessedValue / 1000) * j.rate;
    return {
      ...j,
      yourShare,
      pct: (j.rate / combinedRate) * 100,
      monthly: yourShare / 12,
      daily: yourShare / 365,
    };
  });

  return (
    <BudgetContext.Provider
      value={{
        assessedValue,
        setAssessedValue,
        persona,
        setPersona,
        language,
        setLanguage,
        propertyDetails,
        setPropertyDetails,
        isLanded,
        setIsLanded,
        totalTax,
        jurisdictions,
        combinedRate,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be used within BudgetProvider");
  return ctx;
}
```

**Step 2: Wrap app in BudgetProvider**

Modify `src/app/providers.tsx`:

```typescript
"use client";

import { BudgetProvider } from "@/contexts/budget-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return <BudgetProvider>{children}</BudgetProvider>;
}
```

**Step 3: Verify build**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/contexts/budget-context.tsx src/app/providers.tsx
git commit -m "feat: add BudgetContext for shared state (assessed value, persona, language)"
```

---

## Phase 2: Core UI (Tasks 6–11)

---

### Task 6: Build Landing State

**Files:**
- Create: `src/components/landing.tsx`
- Create: `src/lib/mprop.ts`
- Modify: `src/app/page.tsx`

**Step 1: Create MPROP API client**

Create `src/lib/mprop.ts`:

```typescript
const MPROP_BASE = "https://data.milwaukee.gov/api/3/action/datastore_search";
const MPROP_RESOURCE = "0a2c7f31-cd15-4151-8222-09dd57d5f16d";

export interface MpropProperty {
  address: string;
  assessedValue: number;
  aldermanicDistrict: string;
  policeDistrict: string;
  fireStation: string;
}

export async function lookupAddress(address: string): Promise<MpropProperty | null> {
  const q = address.toUpperCase().trim();
  const url = `${MPROP_BASE}?resource_id=${MPROP_RESOURCE}&q=${encodeURIComponent(q)}&limit=5`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  const records = data.result?.records;
  if (!records || records.length === 0) return null;

  const record = records[0];
  return {
    address: `${record.HOUSE_NR_LO} ${record.SDIR || ""} ${record.STREET} ${record.STTYPE || ""}`.trim(),
    assessedValue: Number(record.C_A_TOTAL) || 0,
    aldermanicDistrict: record.GEO_ALDER || "",
    policeDistrict: record.GEO_POLICE || "",
    fireStation: record.GEO_FIRE || "",
  };
}
```

**Step 2: Create Landing component**

Create `src/components/landing.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useBudget } from "@/contexts/budget-context";
import { lookupAddress } from "@/lib/mprop";

const PRESETS = [
  { label: "$100K", value: 100000 },
  { label: "$166K", value: 166000, note: "median" },
  { label: "$200K", value: 200000 },
  { label: "$250K", value: 250000 },
  { label: "$350K", value: 350000 },
];

export function Landing() {
  const { setAssessedValue, setPropertyDetails, setPersona, setIsLanded } = useBudget();
  const [addressInput, setAddressInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(166000);

  const handleAddressSearch = async () => {
    if (!addressInput.trim()) return;
    setIsSearching(true);
    setError("");

    const result = await lookupAddress(addressInput);
    if (result && result.assessedValue > 0) {
      setAssessedValue(result.assessedValue);
      setPropertyDetails({
        address: result.address,
        aldermanicDistrict: result.aldermanicDistrict,
        policeDistrict: result.policeDistrict,
        fireStation: result.fireStation,
      });
      setIsLanded(true);
    } else {
      setError("Address not found. Try a different format or use a preset value.");
    }
    setIsSearching(false);
  };

  const handlePreset = (value: number) => {
    setSelectedPreset(value);
    setAssessedValue(value);
  };

  const handleGo = () => {
    if (selectedPreset) {
      setAssessedValue(selectedPreset);
    }
    setIsLanded(true);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-mke-cream p-4">
      <div className="w-full max-w-lg rounded-xl border-2 border-mke-dark bg-white p-6 shadow-[6px_6px_0px_0px_#1A1A2E] sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="font-head text-3xl font-bold text-mke-blue">
            MKE Budget Compass
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Where do your tax dollars go?
          </p>
        </div>

        {/* Address search */}
        <div className="mb-4">
          <label className="mb-1 block text-xs font-semibold text-gray-500">
            Enter your Milwaukee address
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddressSearch()}
              placeholder="123 N Water St"
              className="flex-1 rounded-lg border-2 border-mke-dark px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mke-blue"
            />
            <button
              onClick={handleAddressSearch}
              disabled={isSearching}
              className="rounded-lg border-2 border-mke-dark bg-mke-blue px-4 py-2 text-sm font-bold text-white shadow-[2px_2px_0px_0px_#1A1A2E] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#1A1A2E]"
            >
              {isSearching ? "..." : "Look Up"}
            </button>
          </div>
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>

        {/* Divider */}
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">or choose a home value</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* Presets */}
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => handlePreset(p.value)}
              className={`rounded-lg border-2 border-mke-dark px-3 py-2 text-sm font-bold transition-all ${
                selectedPreset === p.value
                  ? "bg-mke-blue text-white shadow-[2px_2px_0px_0px_#1A1A2E]"
                  : "bg-white text-mke-dark shadow-[3px_3px_0px_0px_#1A1A2E] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#1A1A2E]"
              }`}
            >
              {p.label}
              {p.note && <span className="ml-1 text-xs opacity-70">({p.note})</span>}
            </button>
          ))}
        </div>

        {/* Persona */}
        <div className="mb-6">
          <label className="mb-2 block text-center text-xs font-semibold text-gray-500">
            I am a...
          </label>
          <div className="flex justify-center gap-2">
            {([
              { id: "resident", label: "Resident", emoji: "🏠" },
              { id: "student", label: "Student", emoji: "🎓" },
              { id: "journalist", label: "Journalist", emoji: "📰" },
            ] as const).map((p) => (
              <button
                key={p.id}
                onClick={() => setPersona(p.id)}
                className="rounded-lg border-2 border-mke-dark bg-white px-3 py-2 text-sm font-bold shadow-[2px_2px_0px_0px_#1A1A2E] transition-all hover:bg-mke-cream"
              >
                {p.emoji} {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Go button */}
        <button
          onClick={handleGo}
          className="w-full rounded-lg border-2 border-mke-dark bg-mke-blue py-3 text-lg font-bold text-white shadow-[4px_4px_0px_0px_#1A1A2E] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1A1A2E]"
        >
          Show Me Where My Money Goes
        </button>
      </div>
    </main>
  );
}
```

**Step 3: Update page.tsx to show Landing or App**

Modify `src/app/page.tsx` to conditionally render Landing vs tabbed app based on `isLanded` state.

**Step 4: Commit**

```bash
git add src/components/landing.tsx src/lib/mprop.ts src/app/page.tsx
git commit -m "feat: add landing page with MPROP address lookup and preset values"
```

---

### Task 7: Build Tab Navigation

**Files:**
- Create: `src/components/app-shell.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Create the app shell with 4 tabs**

Create `src/components/app-shell.tsx` with:
- Header bar: app title, persona dropdown, language toggle (EN|ES), voice button, UserButton
- 4 tabs: My Receipt, Explore, Simulate, Ask
- Active tab content area
- Data source footer badge

Each tab renders its own component (created in subsequent tasks). Start with placeholder content for tabs not yet built.

**Step 2: Wire page.tsx**

```typescript
export default function Home() {
  const { isLanded } = useBudget();
  return isLanded ? <AppShell /> : <Landing />;
}
```

**Step 3: Commit**

```bash
git add src/components/app-shell.tsx src/app/page.tsx
git commit -m "feat: add tab navigation shell with 4 tabs (receipt, explore, simulate, ask)"
```

---

### Task 8: Build Tax Receipt Tab

**Files:**
- Create: `src/components/tabs/tax-receipt.tsx`
- Move/refactor: logic from `background-research/milwaukee-tax-receipt-v3 (1).jsx`

**Step 1: Convert the existing JSX component to TypeScript + Tailwind**

The existing component (492 lines, inline styles) needs to be converted to:
- TypeScript with proper types
- Tailwind CSS classes replacing all inline `style={}` props
- Pull rates from BudgetContext (not hardcoded constants)
- ECharts for the stacked bar and department mini-bars
- "Ask Nova" button on each jurisdiction card
- Responsive mobile layout

Key conversion points:
- `COMBINED_RATE` → `useBudget().combinedRate`
- `JURISDICTIONS` → `useBudget().jurisdictions`
- `assessedValue` state → `useBudget().assessedValue`
- `SERVICE_GROUPS` → from `tax-rates-2026.json` serviceGroups
- Inline `style={{}}` → Tailwind classes
- `BarSegment` component → ECharts stacked bar

**Step 2: Add "Ask Nova" slide-up panel**

When user clicks "Ask Nova" on a jurisdiction card:
1. A slide-up panel appears with a contextual question pre-filled
2. The question hits `/api/chat` with context about the jurisdiction and assessed value
3. Streaming response appears in the panel

**Step 3: Commit**

```bash
git add src/components/tabs/tax-receipt.tsx
git commit -m "feat: build Tax Receipt tab from existing component (Tailwind + ECharts + BudgetContext)"
```

---

### Task 9: Build Explore Budgets Tab

**Files:**
- Create: `src/components/tabs/explore.tsx`
- Create: `src/components/budget-treemap.tsx`

**Step 1: Create the treemap component**

Create `src/components/budget-treemap.tsx` — a reusable ECharts treemap with:
- Hierarchical data (jurisdictions → departments/offices → expenditure types)
- Drill-down on click (ECharts `drillDown` event)
- Breadcrumb trail
- Personalized values ($YOUR share, not just budget total)
- Animated transitions
- Neobrutalist border styling

```typescript
// ECharts treemap option structure
{
  series: [{
    type: "treemap",
    data: [
      {
        name: "MPS",
        value: yourMPSShare,
        children: [
          { name: "Schools", value: schoolsShare },
          { name: "Operations", value: operationsShare },
          // ...
        ]
      },
      {
        name: "City",
        value: yourCityShare,
        children: serviceGroups.map(g => ({
          name: g.name,
          value: g.yourShare,
          children: g.departments.map(d => ({
            name: d.name,
            value: d.yourShare,
          }))
        }))
      },
      // County, MMSD, MATC...
    ],
    levels: [
      { itemStyle: { borderWidth: 3, borderColor: "#1A1A2E", gapWidth: 3 } },
      { itemStyle: { borderWidth: 2, borderColor: "#1A1A2E", gapWidth: 2 } },
      { itemStyle: { borderWidth: 1, gapWidth: 1 } },
    ],
    animationDuration: 500,
    animationEasing: "cubicOut",
  }]
}
```

**Step 2: Create the Explore tab component**

Create `src/components/tabs/explore.tsx` with:
- Treemap as primary view
- "Compare" toggle for side-by-side year comparisons
- "Tell me about this" button on click
- AI context panel (same slide-up pattern as tax receipt)

**Step 3: Commit**

```bash
git add src/components/budget-treemap.tsx src/components/tabs/explore.tsx
git commit -m "feat: build Explore tab with ECharts treemap drill-down"
```

---

### Task 10: Build Budget Simulator Tab

**Files:**
- Create: `src/components/tabs/simulator.tsx`
- Create: `src/components/budget-slider.tsx` (rewrite existing)

**Step 1: Create the simulator component**

Create `src/components/tabs/simulator.tsx` with:
- Top summary bar: YOUR tax impact (dynamic) + city budget balance indicator
- Department sliders grouped by service area (Public Safety, Infrastructure, Community, Govt)
- Locked items (debt service, retirement) — displayed but not adjustable
- Real-time calculation as sliders move
- Color-coded balance indicator (green/yellow/red)
- "What happens?" button → sends slider state to Nova for consequence analysis
- "Hear impact" button → Nova Sonic summarizes changes

**Step 2: Slider mechanics**

Each slider:
- Shows department name, current budget, and +/- delta
- Range: -50% to +50% of current budget
- Step size: $1M increments
- Visual bar fills proportionally
- Tax impact = (total delta / total assessed value in city) * your assessed value

**Step 3: Consequence analysis**

When user presses "What happens if I do this?":
```typescript
const changes = departments
  .filter(d => d.delta !== 0)
  .map(d => ({ name: d.name, original: d.budget, delta: d.delta }));

const prompt = `The user adjusted Milwaukee's budget. Changes: ${JSON.stringify(changes)}.
Their home is assessed at $${assessedValue}. Explain the real-world consequences.`;

// Send to /api/chat with this context
```

**Step 4: Commit**

```bash
git add src/components/tabs/simulator.tsx src/components/budget-slider.tsx
git commit -m "feat: build Budget Simulator tab with sliders and real-time tax impact"
```

---

### Task 11: Enhance Chat Tab

**Files:**
- Modify: `src/components/chat.tsx`
- Create: `src/components/tabs/ask.tsx`

**Step 1: Wrap existing Chat in a tab component**

Create `src/components/tabs/ask.tsx` that wraps the existing `Chat` component with:
- Context injection (assessed value, persona, language, current tab)
- Persona-specific starter questions
- ECharts rendering for inline chart blocks (replace Recharts)

**Step 2: Update agent system prompt**

Modify `src/mastra/agents/budget-agent.ts` to accept persona and context:
- Resident: plain language, personal impact framing
- Student: educational, Socratic questioning
- Journalist: data-heavy, citations, year-over-year comparisons

**Step 3: Add MPS and County query tools**

Create `src/mastra/tools/query-mps-data.ts` and `src/mastra/tools/query-county-data.ts` following the same pattern as `query-budget-data.ts` but hitting the new Convex MPS/County tables.

Register both tools in `src/mastra/agents/budget-agent.ts`.

**Step 4: Add Bedrock Knowledge Base search tool**

Create `src/mastra/tools/search-budget-docs.ts` — this tool queries Amazon Bedrock Knowledge Bases for narrative context from budget documents and policy briefs. The agent uses this for "why" questions (explanations, context, analysis) while using Convex tools for "what" questions (exact numbers).

```typescript
import { createTool } from "@mastra/core";
import { z } from "zod";
import {
  BedrockAgentRuntimeClient,
  RetrieveCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";

const bedrockAgent = new BedrockAgentRuntimeClient({
  region: process.env.AWS_REGION ?? "us-east-1",
});

export const searchBudgetDocs = createTool({
  id: "searchBudgetDocs",
  description:
    "Search budget documents and policy briefs for narrative context, explanations, and analysis. Use for 'why' questions, department descriptions, policy analysis, and contextual information. Do NOT use for exact dollar amounts — use Convex query tools for numbers.",
  inputSchema: z.object({
    query: z.string().describe("Natural language search query"),
    jurisdiction: z
      .enum(["city", "mps", "county", "all"])
      .optional()
      .describe("Filter by jurisdiction"),
  }),
  execute: async ({ query }) => {
    const response = await bedrockAgent.send(
      new RetrieveCommand({
        knowledgeBaseId: process.env.BEDROCK_KNOWLEDGE_BASE_ID,
        retrievalQuery: { text: query },
        retrievalConfiguration: {
          vectorSearchConfiguration: { numberOfResults: 5 },
        },
      })
    );

    return (response.retrievalResults ?? []).map((r) => ({
      content: r.content?.text ?? "",
      source: r.location?.s3Location?.uri ?? "unknown",
      score: r.score ?? 0,
    }));
  },
});
```

Register `searchBudgetDocs` in the budget agent alongside Convex tools. Update the agent system prompt to clarify when to use each tool type:
- **Convex tools** (`queryBudgetData`, `queryMPSData`, `queryCountyData`, `getTaxBreakdown`): For exact numbers, dollar amounts, percentages
- **Bedrock KB tool** (`searchBudgetDocs`): For explanations, department narratives, policy analysis, "why" questions, context

**Step 5: Commit**

```bash
git add src/components/tabs/ask.tsx src/components/chat.tsx src/mastra/agents/budget-agent.ts src/mastra/tools/query-mps-data.ts src/mastra/tools/query-county-data.ts src/mastra/tools/search-budget-docs.ts
git commit -m "feat: enhance Ask tab with persona awareness, MPS/County tools, and Bedrock KB search"
```

---

## Phase 3: Voice & Polish (Tasks 12–16)

---

### Task 12: Nova Sonic Audio Briefing

**Files:**
- Create: `src/app/api/voice/briefing/route.ts`
- Create: `src/components/audio-briefing.tsx`
- Create: `src/lib/nova-sonic.ts`

**Step 1: Create Nova Sonic client helper**

Create `src/lib/nova-sonic.ts` with functions for:
- Text-to-speech (for briefings)
- Speech-to-text (for live conversation)
- Bidirectional streaming (for live conversation)

Use `@aws-sdk/client-bedrock-runtime` with the Nova Sonic model.

**Step 2: Create briefing API route**

Create `src/app/api/voice/briefing/route.ts`:
- Accepts: `{ assessedValue, language }`
- Generates briefing text using Nova 2 Lite (personalized with user's numbers)
- Passes text to Nova Sonic TTS
- Returns audio stream

**Step 3: Create AudioBriefing component**

Create `src/components/audio-briefing.tsx`:
- Speaker button that triggers the briefing
- Loading state while generating
- Audio playback controls
- Works on Tax Receipt tab

**Step 4: Commit**

```bash
git add src/lib/nova-sonic.ts src/app/api/voice/briefing/route.ts src/components/audio-briefing.tsx
git commit -m "feat: add Nova Sonic audio briefing for personalized tax bill summary"
```

---

### Task 13: Nova Sonic Voice Tour

**Files:**
- Create: `src/app/api/voice/tour/route.ts`
- Create: `src/components/voice-tour.tsx`

**Step 1: Create tour API route**

Accepts: `{ context, language }` where context describes what the user is currently viewing (e.g., "User is viewing City of Milwaukee treemap, Public Safety department").

Generates contextual narration and returns audio.

**Step 2: Create VoiceTour component**

Integrate with the Explore tab — when voice tour is active, each treemap navigation triggers a narration request.

**Step 3: Commit**

```bash
git add src/app/api/voice/tour/route.ts src/components/voice-tour.tsx
git commit -m "feat: add Nova Sonic voice-guided tour for Explore tab"
```

---

### Task 14: Nova Sonic Live Conversation

**Files:**
- Create: `src/app/api/voice/converse/route.ts`
- Create: `src/components/voice-chat.tsx`

**Step 1: Create bidirectional voice API**

WebSocket or streaming endpoint that:
- Receives audio from browser
- Sends to Nova Sonic for STT
- Routes text to budget agent
- Sends response through Nova Sonic TTS
- Streams audio back

**Step 2: Create VoiceChat component**

Microphone button in header and Ask tab:
- Press to start recording
- Animated waveform while listening
- Response plays as audio while typing in chat
- Language-aware (English or Spanish)

**Step 3: Commit**

```bash
git add src/app/api/voice/converse/route.ts src/components/voice-chat.tsx
git commit -m "feat: add Nova Sonic live voice conversation"
```

---

### Task 15: Spanish Language Support

**Files:**
- Create: `src/lib/i18n.ts`
- Modify: `src/mastra/agents/budget-agent.ts`
- Modify: various components for label translations

**Step 1: Create i18n helper with key UI labels**

Minimal i18n — just the essential labels:
- Tab names, button text, headings, persona labels
- English and Spanish only

**Step 2: Update agent system prompt for Spanish**

When language is "es", add to system prompt:
> "Respond in Spanish. Use clear, accessible language. Budget line item names should remain in English (official names) but explain everything in Spanish."

**Step 3: Pass language to Nova Sonic calls**

Set `language: "es"` on all Nova Sonic API calls when Spanish is selected.

**Step 4: Commit**

```bash
git add src/lib/i18n.ts src/mastra/agents/budget-agent.ts
git commit -m "feat: add Spanish language support for chat and voice"
```

---

### Task 16: Amazon Bedrock Knowledge Base Setup

**Why Bedrock KB:** This is the RAG layer that gives our agent deep contextual knowledge from budget documents and independent policy analysis. It demonstrates understanding of the full Bedrock ecosystem (not just Nova models) and gives judges an additional AWS service to evaluate. The agent uses Bedrock KB for "why" questions while Convex handles "what" questions (exact numbers).

**Documents to ingest:**
- `policy-briefs/2026CityBudgetBrief.pdf` — Wisconsin Policy Forum city analysis
- `policy-briefs/BudgetBrief_2026MilwaukeeCounty.pdf` — Wisconsin Policy Forum county analysis
- `policy-briefs/BudgetBrief_2026MPS (1).pdf` — Wisconsin Policy Forum MPS analysis
- `data/department_narratives.json` — City department narrative descriptions from budget PDF
- Budget document excerpts (narrative sections, not tables)

**Files:**
- Create: `scripts/setup-bedrock-kb.sh` — AWS CLI script to create KB infrastructure
- Create: `scripts/upload-kb-documents.sh` — Script to upload docs to S3
- Modify: `src/mastra/agents/budget-agent.ts` — Verify searchBudgetDocs tool is wired (added in Task 11)
- Create: `.env.example` updates for `BEDROCK_KNOWLEDGE_BASE_ID`, `AWS_REGION`

**Step 1: Create S3 bucket for source documents**

```bash
# scripts/setup-bedrock-kb.sh
BUCKET_NAME="budget-compass-kb-docs"
AWS_REGION="us-east-1"

# Create S3 bucket
aws s3 mb s3://${BUCKET_NAME} --region ${AWS_REGION}

# Upload policy briefs and narratives
aws s3 sync ./policy-briefs/ s3://${BUCKET_NAME}/policy-briefs/
aws s3 cp ./data/department_narratives.json s3://${BUCKET_NAME}/narratives/
```

**Step 2: Create Bedrock Knowledge Base via AWS Console or CLI**

Using AWS Console (recommended for hackathon speed):
1. Go to Amazon Bedrock > Knowledge Bases > Create
2. Name: `budget-compass-knowledge-base`
3. Data source: S3 bucket `budget-compass-kb-docs`
4. Embedding model: Amazon Titan Embeddings v2
5. Vector store: Quick create (OpenSearch Serverless — auto-provisioned)
6. Chunking strategy: Default (300 tokens, 20% overlap)
7. Create and sync

Or via AWS CLI:

```bash
# Create Knowledge Base
aws bedrock-agent create-knowledge-base \
  --name "budget-compass-knowledge-base" \
  --description "Milwaukee 2026 budget documents and Wisconsin Policy Forum analysis" \
  --role-arn "arn:aws:iam::role/BudgetCompassKBRole" \
  --knowledge-base-configuration '{
    "type": "VECTOR",
    "vectorKnowledgeBaseConfiguration": {
      "embeddingModelArn": "arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v2:0"
    }
  }' \
  --storage-configuration '{
    "type": "OPENSEARCH_SERVERLESS",
    "opensearchServerlessConfiguration": {
      "collectionArn": "[auto-created]",
      "vectorIndexName": "budget-compass-index",
      "fieldMapping": {
        "vectorField": "embedding",
        "textField": "text",
        "metadataField": "metadata"
      }
    }
  }'

# Create S3 data source
aws bedrock-agent create-data-source \
  --knowledge-base-id "[KB_ID]" \
  --name "budget-documents" \
  --data-source-configuration '{
    "type": "S3",
    "s3Configuration": {
      "bucketArn": "arn:aws:s3:::budget-compass-kb-docs"
    }
  }'

# Sync (ingest documents)
aws bedrock-agent start-ingestion-job \
  --knowledge-base-id "[KB_ID]" \
  --data-source-id "[DS_ID]"
```

**Step 3: Add Knowledge Base ID to environment**

```bash
# .env.local
BEDROCK_KNOWLEDGE_BASE_ID=your-kb-id-here
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

**Step 4: Verify the searchBudgetDocs tool works**

The tool was created in Task 11. Test it:
- Query: "What are the key challenges facing MPS?" → Should return policy brief content
- Query: "What does the Library department do?" → Should return department narrative
- Query: "How does Milwaukee compare to other cities on police spending?" → Should return policy analysis

Verify the agent correctly chooses between Convex (numbers) and Bedrock KB (context):
- "How much is the police budget?" → Agent calls `queryBudgetData` (Convex)
- "Why is the police budget so large?" → Agent calls `searchBudgetDocs` (Bedrock KB)
- "How much does MPS spend and what are their biggest challenges?" → Agent calls BOTH

**Step 5: Commit**

```bash
git add scripts/setup-bedrock-kb.sh scripts/upload-kb-documents.sh .env.example
git commit -m "feat: add Amazon Bedrock Knowledge Base for budget narratives and policy briefs"
```

**Why this impresses judges:**
- Shows understanding of Bedrock ecosystem beyond just models
- Demonstrates proper RAG architecture (KB for context, structured DB for numbers)
- Uses Titan Embeddings + OpenSearch Serverless — AWS-native vector search
- Policy briefs from independent Wisconsin Policy Forum add credibility
- Agent intelligently routes between two data sources based on question type

---

## Phase 4: Ship (Tasks 17–19)

---

### Task 17: Data Methodology Page

**Files:**
- Create: `src/app/methodology/page.tsx`
- Already created: `docs/DATA_METHODOLOGY.md`

**Step 1: Create a `/methodology` route**

Render the DATA_METHODOLOGY.md content as a styled page within the app. Link to it from the footer badge on every tab.

Add `/methodology` to the public routes in `src/middleware.ts`.

**Step 2: Commit**

```bash
git add src/app/methodology/page.tsx src/middleware.ts
git commit -m "feat: add data methodology page accessible from footer badge"
```

---

### Task 18: Final Data Verification

**Files:**
- Modify: `data/tax-rates-2026.json` (if corrections needed)
- Modify: seed files (if corrections needed)

**Step 1: Verify all numbers**

- Cross-check tax rates against at least 2 published sources
- Verify city department totals sum to GCP total
- Verify MPS office totals sum to district total
- Spot-check 5 random numbers against source PDFs
- Test tax calculation: median home ($166K) should produce reasonable total

**Step 2: Update transparency badge text if needed**

**Step 3: Commit**

```bash
git commit -m "fix: final data verification pass — corrected [specific items]"
```

---

### Task 19: Deploy and Demo Prep

**Step 1: Build and deploy**

```bash
npm run build  # Verify no errors
vercel --prod  # Deploy to production
```

**Step 2: Verify on production**

- Test address lookup
- Test all 4 tabs
- Test voice features
- Test Spanish mode
- Test on mobile

**Step 3: Update middleware for any new routes**

Ensure `/api/voice/*` and `/methodology` are in public routes.

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: deploy preparation and final polish"
```

---

## Task Dependency Map

```
Task 1 (Mill Rates) ──→ Task 5 (BudgetContext) ──→ Task 6 (Landing)
                                                  ├→ Task 7 (Tab Nav)
Task 2 (MPS Data)   ──→ Task 9 (Explore)         ├→ Task 8 (Receipt)
Task 3 (County Data) ─→ Task 9 (Explore)         ├→ Task 9 (Explore)
Task 4 (ECharts)     ──→ Task 8 (Receipt)         ├→ Task 10 (Simulator)
                        Task 9 (Explore)           └→ Task 11 (Chat)
                        Task 10 (Simulator)
                                                  Tasks 12-14 (Voice) → after Phase 2
                                                  Task 15 (Spanish) → after Voice
                                                  Task 16 (Policy) → independent
                                                  Tasks 17-19 (Ship) → after all
```

## Critical Path

**Must complete for demo:** Tasks 1, 4, 5, 6, 7, 8, 9, 10, 11, 19
**Should complete:** Tasks 2, 3, 12, 17, 18
**Nice to have:** Tasks 13, 14, 15, 16
