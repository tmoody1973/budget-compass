**MKE Budget Compass**

Mastra Agent Implementation Guide

Technical reference for building the multi-agent system

Amazon Nova AI Hackathon • Deadline: March 16, 2026

Stack: Mastra + CopilotKit + Amazon Bedrock + Convex + Clerk

Version 1.0 • February 2026

**1. Mastra Fundamentals**

Mastra is a TypeScript-native agent framework from the team behind Gatsby. It provides agents, tools, workflows, RAG, memory, and a built-in dev server with playground. For Budget Compass, Mastra orchestrates seven specialized agents powered by Amazon Nova models and connects them to the CopilotKit frontend via the AG-UI protocol.

**1.1 Core Concepts**

**Agent:** An autonomous unit that uses an LLM and tools to solve tasks. Agents reason about goals, decide which tools to call, and iterate until they produce a final answer. Each Budget Compass agent wraps a specific Nova model.

**Tool:** A typed function an agent can invoke. Defined with Zod input/output schemas. Tools give agents access to the Convex database, code execution, external APIs, and CopilotKit Generative UI actions.

**Workflow:** A graph-based execution pipeline with branching, looping, and error handling. Used for multi-step processes like the budget analysis pipeline (route → query → compute → visualize).

**Mastra Instance:** The central registry where agents, tools, and workflows are registered. Exposes them as API endpoints and provides shared resources like memory, logging, and observability.

**registerCopilotKit():** A one-line helper from \@ag-ui/mastra that creates a CopilotKit-compatible API route on the Mastra server, bridging agents to the AG-UI event stream.

**1.2 Project Structure**

> src/
>
> mastra/
>
> agents/
>
> query-router.ts \# Nova 2 Lite - classifies & routes
>
> qa-agent.ts \# Nova 2 Lite - fast factual lookups
>
> analyst-agent.ts \# Nova 2 Pro - complex analysis
>
> voice-agent.ts \# Nova 2 Sonic - speech-to-speech
>
> visual-agent.ts \# Nova 2 Omni - infographic generation
>
> enrichment-agent.ts \# Nova Act - web browsing
>
> simulator-agent.ts \# Nova 2 Pro - budget reallocation
>
> tools/
>
> query-budget-data.ts \# Convex database queries
>
> execute-code.ts \# Python/JS code execution
>
> render-budget-chart.ts \# CopilotKit Generative UI
>
> search-budget-docs.ts \# RAG vector search
>
> browse-external.ts \# Nova Act web enrichment
>
> workflows/
>
> budget-analysis.ts \# Route → Query → Compute → Viz
>
> index.ts \# Mastra instance + registerCopilotKit
>
> app/ \# Next.js frontend
>
> components/
>
> copilotkit-provider.tsx
>
> budget-chat.tsx
>
> api/copilotkit/route.ts \# CopilotKit API route

**2. Creating Agents**

Each agent is an instance of the Agent class with a model, system instructions, and tools. Mastra auto-detects environment variables for the configured provider.

**2.1 Agent Anatomy**

