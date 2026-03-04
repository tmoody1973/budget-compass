**MKE Budget Compass**

CopilotKit + AG-UI

Implementation & Integration Guide

How CopilotKit connects our Mastra agents to the frontend, explained in plain English

Amazon Nova AI Hackathon • Version 1.0 • February 2026

**Contents**

**Part I --- Understanding the Concepts**

1\. What Is CopilotKit? (Plain English)

2\. What Is AG-UI? (Plain English)

3\. What Is Generative UI? (Plain English)

4\. How It All Fits Together: The Full Picture

**Part II --- Architecture for MKE Budget Compass**

5\. The Three-Layer Cake: Frontend, Protocol, Agents

6\. Agent-to-UI Mapping: Which Agent Renders What

7\. Event Lifecycle: A Question's Journey Through the System

**Part III --- Implementation Guide**

8\. Backend: Mastra Server + CopilotKit Registration

9\. Frontend: CopilotKit Provider & Chat Integration

10\. Generative UI: Rendering Charts Inside Chat

11\. Shared State: Keeping Agents and UI in Sync

12\. Human-in-the-Loop: Confirmation Patterns

13\. Multi-Agent Routing with CopilotKit

**Part IV --- Mode-by-Mode Wiring**

14\. Ask Mode: Chat + Inline Generative UI

15\. Hear Mode: Voice Briefings via Nova 2 Sonic

16\. See Mode: AI-Generated Infographics

17\. Remix Mode: Shared State Budget Simulator

**Part V --- Reference**

18\. Package Inventory

19\. Environment Variables

20\. Troubleshooting & Common Patterns

**Part I**

Understanding the Concepts

**1. What Is CopilotKit? (Plain English)**

Imagine you're building Budget Compass as a Next.js app. You've got your seven Mastra agents on the backend --- they can answer budget questions, generate audio briefings, create infographics, and model budget tradeoffs. But there's a problem: how does the thing the user sees in their browser actually talk to those agents?

You could build custom API endpoints, WebSocket connections, streaming parsers, error handlers, and state management from scratch. That's weeks of infrastructure work before you write a single line of budget-related code.

**CopilotKit eliminates all of that.** It's a React framework that gives you pre-built components and hooks for connecting a frontend application to AI agents. Think of it as the "USB cable" between your app and your agents --- it handles the connection, the data flow, and the display, so you can focus on what your agents actually do.

**What CopilotKit Gives You**

-   **Chat UI:** A full-featured chat interface (CopilotChat component) that handles message streaming, typing indicators, and agent responses out of the box. You customize the look, not the plumbing.

-   **Generative UI:** When your agent calls a tool like "renderBudgetChart," CopilotKit intercepts that tool call and renders a real React component (like a Recharts bar chart) directly inside the chat bubble. The agent doesn't produce HTML --- it triggers a tool, and your app renders the UI.

-   **Shared State:** Your agents and your React components can share a live state object. When the user moves a budget slider in Remix mode, the agent sees the change instantly. When the agent updates a consequence analysis, the UI updates instantly. No manual sync code.

-   **Human-in-the-Loop:** Agents can pause mid-execution to ask the user for confirmation. "Are you sure you want to reallocate \$15M from Police?" The user clicks yes or no, and the agent continues.

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **The Key Insight**                                                                                                                                                                                                 |
|                                                                                                                                                                                                                     |
| CopilotKit is not an LLM. It's not a model. It doesn't do any thinking. It is the plumbing and UI layer that connects your thinking agents (Mastra + Nova) to the thing the user sees and touches in their browser. |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

**2. What Is AG-UI? (Plain English)**

AG-UI stands for Agent-User Interaction Protocol. It's an open standard --- like HTTP is a standard for web pages, AG-UI is a standard for how AI agents talk to frontends.

**The Problem AG-UI Solves**

Before AG-UI, every agent framework had its own way of sending data to the frontend. LangGraph had one format. CrewAI had another. A custom agent had yet another. If you wanted to switch agent frameworks, you had to rewrite your entire frontend integration. AG-UI fixes this by defining a single, universal set of events that any agent framework can emit and any frontend can consume.

**How It Works: Events**

AG-UI is built on a simple idea: everything the agent does gets expressed as a typed event that streams to the frontend. Here are the events that matter for Budget Compass:

  ---------------------- --------------------------------------------------------------------------------------------------------------
  **Event**              **What It Means (Plain English)**

  RUN_STARTED            \"Hey frontend, I've started working on the user's question. Show a loading state.\"

  TEXT_MESSAGE_START     \"I'm about to start typing my response.\"

  TEXT_MESSAGE_CONTENT   \"Here's the next few words of my response.\" (This streams token by token, creating the typewriter effect.)

  TEXT_MESSAGE_END       \"I'm done typing that message.\"

  TOOL_CALL_START        \"I need to use a tool. The tool is called renderBudgetChart and here are the parameters.\"

  TOOL_CALL_END          \"The tool finished. Here's the result.\"

  STATE_DELTA            \"I've updated the shared state. The new consequence analysis text is \[this\].\"

  RUN_FINISHED           \"I'm completely done. You can hide the loading state now.\"
  ---------------------- --------------------------------------------------------------------------------------------------------------

