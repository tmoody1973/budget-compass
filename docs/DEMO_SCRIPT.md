# Budget Compass — Demo Video Script (3 minutes)

**Category:** Agentic AI
**Required:** Include #AmazonNova in video

**Nova integration points to highlight:**
1. 8 specialized Amazon Nova 2 Lite agents with tool use
2. Query router agent that classifies intent and dispatches to specialists
3. Bedrock Knowledge Bases (RAG) with 6 indexed policy documents
4. Nova 2 Lite document understanding — reads budget PDFs directly via Converse API
5. Extended thinking for complex budget analysis
6. 6 typed tools the agents call (Convex queries, chart rendering, narrative search, KB search)

---

## 0:00–0:20 — The problem

*[Show a 291-page budget PDF scrolling, then the Budget Compass landing page]*

"Milwaukee spends 1.7 billion dollars a year. The budget that decides where it goes is 291 pages of PDF tables that almost nobody reads. I built Budget Compass to fix that — using Amazon Nova's reasoning and document understanding to make city budgets personal, interactive, and educational."

## 0:20–0:45 — Landing page + personalization

*[Show the landing page. Type an address, show autocomplete, click a suggestion]*

"Enter your Milwaukee address. Budget Compass pulls your actual assessed value from the city's MPROP open data API — this is real property data, not a demo. Pick your persona. The Nova agents tailor every explanation to who you are — a homeowner gets different context than a student or a journalist."

*[Click "See My Tax Breakdown"]*

## 0:45–1:15 — Tax receipt (Nova agents explaining line items)

*[Show the tax receipt with jurisdiction breakdown]*

"Here's your personalized tax receipt — $3,247 a year broken down by jurisdiction. MPS gets 43 cents of every dollar, the city gets 34 cents, the county 14.

Now here's where Nova comes in. Click any line item and a **Nova 2 Lite agent** explains what you're paying for in two sentences of plain language. It calls the `queryBudgetData` tool to get the exact dollar amount from our Convex database, then generates the explanation. The architecture rule is strict: Nova handles language and reasoning, but every number comes from the database. Zero hallucinated figures."

*[Click a line item, show the explanation appearing]*

## 1:15–1:45 — Ask mode (multi-agent routing + Knowledge Base RAG)

*[Switch to Ask tab]*

"This is where the agentic architecture shines. We have **8 specialized Nova 2 Lite agents**, each with a different job. When you type a question, a **query router agent** classifies your intent — is this a simple factual lookup, a complex analysis, a budget simulation, or a visualization request? — and dispatches to the right specialist. The router never answers directly. It delegates."

*[Type: "Why did the MPS levy increase?"]*

"Watch this one. The question asks 'why' — so the router sends it to the analyst agent, which calls two tools: `queryBudgetData` for the exact levy numbers, and `searchBudgetDocs` which queries our **Bedrock Knowledge Base**. That KB has 6 indexed documents — Wisconsin Policy Forum budget briefs, the city's proposed budget, the county's adopted budget. The answer comes back with source citations and page numbers linked to the original PDFs."

*[Highlight the source citation in the response]*

## 1:45–2:05 — Budget 101 (educational guided flow)

*[Switch to Budget 101 tab]*

"For people who don't know what questions to ask — students especially — we built Budget 101. A Nova 2 Lite agent walks you through the budget in 6 steps, personalized to your home value. Each answer is generated live by the same agent that powers the Ask tab, but the questions are pre-structured to build understanding progressively. Step 1 is the big picture, step 6 is your neighborhood.

After every answer, the agent suggests follow-up questions so you always know where to go next."

*[Show step 1 response streaming, click Next]*

## 2:05–2:30 — Document understanding (Nova reading budget PDFs)

*[Show terminal running the extraction script, or show the before/after: PDF → JSON]*

"Here's what makes this scalable to any city. We use **Nova 2 Lite's document understanding** — the same model, but now processing a PDF directly through the Bedrock Converse API. We sent it Madison's 3.4 megabyte budget brief. Nova read the tables, understood the layout, and extracted 9 departments with budget amounts, 6 revenue sources, and the property tax levy — all into validated JSON."

*[Show the madison.json output briefly]*

*[Switch to Ask tab, type: "How does Milwaukee's police spending compare to Madison?"]*

"Now the agents can answer cross-city comparison questions. Milwaukee spends 22% of its budget on police — how does that stack up against Madison? The data was extracted from a real PDF by Nova, not entered by hand."

## 2:30–2:50 — Architecture recap

*[Show a simple architecture diagram or on-screen text]*

"Let me recap the Nova integration:

**8 Nova 2 Lite agents** — query router, QA, analyst, simulator, visual, voice, budget, and receipt insights — all on Amazon Bedrock.

**6 typed tools** the agents call — Convex database queries, chart rendering, narrative search, Bedrock Knowledge Base search.

**Document understanding** — Nova reads raw budget PDFs and extracts structured data through the Converse API.

**Bedrock Knowledge Bases** — RAG over 6 indexed policy documents with source citations.

The hard rule: Nova reasons and explains. Databases hold the numbers. That separation is why we can say zero hallucinated figures."

## 2:50–3:00 — Close

"Budget Compass turns a 291-page PDF into a conversation. Enter your address. See where your money goes. Ask anything. Compare cities. Learn the budget from scratch.

Built for Milwaukee. Built with Amazon Nova. #AmazonNova"

*[Show URL: budget-compass.vercel.app]*
