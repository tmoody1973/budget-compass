# Budget Compass Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build MKE Budget Compass — an AI-powered civic intelligence platform with 4 interaction modes (Ask, Hear, See, Remix) powered by Mastra agents, Amazon Nova, Convex, and CopilotKit.

**Architecture:** Next.js 15 app with Mastra running inside via registerCopilotKit() API route. Query Router agent classifies user intent and delegates to specialist agents. All budget data served from Convex (pre-loaded seed data). CopilotKit Generative UI renders interactive charts inline in chat. RetroUI neobrutalist components with Milwaukee civic color palette.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, RetroUI, Recharts, Mastra, @ai-sdk/amazon-bedrock (Nova 2 Lite/Pro/Sonic/Omni), Convex, CopilotKit + AG-UI, Clerk

---

## Phase 1: Foundation + Ask Mode (Days 1-4)

### Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Create: `.env.local`
- Create: `.gitignore`

**Step 1: Create Next.js app with TypeScript and Tailwind**

```bash
cd /Users/tarikmoody/Documents/Projects/budget-compass
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

**Step 2: Install core dependencies**

```bash
# Mastra + Bedrock
npm install @mastra/core mastra @ai-sdk/amazon-bedrock zod

# CopilotKit + AG-UI
npm install @ag-ui/mastra @mastra/client-js @ag-ui/core @ag-ui/client @copilotkit/runtime @copilotkit/react-core @copilotkit/react-ui

# Convex
npm install convex

# Clerk
npm install @clerk/nextjs

# Charts
npm install recharts

# RetroUI peer deps (class-variance-authority, tailwind-merge)
npm install class-variance-authority tailwind-merge clsx
```

**Step 3: Configure environment variables**

Create `.env.local`:
```
# AWS Bedrock
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1

# Convex
CONVEX_URL=
CONVEX_DEPLOY_KEY=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Mastra
MASTRA_SERVER_URL=http://localhost:4111
```

**Step 4: Verify app runs**

```bash
npm run dev
```
Expected: Next.js dev server on http://localhost:3000

**Step 5: Initialize git and commit**

```bash
git init
git add .
git commit -m "feat: initialize Next.js 15 project with dependencies"
```

---

### Task 2: Set Up Convex & Load Seed Data

**Files:**
- Create: `convex/schema.ts` (copy from `background-research/schema.ts`)
- Create: `convex/budget.ts` (copy from `background-research/queries.ts`)
- Create: `convex/seed.ts` (seed script)

**Step 1: Initialize Convex**

```bash
npx convex init
```

Follow prompts to connect to your Convex project.

**Step 2: Copy schema and queries from background-research**

Copy `background-research/schema.ts` → `convex/schema.ts`
Copy `background-research/queries.ts` → `convex/budget.ts`

**Step 3: Create seed script**

Create `convex/seed.ts`:
```typescript
import { mutation } from "./_generated/server";

export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    // This will be called manually from the Convex dashboard
    // or via a script that reads the JSON files
    console.log("Seed function ready. Use Convex dashboard to import data.");
  },
});
```

**Step 4: Deploy schema and push seed data**

```bash
npx convex dev
```

In a separate terminal, use the Convex CLI or dashboard to import `convex_seed_data.json` and `department_narratives.json` into the respective tables.

**Step 5: Verify data loaded**

Open Convex dashboard → verify all 10 tables have data:
- cityOverview: 1 row
- budgetSections: 12 rows (sections A-N)
- departmentMeta: ~30 rows
- departmentBudgets: ~500+ rows
- departmentNarratives: ~30 rows

**Step 6: Test a query**

```bash
npx convex run budget:getCityOverview
```
Expected: Returns Milwaukee 2026 budget overview object

**Step 7: Commit**

```bash
git add convex/
git commit -m "feat: add Convex schema, queries, and seed data"
```

---

### Task 3: Install & Configure RetroUI

**Files:**
- Modify: `tailwind.config.ts`
- Create: `src/components/retroui/` (component files)
- Modify: `src/app/globals.css`

**Step 1: Install RetroUI**

Follow RetroUI docs at https://www.retroui.dev/docs/install for Next.js setup. This typically involves:
```bash
npx retroui init
```
Or manually copying components into `src/components/retroui/`.

**Step 2: Configure Milwaukee color palette in Tailwind**

Update `tailwind.config.ts`:
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/retroui/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mke: {
          blue: "#0A3161",       // Lake Michigan deep blue
          brick: "#D4A574",      // Cream City brick
          green: "#2E8B57",      // Milwaukee parks
          cream: "#FDF6EC",      // Warm background
          dark: "#1A1A2E",       // Near-black text
          danger: "#C41E3A",     // Budget cuts
        },
      },
      fontFamily: {
        head: ["var(--font-head)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
```

