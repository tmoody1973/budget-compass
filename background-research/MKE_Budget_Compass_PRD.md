PRODUCT REQUIREMENTS DOCUMENT

**MKE Budget Compass**

AI-Powered Civic Intelligence Platform

Making Milwaukee's \$1.4 Billion Budget Accessible to Everyone

Amazon Nova AI Hackathon Submission

Category: Agentic AI \| Voice AI \| Multimodal Understanding

  ---------------------------------- ------------------------------------
  **Author**                         Tarik Moody

  **Version**                        1.0

  **Date**                           February 8, 2026

  **Deadline**                       March 16, 2026

  **Status**                         Draft
  ---------------------------------- ------------------------------------

Table of Contents

*\[Table of Contents will auto-generate when opened in Word\]*

1\. Executive Summary

MKE Budget Compass is an AI-powered civic intelligence platform that transforms the City of Milwaukee's 208-page, \$1.4 billion annual budget document into an interactive, multi-modal experience accessible to residents, journalists, students, and educators. Built on Amazon Nova's full model portfolio, Mastra's TypeScript agent framework, and CopilotKit's agentic UI framework, Budget Compass enables users to converse with, listen to, visualize, and simulate their city's budget through a team of specialized AI agents.

The platform addresses a fundamental civic transparency problem: municipal budgets are published as dense PDF documents that fewer than 1% of residents ever read, yet these documents determine how billions of dollars flow through communities. Budget Compass democratizes access by meeting users where they are --- through natural language conversation, voice briefings, AI-generated infographics, and an interactive budget simulator.

1.1 Problem Statement

The City of Milwaukee publishes its annual Plan and Executive Budget Summary as a 208-page PDF containing complex financial tables, department narratives, capital improvement plans, and debt analyses. This document determines the allocation of \$810.7 million in General City Purposes spending, \$261.1 million in Employees' Retirement funds, \$232.6 million in Capital Improvements, and \$111.3 million in City Debt service. Despite its profound impact on every resident's daily life --- from police response times to library hours to road quality --- the document remains effectively inaccessible to the public it serves.

Key barriers to accessibility include:

-   Financial jargon and accounting terminology that requires specialized knowledge to interpret (e.g., "Fringe Benefit Offset," "Special Purpose Accounts," "CMERS actuarial contributions")

-   Dense tabular data spanning dozens of pages with no interactive exploration capability

-   No mechanism to understand how budget decisions translate to neighborhood-level service delivery

-   No tools for citizens to compare spending priorities, model tradeoffs, or prepare informed testimony for Common Council hearings

-   Static format that cannot answer follow-up questions or provide personalized context

1.2 Solution Overview

Budget Compass provides four integrated modes of interaction, each powered by purpose-selected Amazon Nova models and connected through CopilotKit's AG-UI protocol for seamless agent-to-UI communication:

  ------------------ ------------------------------------------------------------------- ------------------------ --------------------------------
  **Mode**           **Description**                                                     **Primary Nova Model**   **Target User**

  Ask the Budget     Conversational Q&A with inline interactive chart generation         Nova 2 Lite + Pro        All audiences

  Hear the Budget    Real-time voice briefings with synchronized visualizations          Nova 2 Sonic             Commuters, accessibility needs

  See the Budget     AI-generated infographic images from budget data                    Nova 2 Omni              Journalists, social media

  Remix the Budget   Interactive budget allocation simulator with consequence modeling   Nova 2 Pro + Act         Students, educators, advocates
  ------------------ ------------------------------------------------------------------- ------------------------ --------------------------------

2\. Target Users & Personas

2.1 Primary Personas

Persona 1: The Engaged Resident

**Profile:** Milwaukee homeowner or renter who pays property taxes (\$7.52 per \$1,000 assessed value in 2026) and wants to understand where their money goes. May attend occasional Common Council meetings or aldermanic town halls.

**Key Needs:** Plain-language explanations of budget line items; ability to see how budget decisions affect their neighborhood; tools to prepare testimony for public hearings; shareable summaries for social media.

**How They Use Budget Compass:** Asks natural language questions ("How much does my district spend on road repair?"), listens to voice briefings during commutes, generates infographics to share with neighbors, uses Remix mode to explore "what if" scenarios before testifying at hearings.

Persona 2: The Local Journalist

**Profile:** Reporter covering city government for Milwaukee Journal Sentinel, Urban Milwaukee, WUWM, or community outlets. Needs to quickly find stories in the budget data and produce accurate, sourced analysis on deadline.

