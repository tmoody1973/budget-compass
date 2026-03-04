# PROJECT BRIEF: MKE Budget Compass

**Date:** 2026-03-04 | **Mode:** Hackathon (Amazon Nova AI Hackathon, deadline March 16)

---

## 1. Who is this for?

Milwaukee residents, journalists, students, and educators who want to understand how the city's $1.4 billion annual budget affects their lives — but can't parse a 208-page PDF full of financial jargon and dense tables.

**Primary personas:**
- **Engaged Resident** — homeowner/renter who pays $7.52/$1K property tax, wants plain-language answers
- **Local Journalist** — needs fast, sourced analysis on deadline (Journal Sentinel, WUWM)
- **Student** — MPS civics or UWM poli-sci, encountering municipal budgets for the first time
- **Educator** — needs interactive classroom tools for teaching civic finance

## 2. What problem does it solve?

Municipal budgets determine how billions flow through communities — police response times, library hours, road quality — yet fewer than 1% of residents ever read them. The barriers: financial jargon, static PDF format, no interactive exploration, no way to model tradeoffs or prepare informed testimony. Budget Compass makes Milwaukee's budget conversational, audible, visual, and interactive.

## 3. What does "done" look like? (3 success criteria)

1. **A resident can ask a plain-language question and get an accurate, sourced answer with an inline chart** — within 3 seconds, using verified data from the Convex database (never LLM estimation).
2. **A student can move budget sliders and immediately see consequences** — the Remix simulator shows what happens when you reallocate funds between departments.
3. **A journalist can generate a shareable infographic or listen to a voice briefing** — See and Hear modes produce outputs ready for social media or commute listening.

## 4. PM Competencies Demonstrated

| Competency | Evidence |
|---|---|
| **Product Strategy** | Defined 4-mode interaction model (Ask/Hear/See/Remix) targeting distinct user needs and contexts. Scoped MVP with vertical-slice delivery to ensure always-working demo. |
| **Technical Fluency** | Selected Mastra over Bedrock Agents based on CopilotKit AG-UI protocol compatibility. Chose per-agent Nova model assignments based on latency/capability tradeoffs. Designed 10-table Convex schema with pre-processed data to guarantee numerical accuracy. |
| **Responsible AI** | Core principle: all numbers from deterministic database queries, never LLM estimation. Source attribution on every answer. Agents cite which Convex query produced each data point. Balanced consequence modeling in Remix mode (no advocacy for budget positions). |

## 5. Anchor Project

**Responsible AI + Civic Tech** — High-stakes domain (public budget decisions), transparency-first design, source attribution built into every response. Demonstrates that AI can make government data more accessible without introducing misinformation.

## 6. Hackathon Details

- **Competition:** Amazon Nova AI Hackathon
- **Deadline:** March 16, 2026 (12 days from start)
- **Categories:** Agentic AI | Voice AI | Multimodal Understanding
- **Stack:** Next.js 15, Mastra, Amazon Bedrock (Nova 2 Lite/Pro/Sonic/Omni), Convex, CopilotKit + AG-UI, Clerk, RetroUI

### 3 Explicit Scope Cuts (NOT building)

1. **NOT building multi-city support** — Milwaukee only. No jurisdiction selector, no generic budget schema.
2. **NOT building real-time budget updates** — data is pre-processed from the 2026 Proposed Budget PDF. No live data feeds.
3. **NOT building user-generated content** — no comments, annotations, or community features. Pure consumption + simulation.

## PM Guardrails (built into implementation)

- **Evaluation:** Thumbs up/down on agent responses + source attribution on every answer
- **Responsible AI:** "AI generated" labels, cited data sources, no hallucinated numbers
- **Metrics:** Log user questions, agent routing decisions, and tool calls for demo analysis
