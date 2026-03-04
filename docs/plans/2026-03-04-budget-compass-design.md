# Budget Compass Design Document

**Date:** 2026-03-04
**Deadline:** 2026-03-16 (Amazon Nova AI Hackathon)
**Author:** Tarik Moody

## Overview

MKE Budget Compass is an AI-powered civic intelligence platform that transforms Milwaukee's 208-page, $1.4 billion annual budget into an interactive, multi-modal experience. Four interaction modes (Ask, Hear, See, Remix) each powered by specialized Amazon Nova agents.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS |
| UI Components | RetroUI (neobrutalist) + Milwaukee color palette |
| Charts | Recharts |
| Agent Framework | Mastra (TypeScript-native) |
| LLM Provider | Amazon Bedrock — Nova 2 Lite, Pro, Sonic, Omni |
| Database | Convex (10 tables, indexed, full-text search) |
| Auth | Clerk (citizen, journalist, student, educator personas) |
| Protocol | CopilotKit + AG-UI (real-time streaming, Generative UI) |
| Deployment | Vercel |

## Architecture

```
Next.js 15 App
├── CopilotKit Provider (AG-UI protocol)
├── Clerk Auth
├── Mode UIs (Ask / Remix / See / Hear)
└── /api/copilotkit route
        │
        ▼ AG-UI Event Stream
    Mastra Server (registerCopilotKit)
    ├── Query Router (Nova 2 Lite) — classifies & delegates
    │   ├── Q&A Agent (Nova 2 Lite) — fast factual lookups
    │   ├── Analyst Agent (Nova 2 Pro) — complex analysis
    │   ├── Simulator Agent (Nova 2 Pro) — budget reallocation
    │   ├── Visual Agent (Nova 2 Omni) — infographic generation
    │   └── Voice Agent (Nova 2 Sonic) — spoken briefings
    └── Tools
        ├── queryBudgetData — typed Convex queries
        ├── searchNarratives — full-text search
        ├── renderBudgetChart — CopilotKit Generative UI
        ├── executeCode — calculations
        ├── generateInfographic — image generation
        └── generateVoiceBriefing — speech synthesis
            │
            ▼
        Convex Cloud DB
        10 tables + indexes + full-text search
```

Mastra runs inside the Next.js app via `registerCopilotKit()` on the API route. No separate server needed.

## Design System

RetroUI neobrutalist components with Milwaukee civic identity.

| Role | Color | Source |
|------|-------|--------|
| Primary | #0A3161 | Lake Michigan deep blue |
| Secondary | #D4A574 | Cream City brick |
| Accent | #2E8B57 | Milwaukee parks green |
| Background | #FDF6EC | Warm cream/parchment |
| Text | #1A1A2E | Near-black |
| Danger | #C41E3A | Budget cuts/warnings |

## Four Modes

### Ask Mode
Conversational Q&A with inline interactive charts.

- User types question → Query Router classifies → routes to Q&A or Analyst agent
- Agent calls `queryBudgetData` → verified numbers from Convex
- Agent calls `renderBudgetChart` → CopilotKit intercepts via `useCopilotAction` → renders Recharts component inline in chat
- Conversation memory for follow-ups

### Remix Mode
Interactive budget simulator with sliders and consequence modeling.

- Budget sections displayed as sliders (% allocation)
- Slider changes exposed to Simulator Agent via `useCopilotReadable`
- Agent models consequences, sends `STATE_DELTA` events back
- Bidirectional sync between sliders and agent via CopilotKit shared state

### See Mode
AI-generated infographic images from budget data.

- User requests visual summary
- Visual Agent (Nova Omni) queries data then generates infographic
- Images displayed inline, shareable for social media

### Hear Mode
Voice briefings about the budget.

- User selects topic → Voice Agent (Nova Sonic) generates spoken briefing
- Audio player inline with synchronized transcript
- Fallback to browser TTS if Nova Sonic unavailable

## UI Layout

```
┌──────────────────────────────────────────────┐
│  Header: Logo + Mode Tabs + Clerk Auth       │
│  [Ask]  [Remix]  [See]  [Hear]               │
├──────────────────────────────────────────────┤
│                                              │
│  ASK: Chat panel + Context sidebar           │
│  REMIX: Sliders panel + Consequence panel    │
│  SEE: Prompt input + Image gallery           │
│  HEAR: Topic selector + Audio player         │
│                                              │
└──────────────────────────────────────────────┘
```

## Data Layer

Pre-processed Milwaukee budget data already extracted into:
- `convex_seed_data.json` (208KB) — structured data for 9 tables
- `department_narratives.json` (554KB) — full-text narratives with search index

10 Convex tables: cityOverview, budgetSections, appropriationDetails, departmentBudgets, departmentMeta, departmentServices, performanceMeasures, positions, historicalComparison, departmentNarratives.

16 typed query functions provide all database access patterns.

## Agent Tools

| Tool | Purpose | Used By |
|------|---------|---------|
| queryBudgetData | Typed Convex queries (16 functions) | Q&A, Analyst, Simulator |
| searchNarratives | Full-text search on narratives | Q&A, Analyst |
| renderBudgetChart | CopilotKit Generative UI trigger | Q&A, Analyst, Simulator |
| executeCode | Percentage/comparison calculations | Analyst |
| generateInfographic | Nova Omni image generation | Visual |
| generateVoiceBriefing | Nova Sonic speech synthesis | Voice |

## Build Order (Vertical Slices)

| Phase | Mode | Days | Scope |
|-------|------|------|-------|
| 1 | Ask | 1-4 | Mastra setup, Convex data loading, Query Router, Q&A + Analyst agents, CopilotKit + Generative UI, chat interface |
| 2 | Remix | 5-7 | Simulator agent, slider UI, bidirectional state sync, consequence modeling |
| 3 | See | 8-9 | Visual agent, Nova Omni integration, image gallery |
| 4 | Hear | 10-11 | Voice agent, Nova Sonic integration, audio player |
| 5 | Polish | 12 | Clerk auth polish, responsive design, deploy to Vercel |

## Key Principles

- All numerical data from deterministic Convex queries, never LLM estimation
- CopilotKit Generative UI for inline chart rendering (the demo differentiator)
- Query Router as single entry point for all user interactions
- Vertical slice delivery: always have a working demo