**Key Needs:** Anomaly detection (what changed dramatically?); year-over-year comparisons; department-level deep dives; exportable charts with source citations; ability to verify claims made by elected officials.

**How They Use Budget Compass:** Uses Ask mode with complex analytical queries ("Which departments had the largest gap between their budget request and the Mayor's proposed amount?"); generates publication-ready charts; uses the Investigative layer to build data-backed narratives.

Persona 3: The High School / College Student

**Profile:** Milwaukee Public Schools civics student or UWM/MSOE/Marquette political science student studying local government. May be encountering municipal budgets for the first time.

**Key Needs:** Beginner-friendly explanations with analogies; gamified interactions; guided exploration; discussion prompts; ability to complete class assignments.

**How They Use Budget Compass:** Uses Remix mode in classroom settings to allocate the budget and debate tradeoffs with classmates; listens to student-level voice briefings; generates visual reports for class presentations.

Persona 4: The Educator

**Profile:** Civics, economics, or social studies teacher looking for interactive tools to teach municipal finance and civic engagement.

**Key Needs:** Lesson plan integration; discussion question generation; rubric-aligned assessments; ability to set up classroom activities; exportable student work.

**How They Use Budget Compass:** Assigns Remix challenges to students; uses auto-generated Socratic discussion prompts; exports class results for grading; shares voice briefings as homework listening assignments.

3\. Feature Specifications

3.1 Mode 1: Ask the Budget --- Conversational Explorer

The primary interaction mode. Users type natural language questions and receive answers enriched with interactive, data-verified charts rendered inline through CopilotKit's Generative UI.

3.1.1 Core Capabilities

-   Natural language Q&A over the full 208-page budget PDF via RAG with Nova Multimodal Embeddings

-   Tiered model routing: Nova 2 Lite handles factual lookups (fast, cost-effective); Nova 2 Pro handles multi-step analytical queries requiring cross-table reasoning

-   Inline interactive chart generation via CopilotKit Generative UI --- agents dynamically render Recharts components (bar, line, pie, treemap) directly in the chat stream

-   Code execution for all calculations --- Nova writes and runs Python/JS to ensure numerical accuracy; no LLM mental math

-   Source citation with page references back to the original PDF

-   Human-in-the-loop disambiguation: when queries are ambiguous, the agent pauses and presents clarifying options before proceeding

3.1.2 Example Interactions

  ---------------------------------------------- ----------------------------------------------------------------------------------------------- ---------------------------------------------------------------------------
  **User Query**                                 **Agent Behavior**                                                                              **Output**

  \"How much does Milwaukee spend on police?\"   Nova 2 Lite RAG lookup → structured data query                                                  \"\$309.8M proposed for 2026\" + bar chart comparing to Fire, DPW, Health

  \"What changed most from last year?\"          Nova 2 Pro multi-step: extract all dept. YoY changes, rank, compute percentages                 Sorted table + bar chart of top 10 changes with % annotations

  \"Why did pension costs jump?\"                RAG retrieves narrative from pp. 11-16 explaining CMERS actuarial changes and Act 12 mandates   Prose explanation + line chart showing pension cost trajectory

  \"Compare police vs library per capita\"       Code execution: police_per_cap = 309.8M / 577,222; library_per_cap = 38.8M / 577,222            \"Police: \$537/resident. Library: \$67/resident\" + comparison visual
  ---------------------------------------------- ----------------------------------------------------------------------------------------------- ---------------------------------------------------------------------------

3.1.3 Technical Implementation

The Ask mode agent pipeline follows a strict Extract → Structure → Compute → Visualize architecture to ensure numerical reliability:

1.  User query enters through CopilotKit chat interface

2.  Query classifier (Nova 2 Lite) determines: (a) simple factual lookup, (b) complex analytical query, or (c) narrative/explanatory question

3.  For factual queries: agent calls queryBudgetData tool against the pre-processed structured database

4.  For analytical queries: Nova 2 Pro generates a Python computation plan, executes it via code execution, returns verified results

5.  For narrative queries: RAG retrieves relevant passages from the embedded PDF, Nova synthesizes an explanation

6.  Agent calls renderBudgetChart tool with structured data → CopilotKit Generative UI renders the interactive Recharts component inline

3.2 Mode 2: Hear the Budget --- Voice Briefings

A voice-first interaction mode powered by Nova 2 Sonic that delivers personalized, NPR-style audio briefings about the Milwaukee budget with real-time conversational follow-up.

3.2.1 Core Capabilities

