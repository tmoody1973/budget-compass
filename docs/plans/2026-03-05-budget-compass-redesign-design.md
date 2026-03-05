# MKE Budget Compass: Comprehensive Redesign

> **Where do your tax dollars go?**
> The first AI-powered civic tool that shows every Milwaukee homeowner exactly how their property tax bill breaks down across all five taxing jurisdictions — with interactive visualizations, a budget simulator, and multilingual voice conversations powered by Amazon Nova.

**Date:** March 5, 2026
**Author:** Tarik Moody
**Hackathon:** Amazon Nova AI Hackathon (Deadline: March 16, 2026)
**Live:** [budget-compass.vercel.app](https://budget-compass.vercel.app)
**GitHub:** [github.com/tmoody1973/budget-compass](https://github.com/tmoody1973/budget-compass)

---

## Table of Contents

1. [Vision & Problem Statement](#vision--problem-statement)
2. [Target Users & Personas](#target-users--personas)
3. [App Architecture](#app-architecture)
4. [Tab 1: My Tax Receipt](#tab-1-my-tax-receipt)
5. [Tab 2: Explore Budgets](#tab-2-explore-budgets)
6. [Tab 3: Budget Simulator](#tab-3-budget-simulator)
7. [Tab 4: Ask (AI Chat)](#tab-4-ask-ai-chat)
8. [Nova Sonic Voice Integration](#nova-sonic-voice-integration)
9. [Multilingual Support](#multilingual-support)
10. [Data Architecture & Methodology](#data-architecture--methodology)
11. [Data Accuracy & Transparency](#data-accuracy--transparency)
12. [Tech Stack](#tech-stack)
13. [Nova Model Strategy](#nova-model-strategy)
14. [Design System](#design-system)
15. [What Makes This a Hackathon Winner](#what-makes-this-a-hackathon-winner)
16. [Build Priority & Timeline](#build-priority--timeline)
17. [Future Vision](#future-vision)

---

## Vision & Problem Statement

Milwaukee homeowners receive a property tax bill every December. It's a single number — around $3,800 for a median-value home. Most people pay it and move on. They don't know that five separate governments take a share, that MPS takes 43 cents of every dollar, or that $1.23 of their daily tax payment funds the police department.

**The problem:** Government budgets are public documents, but they're 200-400 page PDFs written for accountants. Milwaukee's combined annual spending across City ($1.4B), MPS ($1.5B), and County ($1.8B) totals nearly $5 billion — and no tool exists that connects these budgets to what an individual homeowner actually pays.

**The solution:** MKE Budget Compass transforms dense budget documents into a personalized, interactive experience. Enter your address. See your tax bill broken down to the penny. Explore where every dollar goes with animated treemaps. Simulate what happens if you were the Mayor and had to balance the budget. Ask questions in English or Spanish — by text or voice — and get answers grounded in verified data, never AI hallucination.

**The innovation:** This isn't a chatbot that summarizes PDFs. The AI layer (Amazon Nova) enhances a rich visual experience — explaining numbers you're looking at, narrating your exploration like a museum audio guide, and modeling consequences of budget changes in real time.

---

## Target Users & Personas

### Primary: Milwaukee Homeowners (~160,000 properties)
The person who opens their tax bill in December and wonders, "Where does this money go?" They want clarity, not complexity. They want to know what they're paying for, whether it's a good deal, and what would happen if things changed.

### Three Persona Modes

| Persona | Default Tab | AI Tone | Special Features |
|---------|------------|---------|------------------|
| **Resident** | My Tax Receipt | Plain language, personal impact | MPROP address lookup, "What this means for you" framing, daily/monthly cost breakdowns |
| **Student** | Explore Budgets | Educational, Socratic questioning | Glossary tooltips, "Did you know?" facts, quiz-style follow-ups, civics lesson framing |
| **Journalist** | Explore Budgets | Data-heavy, citations, story angles | Year-over-year comparisons, export data, source attribution, investigative prompts |

### Why Personas Matter
The same budget fact — "Police spending is $310M" — means different things to different people:
- **Resident:** "That costs you $1.23 per day. It covers patrol, investigations, and 911 dispatch for your neighborhood."
- **Student:** "The Police Department is the city's single largest expense at 38% of General City Purposes. Why do you think cities prioritize public safety spending?"
- **Journalist:** "Police spending is $310M, up 2.3% YoY. Authorized positions are 1,637, down from 1,800 in 2020. The per-officer cost including benefits is approximately $190K."

---

## App Architecture

### Navigation: Tab-Based with Landing State

**First Visit (Landing State):**
When a user first arrives, they see a hero card — not the full app. This creates a guided entry point:

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│           🏛️ MKE Budget Compass                      │
│                                                      │
│      Where do your tax dollars go?                   │
│                                                      │
│   ┌──────────────────────────────────────────┐       │
│   │  🔍 Enter your Milwaukee address...       │       │
│   └──────────────────────────────────────────┘       │
│                                                      │
│   Or choose a home value:                            │
│   [$100K] [$166K median] [$200K] [$250K] [$350K]     │
│                                                      │
│   I am a:  [Resident]  [Student]  [Journalist]       │
│                                                      │
│              [ Show Me → ]                           │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**After Entry (Full App):**
The app transitions to a 4-tab layout. Everything is personalized to the entered value.

```
┌─────────────────────────────────────────────────────┐
│  MKE Budget Compass    [Resident ▾] [EN|ES] [🔊] [👤]│
├──────────┬──────────┬──────────┬────────────────────┤
│ 💰 My    │ 🗺️ Explore│ 🎛️ Sim-  │ 💬 Ask            │
│ Receipt  │ Budgets  │  ulate   │                    │
├──────────┴──────────┴──────────┴────────────────────┤
│                                                      │
│              [Active Tab Content]                     │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ 📋 Source: 2026 Adopted Budget rates.         │   │
│  │    Department data from Proposed Budget.      │   │
│  │    See Data Methodology →                     │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

### Shared State (React Context)

All tabs share a single `BudgetContext`:
- `assessedValue` — from MPROP API or manual entry
- `address` — street address (if entered via MPROP)
- `persona` — resident / student / journalist
- `language` — en / es
- `propertyDetails` — aldermanic district, police district, fire station (from MPROP)
- `taxRates` — loaded from verified `tax-rates-2026.json`

---

## Tab 1: My Tax Receipt

The emotional centerpiece of the app. Converts the existing tax receipt React component (built with Claude, 492 lines) into a Tailwind/ECharts-powered interactive breakdown.

### MPROP Integration
- User enters a Milwaukee address
- App queries MPROP CKAN API (`data.milwaukee.gov`, resource `0a2c7f31-cd15-4151-8222-09dd57d5f16d`)
- Returns: assessed value (`C_A_TOTAL`), aldermanic district (`GEO_ALDER`), police district (`GEO_POLICE`), fire station (`GEO_FIRE`)
- Displays: "123 N Water St — Assessed at $185,000 — District 4 — Police District 1"

### Tax Breakdown Structure

**Top Section:** Total annual tax, monthly/weekly/daily equivalents
**Stacked Bar:** All 5 jurisdictions sized by share, animated on load
**Jurisdiction Cards:** Expandable cards with drill-down

| Jurisdiction | Share | Level 1 | Level 2 | Level 3 |
|-------------|-------|---------|---------|---------|
| MPS (~43%) | ~$9.46/1K | Total your share | By office (Schools, Operations, Academics) | Expenditure types |
| City (~34%) | $7.64/1K | Total your share | By service group (Safety, Infrastructure, Community, Govt) | Individual departments |
| County (~14%) | ~$3.21/1K | Total your share | By function (Public Safety, Courts, Parks, Health) | Departments |
| MMSD (~5%) | ~$1.15/1K | Total your share | Summary description | — |
| MATC (~4%) | ~$0.91/1K | Total your share | Summary description | — |

### AI Enhancement
Each jurisdiction card has an "Ask Nova" button. Tapping sends a contextual prompt:
> "Explain why MPS takes 43% of property tax on a $166,000 home in Milwaukee. Include the 2024 referendum context."

Response appears in a slide-up panel without leaving the tab.

### Nova Sonic on This Tab
Press 🔊 → personalized 60-second audio briefing:
> "Here's your tax breakdown. On your $166,000 home, you pay about $3,771 total per year. The biggest chunk — $1,570 — goes to Milwaukee Public Schools, which funds 66,000 students across 130 schools..."

---

## Tab 2: Explore Budgets

Visual Town Budget-inspired treemap exploration with ECharts drill-down animations.

### Primary View: Treemap

```
┌──────────────────────────────────────────────────┐
│ Where Your $3,771 Goes                   [2026 ▾]│
├──────────────────────────────────────────────────┤
│ ┌─────────────────────┬──────────────────┐       │
│ │                     │                  │       │
│ │   MPS               │   City           │       │
│ │   $1,570 (43%)      │   $1,282 (34%)   │       │
│ │                     │                  │       │
│ ├──────────┬──────────┼──────────────────┤       │
│ │ County   │ MMSD     │ MATC             │       │
│ │ $539     │ $193     │ $153             │       │
│ │ (14%)    │ (5%)     │ (4%)             │       │
│ └──────────┴──────────┴──────────────────┘       │
└──────────────────────────────────────────────────┘
```

**Drill-Down Interaction:**
1. Click "City" → treemap animates to show City departments (Police $310M, Fire $165M, DPW $165M, Library $33M...)
2. Click "Police" → shows expenditure breakdown (Salaries, Benefits, Operations...)
3. Breadcrumb: `All → City → Public Safety → Police Department`
4. Click breadcrumb to zoom back out

**Compare Toggle:**
Switch from treemap to side-by-side bar charts:
- 2025 vs 2026 for any jurisdiction
- MPS 5-year forecast (FY25-FY30) showing the projected $144M structural deficit
- City historical comparison data (4 years in Convex)

### AI Enhancement
Click any treemap node → "Tell me about this" tooltip:
- City departments: pulls narrative from Convex `departmentNarratives` table
- MPS/County: agent summarizes from seed data
- Persona-aware responses

### Nova Sonic on This Tab
Voice-guided tour — like a museum audio guide:
> "You're exploring the City of Milwaukee budget. The biggest department is Police at $310 million — that's 38% of general city spending. Tap any section to learn more, or ask me a question."

---

## Tab 3: Budget Simulator

Inspired by [A Balancing Act](https://us.abalancingact.com/federal-budget-simulator). The hook: "You're the Mayor. Balance Milwaukee's budget."

### Layout

```
┌──────────────────────────────────────────────────────┐
│ Budget Simulator                        [Reset] [📋] │
├──────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────┐ │
│ │  YOUR TAX IMPACT        CITY BUDGET BALANCE      │ │
│ │  $1,282/yr (+$0)        $810.7M  ✅ Balanced     │ │
│ │  $106.83/mo             Surplus: $0              │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ── Public Safety ($508M) ───────────────────────── │
│ 🛡️ Police      [$310M ████████████████░░░] +/- $0   │
│ 🚒 Fire        [$165M █████████░░░░░░░░░░] +/- $0   │
│ 📞 911         [$27M  ██░░░░░░░░░░░░░░░░░] +/- $0   │
│                                                      │
│ ── Infrastructure ($165M) ────────────────────────  │
│ 🏗️ DPW Ops     [$108M ██████░░░░░░░░░░░░░] +/- $0   │
│ 🛣️ DPW Infra   [$53M  ███░░░░░░░░░░░░░░░░] +/- $0   │
│                                                      │
│ ── Community Services ($90M) ─────────────────────  │
│ 📚 Library     [$33M  ██░░░░░░░░░░░░░░░░░] +/- $0   │
│ 🏘️ Neighborhood[$26M  █░░░░░░░░░░░░░░░░░░] +/- $0   │
│ 🏥 Health      [$23M  █░░░░░░░░░░░░░░░░░░] +/- $0   │
│                                                      │
│ ── Locked (mandatory) ────────────────────────────  │
│ 🔒 Debt Service    $106.7M  (contractual)            │
│ 🔒 Retirement      $76.8M   (contractual)            │
│                                                      │
│ [💬 What happens if I do this?]  [🔊 Hear impact]   │
└──────────────────────────────────────────────────────┘
```

### Mechanics
- Each slider adjusts a department's GCP budget allocation
- Top bar updates in real-time: personal tax impact AND city surplus/deficit
- Locked items (debt service, retirement) cannot be changed — contractual obligations
- Color coding: green = balanced, yellow = close, red = deficit
- Minimum constraints on public safety departments

### AI Consequence Engine
Press "What happens if I do this?" → Nova analyzes your slider state:
> "You've increased police funding by $15M and cut libraries by $10M. This would raise your monthly tax bill by $2.40. The library cuts would affect approximately 450,000 annual visits. The neighborhoods most affected would be those served by smaller branches like Villard Square and Center Street."

### Nova Sonic on This Tab
> "You've made some interesting choices. Your budget increases police funding and reduces library spending. Let me walk you through the real-world impacts..."

### Scope
Hackathon: City departments only (deepest data). MPS and County simulator would require different constraint modeling and are Phase 2.

---

## Tab 4: Ask (AI Chat)

Enhanced version of the existing streaming chat interface.

### Context-Aware Chat
The agent knows:
- Your assessed value and address
- Your persona (resident/student/journalist)
- Which tab you were just viewing
- Your language preference

### Persona-Specific Starter Questions

**Resident:**
- "Where do my property tax dollars go?"
- "Why did my taxes go up this year?"
- "What services does my neighborhood get?"

**Student:**
- "How does Milwaukee's budget compare to other cities?"
- "What is a mill rate and how does it work?"
- "Why is the MPS budget facing a deficit?"

**Journalist:**
- "Which departments had the biggest year-over-year changes?"
- "Show me the MPS 5-year deficit projection"
- "Compare police spending to national averages"

### Inline Charts
Agent can generate ECharts visualizations inline in chat responses using the existing ````chart` block syntax.

---

## Nova Sonic Voice Integration

Three distinct voice modes demonstrate deep Nova integration:

### Mode 1: Audio Briefing (Tax Receipt Tab)
**Trigger:** Press 🔊 on the receipt tab
**Experience:** Pre-generated 60-second personalized summary
**Model:** Nova Sonic text-to-speech
**Example:**
> "Here's your 2026 Milwaukee property tax breakdown. On your home assessed at $166,000, your total annual tax bill is approximately $3,771. Let me walk you through where every dollar goes. The largest share — $1,570 or 43 percent — goes to Milwaukee Public Schools..."

### Mode 2: Voice-Guided Tour (Explore Tab)
**Trigger:** Press 🔊 while exploring treemaps
**Experience:** Narrates what you're looking at as you navigate
**Model:** Nova Sonic streaming text-to-speech
**Example:**
> "You're looking at the City of Milwaukee's budget. The biggest slice is public safety at $508 million. Tap into it to see the breakdown between police, fire, and 911 dispatch."

### Mode 3: Live Conversation (Ask Tab + Global)
**Trigger:** Press 🎙️ microphone button
**Experience:** Real-time speech-to-speech conversation
**Model:** Nova Sonic bidirectional
**Flow:**
1. Browser captures audio via Web Audio API
2. Audio streams to `/api/voice` endpoint
3. Nova Sonic processes speech → text
4. Text routes to budget agent → verified answer from Convex
5. Answer streams back through Nova Sonic text → speech
6. User hears response while seeing it typed in chat

### Why This Impresses Judges
- Nova Sonic is Amazon's newest model — few teams will use it
- Three distinct modes shows deep integration, not a gimmick
- The voice-guided tour is genuinely novel (museum audio guide for civic data)
- Accessibility: visually impaired residents can use the full app via voice
- Multilingual: same voice features work in Spanish

---

## Multilingual Support

### Why This Matters for Milwaukee
- Milwaukee is approximately 20% Hispanic/Latino
- MPS is adding 10 ESL teachers in the 2026 budget
- Many property-owning families are bilingual
- No other civic budget tool offers this

### Implementation

| Feature | Approach |
|---------|----------|
| Language toggle | `EN \| ES` in header next to persona selector |
| Voice (Nova Sonic) | Native Spanish support — set `language: "es"` |
| Chat responses | Nova 2 Lite supports Spanish — system prompt instruction |
| UI labels | i18n for tab names, buttons, headings (English + Spanish) |
| Budget line items | Stay in English (official names) with Spanish explanations |
| Code-switching | Nova Sonic supports mixing languages in same sentence |

### Hackathon Scope
Voice + chat responses in Spanish. UI labels in English with Spanish as Phase 2. This alone is a powerful equity story.

---

## Data Architecture & Methodology

### The Seed Data Approach

Every number in Budget Compass comes from a **database lookup, not an AI guess.** This is the core design principle.

**How it works:**
1. We read budget PDFs and official sources
2. We extract key numbers into structured JSON seed files
3. We load those exact numbers into Convex (our database)
4. When a user asks a question, the AI agent queries the database
5. The agent can only cite what the database returns

**Why not RAG (Retrieval Augmented Generation)?**
RAG works by searching document chunks and having AI interpret them. It's great for narrative context but risky for numbers — an AI might misread "$310M" as "$31M" from a poorly parsed table. For a civic accuracy tool, that's unacceptable. We use seed data for numbers and reserve RAG (via Convex full-text search) for narrative explanations only.

### Data Sources

| Source | Type | What We Extract |
|--------|------|-----------------|
| City of Milwaukee 2026 Proposed Executive Budget (208 pages) | PDF | Department budgets, services, performance measures, positions, narratives |
| City of Milwaukee 2026 Adopted Budget amendments | News sources | Corrected tax rate ($7.64), final levy amounts |
| MPS 2025-26 Proposed Budget Summary (45 pages) | PDF | Fund groups, office budgets, expenditure types, enrollment, 5-year forecast |
| MPS 2025-26 Budget Line Item Detail | Excel | Granular school-level data (Phase 2) |
| Milwaukee County 2026 Adopted Operating Budget (437 pages) | PDF | Department budgets by functional area, tax levy, positions |
| MPROP (Milwaukee Property Records) | API | Assessed values, geographic districts (~160K properties) |
| City Comptroller's Office, Journal Sentinel, Urban Milwaukee | Published rates | Verified mill rates for all 5 jurisdictions |

### Convex Database Schema

**Existing (City Budget — 10 tables, 785 rows):**
- `cityOverview` — Total budget, tax levy, rates
- `budgetSections` — 12 major budget sections (A through N)
- `appropriationDetails` — Line-item appropriations
- `departmentBudgets` — Expenditure/revenue/personnel by department
- `departmentMeta` — Mission statements, totals
- `departmentServices` — Individual services per department
- `performanceMeasures` — 3-year performance metrics
- `positions` — Authorized headcount by department
- `historicalComparison` — 4-year trend data
- `departmentNarratives` — Full text with search index (RAG)

**New (MPS Budget):**
- `mpsOverview` — $1.549B total, 66,000 students, 9,500+ staff
- `mpsFundGroups` — School Operations $1.213B, Grants $175.7M, Nutrition $62.7M, MKE Rec $39.4M, Debt $27.8M, Capital Trust $27.8M, Construction $2.7M
- `mpsOffices` — 16 offices with budgets, FTEs, year-over-year changes
- `mpsExpenditures` — Salaries $626.9M, Benefits $355.9M, Purchased Services $376.6M, Supplies $87M, Equipment $10M, Other $63.1M
- `mpsPositions` — 22 position types (Teachers 4,511, Ed Assistants 1,319, Principals 125, etc.)
- `mpsEnrollment` — FY20-FY26 enrollment by school type
- `mpsForecast` — 5-year pro-forma revenue/expenditure/deficit projections

**New (County Budget):**
- `countyOverview` — Total budget, tax levy, positions
- `countyDepartments` — Departments by functional area (Legislative, Admin, Courts, Public Safety, Transportation, Health, Parks, Debt)
- `countyExpenditures` — By expenditure type

**New (Tax Rates):**
- `taxRates` — All 5 jurisdictions with verified rates, sources, and effective dates

### Agent Tools (Mastra)

| Tool | Purpose | Data Source |
|------|---------|-------------|
| `queryBudgetData` | City budget queries | Existing Convex tables |
| `queryMPSData` | MPS budget queries | New MPS Convex tables |
| `queryCountyData` | County budget queries | New County Convex tables |
| `getTaxBreakdown` | Personalized tax calculation | `tax-rates-2026.json` + assessed value |
| `searchNarratives` | Department narrative lookup | `departmentNarratives` full-text search |

---

## Data Accuracy & Transparency

### The Proposed vs. Adopted Problem

The City of Milwaukee budget data comes from the **2026 Proposed Executive Budget** (Mayor's proposal, May 2025). The Common Council adopted an amended version in November 2025 with different final numbers. Key differences:

| Item | Proposed Budget (our data) | Adopted (actual) |
|------|---------------------------|-------------------|
| City tax rate | $7.52/1K | $7.64/1K |
| Total city levy | ~$333.9M | ~$347M (3.9% increase) |

### Our Approach: Fix Key Rates, Badge Everything

1. **Tax rate:** Updated to $7.64/1K (adopted) — this is what residents actually pay
2. **Department data:** Kept from proposed budget — directionally accurate, most line items don't change dramatically
3. **Transparency badge:** Every page displays data provenance

```
📋 Data Source: Tax rates from 2026 Adopted Budget (Nov 2025).
   Department detail from 2026 Proposed Executive Budget (May 2025).
   See Data Methodology for full source list.
```

### Why Transparency Is a Feature

For a civic tool, being honest about data sources is more important than being perfectly complete. We show:
- Where each number comes from
- When it was last verified
- What the known limitations are
- Links to original source documents

This demonstrates **Responsible AI** — a key hackathon judging criterion.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 15, React 19, TypeScript | App framework |
| Styling | Tailwind CSS | Neobrutalist design system |
| Charts | **Apache ECharts** (via `echarts-for-react`) | Treemaps, bar charts, animations, drill-down |
| Database | Convex | Reactive data, full-text search, seed data |
| AI Agents | Mastra (TypeScript) | Agent orchestration, tool execution |
| LLM (Text) | Amazon Nova 2 Lite (`us.amazon.nova-2-lite-v1:0`) | Chat Q&A, consequence analysis |
| LLM (Voice) | Amazon Nova Sonic | Speech-to-speech, audio briefings, voice tour |
| LLM (Complex) | Amazon Nova Pro (`us.amazon.nova-pro-v1:0`) | Multi-department analysis (if needed) |
| Auth | Clerk | User authentication |
| Property API | MPROP CKAN API (`data.milwaukee.gov`) | Address → assessed value lookup |
| Deployment | Vercel (frontend + API routes) | Hosting |

---

## Nova Model Strategy

### Why Multiple Nova Models

Amazon Nova offers specialized models for different tasks. Using the right model for each feature maximizes quality while minimizing cost and latency:

| Feature | Model | Why This Model |
|---------|-------|---------------|
| Chat Q&A | Nova 2 Lite | Fast responses for factual budget lookups. Low latency keeps conversation flowing. |
| Simulator consequences | Nova 2 Lite | Must respond quickly as users drag sliders. |
| Complex multi-department analysis | Nova Pro | Deeper reasoning for comparative analysis, trend interpretation. |
| Audio briefings | Nova Sonic | Purpose-built for natural speech synthesis. |
| Voice tour narration | Nova Sonic | Streaming TTS for real-time narration. |
| Live voice conversation | Nova Sonic | Bidirectional speech-to-speech for hands-free interaction. |

### How Nova Sonic Works in the App

```
User speaks → Browser Web Audio API captures audio
  → Stream to /api/voice endpoint
    → Nova Sonic: speech → text
      → Budget Agent: text → verified answer (from Convex)
        → Nova Sonic: text → speech
          → Stream audio back to browser
            → User hears personalized answer
```

### Hackathon Differentiation
- **Nova 2 Lite:** Most teams will use this for basic chat. We use it for contextual, persona-aware responses grounded in verified data.
- **Nova Pro:** Reserved for the "wow" moments — deep analysis that shows the model's reasoning capabilities.
- **Nova Sonic:** Few teams will implement speech-to-speech. We demonstrate three distinct voice modes (briefing, tour, conversation) plus Spanish support.

---

## Design System

### Civic Modernism (Neobrutalist Milwaukee)

The visual identity draws from Milwaukee's physical landscape:

| Element | Value | Inspiration |
|---------|-------|-------------|
| Primary Blue | `#0A3161` | Lake Michigan |
| Cream | `#F5E6D3` | Cream City brick |
| Green | `#2E8B57` | Milwaukee parks |
| Red | `#C41E3A` | Milwaukee flag |
| Dark | `#1A1A2E` | Industrial heritage |

### Component Style
- Bold 2px borders with offset drop shadows (`shadow-[3px_3px_0px_0px_#1A1A2E]`)
- Rounded corners (8-12px)
- High contrast text
- Animated transitions on interaction
- ECharts themed to match palette

### Typography
- Headings: Bold, slightly compressed (font-head)
- Body: System UI stack
- Data: Tabular/monospace for numbers

---

## What Makes This a Hackathon Winner

### 1. Personal
Not abstract government numbers. YOUR address, YOUR tax bill, YOUR neighborhood. The MPROP integration makes it immediately real.

### 2. Complete
First tool to show all 5 taxing jurisdictions together. City + MPS + County + MMSD + MATC. No other tool does this.

### 3. Interactive
The simulator creates emotional investment. When you have to cut libraries to fund police, you feel the tradeoff. That's civic engagement.

### 4. AI-Native (Not AI-Only)
Nova doesn't just chat — it explains every number you touch, narrates your exploration, models consequences, and speaks in your language. The AI enhances a visual experience rather than replacing it.

### 5. Multilingual
Spanish support via Nova Sonic. In a city that's 20% Hispanic, this is an equity imperative, not a nice-to-have.

### 6. Trustworthy
Every number comes from a database query. Data sources are cited. Limitations are disclosed. This is what Responsible AI looks like in practice.

### 7. Visually Stunning
ECharts treemap drill-downs with smooth animations. Neobrutalist Milwaukee design system. Not another generic dashboard.

### 8. Model for All Cities
The architecture generalizes. Any city with open budget data could deploy this. The data extraction methodology is documented and reproducible.

---

## Build Priority & Timeline

### Phase 1: Foundation (Days 1-3)
1. Research and verify all 5 mill rates from published sources
2. Create `data/tax-rates-2026.json` single source of truth
3. Extract and seed MPS summary data into Convex
4. Extract and seed County summary data into Convex
5. Convert tax receipt component to Tailwind + ECharts
6. Build landing state (address input + presets + persona selector)
7. Implement tab navigation with shared BudgetContext

### Phase 2: Core Features (Days 4-7)
8. MPROP API integration (address → assessed value)
9. Build Explore tab with ECharts treemap + drill-down
10. Build Budget Simulator with sliders + real-time tax impact
11. Enhance chat agent with MPS/County query tools
12. Add persona-aware system prompts

### Phase 3: Voice & Polish (Days 8-10)
13. Nova Sonic audio briefing (Tax Receipt tab)
14. Nova Sonic voice-guided tour (Explore tab)
15. Nova Sonic live conversation (Ask tab)
16. Spanish language support (voice + chat)
17. Data methodology page / transparency badges

### Phase 4: Ship (Day 11)
18. Write DATA_METHODOLOGY.md
19. Final data verification pass
20. Deploy to Vercel
21. Record demo video
22. Submit

---

## Future Vision

### Post-Hackathon Roadmap
- **Full MPS line-item data** from Excel spreadsheet (school-level breakdowns)
- **County department narratives** from full 437-page budget
- **MPS and County simulators** with jurisdiction-specific constraints
- **MMSD and MATC drill-downs** with detailed budget data
- **Full Spanish i18n** for all UI labels and content
- **Historical tax rate trends** (5-10 year property tax trajectory)
- **Neighborhood-level analysis** (combine MPROP district data with budget allocations)
- **School-level MPS explorer** (find your child's school, see its budget)
- **Push to other Wisconsin cities** (Madison, Green Bay, Kenosha)
- **Mobile app** with offline budget data and voice-first interface
- **Budget alert notifications** when new budgets are proposed or adopted

### The Bigger Mission
MKE Budget Compass proves that AI can make democracy more accessible. When every resident — regardless of language, education level, or technical skill — can understand and engage with their government's spending decisions, that's not just a hackathon project. That's civic infrastructure.

---

*Built by Tarik Moody for the Amazon Nova AI Hackathon, March 2026.*
*Powered by Amazon Nova (Lite, Pro, Sonic) + Mastra + Convex + Next.js.*
