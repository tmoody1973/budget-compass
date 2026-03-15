# Budget Compass -- Social media post for Amazon Nova AI Hackathon

## LinkedIn / Twitter (long-form)

I built Budget Compass because city budgets are public record but nobody actually reads them.

Milwaukee's 2026 proposed budget is 291 pages. It decides how $1.7 billion gets spent -- police, fire, parks, libraries, everything. Most residents never see it. I wanted to change that.

Budget Compass takes your home address, pulls your actual assessed value from Milwaukee's property database, and shows you a personalized tax receipt: here's what you paid, and here's exactly where every dollar went. Schools, police, fire, debt service, all of it. Each line item gets a plain-language explanation so you don't need an MPA to understand your own taxes.

But the tax receipt is just the entry point. The app has four modes:

**Ask** -- Talk to the budget like you'd talk to a person. "How much does Milwaukee spend on snow removal?" or "Why did the police budget go up?" A query router figures out whether you need a quick factual lookup or a deeper fiscal analysis and sends your question to the right specialist agent.

**Remix** -- Model "what if" scenarios. Cut the police budget 20%, shift funding to mental health services, and see the cascade: which positions get affected, how the tax rate changes, what services shrink or grow. It's honest about trade-offs.

**See** -- Interactive charts and infographics. Department comparisons, trend lines over five years, treemaps of the full budget hierarchy. Built for the person who thinks in pictures.

**Hear** -- Audio briefings written for the ear, not the page. "About eight hundred million dollars" instead of "$800M." Styled after public radio, personalized to your household. Amazon Polly handles the text-to-speech.

## How it works under the hood

The system runs 8 specialized agents on Amazon Bedrock, all orchestrated through the Mastra framework:

- A **query router** (Nova Lite) that never answers questions directly -- it classifies intent and dispatches to the right specialist
- **QA and Analyst agents** (Nova Lite / Nova Pro) for factual lookups vs. deeper fiscal analysis
- **Simulator, Visual, and Voice agents** (Nova Pro) for budget modeling, chart generation, and audio scripts
- A **receipt insights agent** that writes your personalized tax story and "did you know" civic facts

Every financial number comes from one of two verified sources -- never from the LLM's head:

1. **Convex database** with 12 structured tables (departments, appropriations, positions, historical comparisons, tax rates) seeded from official budget documents. 18 typed query functions. Agents query this for exact dollar amounts.

2. **Amazon Bedrock Knowledge Bases** with indexed policy documents (City Budget Brief, County Budget Brief, MPS Budget Brief, Wisconsin Policy Forum analysis). This handles the "why" questions -- policy context, narrative explanations, source citations with page numbers.

Property data comes from Milwaukee's MPROP open data API through the city's CKAN portal. Address autocomplete searches the database in real-time, returns assessed values, and identifies your aldermanic district, police district, and fire station.

The frontend uses CopilotKit with the AG-UI protocol for streaming agent responses and rendering charts inline. Next.js on Vercel. Clerk for auth.

## Data methodology

All budget figures trace back to the City of Milwaukee's 2026 Proposed Budget and supporting documents from Milwaukee County and Milwaukee Public Schools. Tax rates come from the 2026 rate tables published by the city assessor. Property assessments are pulled live from the MPROP database maintained by the City of Milwaukee.

The agents are instructed to never estimate or calculate mentally. If a number isn't in the database, the agent says so. Every policy claim links back to a source document with page numbers where possible.

This matters because the whole point of the app is trust. If someone looks up their tax bill and sees a number that doesn't match their actual bill, the tool is worse than useless. So the architecture enforces a hard separation: LLMs handle language and routing, databases handle numbers.

## The short version

Budget Compass turns a 291-page city budget into a conversation. Enter your address, see your personal tax receipt, ask questions, remix scenarios, visualize the data, or listen to a briefing. Eight Amazon Nova agents. Zero hallucinated numbers.

Built for the Amazon Nova AI Hackathon. Built for Milwaukee.

budget-compass.vercel.app

#AmazonNova #AWSBedrock #AIHackathon #CivicTech #Milwaukee #OpenData #Mastra #CopilotKit

---

## Twitter/X thread version

**1/** I built an app that turns Milwaukee's 291-page city budget into a conversation.

Enter your home address. Get a personalized tax receipt showing exactly where your money goes. Then ask it anything.

budget-compass.vercel.app

**2/** The problem: city budgets are public but unreadable. $1.7 billion in spending decisions, buried in PDF tables. Most people never look. Not because they don't care -- because the format is hostile.

**3/** Budget Compass has 4 modes:

ASK -- "How much do we spend on parks?" Natural language, real answers from the actual budget data.

REMIX -- "What if we cut police 20%?" See the cascading effects on services, positions, and your tax rate.

**4/** SEE -- Interactive charts. Department comparisons, 5-year trends, full budget treemaps.

HEAR -- Audio briefings written for your ear, personalized to your household, powered by Amazon Polly.

**5/** Under the hood: 8 specialized agents on Amazon Bedrock (Nova Lite + Nova Pro), orchestrated with Mastra.

A query router classifies your intent and sends it to the right specialist -- QA, analyst, simulator, visual, or voice agent.

**6/** The hard rule: no hallucinated numbers. Every dollar amount comes from a Convex database with 12 structured tables, or from Bedrock Knowledge Bases with indexed policy documents.

LLMs handle language. Databases handle math. That's the whole architecture.

**7/** Property data comes live from Milwaukee's MPROP open data API. Type your address, get your assessed value, see your actual tax breakdown across city, county, MPS, and state.

**8/** Built with: Amazon Bedrock, Nova Lite, Nova Pro, Amazon Polly, Mastra, CopilotKit + AG-UI protocol, Convex, Next.js, Vercel, Clerk

Built for the Amazon Nova AI Hackathon. Built for Milwaukee.

#AmazonNova #AWSBedrock #CivicTech

---

## Short post (Instagram / quick share)

Your city spends $1.7 billion a year. Do you know where your tax dollars actually go?

I built Budget Compass -- type in your Milwaukee address, see a personalized tax receipt, and talk to the budget like it's a person. Ask questions, remix scenarios, visualize the data, listen to audio briefings.

8 AI agents. Zero made-up numbers. Every figure pulled from the actual city budget.

budget-compass.vercel.app

#AmazonNova #CivicTech #Milwaukee #AIHackathon