-   Real-time speech-to-speech conversation via Nova 2 Sonic with 1M token context window --- the entire budget fits in context

-   Persona-adaptive briefing depth: Resident gets a 3-minute overview; Journalist gets a 10-minute deep dive with citations; Student gets analogies and simplified language

-   Interruptible narrative: users can ask follow-up questions mid-briefing and the agent seamlessly weaves the answer into the ongoing audio

-   Synchronized visual companion: CopilotKit shared state syncs the voice agent's position in the narrative with on-screen chart animations

-   Asynchronous background processing: while Sonic delivers the briefing, background agents can pre-compute charts and data for anticipated follow-ups

-   Multilingual support: Nova 2 Sonic supports multiple languages for Milwaukee's diverse population, including Spanish

3.2.2 Briefing Structure

Each briefing follows a structured narrative arc:

1.  Opening hook: "The City of Milwaukee is proposing to spend \$1.4 billion in 2026 --- here's what that means for you."

2.  Big picture: Total budget, tax rate change (\$8.29 → \$7.52), major themes (pension costs, ARPA wind-down, sales tax stabilization)

3.  Department spotlight: Highlights 3-4 departments with the most significant changes

4.  Your money: Personalizes based on user context ("For a home assessed at \$150,000, your annual city tax bill would be approximately \$1,128")

5.  Civic engagement prompt: "The Common Council will hold hearings on this budget in October. Here's how to participate."

3.3 Mode 3: See the Budget --- AI-Generated Infographics

The platform's most visually distinctive feature, leveraging Nova 2 Omni's industry-first ability to generate both text and images from multimodal input. Users describe what they want to understand, and the agent creates custom infographic images --- not templated charts, but designed visual explanations.

3.3.1 Core Capabilities

-   Natural language to infographic: user describes a concept ("Show me where my property taxes go") and Nova 2 Omni generates a designed visual explanation

-   Data-verified content: all numbers in generated infographics are computed via code execution before being passed to Omni, ensuring accuracy

-   Social media optimization: generated images are sized for Twitter/X (1200x675), Instagram (1080x1080), and LinkedIn (1200x627)

-   Shareable with attribution: each infographic includes a subtle "Data: City of Milwaukee 2026 Proposed Budget \| Generated by MKE Budget Compass" watermark

-   Batch generation: educators can generate a set of infographics for an entire lesson plan in a single request

3.3.2 Example Infographic Types

  ------------------------------- ----------------------------------------------------------------------------------------------------------------------------- ---------------------------------------
  **Request**                     **Generated Image Description**                                                                                               **Data Source**

  \"Where do my taxes go?\"       Illustrated house with labeled spending streams flowing to icons representing police, fire, roads, libraries, parks, health   Tax levy allocation table (p. 17)

  \"Police budget breakdown\"     Donut chart with sections for salaries, benefits, equipment, operations + key stat callouts                                   Police Dept. detail (pp. 114-117)

  \"Budget changes since 2023\"   Timeline infographic showing 4-year trend with milestone annotations (Act 12, ARPA, sales tax)                                Year-over-year comparison (pp. 17-20)

  \"How does MKE compare?\"       City comparison graphic with peer cities (Madison, Minneapolis, Detroit) on key metrics                                       Web-enriched data via Nova Act
  ------------------------------- ----------------------------------------------------------------------------------------------------------------------------- ---------------------------------------

3.4 Mode 4: Remix the Budget --- Allocation Simulator

An interactive budget allocation simulator where users receive the actual \$810.7 million General City Purposes budget and must reallocate it across departments. AI agents model the consequences of every decision in real-time.

3.4.1 Core Capabilities

-   Interactive sliders for each major department budget with real-time constraint enforcement (total must balance)

-   Consequence modeling via Nova 2 Pro: when users adjust allocations, the agent calculates and narrates downstream impacts using historical correlations and department service metrics

-   CopilotKit bi-directional shared state: slider movements instantly update agent context, and agent-computed consequences instantly update the UI

-   Nova Act web enrichment: agents browse Milwaukee's open data portal and Census data to provide real-world context for tradeoff decisions

-   Gamification: leaderboard, challenge modes ("Balance the budget with the lowest tax rate" / "Maximize equity"), and shareable results

-   Educator toolkit: auto-generated Socratic discussion prompts, rubric-aligned assessments, and exportable classroom reports