**A Real Example**

When a Milwaukee resident asks "How much does the city spend on parks?", here's the actual sequence of AG-UI events that flows from the Mastra agent to the Next.js frontend:

1.  RUN_STARTED --- CopilotKit shows the typing indicator

2.  TEXT_MESSAGE_START --- a new assistant message bubble appears

3.  TEXT_MESSAGE_CONTENT × 20 --- "The Milwaukee Department of Public Works, Parks Division receives \$28.4M in the 2025 budget\..." streams in token by token

4.  TEXT_MESSAGE_END --- the text portion is complete

5.  TOOL_CALL_START: renderBudgetChart --- CopilotKit sees this tool name and knows to render a React component

6.  TOOL_CALL_END --- the chart component appears inside the chat bubble with animated bars showing Parks vs. other departments

7.  RUN_FINISHED --- typing indicator disappears, input bar re-enables

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Why This Matters for the Hackathon**                                                                                                                                                                                                                                                                              |
|                                                                                                                                                                                                                                                                                                                     |
| AG-UI is adopted by Google, AWS, Microsoft, LangChain, and Mastra. By building on AG-UI, Budget Compass isn't locked into any single agent framework. If Amazon releases a better Nova integration next month, we can swap the backend without touching the frontend. Judges love architecture that's future-proof. |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

**3. What Is Generative UI? (Plain English)**

Most chatbots work like this: the AI generates text, and the frontend displays that text in a bubble. That's it. Text in, text out.

**Generative UI flips this model.** Instead of only generating text, the AI agent can trigger the rendering of real, interactive React components --- charts, sliders, maps, forms, audio players --- directly inside the conversation. The agent doesn't produce the UI. It tells the frontend "I need to show a budget chart with this data," and the frontend renders your pre-built, beautifully-designed chart component.

**The Three Flavors of Generative UI**

  ------------- ----------------------------------------------------------------------------------------------------------------------- --------------------------------------------------------------------------------------------------------------
  **Type**      **How It Works**                                                                                                        **Budget Compass Usage**

  Static        You pre-build specific components. Agent picks which one to show and passes data to it. You control 100% of the look.   BudgetChart, DepartmentCard, ConsequencePanel --- all pre-built in our design system. Agent fills with data.

  Declarative   Agent returns a structured JSON spec (A2UI, Open-JSON-UI). Frontend interprets and renders with its own styling.        Not used. Too little control over our Civic Modernism design language.

  Open-Ended    Agent generates full HTML/iframe surfaces. Maximum flexibility, minimum control.                                        Not used. We need pixel-perfect Milwaukee-branded visuals.
  ------------- ----------------------------------------------------------------------------------------------------------------------- --------------------------------------------------------------------------------------------------------------

**Budget Compass uses Static Generative UI exclusively.** This is the right choice because we have a strong design system (Civic Modernism) and we need every chart, every number, and every interaction to look and feel consistent with our Milwaukee identity. The agent decides what to show; our components decide how it looks.

**How It Works in Practice**

In CopilotKit, Static Generative UI is implemented with the useCopilotAction (also called useFrontendTool) hook. Here's the plain-English version:

1.  You register a "frontend action" with CopilotKit. You give it a name (like "renderBudgetChart"), a description, parameters it expects, and a render function that returns a React component.

2.  When the Mastra agent calls a tool with the same name, CopilotKit intercepts the tool call via the AG-UI event stream.

3.  Instead of waiting for the agent to return text, CopilotKit immediately calls your render function with the tool's parameters.

4.  Your React component appears inside the chat bubble --- with your fonts, your colors, your animations, your design system.

5.  The agent continues streaming its text response, which appears around and after the chart.

**4. How It All Fits Together: The Full Picture**

Let's put CopilotKit, AG-UI, and Generative UI together in one mental model for Budget Compass:

+--------------------------------------------------------------------------+
| User types: "What's the police budget vs. fire?"                         |
|                                                                          |
| ↓                                                                        |
|                                                                          |
| CopilotKit (React) sends message via AG-UI to Mastra server              |
|                                                                          |
| ↓                                                                        |
|                                                                          |
| Query Router Agent (Nova 2 Lite) classifies → sends to Q&A Agent         |
|                                                                          |
| ↓                                                                        |
|                                                                          |
| Q&A Agent calls queryBudgetData tool → Convex returns exact \$\$\$       |
|                                                                          |
| ↓                                                                        |
|                                                                          |
| Agent calls renderBudgetChart tool with data → AG-UI TOOL_CALL event     |
|                                                                          |
| ↓                                                                        |
|                                                                          |
| CopilotKit intercepts TOOL_CALL, renders \<BudgetChart\> in chat bubble  |
|                                                                          |
| ↓                                                                        |
|                                                                          |
| User sees animated bar chart + explanation text in one seamless response |
+--------------------------------------------------------------------------+

That's the entire system in one flow. CopilotKit is the frontend framework. AG-UI is the communication protocol. Generative UI is the pattern that lets agents render React components. Mastra orchestrates the agents. Nova does the thinking. Convex provides the verified data.

**Part II**

Architecture for MKE Budget Compass

**5. The Three-Layer Cake**

Budget Compass is organized into three clean layers. Each layer has one job, and they communicate through well-defined interfaces:

**Layer 1: Frontend (Next.js + CopilotKit)**

This is what the user sees. It runs in the browser and handles all rendering, animations, and user input. CopilotKit's React components manage the chat interface, and our custom components (BudgetChart, RemixSlider, AudioPlayer) handle the specialized UI for each mode.

-   Technology: Next.js 14+ App Router, React 18, Tailwind CSS, shadcn/ui, Recharts, Framer Motion

-   CopilotKit packages: \@copilotkit/react-core, \@copilotkit/react-ui

-   Role: render UI, capture user input, register frontend actions for Generative UI

**Layer 2: Protocol (AG-UI via CopilotKit Runtime)**

This is the invisible plumbing. It takes user messages from the frontend, sends them to the right agent, and streams the agent's response events back. You don't build this layer --- CopilotKit and AG-UI provide it. You just configure it.

-   Technology: \@copilotkit/runtime, \@ag-ui/mastra, \@ag-ui/core

-   Transport: Server-Sent Events (SSE) over HTTP --- the same tech that powers ChatGPT's streaming

-   Role: marshal messages, stream events, route to agents, manage session state

**Layer 3: Agents (Mastra + Amazon Nova)**

This is where the intelligence lives. Mastra orchestrates seven specialized agents, each powered by the right Nova model for the job. Agents have typed tools that query Convex for exact budget data and code-execute for arithmetic. They never guess numbers.

-   Technology: Mastra framework, \@ai-sdk/amazon-bedrock, Convex client

-   Models: Nova 2 Lite, Nova 2 Pro, Nova 2 Sonic, Nova 2 Omni, Nova Act

-   Role: understand questions, retrieve data, compute answers, decide which UI to render

**6. Agent-to-UI Mapping**

Each agent in the system has specific frontend actions and UI components it can trigger. This is the contract between the backend and frontend:

  ----------------- ---------------- ------------------------------------------ -------------------------------------------------------------
  **Agent**         **Nova Model**   **Frontend Actions**                       **UI Components Rendered**

  Query Router      Nova 2 Lite      (none --- routes only)                     Typing indicator while routing

  Q&A Agent         Nova 2 Lite      renderBudgetChart                          BudgetChart (horizontal bars), DepartmentCard (single stat)

  Analyst Agent     Nova 2 Pro       renderBudgetChart, renderComparisonTable   Multi-series chart, comparison table, trend line

  Voice Agent       Nova 2 Sonic     renderAudioPlayer                          AudioPlayer card with waveform, transport controls

  Visual Agent      Nova 2 Omni      renderInfographic                          Infographic image container with download button

  Simulator Agent   Nova 2 Pro       updateConsequences                         ConsequencePanel (dark card with impact analysis)

  Enrichment        Nova Act         renderExternalData                         Citation card with source link and summary
  ----------------- ---------------- ------------------------------------------ -------------------------------------------------------------

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Design Principle: Agents Don't Generate HTML**                                                                                                                                                                                                                                                                                        |
|                                                                                                                                                                                                                                                                                                                                         |
| No agent in Budget Compass ever produces raw HTML, CSS, or UI markup. Agents produce structured data and tool calls. The frontend's pre-built, design-system-compliant components render that data. This guarantees that every visual element matches the Civic Modernism design language regardless of what the agent decides to show. |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

**7. Event Lifecycle: A Question's Journey**