**Step 3: Update globals.css with Milwaukee theme**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #FDF6EC;
  --foreground: #1A1A2E;
  --primary: #0A3161;
  --secondary: #D4A574;
  --accent: #2E8B57;
}

body {
  background-color: var(--background);
  color: var(--foreground);
}
```

**Step 4: Verify RetroUI renders**

Create a test page with a RetroUI Button component to confirm styling works.

**Step 5: Commit**

```bash
git add .
git commit -m "feat: configure RetroUI with Milwaukee civic color palette"
```

---

### Task 4: Create Mastra Agents (Q&A + Analyst + Query Router)

**Files:**
- Create: `src/mastra/agents/qa-agent.ts`
- Create: `src/mastra/agents/analyst-agent.ts`
- Create: `src/mastra/agents/query-router.ts`
- Create: `src/mastra/tools/query-budget-data.ts`
- Create: `src/mastra/tools/render-budget-chart.ts`
- Create: `src/mastra/tools/search-narratives.ts`
- Create: `src/mastra/index.ts`

**Step 1: Create the queryBudgetData tool**

Create `src/mastra/tools/query-budget-data.ts`:
```typescript
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { ConvexClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

const convex = new ConvexClient(process.env.CONVEX_URL!);

export const queryBudgetDataTool = createTool({
  id: "query-budget-data",
  description: `Query Milwaukee's 2026 budget database for exact fiscal data.
    Use for ANY question about dollar amounts, headcounts, tax rates, or department budgets.
    Available queries: getCityOverview, getAllBudgetSections, getBudgetSection,
    getDepartmentBudget, getDepartmentExpenditures, getDepartmentRevenues,
    getAllDepartmentTotals, getAllDepartments, getDepartmentMeta,
    getDepartmentServices, getDepartmentPerformance, getAllPositions,
    getHistoricalBySection, getTaxLevyBreakdown, compareDepartments,
    topDepartmentsBySpending, categoryBreakdown.`,
  inputSchema: z.object({
    queryName: z.enum([
      "getCityOverview", "getAllBudgetSections", "getBudgetSection",
      "getDepartmentBudget", "getDepartmentExpenditures", "getDepartmentRevenues",
      "getAllDepartmentTotals", "getAllDepartments", "getDepartmentMeta",
      "getDepartmentServices", "getDepartmentPerformance", "getAllPositions",
      "getHistoricalBySection", "getTaxLevyBreakdown", "compareDepartments",
      "topDepartmentsBySpending", "categoryBreakdown",
    ]).describe("Which Convex query function to call"),
    args: z.record(z.any()).optional().describe("Arguments for the query, e.g. { department: 'Police' }"),
  }),
  outputSchema: z.object({
    data: z.any(),
    source: z.string(),
  }),
  execute: async ({ context }) => {
    const queryFn = (api.budget as any)[context.queryName];
    const result = await convex.query(queryFn, context.args ?? {});
    return {
      data: result,
      source: `Convex query: budget.${context.queryName}`,
    };
  },
});
```

**Step 2: Create the renderBudgetChart tool**

Create `src/mastra/tools/render-budget-chart.ts`:
```typescript
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const renderBudgetChartTool = createTool({
  id: "render-budget-chart",
  description: `Render an interactive chart in the chat. Call AFTER getting verified data from queryBudgetData. Never pass estimated numbers.`,
  inputSchema: z.object({
    chartType: z.enum(["bar", "line", "pie", "treemap"]).describe("Best chart type for this data"),
    title: z.string().describe("Chart title"),
    data: z.array(z.object({
      label: z.string(),
      value: z.number(),
      color: z.string().optional(),
    })),
    xLabel: z.string().optional(),
    yLabel: z.string().optional(),
    unit: z.string().optional().describe("e.g. $, %, FTEs"),
  }),
  outputSchema: z.object({
    rendered: z.boolean(),
  }),
  execute: async () => {
    // CopilotKit intercepts this tool call via AG-UI
    // and renders the chart component on the frontend
    return { rendered: true };
  },
});
```

**Step 3: Create the searchNarratives tool**

Create `src/mastra/tools/search-narratives.ts`:
```typescript
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { ConvexClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

const convex = new ConvexClient(process.env.CONVEX_URL!);

export const searchNarrativesTool = createTool({
  id: "search-narratives",
  description: "Search budget document narratives for context about departments, policies, and explanations. Use when you need qualitative context beyond raw numbers.",
  inputSchema: z.object({
    searchQuery: z.string().describe("What to search for in budget narratives"),
  }),
  outputSchema: z.object({
    results: z.array(z.object({
      department: z.string(),
      pages: z.string(),
      excerpt: z.string(),
    })),
  }),
  execute: async ({ context }) => {
    const results = await convex.query(api.budget.searchNarratives, {
      searchQuery: context.searchQuery,
    });
    return {
      results: results.map((r: any) => ({
        department: r.department,
        pages: r.pages,
        excerpt: r.fullText.substring(0, 500) + "...",
      })),
    };
  },
});
```

**Step 4: Create Q&A Agent**

Create `src/mastra/agents/qa-agent.ts`:
```typescript
import { Agent } from "@mastra/core/agent";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { queryBudgetDataTool } from "../tools/query-budget-data";
import { renderBudgetChartTool } from "../tools/render-budget-chart";
import { searchNarrativesTool } from "../tools/search-narratives";

const bedrock = createAmazonBedrock({ region: "us-east-1" });

export const qaAgent = new Agent({
  id: "qa-agent",
  name: "Budget Q&A Agent",
  instructions: `You are Milwaukee's budget expert for the 2026 Proposed Budget.

RULES:
- ALWAYS use queryBudgetData to get exact numbers. NEVER estimate or calculate mentally.
- When data supports a visualization, call renderBudgetChart with verified data.
- Use searchNarratives for context about department missions, policies, explanations.
- Format dollar amounts with commas and $ signs.
- Be concise but informative. Lead with the answer.
- Cite the data source (which query you used).

AVAILABLE QUERIES:
- getCityOverview: total budget, tax levy, property tax rate
- getAllBudgetSections / getBudgetSection: 12 major budget sections (A-N)
- getDepartmentBudget / getDepartmentExpenditures / getDepartmentRevenues: department line items
- getAllDepartmentTotals / topDepartmentsBySpending: ranked department spending
- getDepartmentMeta: mission, total expenditures, service counts
- getDepartmentServices: services within a department
- getDepartmentPerformance: performance measures (3-year trends)
- getAllPositions: headcount by department
- getHistoricalBySection: 4-year historical comparison
- getTaxLevyBreakdown: tax levy allocation across sections
- compareDepartments: side-by-side comparison of two departments
- categoryBreakdown: spending by category across all departments
- searchNarratives: full-text search on budget document narratives`,
  model: bedrock("us.amazon.nova-lite-v2:0"),
  tools: { queryBudgetDataTool, renderBudgetChartTool, searchNarrativesTool },
});
```

**Step 5: Create Analyst Agent**

Create `src/mastra/agents/analyst-agent.ts`:
```typescript
import { Agent } from "@mastra/core/agent";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { queryBudgetDataTool } from "../tools/query-budget-data";
import { renderBudgetChartTool } from "../tools/render-budget-chart";
import { searchNarrativesTool } from "../tools/search-narratives";

const bedrock = createAmazonBedrock({ region: "us-east-1" });

export const analystAgent = new Agent({
  id: "analyst-agent",
  name: "Budget Analyst Agent",
  instructions: `You are a senior fiscal analyst specializing in Milwaukee's 2026 budget.

You handle COMPLEX queries that require:
- Comparing multiple departments or years
- Trend analysis across time periods
- Cross-referencing budget sections with department data
- Calculating percentages, rankings, or aggregations
- Explaining budget changes with narrative context

RULES:
- ALWAYS query data first using queryBudgetData. NEVER estimate.
- For comparisons, use compareDepartments or make multiple queries.
- For trends, use getHistoricalBySection.
- Always render a chart when comparing or showing trends.
- Combine quantitative data with narrative context from searchNarratives.
- Explain the "so what" — why does this data matter for Milwaukee residents?`,
  model: bedrock("us.amazon.nova-pro-v2:0"),
  tools: { queryBudgetDataTool, renderBudgetChartTool, searchNarrativesTool },
});
```

**Step 6: Create Query Router**

Create `src/mastra/agents/query-router.ts`:
```typescript
import { Agent } from "@mastra/core/agent";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { qaAgent } from "./qa-agent";
import { analystAgent } from "./analyst-agent";

const bedrock = createAmazonBedrock({ region: "us-east-1" });

export const queryRouter = new Agent({
  id: "query-router",
  name: "Budget Query Router",
  instructions: `You route budget questions to specialist agents. You NEVER answer budget questions directly.

ROUTING RULES:
- Simple factual lookups (single department, single number, single year) → delegate to qaAgent
  Examples: "What is the police budget?" "How many employees does DPW have?" "What's the tax rate?"

- Complex analysis (comparisons, trends, multi-department, rankings, explanations) → delegate to analystAgent
  Examples: "Compare police and fire budgets" "How has library funding changed?" "Which departments grew the most?"

- Budget simulation, "what if" scenarios, reallocation → delegate to simulatorAgent (when available)

- Greetings or off-topic → respond directly with a friendly redirect to budget topics

Always route. Be fast. Don't add commentary before routing.`,
  model: bedrock("us.amazon.nova-lite-v2:0"),
  agents: {
    qaAgent: {
      ...qaAgent,
      description: "Fast factual budget lookups for simple single-answer questions",
    },
    analystAgent: {
      ...analystAgent,
      description: "Complex multi-step budget analysis, comparisons, and trend analysis",
    },
  },
});
```

**Step 7: Create Mastra instance**

Create `src/mastra/index.ts`:
```typescript
import { Mastra } from "@mastra/core/mastra";
import { registerCopilotKit } from "@ag-ui/mastra/copilotkit";
import { queryRouter } from "./agents/query-router";
import { qaAgent } from "./agents/qa-agent";
import { analystAgent } from "./agents/analyst-agent";

export const mastra = new Mastra({
  agents: {
    queryRouter,
    qaAgent,
    analystAgent,
  },
  server: {
    cors: {
      origin: "*",
      allowMethods: ["*"],
      allowHeaders: ["*"],
    },
    apiRoutes: [
      registerCopilotKit({
        path: "/copilotkit",
        resourceId: "queryRouter",
        setContext: (c, runtimeContext) => {
          runtimeContext.set("user-id", c.req.header("X-User-ID") ?? "anonymous");
        },
      }),
    ],
  },
});
```

**Step 8: Test agents via Mastra playground**

```bash
cd src/mastra
npx mastra dev
```

Open http://localhost:4111 → test Q&A Agent with: "What is the total Milwaukee budget?"
Expected: Agent calls queryBudgetData with getCityOverview, returns exact dollar amount.

**Step 9: Commit**

```bash
git add src/mastra/
git commit -m "feat: add Mastra agents (Q&A, Analyst, Query Router) and tools"
```

---

### Task 5: Wire CopilotKit Frontend (Ask Mode)

**Files:**
- Create: `src/app/providers.tsx`
- Modify: `src/app/layout.tsx`
- Create: `src/components/modes/ask-mode.tsx`
- Create: `src/components/budget-chart.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Create CopilotKit provider**

Create `src/app/providers.tsx`:
```typescript
"use client";

import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CopilotKit
      runtimeUrl={process.env.NEXT_PUBLIC_MASTRA_URL ?? "http://localhost:4111/copilotkit"}
      agent="queryRouter"
    >
      {children}
    </CopilotKit>
  );
}
```

**Step 2: Create BudgetChart component (Generative UI)**

Create `src/components/budget-chart.tsx`:
```typescript
"use client";

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const MKE_COLORS = ["#0A3161", "#D4A574", "#2E8B57", "#C41E3A", "#5B8BA0", "#8B6914"];

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
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  }
  if (unit === "%") return `${value.toFixed(1)}%`;
  return `${value.toLocaleString()} ${unit}`;
};

export function BudgetChart({ chartType, title, data, xLabel, yLabel, unit }: BudgetChartProps) {
  const chartData = data.map((d, i) => ({
    name: d.label,
    value: d.value,
    fill: d.color || MKE_COLORS[i % MKE_COLORS.length],
  }));

  return (
    <div className="bg-white border-2 border-mke-dark shadow-[4px_4px_0px_0px_#1A1A2E] rounded-lg p-4 my-3">
      <h3 className="font-bold text-mke-blue text-lg mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        {chartType === "bar" ? (
          <BarChart data={chartData} layout="vertical" margin={{ left: 100 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={(v) => formatValue(v, unit)} />
            <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => formatValue(v, unit)} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        ) : chartType === "line" ? (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(v) => formatValue(v, unit)} />
            <Tooltip formatter={(v: number) => formatValue(v, unit)} />
            <Line type="monotone" dataKey="value" stroke="#0A3161" strokeWidth={2} dot={{ fill: "#0A3161" }} />
          </LineChart>
        ) : chartType === "pie" ? (
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={(e) => e.name}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => formatValue(v, unit)} />
            <Legend />
          </PieChart>
        ) : (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => formatValue(v, unit)} />
            <Tooltip formatter={(v: number) => formatValue(v, unit)} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
```

**Step 3: Create Ask Mode with Generative UI action**

Create `src/components/modes/ask-mode.tsx`:
```typescript
"use client";

import { CopilotChat } from "@copilotkit/react-ui";
import { useCopilotAction } from "@copilotkit/react-core";
import { BudgetChart } from "../budget-chart";

export function AskMode() {
  // Register Generative UI action — CopilotKit intercepts the
  // renderBudgetChart tool call and renders this component inline
  useCopilotAction({
    name: "render-budget-chart",
    render: ({ args }) => (
      <BudgetChart
        chartType={args.chartType}
        title={args.title}
        data={args.data}
        xLabel={args.xLabel}
        yLabel={args.yLabel}
        unit={args.unit}
      />
    ),
  });

  return (
    <div className="h-full">
      <CopilotChat
        labels={{
          title: "Budget Compass",
          initial: "Ask anything about Milwaukee's $1.4B city budget.",
          placeholder: "e.g., How much do we spend on police?",
        }}
        className="h-full"
      />
    </div>
  );
}
```

**Step 4: Create main page with mode tabs**

Update `src/app/page.tsx`:
```typescript
"use client";

import { useState } from "react";
import { AskMode } from "@/components/modes/ask-mode";

const MODES = [
  { id: "ask", label: "Ask", emoji: "💬" },
  { id: "remix", label: "Remix", emoji: "🎛️" },
  { id: "see", label: "See", emoji: "🎨" },
  { id: "hear", label: "Hear", emoji: "🎧" },
] as const;

type ModeId = typeof MODES[number]["id"];

export default function Home() {
  const [activeMode, setActiveMode] = useState<ModeId>("ask");

  return (
    <main className="min-h-screen bg-mke-cream">
      {/* Header */}
      <header className="border-b-2 border-mke-dark bg-white shadow-[0_2px_0px_0px_#1A1A2E] px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-mke-blue">
            MKE Budget Compass
          </h1>
          {/* Mode tabs */}
          <nav className="flex gap-2">
            {MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={`px-4 py-2 rounded-lg border-2 border-mke-dark font-bold text-sm transition-all
                  ${activeMode === mode.id
                    ? "bg-mke-blue text-white shadow-[2px_2px_0px_0px_#1A1A2E]"
                    : "bg-white text-mke-dark hover:bg-mke-cream shadow-[3px_3px_0px_0px_#1A1A2E] hover:shadow-[1px_1px_0px_0px_#1A1A2E] hover:translate-x-[2px] hover:translate-y-[2px]"
                  }`}
              >
                {mode.emoji} {mode.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Mode content */}
      <div className="max-w-6xl mx-auto p-6 h-[calc(100vh-64px)]">
        {activeMode === "ask" && <AskMode />}
        {activeMode === "remix" && <div className="text-mke-dark">Remix mode coming soon...</div>}
        {activeMode === "see" && <div className="text-mke-dark">See mode coming soon...</div>}
        {activeMode === "hear" && <div className="text-mke-dark">Hear mode coming soon...</div>}
      </div>
    </main>
  );
}
```

**Step 5: Update layout with providers**

Update `src/app/layout.tsx`:
```typescript
import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "MKE Budget Compass",
  description: "AI-powered civic intelligence for Milwaukee's $1.4B budget",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**Step 6: End-to-end test**

1. Terminal 1: `npx convex dev` (Convex backend)
2. Terminal 2: `cd src/mastra && npx mastra dev` (Mastra agents on :4111)
3. Terminal 3: `npm run dev` (Next.js on :3000)

Open http://localhost:3000 → type "What is Milwaukee's total budget?" → verify:
- Query Router routes to Q&A Agent
- Agent calls queryBudgetData with getCityOverview
- Response shows exact dollar amount
- If agent calls renderBudgetChart, chart renders inline

**Step 7: Commit**

```bash
git add .
git commit -m "feat: wire CopilotKit frontend with Ask mode and Generative UI charts"
```

---

### Task 6: Add Clerk Authentication

**Files:**
- Create: `src/middleware.ts`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/providers.tsx`
- Create: `src/app/sign-in/[[...sign-in]]/page.tsx`
- Create: `src/app/sign-up/[[...sign-up]]/page.tsx`

**Step 1: Configure Clerk middleware**

Create `src/middleware.ts`:
```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)"],
};
```

**Step 2: Wrap layout with ClerkProvider**

Update `src/app/layout.tsx` to include `<ClerkProvider>` wrapping `<Providers>`.

**Step 3: Add UserButton to header**

Add Clerk's `<UserButton />` to the header in `src/app/page.tsx`.

**Step 4: Create sign-in and sign-up pages**

Create `src/app/sign-in/[[...sign-in]]/page.tsx`:
```typescript
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-mke-cream flex items-center justify-center">
      <SignIn />
    </div>
  );
}
```

Create similar for sign-up.

**Step 5: Verify auth flow**

Open http://localhost:3000 → should redirect to sign-in → sign in → see Budget Compass.

**Step 6: Commit**

```bash
git add .
git commit -m "feat: add Clerk authentication with sign-in/sign-up"
```

---

## Phase 2: Remix Mode (Days 5-7)

### Task 7: Create Simulator Agent

**Files:**
- Create: `src/mastra/agents/simulator-agent.ts`
- Modify: `src/mastra/agents/query-router.ts` (add simulator routing)
- Modify: `src/mastra/index.ts` (register simulator)

**Step 1: Create Simulator Agent**

Create `src/mastra/agents/simulator-agent.ts`:
```typescript
import { Agent } from "@mastra/core/agent";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { queryBudgetDataTool } from "../tools/query-budget-data";
import { renderBudgetChartTool } from "../tools/render-budget-chart";

const bedrock = createAmazonBedrock({ region: "us-east-1" });

export const simulatorAgent = new Agent({
  id: "simulator-agent",
  name: "Budget Simulator Agent",
  instructions: `You model the consequences of budget reallocation scenarios for Milwaukee's 2026 budget.

When a user adjusts budget allocations:
1. Use queryBudgetData to get current values for affected sections
2. Calculate the impact of the proposed change
3. Explain consequences in plain language:
   - What services would be affected
   - How many positions might change
   - Impact on tax rate
   - Historical context (has this been tried before?)
4. Render a before/after comparison chart

Be balanced and factual. Present tradeoffs honestly.
Never advocate for specific budget positions.
Always ground analysis in actual data from the database.`,
  model: bedrock("us.amazon.nova-pro-v2:0"),
  tools: { queryBudgetDataTool, renderBudgetChartTool },
});
```

**Step 2: Add simulator to Query Router agents map and to Mastra instance**

**Step 3: Test via Mastra playground**

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add Simulator agent for budget reallocation modeling"
```

---

### Task 8: Build Remix Mode UI

**Files:**
- Create: `src/components/modes/remix-mode.tsx`
- Create: `src/components/budget-slider.tsx`
- Create: `src/components/consequence-panel.tsx`
- Modify: `src/app/page.tsx` (wire Remix tab)

**Step 1: Create BudgetSlider component**

Create `src/components/budget-slider.tsx` — a RetroUI-styled range slider showing section name, current allocation, and proposed allocation.

**Step 2: Create ConsequencePanel**

Create `src/components/consequence-panel.tsx` — displays the Simulator Agent's analysis of slider changes.

**Step 3: Create Remix Mode with CopilotKit shared state**

Create `src/components/modes/remix-mode.tsx`:
```typescript
"use client";

import { useState, useEffect } from "react";
import { useCopilotReadable, useCopilotAction, useCopilotChat } from "@copilotkit/react-core";
import { BudgetSlider } from "../budget-slider";
import { ConsequencePanel } from "../consequence-panel";

// Fetch initial section data from Convex, display as sliders,
// expose slider state via useCopilotReadable, send changes to
// Simulator Agent, display consequences in side panel.
```

Key patterns:
- `useCopilotReadable` exposes slider state to the agent
- When sliders change significantly, auto-send a message to the Simulator Agent
- Agent's response appears in the ConsequencePanel
- `useCopilotAction` for "render-budget-chart" renders comparison charts

**Step 4: Wire into page.tsx**

**Step 5: Test end-to-end**

Move sliders → verify Simulator Agent responds with consequence analysis.

**Step 6: Commit**

```bash
git add .
git commit -m "feat: add Remix mode with budget sliders and consequence modeling"
```

---

## Phase 3: See Mode (Days 8-9)

### Task 9: Create Visual Agent + See Mode UI

**Files:**
- Create: `src/mastra/agents/visual-agent.ts`
- Create: `src/mastra/tools/generate-infographic.ts`
- Create: `src/components/modes/see-mode.tsx`
- Modify: `src/mastra/index.ts`
- Modify: `src/mastra/agents/query-router.ts`

**Step 1: Create Visual Agent**

Uses Nova 2 Omni for image generation. Agent queries budget data first, then generates an infographic image summarizing the data.

**Step 2: Create generateInfographic tool**

This tool takes budget data and a description, calls Nova Omni to generate an image.

**Step 3: Build See Mode UI**

A prompt input + gallery of generated infographics with share/download buttons.

**Step 4: Wire into routing + page**

**Step 5: Test end-to-end**

**Step 6: Commit**

```bash
git add .
git commit -m "feat: add See mode with AI-generated budget infographics"
```

---

## Phase 4: Hear Mode (Days 10-11)

### Task 10: Create Voice Agent + Hear Mode UI

**Files:**
- Create: `src/mastra/agents/voice-agent.ts`
- Create: `src/mastra/tools/generate-voice-briefing.ts`
- Create: `src/components/modes/hear-mode.tsx`
- Create: `src/components/audio-player.tsx`
- Modify: `src/mastra/index.ts`
- Modify: `src/mastra/agents/query-router.ts`

**Step 1: Create Voice Agent**

Uses Nova 2 Sonic for speech synthesis. Agent composes a briefing script from budget data, then generates audio.

**Step 2: Create generateVoiceBriefing tool**

Calls Nova Sonic to generate spoken audio. Returns audio URL/blob.

**Step 3: Build Hear Mode UI**

Topic selector (dropdown of departments/themes) + audio player with waveform + synchronized text transcript.

**Step 4: Fallback for Nova Sonic availability**

If Nova Sonic is not available, use browser's SpeechSynthesis API as fallback:
```typescript
const utterance = new SpeechSynthesisUtterance(briefingText);
window.speechSynthesis.speak(utterance);
```

**Step 5: Wire into routing + page**

**Step 6: Test end-to-end**

**Step 7: Commit**

```bash
git add .
git commit -m "feat: add Hear mode with voice briefings"
```

---

## Phase 5: Polish & Deploy (Day 12)

### Task 11: Responsive Design + Polish

**Files:**
- Modify: `src/app/page.tsx` (mobile tab layout)
- Modify: `src/app/globals.css` (RetroUI overrides for CopilotKit chat)
- Modify: all mode components (responsive breakpoints)

**Step 1: Make mode tabs responsive**

Mobile: horizontal scroll or bottom tab bar. Desktop: top tabs.

**Step 2: Style CopilotKit chat with Milwaukee theme**

Override CopilotKit's default CSS variables to match RetroUI + Milwaukee palette.

**Step 3: Add suggested questions**

Add clickable starter questions on the Ask mode page:
- "What is Milwaukee's total 2026 budget?"
- "Compare police and fire department spending"
- "How has the library budget changed over time?"
- "Where do my property tax dollars go?"

**Step 4: Commit**

```bash
git add .
git commit -m "feat: responsive design, Milwaukee theme polish, starter questions"
```

---

### Task 12: Deploy to Vercel

**Files:**
- Create: `vercel.json` (if needed)
- Create: `mastra.config.ts`

**Step 1: Configure Mastra build for production**

Create `mastra.config.ts`:
```typescript
export default {
  build: {
    external: ["@copilotkit/runtime"],
  },
};
```

**Step 2: Deploy to Vercel**

```bash
vercel
```

Set environment variables in Vercel dashboard:
- AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
- CONVEX_URL
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY
- NEXT_PUBLIC_MASTRA_URL (production Mastra URL)

**Step 3: Verify production deployment**

Test all 4 modes on the deployed URL.

**Step 4: Final commit + tag**

```bash
git add .
git commit -m "feat: production deployment configuration"
git tag v1.0.0-hackathon
```

---

## Quick Reference

### Development Commands
```bash
# Terminal 1: Convex
npx convex dev

# Terminal 2: Mastra agents
cd src/mastra && npx mastra dev  # → http://localhost:4111

# Terminal 3: Next.js
npm run dev  # → http://localhost:3000
```

### Key File Paths
```
src/mastra/index.ts              # Mastra instance + CopilotKit registration
src/mastra/agents/query-router.ts # Entry point agent
src/mastra/agents/qa-agent.ts     # Simple Q&A
src/mastra/agents/analyst-agent.ts # Complex analysis
src/mastra/tools/query-budget-data.ts # Convex queries
src/mastra/tools/render-budget-chart.ts # Generative UI trigger
src/app/providers.tsx             # CopilotKit provider
src/components/modes/ask-mode.tsx  # Ask mode + chart action
src/components/budget-chart.tsx    # Recharts component
convex/schema.ts                  # Database schema
convex/budget.ts                  # Query functions
```

### Nova Model IDs
```
Nova 2 Lite:  us.amazon.nova-lite-v2:0
Nova 2 Pro:   us.amazon.nova-pro-v2:0
Nova 2 Sonic: us.amazon.nova-sonic-v2:0
Nova 2 Omni:  us.amazon.nova-omni-v2:0
```