> import { Agent } from \"@mastra/core/agent\";
>
> import { createAmazonBedrock } from \"@ai-sdk/amazon-bedrock\";
>
> import { queryBudgetDataTool } from \"../tools/query-budget-data\";
>
> import { renderBudgetChartTool } from \"../tools/render-budget-chart\";
>
> const bedrock = createAmazonBedrock({
>
> region: \"us-east-1\",
>
> });
>
> export const qaAgent = new Agent({
>
> id: \"qa-agent\",
>
> name: \"Budget Q&A Agent\",
>
> instructions: \`You are Milwaukee\'s budget expert.
>
> Answer factual questions about the city budget.
>
> ALWAYS use queryBudgetData to get exact numbers.
>
> NEVER estimate or calculate mentally.
>
> When data supports a chart, call renderBudgetChart.\`
>
> model: bedrock(\"us.amazon.nova-lite-v2:0\"),
>
> tools: { queryBudgetDataTool, renderBudgetChartTool },
>
> });

+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Why Nova 2 Lite for Q&A?**                                                                                                                                                                                                                               |
|                                                                                                                                                                                                                                                            |
| Nova 2 Lite is the fastest and cheapest Nova model. For single-lookup factual questions like "What is the police department budget?" it returns answers in under a second. Reserve Nova 2 Pro for multi-step analysis that requires cross-table reasoning. |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

**2.2 All Seven Agents**

  --------------- ---------------- ---------------- ----------------------------------------------------
  **Agent**       **Nova Model**   **PRD Mode**     **Purpose**

  Query Router    Nova 2 Lite      All modes        Classifies intent, routes to specialist agent

  Q&A Agent       Nova 2 Lite      Ask (Mode 1)     Fast factual lookups from structured budget data

  Analyst Agent   Nova 2 Pro       Ask (Mode 1)     Complex multi-step analysis, cross-table reasoning

  Voice Agent     Nova 2 Sonic     Hear (Mode 2)    Real-time speech-to-speech budget briefings

  Visual Agent    Nova 2 Omni      See (Mode 3)     AI-generated infographic images from budget data

  Enrichment      Nova Act         Ask (Mode 1)     Browses external sites for context (Census, BLS)

  Simulator       Nova 2 Pro       Remix (Mode 4)   Models budget reallocation consequences
  --------------- ---------------- ---------------- ----------------------------------------------------

**3. Creating Tools**

Tools are the interface between agents and external systems. Every tool has a Zod input schema, a Zod output schema, a description (used by the LLM to decide when to call it), and an execute function.

**3.1 queryBudgetData Tool**

The most critical tool in the system. It queries the Convex database for verified budget numbers. This is how we ensure no LLM mental math.

> import { createTool } from \"@mastra/core/tools\";
>
> import { z } from \"zod\";
>
> import { ConvexClient } from \"convex/browser\";
>
> import { api } from \"../../convex/\_generated/api\";
>
> const convex = new ConvexClient(
>
> process.env.CONVEX_URL!
>
> );
>
> export const queryBudgetDataTool = createTool({
>
> id: \"query-budget-data\",
>
> description: \"Query Milwaukee budget database for exact
>
> fiscal data. Use for ANY question about dollar amounts,
>
> headcounts, tax rates, or department budgets.\",
>
> inputSchema: z.object({
>
> department: z.string().optional().describe(\"e.g. Police, DPW\"),
>
> category: z.string().optional().describe(\"e.g. salaries, capital\"),
>
> fiscalYear: z.number().optional().describe(\"e.g. 2025\"),
>
> metric: z.enum(\[\"budget\", \"actual\", \"variance\", \"headcount\",
>
> \"taxRate\", \"revenue\"\]).describe(\"What to retrieve\"),
>
> }),
>
> outputSchema: z.object({
>
> data: z.array(z.object({
>
> label: z.string(),
>
> value: z.number(),
>
> unit: z.string(),
>
> })),
>
> source: z.string(),
>
> confidence: z.number(),
>
> }),
>
> execute: async ({ context }) =\> {
>
> const result = await convex.query(
>
> api.budget.query,
>
> {
>
> department: context.department,
>
> category: context.category,
>
> fiscalYear: context.fiscalYear ?? 2025,
>
> metric: context.metric,
>
> }
>
> );
>
> return result;
>
> },
>
> });

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Design Principle: Code Does Math, Not LLMs**                                                                                                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                                                                                                                     |
| Every dollar amount shown in Budget Compass comes from a Convex query function that returns pre-extracted, human-validated numbers. When calculations are needed (e.g. percentage change), Nova writes Python/JS code that executes deterministically via Nova 2 Lite/Pro's built-in code execution. The LLM never does arithmetic. |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

**3.2 renderBudgetChart Tool (Generative UI)**

This tool triggers CopilotKit's Generative UI to render an interactive Recharts component inline in the chat. The agent calls it after retrieving verified data.

> import { createTool } from \"@mastra/core/tools\";
>
> import { z } from \"zod\";
>
> export const renderBudgetChartTool = createTool({
>
> id: \"render-budget-chart\",
>
> description: \"Render an interactive chart in the chat.
>
> Call AFTER getting verified data from queryBudgetData.
>
> Never pass estimated numbers to this tool.\",
>
> inputSchema: z.object({
>
> chartType: z.enum(\[\"bar\", \"line\", \"pie\", \"treemap\"\])
>
> .describe(\"Best chart type for this data\"),
>
> title: z.string().describe(\"Chart title\"),
>
> data: z.array(z.object({
>
> label: z.string(),
>
> value: z.number(),
>
> color: z.string().optional(),
>
> })),
>
> xLabel: z.string().optional(),
>
> yLabel: z.string().optional(),
>
> unit: z.string().optional().describe(\"e.g. \$, %, FTEs\"),
>
> }),
>
> outputSchema: z.object({
>
> rendered: z.boolean(),
>
> }),
>
> execute: async ({ context }) =\> {
>
> // CopilotKit intercepts this tool call via AG-UI
>
> // and renders the chart component on the frontend
>
> return { rendered: true };
>
> },
>
> });

**4. Mastra Instance & CopilotKit Integration**

The Mastra instance is the central registry. It registers all agents and exposes them via the AG-UI protocol through registerCopilotKit().

**4.1 Mastra Server (src/mastra/index.ts)**

> import { Mastra } from \"@mastra/core/mastra\";
>
> import { registerCopilotKit } from \"@ag-ui/mastra/copilotkit\";
>
> import { qaAgent } from \"./agents/qa-agent\";
>
> import { analystAgent } from \"./agents/analyst-agent\";
>
> import { queryRouter } from \"./agents/query-router\";
>
> import { voiceAgent } from \"./agents/voice-agent\";
>
> import { visualAgent } from \"./agents/visual-agent\";
>
> import { simulatorAgent } from \"./agents/simulator-agent\";
>
> export const mastra = new Mastra({
>
> agents: {
>
> queryRouter,
>
> qaAgent,
>
> analystAgent,
>
> voiceAgent,
>
> visualAgent,
>
> simulatorAgent,
>
> },
>
> server: {
>
> cors: {
>
> origin: process.env.FRONTEND_URL \|\| \"http://localhost:3000\",
>
> allowMethods: \[\"\*\"\],
>
> allowHeaders: \[\"\*\"\],
>
> },
>
> apiRoutes: \[
>
> registerCopilotKit({
>
> path: \"/copilotkit\",
>
> resourceId: \"queryRouter\", // Entry point agent
>
> setContext: (c, runtimeContext) =\> {
>
> runtimeContext.set(\"user-id\",
>
> c.req.header(\"X-User-ID\") ?? \"anonymous\");
>
> },
>
> }),
>
> \],
>
> },
>
> });

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Key Insight: Query Router as Entry Point**                                                                                                                                                                                                                                     |
|                                                                                                                                                                                                                                                                                  |
| registerCopilotKit's resourceId points to the Query Router agent, not individual specialists. Every user message first hits the Query Router, which classifies intent and delegates to the appropriate specialist. This is the multi-agent routing pattern described in the PRD. |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

**4.2 Next.js Frontend (CopilotKit Provider)**

> // app/components/copilotkit-provider.tsx
>
> \"use client\";
>
> import { CopilotKit } from \"@copilotkit/react-core\";
>
> import { CopilotChat } from \"@copilotkit/react-ui\";
>
> import \"@copilotkit/react-ui/styles.css\";
>
> export function BudgetCopilot() {
>
> return (
>
> \<CopilotKit
>
> runtimeUrl=\"http://localhost:4111/copilotkit\"
>
> agent=\"queryRouter\"
>
> \>
>
> \<CopilotChat
>
> labels={{
>
> title: \"MKE Budget Compass\",
>
> initial: \"Ask me anything about Milwaukee\'s \$1.4B budget.\"
>
> }}
>
> /\>
>
> \</CopilotKit\>
>
> );
>
> }

**4.3 Alternative: Full-Stack Next.js Route**

If you prefer running Mastra inside Next.js instead of a separate server, use the MastraAgent helper in an API route:

> // app/api/copilotkit/route.ts
>
> import { mastra } from \"../../mastra\";
>
> import { CopilotRuntime, ExperimentalEmptyAdapter,
>
> copilotRuntimeNextJSAppRouterEndpoint } from \"@copilotkit/runtime\";
>
> import { MastraAgent } from \"@ag-ui/mastra\";
>
> import { NextRequest } from \"next/server\";
>
> export const POST = async (req: NextRequest) =\> {
>
> const mastraAgents = MastraAgent.getLocalAgents({
>
> mastra,
>
> agentId: \"queryRouter\",
>
> });
>
> const runtime = new CopilotRuntime({
>
> agents: mastraAgents,
>
> });
>
> const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
>
> runtime,
>
> serviceAdapter: new ExperimentalEmptyAdapter(),
>
> endpoint: \"/api/copilotkit\",
>
> });
>
> return handleRequest(req);
>
> };

**5. Query Router: Multi-Agent Routing**

The Query Router is the orchestration brain. It classifies every incoming message and delegates to the right specialist agent. This agent uses sub-agents, which Mastra automatically converts to callable tools.

**5.1 Router Agent with Sub-Agents**

> import { Agent } from \"@mastra/core/agent\";
>
> import { createAmazonBedrock } from \"@ai-sdk/amazon-bedrock\";
>
> import { qaAgent } from \"./qa-agent\";
>
> import { analystAgent } from \"./analyst-agent\";
>
> import { simulatorAgent } from \"./simulator-agent\";
>
> const bedrock = createAmazonBedrock({ region: \"us-east-1\" });
>
> export const queryRouter = new Agent({
>
> id: \"query-router\",
>
> name: \"Budget Query Router\",
>
> instructions: \`You route budget questions to specialists.
>
> ROUTING RULES:
>
> \- Simple factual lookups (single department, single year)
>
> → delegate to qaAgent
>
> \- Complex analysis (comparisons, trends, multi-department)
>
> → delegate to analystAgent
>
> \- Budget simulation (\"what if\", reallocation, tradeoffs)
>
> → delegate to simulatorAgent
>
> \- Ambiguous queries → ask user to clarify
>
> Always route. Never answer budget questions directly.\`
>
> model: bedrock(\"us.amazon.nova-lite-v2:0\"),
>
> agents: {
>
> qaAgent: {
>
> \...qaAgent,
>
> description: \"Fast factual budget lookups for simple questions\"
>
> },
>
> analystAgent: {
>
> \...analystAgent,
>
> description: \"Complex multi-step budget analysis\"
>
> },
>
> simulatorAgent: {
>
> \...simulatorAgent,
>
> description: \"Budget reallocation simulation and tradeoffs\"
>
> },
>
> },
>
> });

**6. Amazon Bedrock Provider Setup**

Mastra uses the Vercel AI SDK's Amazon Bedrock provider to access all Nova models. Install the provider and configure AWS credentials.

**6.1 Installation**

> \# Core Mastra + Bedrock
>
> npm install \@mastra/core mastra \@ai-sdk/amazon-bedrock zod
>
> \# CopilotKit integration
>
> npm install \@ag-ui/mastra \@mastra/client-js \\
>
> \@ag-ui/core \@ag-ui/client \@copilotkit/runtime
>
> \# Frontend (in Next.js app)
>
> npm install \@copilotkit/react-core \@copilotkit/react-ui

**6.2 Environment Variables**

> \# .env
>
> AWS_ACCESS_KEY_ID=your_access_key
>
> AWS_SECRET_ACCESS_KEY=your_secret_key
>
> AWS_REGION=us-east-1
>
> \# Convex
>
> CONVEX_URL=https://your-project.convex.cloud
>
> CONVEX_DEPLOY_KEY=your_deploy_key
>
> \# Clerk
>
> NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk\_\...
>
> CLERK_SECRET_KEY=sk\_\...
>
> \# Frontend URL (for CORS)
>
> FRONTEND_URL=http://localhost:3000

**6.3 Nova Model Strings**

  ---------------- ------------------------------- ----------------------
  **Nova Model**   **Bedrock Model ID**            **Use Case**

  Nova 2 Lite      us.amazon.nova-lite-v2:0        Router, Q&A

  Nova 2 Pro       us.amazon.nova-pro-v2:0         Analyst, Simulator

  Nova 2 Sonic     us.amazon.nova-sonic-v2:0       Voice briefings

  Nova 2 Omni      us.amazon.nova-omni-v2:0        Infographic gen

  Nova Act         amazon.nova-act-v1:0            Web browsing
  ---------------- ------------------------------- ----------------------

**7. AG-UI Event Flow**

The AG-UI protocol defines how Mastra agents communicate with CopilotKit in real time. Understanding the event lifecycle is essential for debugging and building Generative UI.

**7.1 Event Lifecycle**

**1. RUN_STARTED:** CopilotKit sends a message, Mastra begins agent execution.

**2. TEXT_MESSAGE_START:** Agent begins streaming a response chunk.

**3. TEXT_MESSAGE_CONTENT:** Incremental text tokens stream to the frontend.

**4. TEXT_MESSAGE_END:** Agent finishes the current message segment.

**5. TOOL_CALL_START:** Agent invokes a tool (e.g., queryBudgetData).

**6. TOOL_CALL_END:** Tool returns results. If the tool is renderBudgetChart, CopilotKit intercepts and renders the Generative UI component.

**7. STATE_SNAPSHOT / STATE_DELTA:** Shared state updates for Remix simulator mode (bi-directional).

**8. RUN_FINISHED:** Agent execution complete.

**7.2 Generative UI: How Chart Rendering Works**

When the Q&A or Analyst agent decides a chart would help, it calls the renderBudgetChart tool. CopilotKit's frontend intercepts the tool call via AG-UI and renders the corresponding React component inline:

> // Frontend: Register the Generative UI action
>
> import { useCopilotAction } from \"@copilotkit/react-core\";
>
> import { BudgetChart } from \"./budget-chart\";
>
> useCopilotAction({
>
> name: \"render-budget-chart\",
>
> render: ({ args }) =\> (
>
> \<BudgetChart
>
> chartType={args.chartType}
>
> title={args.title}
>
> data={args.data}
>
> xLabel={args.xLabel}
>
> yLabel={args.yLabel}
>
> unit={args.unit}
>
> /\>
>
> ),
>
> });

**8. Running the System**

**8.1 Development**

> \# Terminal 1: Mastra agent server
>
> cd src/mastra
>
> npx mastra dev
>
> \# → http://localhost:4111 (API + Playground)
>
> \# Terminal 2: Next.js frontend
>
> cd ..
>
> npm run dev
>
> \# → http://localhost:3000
>
> \# Terminal 3: Convex backend
>
> npx convex dev
>
> \# → Reactive data layer + dashboard

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Mastra Playground**                                                                                                                                                                                                    |
|                                                                                                                                                                                                                          |
| Running mastra dev launches a built-in web playground at http://localhost:4111 where you can test each agent individually, inspect tool calls, view traces, and debug behavior before wiring up the CopilotKit frontend. |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

**8.2 Deployment Note**

When deploying Mastra with CopilotKit, you must exclude \@copilotkit/runtime from the bundle. This is only an issue with mastra build, not during development with mastra dev. Add to your Mastra config:

> // mastra.config.ts
>
> export default {
>
> build: {
>
> external: \[\"@copilotkit/runtime\"\]
>
> }
>
> };

**9. Testing & Evaluation**

Mastra includes built-in evaluation tools. Use them to verify agent routing accuracy and answer quality before demo day.

**9.1 Programmatic Agent Testing**

> // test/qa-agent.test.ts
>
> import { mastra } from \"../src/mastra\";
>
> const agent = mastra.getAgent(\"qaAgent\");
>
> const response = await agent.generate(
>
> \"What is the DPW budget for 2025?\"
>
> );
>
> console.log(response.text);
>
> console.log(response.toolResults);
>
> // Verify: toolResults includes queryBudgetData call
>
> // Verify: response.text contains exact dollar amount

**9.2 cURL Testing (API)**

> curl -X POST http://localhost:4111/api/agents/qaAgent/generate \\
>
> -H \"Content-Type: application/json\" \\
>
> -d \'{\"messages\":\[\"What is the police department budget?\"\]}\'

**10. Quick Reference: Packages**

  ------------------------------ -------------------------------------------
  **Package**                    **Purpose**

  \@mastra/core                  Agent, createTool, Mastra, workflows

  mastra                         CLI: mastra dev, mastra build

  \@ai-sdk/amazon-bedrock        Bedrock provider for Nova models

  \@ag-ui/mastra                 registerCopilotKit(), MastraAgent helpers

  \@copilotkit/runtime           CopilotRuntime for Next.js API routes

  \@copilotkit/react-core        CopilotKit provider, useCopilotAction

  \@copilotkit/react-ui          CopilotChat component + styles

  convex                         Convex client + generated API types

  zod                            Schema validation for tool I/O
  ------------------------------ -------------------------------------------