3.4.2 Consequence Modeling Examples

  --------------------------------------- ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **User Action**                         **Agent Response**

  Cut Police by \$15M (-5%)               \"That's approximately 120 fewer authorized positions. Based on 2023-2025 staffing-to-response data, average response times could increase by an estimated 45-90 seconds. The 2026 budget already reflects a decrease of 146 positions citywide.\"

  Increase Library by \$5M (+13%)         \"This could fund approximately 3 additional branch locations or restore extended hours across all 13 branches. Milwaukee's library system currently operates at \$67 per resident vs. the national median of \$42.\"

  Cut DPW Infrastructure by \$10M (-8%)   \"Based on the Capital Improvements plan (p. 167), this would reduce street reconstruction from 35 miles to approximately 27 miles annually. Milwaukee currently has a \$250M+ infrastructure backlog.\"
  --------------------------------------- ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

3.4.3 Classroom Integration

After a student submits their budget allocation, the agent generates:

-   A summary report comparing their allocation to the Mayor's proposed budget

-   Three Socratic discussion questions tailored to their specific choices (e.g., "You prioritized infrastructure over public safety --- what evidence supports this tradeoff?")

-   A peer comparison showing how their allocation differs from classmates (anonymized)

-   An equity analysis showing per-capita spending implications across demographic groups

4\. Technical Architecture

4.1 System Architecture Overview

Budget Compass follows a three-tier architecture: a Next.js frontend with CopilotKit, a Mastra agent orchestration layer powered by Amazon Bedrock Nova models, and a Convex reactive data layer combining pre-processed structured data with a RAG-indexed vector store.

4.2 Frontend Layer

  --------------- ----------------------------------------------- -------------------------------------------------------------------------
  **Component**   **Technology**                                  **Purpose**

  Framework       Next.js 14+ (App Router)                        Server-side rendering, API routes, edge runtime

  Agent UI        CopilotKit v1.50+ (AG-UI Protocol)              Chat interface, Generative UI, shared state, human-in-the-loop

  Charts          Recharts + D3.js                                Interactive budget visualizations rendered via CopilotKit Generative UI

  Voice UI        Nova 2 Sonic integration via WebRTC/WebSocket   Real-time bidirectional voice streaming

  Simulator UI    React + Tailwind CSS                            Slider-based budget allocation interface with real-time updates

  State Mgmt      CopilotKit Shared State + React Context         Bi-directional sync between agent reasoning and UI components

  Styling         Tailwind CSS + shadcn/ui                        Consistent, accessible component library
  --------------- ----------------------------------------------- -------------------------------------------------------------------------

4.3 Agent Orchestration Layer

The agent layer uses Mastra, a TypeScript-native agent framework, to implement a multi-agent architecture where each agent is purpose-built for a specific capability and uses the most cost-effective Nova model for its task. Mastra provides built-in multi-agent orchestration, typed tool definitions, RAG support, and a native CopilotKit integration via registerCopilotKit() for seamless AG-UI protocol connectivity.

  ------------------ ---------------- ------------------------------------------------------------------------ ---------------------------------------------------
  **Agent Name**     **Nova Model**   **Responsibility**                                                       **Tools Available**

  Query Router       Nova 2 Lite      Classifies incoming queries and routes to appropriate specialist agent   classifyQuery

  Q&A Agent          Nova 2 Lite      Fast factual lookups against structured budget database                  queryBudgetData, renderBudgetChart

  Analyst Agent      Nova 2 Pro       Complex multi-step reasoning, cross-table analysis, anomaly detection    queryBudgetData, executeCode, renderBudgetChart

  Voice Agent        Nova 2 Sonic     Real-time speech-to-speech briefings with persona adaptation             queryBudgetData, getBriefingScript

  Visual Agent       Nova 2 Omni      Generates infographic images from computed budget data                   queryBudgetData, executeCode, generateInfographic

  Enrichment Agent   Nova Act         Browses external data sources (open data portals, Census) for context    browseWeb, extractData

  Simulator Agent    Nova 2 Pro       Models consequences of budget reallocation decisions                     queryBudgetData, executeCode, getServiceMetrics
  ------------------ ---------------- ------------------------------------------------------------------------ ---------------------------------------------------

4.4 Data Layer

4.4.1 Pre-Processing Pipeline (Build Time)

The 208-page budget PDF is processed before the application is deployed. This is critical for ensuring numerical accuracy, as LLMs should not perform arithmetic on extracted table values at runtime.

7.  PDF table extraction via Amazon Textract or Bedrock Data Automation → structured CSV/JSON for every financial table in the document

8.  Data normalization: standardize department names, fiscal years, budget categories, and dollar amounts into a consistent schema

9.  Storage in Convex reactive database with tables for: departments, line_items, budget_years, positions, capital_projects, debt_service

