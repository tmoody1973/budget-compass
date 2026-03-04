# Architecture Decision Records

---

## ADR-001: Use Mastra over Bedrock Agents for Agent Orchestration

**Date:** 2026-03-04 | **Status:** Accepted

### Context

Budget Compass needs a multi-agent orchestration framework that connects to CopilotKit's frontend via the AG-UI protocol. The key demo differentiator is Generative UI — inline interactive charts rendering within the chat stream. Two options exist: Mastra (TypeScript-native framework) or AWS Bedrock Agents (managed service).

### Options Considered

1. **Mastra + CopilotKit** — Native AG-UI support via one-line `registerCopilotKit()` helper. TypeScript-native with Zod schemas. Local dev playground on port 4111. Sub-agent routing pattern built in. Instant startup with `npx mastra dev`.

2. **Bedrock Agents** — Managed AWS service. No native AG-UI integration — would require 3+ days building a custom bridge with uncertain streaming behavior. Requires Lambda configuration, IAM setup, OpenSearch Serverless, and AWS console debugging.

### Decision

Use Mastra for all agent orchestration. CopilotKit's Generative UI is the demo's visual centerpiece, and Mastra is the only framework with native AG-UI support. Bedrock Knowledge Base can still be consumed as a data source tool if needed.

### Consequences

- **Enables:** One-line CopilotKit integration, local dev playground, fast iteration, TypeScript end-to-end
- **Limits:** Not using AWS managed agent infrastructure; Mastra is newer with smaller community
- **Revisit if:** CopilotKit adds native Bedrock Agents support, or Mastra stability issues arise

---

## ADR-002: Pre-processed Convex Data over RAG-only Approach

**Date:** 2026-03-04 | **Status:** Accepted

### Context

Agents need accurate budget data. Two approaches: (1) pre-extract and structure all data into typed Convex tables, or (2) rely on RAG vector search over raw PDF text.

### Options Considered

1. **Pre-processed structured data in Convex** — 10 typed tables with indexes, 16 query functions. Human-validated extraction from the 208-page PDF. Deterministic queries return exact numbers.

2. **RAG-only (vector embeddings over PDF)** — Simpler setup, but numbers retrieved from text chunks may be imprecise. LLM interprets and may hallucinate figures.

### Decision

Pre-processed Convex tables as the primary data source. Full-text search on department narratives as supplementary context (not for numbers). All dollar amounts, headcounts, and tax rates come from deterministic database queries.

### Consequences

- **Enables:** Guaranteed numerical accuracy, sub-second queries, typed responses
- **Limits:** Only covers data that was pre-extracted; new questions requiring data not in the schema need schema changes
- **Revisit if:** Need to support budgets from other cities or years without manual extraction

---

## ADR-003: RetroUI (Neobrutalist) over shadcn/ui

**Date:** 2026-03-04 | **Status:** Accepted

### Context

Need a React + Tailwind component library for the frontend. Judges evaluate many hackathon submissions — visual distinctiveness matters.

### Options Considered

1. **RetroUI** — Neobrutalist aesthetic with bold borders, drop shadows, playful energy. React + Tailwind native. Less conventional but highly memorable.

2. **shadcn/ui** — Industry-standard components. Clean, professional, but generic. Every other hackathon project uses it.

### Decision

RetroUI with Milwaukee civic color palette (Lake Michigan blues, Cream City brick, parks green). The neobrutalist style is bold and accessible — high contrast, clear hierarchy — and matches the "make budgets fun and accessible" mission.

### Consequences

- **Enables:** Visual distinctiveness, memorable demo, brand-aligned civic identity
- **Limits:** Smaller component library than shadcn; may need custom components for gaps
- **Revisit if:** RetroUI lacks a critical component and building custom takes too long

---

## ADR-004: Vertical Slice Delivery Order

**Date:** 2026-03-04 | **Status:** Accepted

### Context

Building all 4 modes (Ask, Remix, See, Hear) in 12 days. Need a delivery strategy that maximizes demo impact while minimizing risk.

### Options Considered

1. **Vertical slices (Ask → Remix → See → Hear)** — Each mode built end-to-end before moving to the next. Always have a working demo.
2. **Foundation first** — Build all infrastructure, then all UIs. No working demo until day 7+.
3. **Parallel tracks** — Frontend and backend simultaneously. High integration risk for solo developer.

### Decision

Vertical slices. Ask mode (days 1-4) is the foundation — if nothing else ships, conversational Q&A with inline charts is a strong standalone demo. Each subsequent mode adds wow factor. Priority: Ask > Remix > See > Hear.

### Consequences

- **Enables:** Always-working demo, de-risked delivery, natural testing progression
- **Limits:** Later modes get less development time
- **Revisit if:** Ask mode takes longer than 4 days — cut Hear mode first
