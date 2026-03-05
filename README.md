# MKE Budget Compass

AI-powered civic intelligence platform for Milwaukee's $1.4 billion annual budget.

**Amazon Nova AI Hackathon Submission** | Categories: Agentic AI, Voice AI, Multimodal Understanding

## What It Does

Budget Compass transforms Milwaukee's 208-page budget document into four interactive modes:

- **Ask** -- Conversational Q&A with inline interactive charts
- **Remix** -- Interactive budget simulator with consequence modeling
- **See** -- AI-generated infographics and visualizations
- **Hear** -- Audio briefings for on-the-go listening

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, RetroUI, Recharts
- **Agents:** Mastra framework with Amazon Nova models (Lite, Pro, Sonic, Omni)
- **Database:** Convex (10 tables of pre-processed budget data)
- **Protocol:** CopilotKit + AG-UI for real-time streaming and Generative UI
- **Auth:** Clerk

## Key Principle

All budget numbers come from deterministic database queries -- never LLM estimation.

## Development

Terminal 1: `npx convex dev`
Terminal 2: `npx mastra dev` (from src/mastra)
Terminal 3: `npm run dev`

## Environment Variables

See `.env.local.example` for required variables.