Let's trace a single user interaction end-to-end, showing every AG-UI event and which component handles it. A resident asks: "How has the library budget changed over the last 3 years?"

  -------- ------------------------------ ------------------------ --------------------------------------------------------------
  **\#**   **AG-UI Event**                **Who Handles It**       **What the User Sees**

  1        User sends message             CopilotKit → HTTP POST   Navy bubble appears with user's question

  2        RUN_STARTED                    CopilotChat              Typing indicator (3 pulsing dots) appears

  3        (internal routing)             Query Router → Analyst   Still typing (user waits \~200ms)

  4        TOOL_CALL: queryBudgetData     Mastra → Convex          Still typing (Convex query takes \~50ms)

  5        TOOL_CALL returns data         Analyst Agent            Still typing (agent has the numbers now)

  6        TEXT_MESSAGE_START             CopilotChat              White assistant bubble appears with civic avatar

  7        TEXT_MESSAGE_CONTENT ×n        CopilotChat              Text streams in: "Library funding has decreased by 4.2%\..."

  8        TOOL_CALL: renderBudgetChart   useCopilotAction         Animated trend line chart appears inside the bubble

  9        TEXT_MESSAGE_CONTENT ×n        CopilotChat              More text streams: "This 4.2% decrease translates to\..."

  10       TEXT_MESSAGE_END               CopilotChat              Text finishes

  11       RUN_FINISHED                   CopilotChat              Typing indicator disappears, input re-enables
  -------- ------------------------------ ------------------------ --------------------------------------------------------------

The entire sequence takes 2--4 seconds. The user experiences a smooth, conversational response with an embedded interactive chart --- never a loading spinner, never a page refresh, never a separate "view chart" button.

**Part III**

Implementation Guide

**8. Backend: Mastra Server + CopilotKit Registration**

The backend integration is handled by the registerCopilotKit() helper from \@ag-ui/mastra. This single function call wires your Mastra agents into the AG-UI protocol so CopilotKit can find them.

**Step 1: Install Dependencies**

> npm install \@ag-ui/mastra \@mastra/client-js \@mastra/core \\
>
> \@ag-ui/core \@ag-ui/client \@copilotkit/runtime

**Step 2: Register CopilotKit on the Mastra Server**

