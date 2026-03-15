# Budget Compass — Demo Video Script (3 minutes)

**Category:** Agentic AI
**Required:** Include #AmazonNova in video

---

## 0:00–0:15 — The problem

*[Show Milwaukee skyline or city hall photo, then cut to a 291-page budget PDF scrolling]*

"Milwaukee spends 1.7 billion dollars a year. The budget that decides where it all goes? 291 pages of PDF tables. Almost nobody reads it. Budget Compass changes that."

## 0:15–0:40 — Landing page + address entry

*[Show the landing page with hero section and bento grid]*

"Enter your Milwaukee address and Budget Compass pulls your actual property assessment from the city's MPROP database. Or pick a preset home value. Choose your persona — resident, student, or journalist — and the AI tailors its explanations to you."

*[Type an address, show autocomplete suggestions, click one]*

"The address lookup is live — it hits Milwaukee's open data API in real time."

*[Click "See My Tax Breakdown"]*

## 0:40–1:10 — Tax receipt

*[Show the personalized tax receipt loading]*

"Here's your personalized tax receipt. For this home, you pay $3,247 a year. The receipt breaks that down by jurisdiction — MPS gets 43 cents of every dollar, the city gets 34, the county 14. Click any line item and an AI agent explains what you're paying for in plain language."

*[Click a line item to show the explanation]*

"Every number comes from the actual budget database. The agents are instructed to never estimate — if the number isn't in the data, they say so."

## 1:10–1:35 — Ask mode + Knowledge Base

*[Switch to Ask tab]*

"The Ask tab connects you to 8 specialized Nova 2 Lite agents. A query router classifies your question and dispatches it to the right specialist."

*[Type: "Why did the MPS levy increase?"]*

"Watch — it searches our Bedrock Knowledge Base, which has indexed the Wisconsin Policy Forum budget briefs and the city's proposed budget documents. The answer comes back with source citations and page numbers you can click through to the original PDF."

*[Highlight the source citation in the response]*

"That's RAG with real civic documents, not generic training data."

## 1:35–1:55 — Explore + Simulate

*[Switch to Explore tab, click through treemap]*

"The Explore tab is an interactive treemap of all three jurisdictions — city, county, and MPS. Click to drill down. Every block shows your personal tax share."

*[Switch to Remix tab, drag a slider]*

"The Remix tab lets you play budget designer. Cut public safety 10%, and see your tax bill drop by $87. The tool shows the tradeoffs honestly."

## 1:55–2:15 — Budget 101

*[Switch to Budget 101 tab]*

"For people who've never looked at a city budget — students especially — we built Budget 101. It's a guided 6-step walkthrough where the AI explains the budget from scratch, personalized to your home value. No prior knowledge needed."

*[Show step 1 loading, then click Next to step 2]*

"Each step builds on the last. The agent suggests follow-up questions so you always know where to go next."

## 2:15–2:40 — Document understanding + cross-city comparison

*[Show terminal running extract-budget.py, or show the Madison JSON output]*

"Here's what makes this scalable. We use Nova 2 Lite's document understanding to read budget PDFs directly. We fed it Madison's budget brief — a 3.4 megabyte PDF — and it extracted 9 departments, 6 revenue sources, and the tax levy into structured JSON."

*[Switch to Ask tab, type: "How does Milwaukee's police spending compare to Madison?"]*

"Now the agents can answer cross-city comparison questions using data extracted from those PDFs. This same pipeline works for any city that publishes a budget document."

## 2:40–2:55 — Architecture summary

*[Show architecture diagram or bullet list]*

"Under the hood: 8 Amazon Nova 2 Lite agents orchestrated with Mastra. Bedrock Knowledge Bases for policy document RAG. Nova 2 Lite document understanding for PDF extraction. Convex for verified budget data. CopilotKit with AG-UI for the frontend. Every financial number comes from a database, never from the model."

## 2:55–3:00 — Close

"Budget Compass. Making city budgets engaging, educational, and personal. Built with Amazon Nova."

*[Show logo + URL: budget-compass.vercel.app]*

"#AmazonNova"