10. Narrative text extraction via Nova 2 Lite: department mission statements, budget introduction, and analysis sections → chunked and stored for RAG

11. Vector embedding via Nova Multimodal Embeddings: index all text chunks, tables (as markdown), and chart descriptions into Amazon Bedrock Knowledge Base

4.4.2 Runtime Data Flow

At runtime, all numerical queries follow a deterministic path:

-   Agent interprets the user's question using Nova (natural language understanding)

-   Agent calls queryBudgetData tool → Convex query function → returns exact numbers

-   If calculations are needed, agent uses Nova's built-in code execution to write and run Python/JS

-   Computed results are passed to renderBudgetChart or generateInfographic tools

-   CopilotKit Generative UI renders the visualization inline in the conversation

**Key Principle:** Every number displayed to the user is sourced from the structured database and computed via deterministic code. Nova models handle language understanding and code generation, never raw arithmetic.

4.4.3 Database Schema

  ------------------ ------------------------------------------------------------------------------------------------------------ --------------------
  **Table**          **Key Fields**                                                                                               **Source**

  departments        id, name, budget_section, 2023_actual, 2024_actual, 2025_adopted, 2026_proposed, tax_levy, non_tax_revenue   Pages 17-20, 27-31

  line_items         id, department_id, category (salaries/fringe/operating/equipment/special), amount, year                      Pages 18-20, 32

  positions          id, department_id, year, authorized_count, fte_count, change_from_prior                                      Pages 23-25

  capital_projects   id, name, department, total_cost, 2026_funding, funding_source, category                                     Pages 167-177

  debt_service       id, year, general_obligation, revenue_bonds, total_outstanding, debt_limit_pct                               Pages 178-197

  tax_rates          id, year, rate_per_1000, total_levy, assessed_value                                                          Page 21

  revenue_sources    id, category, subcategory, amount, year, is_tax_levy                                                         Pages 149-155
  ------------------ ------------------------------------------------------------------------------------------------------------ --------------------

5\. Technology Stack

  -------------------- ----------------------------------------------------------- -----------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Layer**            **Technology**                                              **Rationale**

  Frontend Framework   Next.js 14+ (App Router)                                    Server components, API routes, edge runtime, React Server Components for streaming

  Agent Framework      Mastra + CopilotKit v1.50+ (AG-UI)                          Mastra: TypeScript-native multi-agent orchestration, typed tools, RAG, workflows. CopilotKit: AG-UI protocol for Generative UI, shared state, human-in-the-loop

  AI Models            Amazon Nova 2 (Lite, Pro, Sonic, Omni) via Amazon Bedrock   Full model portfolio for multi-modal civic intelligence; built-in code execution

  RAG Embeddings       Nova Multimodal Embeddings                                  Unified cross-modal search across text, tables, and charts from the budget PDF

  Vector Store         Amazon Bedrock Knowledge Base                               Managed RAG infrastructure with Nova Multimodal Embeddings

  Database             Convex                                                      Reactive backend with real-time subscriptions; TypeScript server functions for deterministic queries; automatic caching and optimistic updates for simulator

  Table Extraction     Amazon Textract or Bedrock Data Automation                  Reliable table extraction from PDF with confidence scores and bounding boxes

  UI Components        Recharts, D3.js, shadcn/ui, Tailwind CSS                    Interactive charts, accessible components, responsive design

  Voice Streaming      WebRTC / WebSocket via Nova 2 Sonic                         Low-latency bidirectional audio for real-time voice conversations

  Web Enrichment       Nova Act                                                    Browser-based data enrichment from Milwaukee open data portal, Census.gov

  Hosting              Vercel + Convex + Amazon Bedrock                            Serverless deployment with managed AI infrastructure

  Authentication       Clerk + Convex integration                                  User authentication, session management, and role-based access; native Convex integration for identity-aware queries
  -------------------- ----------------------------------------------------------- -----------------------------------------------------------------------------------------------------------------------------------------------------------------

6\. CopilotKit Integration Architecture

CopilotKit serves as the connective tissue between the Mastra-orchestrated Nova agent backends and the React frontend. The integration leverages four core CopilotKit capabilities:

6.1 Generative UI (Chart Rendering)

When an agent determines that a visualization would enhance its response, it calls a CopilotKit action that renders a React component inline in the chat. This is the primary mechanism for interactive charts.