> *// src/mastra/index.ts*
>
> import { Mastra } from \'@mastra/core/mastra\';
>
> import { registerCopilotKit } from \'@ag-ui/mastra/copilotkit\';
>
> import { queryRouter } from \'./agents/query-router\';
>
> import { qaAgent } from \'./agents/qa-agent\';
>
> import { analystAgent } from \'./agents/analyst-agent\';
>
> import { voiceAgent } from \'./agents/voice-agent\';
>
> import { visualAgent } from \'./agents/visual-agent\';
>
> import { simulatorAgent } from \'./agents/simulator-agent\';
>
> import { enrichmentAgent } from \'./agents/enrichment-agent\';
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
> enrichmentAgent,
>
> },
>
> server: {
>
> cors: {
>
> origin: \'\*\',
>
> allowMethods: \[\'\*\'\],
>
> allowHeaders: \[\'\*\'\],
>
> },
>
> apiRoutes: \[
>
> registerCopilotKit({
>
> path: \'/copilotkit\',
>
> resourceId: \'queryRouter\',
>
> setContext: (c, runtimeContext) =\> {
>
> runtimeContext.set(\'user-id\',
>
> c.req.header(\'X-User-ID\'));
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

**What's happening here:** registerCopilotKit() creates an AG-UI endpoint at /copilotkit on the Mastra server. It points to the queryRouter agent as the entry point. When the frontend sends a message, it arrives at this endpoint, the Query Router classifies it, and routes it to the right specialist agent. The setContext callback lets us pass user identity from Clerk auth headers into the agent's runtime context.

**Step 3: Start the Mastra Server**

> npx mastra dev

This starts the Mastra server on http://localhost:4111. The CopilotKit endpoint is now live at http://localhost:4111/copilotkit.

**9. Frontend: CopilotKit Provider & Chat**

The frontend integration requires wrapping your app in a CopilotKit provider and placing the CopilotChat component where you want the chat interface to appear.

**Step 1: Install Frontend Packages**

> npm install \@copilotkit/react-core \@copilotkit/react-ui

**Step 2: Create the CopilotKit Provider**

> *// src/app/providers.tsx*
>
> \'use client\';
>
> import { CopilotKit } from \'@copilotkit/react-core\';
>
> import \'@copilotkit/react-ui/styles.css\';
>
> export function Providers({ children }) {
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
> {children}
>
> \</CopilotKit\>
>
> );
>
> }

**runtimeUrl** points to the Mastra server's CopilotKit endpoint. **agent** specifies which Mastra agent receives the first message (our Query Router). CopilotKit automatically handles AG-UI event streaming, reconnection, and state management.

**Step 3: Add to Root Layout**

> *// src/app/layout.tsx*
>
> import { Providers } from \'./providers\';
>
> export default function RootLayout({ children }) {
>
> return (
>
> \<html\>
>
> \<body\>
>
> \<Providers\>{children}\</Providers\>
>
> \</body\>
>
> \</html\>
>
> );
>
> }

**Step 4: Build the Ask Mode Chat Interface**

> *// src/components/modes/ask-mode.tsx*
>
> \'use client\';
>
> import { CopilotChat } from \'@copilotkit/react-ui\';
>
> export function AskMode() {
>
> return (
>
> \<CopilotChat
>
> labels={{
>
> title: \'Budget Compass\',
>
> initial: \'Ask anything about Milwaukee\\\'s
>
> \$1.4B city budget.\',
>
> placeholder: \'e.g., How much do we spend
>
> on parks?\',
>
> }}
>
> className=\"budget-compass-chat\"
>
> /\>
>
> );
>
> }

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Custom Styling**                                                                                                                                                                                                                                                                                           |
|                                                                                                                                                                                                                                                                                                              |
| CopilotKit's CopilotChat accepts className and provides CSS custom properties for full theme control. We override these with our Civic Modernism tokens --- Lake Michigan navy for assistant bubbles, DM Sans for body text, DM Mono for numbers, and our 18px asymmetric border radius for message bubbles. |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

**10. Generative UI: Rendering Charts Inside Chat**

This is where the magic happens. We register frontend actions that CopilotKit will render when the agent calls the matching tool. The agent side defines a tool called renderBudgetChart; the frontend side defines an action with the same name that renders our BudgetChart component.

**Frontend: Register the Generative UI Action**

> *// src/components/copilotkit/budget-chart-action.tsx*
>
> \'use client\';
>
> import { useCopilotAction } from
>
> \'@copilotkit/react-core\';
>
> import { BudgetChart } from \'../ui/budget-bars\';
>
> export function useBudgetChartAction() {
>
> useCopilotAction({
>
> name: \'renderBudgetChart\',
>
> description: \'Display a budget comparison
>
> chart inside the conversation\',
>
> parameters: \[
>
> {
>
> name: \'title\',
>
> type: \'string\',
>
> description: \'Chart title\',
>
> },
>
> {
>
> name: \'departments\',
>
> type: \'object\[\]\',
>
> description: \'Array of {name, amount,
>
> percentage, color}\',
>
> },
>
> {
>
> name: \'totalBudget\',
>
> type: \'number\',
>
> description: \'Total budget for context\',
>
> },
>
> \],
>
> *// This render function is the Generative UI:*
>
> render: ({ status, args }) =\> {
>
> if (status === \'inProgress\') {
>
> return \<ChartSkeleton /\>;
>
> }
>
> return (
>
> \<BudgetChart
>
> title={args.title}
>
> departments={args.departments}
>
> total={args.totalBudget}
>
> /\>
>
> );
>
> },
>
> });
>
> }

**Backend: The Matching Mastra Tool**

> *// src/mastra/tools/render-budget-chart.ts*
>
> import { createTool } from \'@mastra/core\';
>
> import { z } from \'zod\';
>
> export const renderBudgetChart = createTool({
>
> id: \'renderBudgetChart\',
>
> description: \'Render an interactive budget
>
> comparison chart in the frontend\',
>
> inputSchema: z.object({
>
> title: z.string(),
>
> departments: z.array(z.object({
>
> name: z.string(),
>
> amount: z.number(),
>
> percentage: z.number(),
>
> color: z.string(),
>
> })),
>
> totalBudget: z.number(),
>
> }),
>
> execute: async ({ context }) =\> {
>
> *// This tool\'s \"result\" is the data itself.*
>
> *// CopilotKit renders the frontend component.*
>
> return context;
>
> },
>
> });

**How It Connects**

When the Q&A Agent decides a chart would help, it calls the renderBudgetChart tool with data from Convex. Here's the chain:

8.  Agent calls renderBudgetChart({title: "Police vs. Fire Budget", departments: \[\...\], totalBudget: 810700000})

9.  Mastra emits an AG-UI TOOL_CALL_START event with the tool name and parameters

10. CopilotKit on the frontend sees the tool name matches a registered useCopilotAction

11. CopilotKit calls the render function with status: 'inProgress', showing a skeleton loader

12. Once parameters are fully streamed, render is called again with the complete args

13. The BudgetChart component from our design system renders with animated bars

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Critical: Name Matching**                                                                                                                                                                                                                                                                               |
|                                                                                                                                                                                                                                                                                                           |
| The tool name on the Mastra backend (id: \'renderBudgetChart\') must exactly match the action name on the CopilotKit frontend (name: \'renderBudgetChart\'). This string match is how AG-UI knows to route the tool call to the frontend component. A typo here means the chart silently fails to render. |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

**11. Shared State: Keeping Agents and UI in Sync**

Remix mode is the most complex CopilotKit integration because it requires bidirectional state synchronization. When the user moves a budget slider, the agent needs to know. When the agent computes consequences, the UI needs to update.

**How Shared State Works**

CopilotKit's shared state is like a whiteboard that both the agent and the React components can read from and write to. Changes are streamed in real time via AG-UI STATE_DELTA events.

**Frontend: Provide Readable State to the Agent**

> *// src/components/modes/remix-mode.tsx*
>
> \'use client\';
>
> import { useCopilotReadable } from
>
> \'@copilotkit/react-core\';
>
> export function RemixMode() {
>
> const \[allocations, setAllocations\] =
>
> useState(defaultAllocations);
>
> *// Tell the agent about current slider positions*
>
> useCopilotReadable({
>
> description: \'Current budget allocations
>
> set by the user via sliders. Each department
>
> has a name and dollar amount in millions.\',
>
> value: allocations,
>
> });
>
> return (
>
> \<div\>
>
> {allocations.map(dept =\> (
>
> \<RemixSlider
>
> key={dept.name}
>
> department={dept}
>
> onChange={(val) =\>
>
> updateAllocation(dept.name, val)
>
> }
>
> /\>
>
> ))}
>
> \<ConsequencePanel /\>
>
> \</div\>
>
> );
>
> }

**useCopilotReadable** makes the current slider values visible to the Simulator Agent. Every time the user moves a slider, the agent can see the updated allocations in its context. The agent doesn't need to poll or request the data --- CopilotKit pushes it automatically.

**Frontend: Receive Agent State Updates**

> *// Inside ConsequencePanel component*
>
> import { useAgent } from \'@copilotkit/react-core\';
>
> export function ConsequencePanel() {
>
> const { agent } = useAgent({
>
> agentId: \'simulatorAgent\',
>
> });
>
> const consequences =
>
> agent.state?.consequences \|\| \'\';
>
> return (
>
> \<div className=\"consequence-panel\"\>
>
> \<p\>{consequences}\</p\>
>
> \</div\>
>
> );
>
> }

When the Simulator Agent updates its state with new consequence analysis, that update flows through AG-UI as a STATE_DELTA event, and the ConsequencePanel re-renders automatically.

**12. Human-in-the-Loop: Confirmation Patterns**

Some Remix mode actions are significant enough to warrant user confirmation before the agent proceeds. For example, if a user's slider changes would eliminate an entire department's operating budget, the agent should ask: "Are you sure? This would effectively defund the Library system."

**How It Works**

CopilotKit provides useCopilotAction with a renderAndWaitForResponse method. This lets the agent pause execution, render a confirmation UI inside the chat, wait for the user to click a button, and then continue based on their choice.

> *// src/components/copilotkit/confirm-action.tsx*
>
> useCopilotAction({
>
> name: \'confirmBudgetChange\',
>
> description: \'Ask user to confirm a major
>
> budget reallocation before proceeding\',
>
> available: \'remote\',
>
> parameters: \[
>
> { name: \'message\', type: \'string\' },
>
> { name: \'impact\', type: \'string\' },
>
> \],
>
> renderAndWaitForResponse: ({ args, respond }) =\> {
>
> return (
>
> \<ConfirmationCard
>
> message={args.message}
>
> impact={args.impact}
>
> onConfirm={() =\> respond(\'confirmed\')}
>
> onCancel={() =\> respond(\'cancelled\')}
>
> /\>
>
> );
>
> },
>
> });

The agent's execution literally pauses until the user clicks confirm or cancel. This is critical for trust --- residents need to feel in control when exploring budget scenarios.

**13. Multi-Agent Routing with CopilotKit**

Budget Compass has seven agents, but CopilotKit connects to one entry point: the Query Router. The routing happens inside the Mastra agent layer, transparent to CopilotKit.

**How the Router Works**

Mastra supports a pattern where agents can be registered as tools of other agents. The Query Router has each specialist agent available as a callable sub-agent:

14. CopilotKit sends the user's message to the Query Router via the /copilotkit endpoint

15. The Query Router (Nova 2 Lite) classifies the query in \~200ms: is it a simple fact lookup? A complex analysis? A request for audio? A visualization request?

16. Based on classification, the Router calls the appropriate specialist agent as a sub-agent tool

17. The specialist agent processes the query, calls data tools (Convex) and UI tools (renderBudgetChart)

18. All AG-UI events from the specialist agent stream back through the Router to the CopilotKit frontend

19. CopilotKit renders the response exactly as if it came from a single agent --- the multi-agent routing is invisible to the user

**Mode-Based Routing Override**

When the user switches modes in the UI (Ask → Hear → See → Remix), the frontend can optionally change the agent prop on the CopilotKit provider to route directly to the relevant agent, bypassing the router for better latency:

> \<CopilotKit
>
> runtimeUrl=\"http://localhost:4111/copilotkit\"
>
> agent={
>
> activeMode === \'ask\' ? \'queryRouter\' :
>
> activeMode === \'hear\' ? \'voiceAgent\' :
>
> activeMode === \'see\' ? \'visualAgent\' :
>
> \'simulatorAgent\'
>
> }
>
> \>

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Why Route by Mode?**                                                                                                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                                                                                   |
| In Ask mode, the user might ask anything, so the Query Router is needed to classify and dispatch. But in Hear mode, the user is explicitly requesting audio. In See mode, they want a visual. In Remix mode, they're simulating. Direct routing to the specialist agent saves \~200ms of routing latency and reduces token usage from the Router. |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

**Part IV**

Mode-by-Mode Wiring

**14. Ask Mode: Chat + Inline Generative UI**

**CopilotKit Components Used**

-   CopilotChat --- the primary chat interface for all conversational Q&A

-   useCopilotAction: renderBudgetChart --- displays bar charts inside chat bubbles

-   useCopilotAction: renderDepartmentCard --- displays single-stat callout cards

-   useCopilotReadable --- provides conversation context for follow-up questions

**Agent Flow**

User message → Query Router → Q&A Agent (simple) or Analyst Agent (complex) → queryBudgetData tool → Convex returns data → Agent streams text + calls renderBudgetChart → CopilotKit renders chart component inside message bubble.

**Key Design Decision**

The chat interface uses CopilotChat's built-in message rendering but with heavily customized CSS to match Civic Modernism. The asymmetric bubble shapes, DM Sans typography, and navy/white color scheme are applied via CSS custom properties that override CopilotKit's default theme.

**15. Hear Mode: Voice Briefings**

**CopilotKit Components Used**

-   useCopilotAction: renderAudioPlayer --- renders the full audio player card with waveform

-   useCopilotReadable --- provides the current topic selection to the Voice Agent

**Agent Flow**

User selects topic pill → Voice Agent (Nova 2 Sonic) generates real-time audio briefing → Agent calls renderAudioPlayer with audio stream URL and metadata → CopilotKit renders AudioPlayer component with waveform visualizer, transport controls, and progress bar.

**Voice Streaming Architecture**

Nova 2 Sonic provides real-time speech-to-speech capability with a 1M token context window. The audio stream is handled via WebRTC/WebSocket separately from the AG-UI event stream. The AG-UI channel sends control events (play, pause, topic change); the audio payload flows through a direct binary stream for low latency.

**16. See Mode: AI-Generated Infographics**

**CopilotKit Components Used**

-   useCopilotAction: renderInfographic --- renders infographic image or chart container

-   useCopilotAction: renderInsightCallout --- renders highlighted insight boxes

**Agent Flow**

User enters topic prompt or clicks suggestion pill → Visual Agent (Nova 2 Omni) queries Convex for relevant data → Nova 2 Omni generates infographic image with pre-computed numbers injected as text overlays → Agent calls renderInfographic with image URL and metadata → CopilotKit renders downloadable infographic container.

**Why Nova 2 Omni Is Special Here**

Nova 2 Omni is Amazon's first industry model that can generate both text and images in a single response. For Budget Compass, this means the Visual Agent can produce a complete infographic image --- not a chart made from code, but an actual visual design with layout, icons, and typography --- with verified budget numbers baked into the image as text. This is a hackathon differentiator that no other model can match.

**17. Remix Mode: Shared State Budget Simulator**

**CopilotKit Components Used**

-   useCopilotReadable --- pushes current slider allocations to the Simulator Agent

-   useAgent --- reads consequence analysis from the Simulator Agent's state

-   useCopilotAction: confirmBudgetChange --- HITL confirmation for extreme changes

-   useCopilotAction: updateConsequences --- renders the dark ConsequencePanel

**Agent Flow**

User moves slider → useCopilotReadable pushes new allocations → Simulator Agent (Nova 2 Pro) receives STATE_DELTA → Agent computes consequences using code execution → If extreme change: agent calls confirmBudgetChange (HITL) → Agent updates state with consequence text → STATE_DELTA event streams to frontend → ConsequencePanel re-renders with new analysis.

**Debouncing Strategy**

Users may drag sliders rapidly. To avoid overwhelming the Simulator Agent with state updates, the frontend debounces useCopilotReadable updates by 500ms. This means the agent receives at most two updates per second, even if the user is actively dragging multiple sliders.

**The Full Remix Wiring Diagram**

+-----------------------------------------------------------------------+
| RemixSlider → useCopilotReadable → AG-UI STATE_DELTA                  |
|                                                                       |
| ↓                                                                     |
|                                                                       |
| Simulator Agent (Nova 2 Pro) + Code Execution                         |
|                                                                       |
| ↓                                                                     |
|                                                                       |
| Agent updates state → AG-UI STATE_DELTA → useAgent                    |
|                                                                       |
| ↓                                                                     |
|                                                                       |
| ConsequencePanel re-renders with new analysis                         |
+-----------------------------------------------------------------------+

**Part V**

Reference

**18. Package Inventory**

**Frontend (Next.js App)**

  --------------------------- -------------------------------------------------------------------------------
  **Package**                 **Role**

  \@copilotkit/react-core     CopilotKit provider, useCopilotAction, useCopilotReadable, useAgent hooks

  \@copilotkit/react-ui       CopilotChat component with built-in message rendering, streaming, styling

  recharts                    React chart library for BudgetChart, trend lines, pie charts in Generative UI

  framer-motion               Mode card transitions, staggered bar chart animations, page reveals

  tailwindcss                 Utility CSS for responsive layout, spacing, custom theme

  shadcn/ui                   Base components: Slider (Remix), Dialog (HITL), Tooltip
  --------------------------- -------------------------------------------------------------------------------

**Backend (Mastra Server)**

  --------------------------- -----------------------------------------------------------------------
  **Package**                 **Role**

  \@mastra/core               Agent, Tool, Workflow, Mastra class definitions

  \@ag-ui/mastra              registerCopilotKit() helper --- wires Mastra agents to AG-UI protocol

  \@ag-ui/core                AG-UI event types, message models, state management primitives

  \@copilotkit/runtime        CopilotKit server runtime --- handles AG-UI event serialization

  \@ai-sdk/amazon-bedrock     Vercel AI SDK provider for Amazon Nova models via Bedrock

  convex                      Convex client for typed database queries (budget data)

  zod                         Runtime schema validation for all tool inputs and outputs
  --------------------------- -----------------------------------------------------------------------

**19. Environment Variables**

  ------------------------- ------------------ ----------------------------------------------------
  **Variable**              **Where**          **Purpose**

  AWS_ACCESS_KEY_ID         Mastra server      AWS credentials for Bedrock API

  AWS_SECRET_ACCESS_KEY     Mastra server      AWS credentials for Bedrock API

  AWS_REGION                Mastra server      Bedrock region (us-east-1)

  CONVEX_URL                Mastra server      Convex deployment URL

  CLERK_SECRET_KEY          Both               Server-side auth verification

  NEXT_PUBLIC_CLERK_KEY     Next.js frontend   Client-side auth provider

  NEXT_PUBLIC_MASTRA_URL    Next.js frontend   Mastra server URL (default: http://localhost:4111)
  ------------------------- ------------------ ----------------------------------------------------

**20. Troubleshooting & Common Patterns**

**Chart doesn't render in chat bubble**

The most common cause is a tool name mismatch. Verify that the id in your Mastra createTool() exactly matches the name in your useCopilotAction(). Both are case-sensitive strings. Use console.log on both sides to verify the names match at runtime.

**Agent response is empty or times out**

Check that the Mastra server is running (npx mastra dev) and the runtimeUrl in the CopilotKit provider points to the correct address and port. Check CORS settings in the Mastra server configuration --- origin: \'\*\' is required for local development.

**Shared state updates are laggy**

useCopilotReadable pushes state to the agent on every render. For high-frequency updates like slider dragging, wrap the state update in a debounce (500ms recommended). React's useDeferredValue can also help by deprioritizing state pushes.

**HITL confirmation renders but agent doesn't wait**

Ensure the action uses renderAndWaitForResponse (not just render) and that the agent-side tool is configured with available: 'remote'. The agent must call the tool as a frontend action, not a backend tool.

**Multiple agents respond to the same question**

This happens when the Query Router doesn't classify correctly. Improve the Router's system prompt with more explicit routing rules and example queries. Adding a confidence threshold (\>0.8 to route, otherwise ask for clarification) helps prevent misroutes.

**CopilotChat styling doesn't match design system**

CopilotKit's default styles are loaded via \@copilotkit/react-ui/styles.css. Override with higher-specificity CSS using the .budget-compass-chat wrapper class, or use CopilotKit's CSS custom properties to remap colors, fonts, and border radii to your Civic Modernism tokens.

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Document Summary**                                                                                                                                                                                                                                                                                                                                                                                                          |
|                                                                                                                                                                                                                                                                                                                                                                                                                               |
| This guide documents the full CopilotKit + AG-UI integration for MKE Budget Compass. It pairs with three companion documents: the Product Requirements Document (tech stack and architecture), the Mastra Agent Implementation Guide (agent code and tools), and the UX/UI Design Guide (visual design system and components). Together, these four documents provide everything needed to build Budget Compass from scratch. |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
