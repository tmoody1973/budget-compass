# Data Methodology

> How MKE Budget Compass ensures every number is accurate, sourced, and verifiable.

---

## Core Principle

**Every number in Budget Compass comes from a database lookup, not an AI guess.**

When a user asks "How much is the police budget?", the AI agent queries a structured database and returns the exact number. The agent cannot estimate, round, or hallucinate budget figures. If the data isn't in the database, the agent says so.

---

## Data Sources

### Tax Rates (All 5 Jurisdictions)

| Jurisdiction | Rate (per $1,000) | Source | Date |
|-------------|-------------------|--------|------|
| Milwaukee Public Schools | $9.66 | City of Milwaukee Comptroller, 2025 Combined Property Tax Report | Dec 2025 |
| City of Milwaukee | $7.61 | City of Milwaukee Comptroller, 2025 Combined Property Tax Report | Dec 2025 |
| Milwaukee County | $3.15 | City of Milwaukee Comptroller, 2025 Combined Property Tax Report | Dec 2025 |
| MMSD | $1.24 | City of Milwaukee Comptroller, 2025 Combined Property Tax Report | Dec 2025 |
| MATC | $0.76 | City of Milwaukee Comptroller, 2025 Combined Property Tax Report | Dec 2025 |

### City of Milwaukee Budget

| Document | Pages | What We Extracted |
|----------|-------|-------------------|
| 2026 Proposed Executive Budget | 208 | Department budgets, services, performance measures, authorized positions, narratives |
| Common Council adopted amendments | — | Final tax rate ($7.64), levy adjustments |

**Source:** [City of Milwaukee Budget Office](https://city.milwaukee.gov/budget)

**Known limitation:** Department-level detail is from the Proposed Budget (May 2025). The Common Council adopted amendments in November 2025 that changed some allocations. The tax rate used for calculations reflects the adopted rate.

### Milwaukee Public Schools Budget

| Document | Format | What We Extracted |
|----------|--------|-------------------|
| 2025-26 Proposed Budget Summary | PDF (45 pages) | Total budget ($1.549B), fund groups, office budgets, expenditure classes, position types, enrollment trends, 5-year forecast |
| 2025-26 Budget Line Item Detail | Excel | Available for future granular analysis |
| 2025-26 Office Budget Supplement | PDF | Office-level detail |
| 2025-26 School Budget Supplement | PDF | School-level detail (Phase 2) |

**Source:** [Milwaukee Board of School Directors](https://milwaukeepublic.ic-board.com)

### Milwaukee County Budget

| Document | Format | What We Extracted |
|----------|--------|-------------------|
| 2026 Adopted Operating Budget | PDF (437 pages) | Department budgets by functional area, total tax levy, position counts |
| 2025 Adopted Capital Improvement Budget | PDF | Capital project overview |

**Source:** [Milwaukee County Budget Office](https://county.milwaukee.gov/EN/Administrative-Services/Budget)

### Property Data (MPROP)

| Source | API | Fields Used |
|--------|-----|-------------|
| Milwaukee Property Records (MPROP) | CKAN API at `data.milwaukee.gov` | Assessed value (`C_A_TOTAL`), aldermanic district (`GEO_ALDER`), police district (`GEO_POLICE`), fire district (`GEO_FIRE`) |

**Resource ID:** `0a2c7f31-cd15-4151-8222-09dd57d5f16d`
**Coverage:** ~160,000 Milwaukee properties

---

## How We Process Data

### Step 1: Extract from Source Documents

We read budget PDFs and extract key summary tables: totals, department budgets, fund groups, expenditure classes, position counts, and year-over-year changes. We prioritize summary-level data that powers the tax receipt, treemap, and simulator features.

### Step 2: Structure into JSON Seed Files

Extracted numbers are organized into typed JSON files with field names matching our database schema. Each record includes the source document and page number for traceability.

```
data/
├── tax-rates-2026.json      ← Verified mill rates with citations
├── city-seed.json           ← City department budgets (existing)
├── mps-seed.json            ← MPS office/fund budgets (new)
└── county-seed.json         ← County department budgets (new)
```

### Step 3: Load into Convex Database

A seed script loads the JSON files into Convex tables with type validation. Convex enforces schemas — if a number is missing or the wrong type, the insert fails. This prevents data corruption.

### Step 4: Agent Queries Database

When the AI agent (powered by Amazon Nova) needs a number, it calls a tool that executes a Convex query. The tool returns exact database records. The agent formats these into a human-readable response but cannot modify or estimate the underlying numbers.

```
User: "How much is the library budget?"
  → Agent calls queryBudgetData(department: "Library")
    → Convex returns: { budget: 33022606, revenue: 1150000, ... }
      → Agent responds: "The Library budget is $33M..."
```

### Step 5: Human Verification

Before deployment, a human reviews:
- Tax rates against published news sources
- Department totals against budget document tables
- Calculations (tax bill = assessed value / 1000 * rate) against known examples

---

## Dual Data Strategy: Seed Data + Bedrock Knowledge Bases

We use two data sources, each for what it does best:

### Seed Data (Convex) → Exact Numbers
Every dollar amount in Budget Compass comes from a deterministic database query against pre-verified seed data in Convex. When the AI agent needs a number, it calls a Convex tool — not RAG, not estimation. This eliminates hallucination risk for financial data.

**Why not RAG for numbers?**
- A poorly parsed table might show "$310M" as "$31M"
- The AI might average two different years' numbers
- Confidence scores don't tell you if a specific dollar amount is correct

### Amazon Bedrock Knowledge Bases → Narrative Context
For "why" questions, policy analysis, and department descriptions, we use **Amazon Bedrock Knowledge Bases** — AWS's managed RAG service. Budget documents and independent policy analysis from the Wisconsin Policy Forum are stored in S3, chunked, embedded with Amazon Titan Embeddings, and indexed in OpenSearch Serverless. The agent retrieves relevant passages with source attribution.

**What's in the Knowledge Base:**
- Department narratives and service descriptions from the city budget
- Wisconsin Policy Forum independent analysis (city, county, MPS)
- Budget context that helps explain the numbers

**The agent knows which tool to use:**
- "How much is the police budget?" → Convex (exact number: $310M)
- "Why is the police budget so large?" → Bedrock KB (contextual explanation with sources)
- "How does MPS spending compare?" → Both tools (numbers from Convex, analysis from KB)

---

## Known Limitations

1. **Proposed vs. Adopted:** City department data is from the Proposed Budget. Some allocations changed during Council adoption.
2. **Tax rate timing:** Mill rates are set each December. Our rates reflect the most recent published figures as of deployment.
3. **MPS summary level:** We extracted office-level totals, not school-by-school detail. The line-item Excel file enables future granular analysis.
4. **County summary level:** We extracted functional-area totals from the 437-page budget, not every department narrative.
5. **MMSD and MATC:** Summary information only. These jurisdictions represent 5% and 4% of the tax bill respectively.

---

## How to Verify Our Numbers

Every number in the app can be traced back to a specific document:

1. **Tax rates** → City Comptroller press releases, Journal Sentinel reporting
2. **City departments** → 2026 Proposed Executive Budget, Section A (General City Purposes)
3. **MPS totals** → 2025-26 Proposed Budget Summary, Executive Summary (page 2)
4. **County totals** → 2026 Adopted Operating Budget, Budget Summary section
5. **Property values** → MPROP API (same data source as the City Assessor's office)

If you find a discrepancy, please report it. Civic data accuracy is a community effort.

---

*Last updated: March 2026*
*MKE Budget Compass — Built for the Amazon Nova AI Hackathon*