The agent pipeline works as follows: Nova interprets the user's question and determines a chart type (bar, line, pie, treemap). The agent queries the structured database for exact numbers. If calculations are needed, Nova writes Python code and executes it. The computed data payload is passed to a renderBudgetChart action, which CopilotKit renders as an interactive Recharts component directly in the conversation stream.

6.2 Shared State (Simulator Sync)

The Remix simulator mode requires bi-directional state synchronization between the UI sliders and the agent's consequence modeling. CopilotKit's shared state layer enables this: when a user moves a department budget slider, the state change propagates instantly to the Nova 2 Pro Simulator Agent, which computes downstream effects and writes updated consequence data back to shared state, which the UI renders immediately.

6.3 Human-in-the-Loop (Disambiguation)

Budget queries are often ambiguous. When the Query Router identifies ambiguity, CopilotKit's human-in-the-loop mechanism pauses the agent execution and presents the user with clarifying options. For example, if a user asks about "infrastructure spending," the agent might pause and present: "I found two interpretations: (A) DPW Infrastructure Services Division budget at \$123.5M, or (B) Capital Improvements for infrastructure at \$232.6M. Which do you mean?"

6.4 AG-UI Event Stream (Voice Sync)

The Voice Agent (Nova 2 Sonic) communicates its narrative position to the frontend via the AG-UI event stream. As Sonic discusses a particular budget topic, it emits state events that CopilotKit uses to animate the corresponding on-screen visualization. This creates a synchronized audio-visual experience where charts highlight and animate in time with the spoken narrative.

7\. Amazon Nova Model Utilization Map

This section details exactly how each Nova model is used, mapping to the hackathon's requirement that the core solution must use Nova foundation models.

  ---------------------------- ----------------------------------------------------------------------------------------- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Nova Model**               **Where Used**                                                                            **Why This Model**

  Nova 2 Lite                  Query routing, fast Q&A, RAG retrieval, document processing, pre-processing pipeline      Best price-performance for high-volume, lower-complexity queries. Adjustable thinking depth allows cost optimization. Enhanced document/table understanding.

  Nova 2 Pro                   Complex analytical queries, consequence modeling in simulator, multi-document reasoning   Deepest reasoning capability for multi-step analysis. Excels at cross-table comparisons and long-range budget trend analysis. Code execution for verified math.

  Nova 2 Sonic                 Voice briefings, conversational follow-up, persona-adapted narration                      Real-time speech-to-speech with 1M token context (entire budget in context). Multilingual support for Milwaukee's diverse population. Async background task processing.

  Nova 2 Omni                  Infographic generation, visual explanations, social media assets                          Industry-first text+image generation from multimodal input. No other model can create custom visual explanations from budget data.

  Nova Act                     Web browsing for external data enrichment (Census, open data, peer city comparisons)      90% reliability on browser workflows. Automates data collection from Milwaukee's open data portal for real-time context enrichment.

  Nova Multimodal Embeddings   RAG vector store for budget PDF (text, tables, charts in unified semantic space)          Cross-modal retrieval means users can find information whether it was in a table, chart, or narrative paragraph.
  ---------------------------- ----------------------------------------------------------------------------------------- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------

8\. Data Pipeline & Numerical Reliability

Numerical reliability is the single most important technical requirement. LLMs cannot be trusted to perform arithmetic accurately. Budget Compass implements a strict separation between language understanding (Nova's job) and numerical computation (deterministic code's job).

8.1 Build-Time Pipeline

The following steps are executed once during development, before the application is deployed:

12. Ingest: Upload the 208-page budget PDF to Amazon S3

13. Extract Tables: Run Amazon Textract or Bedrock Data Automation to extract every financial table as structured CSV with confidence scores

14. Validate: Human review of extracted tables against the source PDF. Flag any cells with confidence scores below 0.95 for manual verification

15. Normalize: Python ETL script standardizes department names, category labels, and fiscal year formats

16. Load: Insert normalized data into Convex database tables matching the schema defined in Section 4.4.3

17. Embed Narratives: Extract non-tabular text (department descriptions, budget introduction, analysis) via Nova 2 Lite, chunk into \~500 token segments, embed via Nova Multimodal Embeddings, store in Bedrock Knowledge Base

18. Embed Tables: Convert each table to markdown format, embed alongside text chunks for cross-modal retrieval

8.2 Runtime Computation Contract

Every runtime calculation follows this contract:

-   All source numbers come from the structured Convex database (queryBudgetData tool), never from LLM extraction at query time

-   All arithmetic is performed via Nova 2 Lite/Pro code execution (Python/JS), never via LLM "mental math"

-   All generated visualizations receive pre-computed data arrays, never LLM-estimated values

-   All infographic numbers (Nova 2 Omni) are injected as verified text strings into the generation prompt, not computed by the image model

***Demo talking point:** "Every number in Budget Compass is verified through code execution, not LLM estimation. We trust Nova to understand language and write code --- we trust code to do math."*

9\. Hackathon Submission Strategy

9.1 Category Selection

**Primary Category: Agentic AI.** The multi-agent architecture built on Mastra with purpose-selected models, tool use, code execution, and CopilotKit orchestration makes this the strongest category fit. This also positions the project for the First Prize Overall (\$15,000) and Best of Agentic System (\$3,000).

**Secondary Prize Targets:** Best of Voice AI (\$3,000) if the Sonic briefing mode is sufficiently polished. Best Student App (\$3,000) if the Remix simulator is framed for classroom use. Best of Multimodal Understanding (\$3,000) via Nova 2 Omni infographic generation.

9.2 Judging Criteria Alignment

  ----------------------------------- ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ -----------------------------------------------------------------------------------------------------------------------------
  **Criteria (Weight)**               **How Budget Compass Scores**                                                                                                                                                                                **Key Demo Moments**

  Technical Implementation (60%)      Uses 5/5 Nova model types + multimodal embeddings. Mastra multi-agent orchestration with intelligent routing. CopilotKit AG-UI integration. Code execution for verified math. RAG with cross-modal search.   Show the model routing in action: simple query → Lite, complex query → Pro. Show code execution producing verified numbers.

  Enterprise/Community Impact (20%)   Directly addresses civic transparency for Milwaukee's 577,000 residents. Four distinct user personas with tailored experiences. Replicable to any US city budget.                                            Demo the classroom Remix mode. Show a resident generating testimony. Explain the replication model.

  Creativity & Innovation (20%)       Nova 2 Omni infographics (no other civic tool does this). Voice-first budget exploration via Sonic. Budget gamification through Remix mode.                                                                  Generate a live infographic. Have the voice agent interrupt and pivot. Show the leaderboard.
  ----------------------------------- ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ -----------------------------------------------------------------------------------------------------------------------------

9.3 Blog Post Strategy (Bonus Prize)

**Title:** "From PDF to Public Square: How AI Agents Can Democratize Municipal Budget Transparency for 19,000+ US Cities"

The blog post on builder.aws positions Budget Compass as a replicable framework, not just a Milwaukee-specific tool. Key arguments: every US city publishes budget documents that are effectively inaccessible; Nova's model portfolio enables a one-size-fits-all architecture where the budget PDF is the only variable input; CopilotKit's AG-UI protocol means the agent backend is framework-agnostic. The post includes a "Replicate This" section with infrastructure cost estimates and a GitHub deployment guide.

9.4 Demo Video Script (3 minutes)

The demo video follows a narrative arc designed to maximize impact within the 3-minute constraint:

19. Hook (0:00-0:20): "Milwaukee spends \$1.4 billion every year. This is the 208-page document that decides where it goes. Fewer than 1% of residents have ever read it. We're changing that."

20. Ask Mode (0:20-1:00): Show 2-3 progressively complex queries. Simple lookup → inline chart. Complex analysis → code execution → multi-department comparison. Narrative question → sourced explanation.

21. Hear Mode (1:00-1:30): Switch to voice. Sonic delivers a briefing segment. Interrupt with a question. Show synchronized chart animation.

22. See Mode (1:30-2:00): Request an infographic. Nova 2 Omni generates it in real-time. Show social media sharing.

23. Remix Mode (2:00-2:40): Move sliders. Show consequence modeling in real-time. Generate a Socratic discussion prompt.

24. Close (2:40-3:00): Architecture diagram overlay. "Every number verified by code. Every answer sourced from the actual budget. Powered by Amazon Nova. #AmazonNova"

10\. MVP Scope & Phased Delivery

Given the hackathon deadline of March 16, 2026, the following phasing prioritizes a demoable MVP while leaving room for stretch goals.

10.1 Phase 1: Foundation (Days 1-7)

-   Budget PDF pre-processing: extract all tables via Textract, load into Convex, validate against source

-   RAG pipeline: embed narrative text + table markdown via Nova Multimodal Embeddings into Bedrock Knowledge Base

-   Basic CopilotKit chat interface with Nova 2 Lite Q&A agent

-   First 3 CopilotKit actions: queryBudgetData, renderBudgetChart, classifyQuery

-   Interactive chart rendering via Generative UI (bar, pie, line charts)

10.2 Phase 2: Intelligence (Days 8-14)

-   Multi-agent routing: add Nova 2 Pro Analyst Agent for complex queries

-   Code execution integration for verified arithmetic

-   Human-in-the-loop disambiguation for ambiguous queries

-   Source citation with page number references

-   Initial Remix simulator UI with 5-6 department sliders

10.3 Phase 3: Multi-Modal (Days 15-21)

-   Nova 2 Sonic voice briefing integration with persona selection

-   CopilotKit shared state sync between voice agent and chart animations

-   Nova 2 Omni infographic generation with social sharing

-   Remix mode consequence modeling with Nova 2 Pro

10.4 Phase 4: Polish & Submit (Days 22-28)

-   Demo video production (3 minutes, #AmazonNova)

-   Blog post draft for builder.aws (bonus prize)

-   Code cleanup, README, GitHub repository preparation

-   Performance optimization and error handling

-   UI polish, responsive design, accessibility audit

11\. Success Metrics & KPIs

While a hackathon project does not have production usage metrics, the following criteria define success:

11.1 Technical Success

-   100% numerical accuracy on a test suite of 50 budget queries with known correct answers

-   Sub-3-second response time for simple factual queries (Nova 2 Lite path)

-   Sub-10-second response time for complex analytical queries (Nova 2 Pro path with code execution)

-   Voice briefing latency under 500ms (first audio byte from Nova 2 Sonic)

-   Successful multi-agent routing for 95%+ of test queries

11.2 Hackathon Success

-   Demo video clearly shows all four modes within the 3-minute constraint

-   Code repository is clean, documented, and deployable

-   Blog post published on builder.aws before deadline

-   Minimum viable Remix mode with at least 6 department sliders and real-time consequence modeling

11.3 Community Impact Success (Post-Hackathon)

-   Shared with Milwaukee Common Council members and city budget office for feedback

-   Presented at a local civic tech meetup or Code for Milwaukee event

-   Framework documentation enables replication for at least one other city's budget

-   At least one educator expresses interest in classroom use

12\. Risks & Mitigations

  ------------------------------------------------------ ---------------- ------------ ----------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Risk**                                               **Likelihood**   **Impact**   **Mitigation**

  Table extraction errors from PDF                       Medium           High         Use Textract with confidence scoring. Human-validate all extracted tables before loading. Maintain a known-correct test set.

  Nova 2 Sonic latency in voice mode                     Medium           Medium       Pre-compute briefing scripts. Cache common queries. Fall back to text-to-speech if Sonic latency exceeds thresholds.

  Nova 2 Omni image quality for infographics             Medium           Low          Have fallback Recharts-based visualizations. Frame Omni output as "AI-generated draft" rather than publication-ready.

  Mastra + CopilotKit + Bedrock integration complexity   High             High         Use Mastra's native registerCopilotKit() integration and AG-UI adapter. Leverage Mastra's Bedrock provider via AI SDK. Prototype the Query Router agent first.

  Budget PDF format changes across years                 Low              Medium       Design schema to be year-agnostic. Document the extraction-to-schema mapping for future PDFs.

  Scope creep across four modes                          High             High         Strict phased delivery. Ask mode is the MVP. Voice, Visual, and Remix are enhancement layers. Ship Ask first.
  ------------------------------------------------------ ---------------- ------------ ----------------------------------------------------------------------------------------------------------------------------------------------------------------

13\. Future Vision: Beyond the Hackathon

Budget Compass is designed as a hackathon entry, but the architecture supports a broader civic intelligence platform:

13.1 Multi-City Expansion

The only city-specific input is the budget PDF. The extraction pipeline, agent architecture, and CopilotKit frontend are city-agnostic. A "Configure Your City" flow could allow any municipality to upload their budget and get a working Budget Compass instance within hours. There are 19,502 incorporated cities in the United States, each publishing annual budgets.

13.2 Real-Time Budget Tracking

Connect to Milwaukee's financial management system (if APIs become available) to show actual vs. budgeted spending in real-time. Nova Act could periodically browse the city's financial transparency portal to scrape current spending data.

13.3 Civic Engagement Pipeline

Extend the platform to cover the full civic engagement cycle: budget proposal → public comment → council hearings → adopted budget → implementation tracking. Integrate with the Common Council's meeting schedule and public comment system.

13.4 Open Source Framework

Release Budget Compass as an open-source civic technology framework under an MIT license. Partner with Code for America, Code for Milwaukee, and university civic tech programs for adoption and contribution.

*--- End of Document ---*
