# Budget Compass Hackathon Final Push

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Budget Compass to maximize Nova 2 integration, add cross-city budget comparison via PDF document understanding, polish UX for demo video impact, and remove broken Sonic code -- all before the Mar 16 5:00 PM PT deadline.

**Architecture:** Nova 2 Lite replaces all v1 model IDs across 8 agents. A new Python extraction script uses Nova 2 Lite's document understanding to read budget PDFs from other Wisconsin cities, extract structured data, and store it alongside Milwaukee's data. The app shell, landing page, and typography get a visual overhaul for demo impact. Broken Sonic/voice code is removed.

**Tech Stack:** Amazon Nova 2 Lite (Bedrock Converse API), Python + boto3, Next.js 15, Tailwind CSS, Mastra agents, Bedrock Knowledge Bases

**Deadline:** March 16, 2026 5:00 PM PT

---

## Chunk 1: Model upgrades + Sonic removal (low risk, high signal)

### Task 1: Upgrade all model IDs to Nova 2 Lite

**Files:**
- Modify: `src/mastra/agents/query-router.ts` (line 35)
- Modify: `src/mastra/agents/qa-agent.ts` (line ~46)
- Modify: `src/mastra/agents/analyst-agent.ts` (line 31)
- Modify: `src/mastra/agents/simulator-agent.ts` (line 59)
- Modify: `src/mastra/agents/visual-agent.ts` (line 31)
- Modify: `src/mastra/agents/voice-agent.ts` (line 29)
- Modify: `src/app/api/voice-briefing/route.ts` (line 56)

All 7 files need the same change: replace the model ID string.

- [ ] **Step 1: Replace `us.amazon.nova-lite-v1:0` with `us.amazon.nova-2-lite-v1:0`**

In `query-router.ts` and `qa-agent.ts`, change:
```typescript
model: bedrock("us.amazon.nova-lite-v1:0"),
```
to:
```typescript
model: bedrock("us.amazon.nova-2-lite-v1:0"),
```

- [ ] **Step 2: Replace `us.amazon.nova-pro-v1:0` with `us.amazon.nova-2-lite-v1:0`**

In `analyst-agent.ts`, `simulator-agent.ts`, `visual-agent.ts`, `voice-agent.ts`, change:
```typescript
model: bedrock("us.amazon.nova-pro-v1:0"),
```
to:
```typescript
model: bedrock("us.amazon.nova-2-lite-v1:0"),
```

- [ ] **Step 3: Replace model ID in voice-briefing API route**

In `src/app/api/voice-briefing/route.ts`, change:
```typescript
modelId: "us.amazon.nova-pro-v1:0",
```
to:
```typescript
modelId: "us.amazon.nova-2-lite-v1:0",
```

- [ ] **Step 4: Verify the app still builds**

Run: `cd /Users/tarikmoody/Documents/Projects/budget-compass && npx next build 2>&1 | tail -20`
Expected: Build succeeds with no errors related to model IDs.

- [ ] **Step 5: Commit**

```bash
git add src/mastra/agents/*.ts src/app/api/voice-briefing/route.ts
git commit -m "feat: upgrade all agents to Nova 2 Lite for hackathon"
```

### Task 2: Remove Sonic/voice dead code

**Files:**
- Modify: `src/components/app-shell.tsx` -- remove VoicePanel import and render
- Modify: `src/components/tabs/tax-receipt.tsx` -- remove SonicClient imports and usage
- Modify: `src/components/modes/ask-mode.tsx` -- remove Sonic references
- Do NOT delete: `src/components/voice-panel.tsx`, `src/components/sonic-visualizer.tsx`, `src/lib/sonic-client.ts` -- keep files, just disconnect them from the app

- [ ] **Step 1: Remove VoicePanel from app-shell.tsx**

In `src/components/app-shell.tsx`:
- Remove the import: `import { VoicePanel } from "@/components/voice-panel";`
- Remove the render: `<VoicePanel />`

- [ ] **Step 2: Remove SonicClient from tax-receipt.tsx**

In `src/components/tabs/tax-receipt.tsx`:
- Remove import of `SonicClient` and `SonicState` from `@/lib/sonic-client`
- Remove import of `SonicVisualizer`
- Remove any Sonic-related state variables, effects, and JSX
- Keep all tax receipt functionality intact

- [ ] **Step 3: Remove Sonic references from ask-mode.tsx**

In `src/components/modes/ask-mode.tsx`:
- Remove any SonicClient imports and usage

- [ ] **Step 4: Verify build**

Run: `cd /Users/tarikmoody/Documents/Projects/budget-compass && npx next build 2>&1 | tail -20`
Expected: Build succeeds. No runtime references to Sonic.

- [ ] **Step 5: Commit**

```bash
git add src/components/app-shell.tsx src/components/tabs/tax-receipt.tsx src/components/modes/ask-mode.tsx
git commit -m "chore: remove broken Sonic/voice integration from app shell"
```

---

## Chunk 2: PDF document understanding pipeline for cross-city comparison

### Task 3: Find and download Wisconsin city budget PDFs

**Files:**
- Create: `scripts/budget-pdfs/` directory
- Download: 2-3 Wisconsin city budget PDFs (Madison, Green Bay, or Racine)

- [ ] **Step 1: Search for publicly available Wisconsin city budget PDFs**

Target cities with published budget summaries or budget briefs. The Wisconsin Policy Forum publishes budget briefs for multiple cities. Madison's budget is well-documented.

Search for:
- Madison 2025 or 2026 budget summary PDF
- Green Bay or Racine budget summary PDF
- Wisconsin Policy Forum budget briefs for other cities

- [ ] **Step 2: Download 2-3 PDFs into scripts/budget-pdfs/**

```bash
mkdir -p scripts/budget-pdfs
# Download found PDFs using curl
```

Keep PDFs under 4.5 MB each (Bedrock limit for non-PDF/DOCX formats -- PDF and DOCX are exempt from the 4.5 MB limit but keep them reasonable for processing speed).

- [ ] **Step 3: Commit the PDFs**

```bash
git add scripts/budget-pdfs/
git commit -m "chore: add Wisconsin city budget PDFs for document understanding demo"
```

### Task 4: Build the PDF extraction script

**Files:**
- Create: `scripts/extract-budget.py`

This script reads a city budget PDF, sends it to Nova 2 Lite via the Bedrock Converse API, and extracts structured budget data as JSON.

- [ ] **Step 1: Create the extraction script**

```python
#!/usr/bin/env python3
"""
Extract structured budget data from city budget PDFs using Amazon Nova 2 Lite
document understanding via the Bedrock Converse API.

Usage:
    python scripts/extract-budget.py scripts/budget-pdfs/madison-budget.pdf --city Madison --state WI --population 269840
"""

import argparse
import json
import sys
from pathlib import Path

import boto3
from botocore.exceptions import ClientError

client = boto3.client("bedrock-runtime", region_name="us-east-1")
MODEL_ID = "us.amazon.nova-2-lite-v1:0"

EXTRACTION_PROMPT = """You are a municipal budget analyst. Extract structured budget data from this document.

Return ONLY valid JSON matching this exact schema (no markdown, no explanation):

{
  "city": "<city name>",
  "state": "<state abbreviation>",
  "fiscal_year": <year as integer>,
  "population": <population as integer>,
  "total_budget": <total budget in dollars as integer>,
  "tax_rate_per_1000": <property tax rate per $1,000 assessed value, or null if not found>,
  "departments": [
    {
      "name": "<department name>",
      "category": "<one of: public_safety, infrastructure, community_services, government_ops, education, health_human_services, parks_recreation, debt_service, other>",
      "budget": <budget amount in dollars as integer>,
      "percent_of_total": <percentage as float, e.g. 15.2>
    }
  ],
  "revenue_sources": [
    {
      "source": "<revenue source name>",
      "amount": <amount in dollars as integer>
    }
  ]
}

Rules:
- Extract EVERY department or functional area with a budget amount
- Use exact dollar amounts from the document, never estimate
- Normalize department names to standard categories using the category field
- If a field is not found in the document, use null
- If population is not in the document, use the value provided in the prompt
- Round dollar amounts to whole numbers
"""


def extract_budget(pdf_path: str, city: str, state: str, population: int) -> dict:
    pdf_bytes = Path(pdf_path).read_bytes()
    pdf_name = Path(pdf_path).stem

    prompt = f"{EXTRACTION_PROMPT}\n\nCity: {city}, {state}\nPopulation: {population}"

    response = client.converse(
        modelId=MODEL_ID,
        messages=[
            {
                "role": "user",
                "content": [
                    {"text": prompt},
                    {
                        "document": {
                            "format": "pdf",
                            "name": pdf_name,
                            "source": {"bytes": pdf_bytes},
                        }
                    },
                ],
            }
        ],
        inferenceConfig={"maxTokens": 8192, "temperature": 0.1},
    )

    response_text = response["output"]["message"]["content"][0]["text"]

    # Strip markdown code fences if present
    text = response_text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()
    if text.startswith("json"):
        text = text[4:].strip()

    return json.loads(text)


def main():
    parser = argparse.ArgumentParser(description="Extract budget data from PDF using Nova 2 Lite")
    parser.add_argument("pdf_path", help="Path to the budget PDF file")
    parser.add_argument("--city", required=True, help="City name")
    parser.add_argument("--state", required=True, help="State abbreviation")
    parser.add_argument("--population", required=True, type=int, help="City population")
    parser.add_argument("--output", help="Output JSON file path (default: stdout)")
    args = parser.parse_args()

    if not Path(args.pdf_path).exists():
        print(f"Error: PDF not found: {args.pdf_path}", file=sys.stderr)
        sys.exit(1)

    print(f"Extracting budget data from: {args.pdf_path}", file=sys.stderr)
    print(f"City: {args.city}, {args.state} (pop. {args.population:,})", file=sys.stderr)
    print(f"Model: {MODEL_ID}", file=sys.stderr)
    print("Sending PDF to Nova 2 Lite for document understanding...", file=sys.stderr)

    try:
        data = extract_budget(args.pdf_path, args.city, args.state, args.population)
    except ClientError as e:
        print(f"Bedrock API error: {e}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON from Nova response: {e}", file=sys.stderr)
        sys.exit(1)

    output = json.dumps(data, indent=2)

    if args.output:
        Path(args.output).write_text(output)
        print(f"Saved to: {args.output}", file=sys.stderr)
    else:
        print(output)

    dept_count = len(data.get("departments", []))
    total = data.get("total_budget", 0)
    print(f"\nExtracted {dept_count} departments, total budget: ${total:,.0f}", file=sys.stderr)


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Test the script against a budget PDF**

```bash
cd /Users/tarikmoody/Documents/Projects/budget-compass
python scripts/extract-budget.py scripts/budget-pdfs/<city-budget>.pdf \
  --city Madison --state WI --population 269840 \
  --output data/comparison/madison.json
```

Expected: JSON output with departments, budgets, and categories extracted from the PDF.

- [ ] **Step 3: Run extraction for each downloaded city budget PDF**

```bash
mkdir -p data/comparison
python scripts/extract-budget.py scripts/budget-pdfs/<madison>.pdf --city Madison --state WI --population 269840 --output data/comparison/madison.json
python scripts/extract-budget.py scripts/budget-pdfs/<green-bay>.pdf --city "Green Bay" --state WI --population 107395 --output data/comparison/green-bay.json
```

- [ ] **Step 4: Validate extracted data manually**

Open each JSON file and spot-check:
- Are department names reasonable?
- Do dollar amounts look right (not off by 1000x)?
- Does the total match the sum of departments?
- Are categories assigned correctly?

Fix any issues by adjusting the extraction prompt and re-running.

- [ ] **Step 5: Commit extraction script and comparison data**

```bash
git add scripts/extract-budget.py data/comparison/
git commit -m "feat: add Nova 2 Lite PDF document understanding for cross-city budget extraction"
```

### Task 5: Add comparison data to the app

**Files:**
- Create: `data/comparison/index.ts` -- exports all comparison city data
- Modify: `src/mastra/tools/query-budget-data.ts` -- add comparison query functions
- Modify: `src/mastra/agents/analyst-agent.ts` -- update instructions to handle comparison questions

- [ ] **Step 1: Create comparison data index**

Create `data/comparison/index.ts` that imports all comparison JSON files and exports them as a typed array:

```typescript
import madisonData from "./madison.json";
import greenBayData from "./green-bay.json";

export interface ComparisonCity {
  city: string;
  state: string;
  fiscal_year: number;
  population: number;
  total_budget: number;
  tax_rate_per_1000: number | null;
  departments: {
    name: string;
    category: string;
    budget: number;
    percent_of_total: number;
  }[];
  revenue_sources: {
    source: string;
    amount: number;
  }[];
}

export const comparisonCities: ComparisonCity[] = [
  madisonData as ComparisonCity,
  greenBayData as ComparisonCity,
];
```

- [ ] **Step 2: Add comparison query to query-budget-data tool**

Add a new query function `getComparisonData` that returns all comparison cities' budget data alongside Milwaukee's, normalized by category. This lets the analyst agent answer questions like "How does Milwaukee's police spending compare to Madison's?"

- [ ] **Step 3: Update analyst agent instructions**

Add to the analyst agent's instructions:
```
- For cross-city comparison questions, use queryBudgetData with query "getComparisonData" to get
  budget data from other Wisconsin cities. Compare per-capita spending, category percentages,
  and tax rates. Always note that comparison data was extracted from official budget PDFs using
  Nova 2 Lite document understanding.
```

- [ ] **Step 4: Test a comparison query through the chat**

Open the app, go to Ask tab, type: "How does Milwaukee's police spending compare to Madison?"
Expected: Agent queries both Milwaukee and comparison data, provides per-capita comparison.

- [ ] **Step 5: Commit**

```bash
git add data/comparison/ src/mastra/tools/query-budget-data.ts src/mastra/agents/analyst-agent.ts
git commit -m "feat: add cross-city budget comparison using Nova document understanding data"
```

---

## Chunk 3: UX polish for demo impact

### Task 6: Redesign the landing page

**Files:**
- Modify: `src/components/landing.tsx`

The landing page needs to:
- Have a clear, impactful headline with larger text
- Show Milwaukee identity (colors, personality)
- Make the address input prominent and inviting
- Explain what Budget Compass does in one sentence
- Have larger, more readable text throughout
- Feel polished enough for a demo video

- [ ] **Step 1: Redesign the landing page component**

Key changes:
- Larger headline (text-4xl → text-5xl)
- Subheadline that explains the value prop: "See exactly where your property tax dollars go"
- Milwaukee blue (#2563eb) as primary color
- Larger input fields and buttons
- Better visual hierarchy
- Add a brief "Powered by Amazon Nova" badge
- Increase font sizes across the board (text-sm → text-base minimum)

- [ ] **Step 2: Visual test in browser**

Open the app and verify:
- Text is readable at arm's length
- Address autocomplete works (after our middleware fix)
- Preset buttons are clearly tappable
- The page looks good on both desktop and mobile

- [ ] **Step 3: Commit**

```bash
git add src/components/landing.tsx
git commit -m "feat: redesign landing page for hackathon demo impact"
```

### Task 7: Polish the app shell

**Files:**
- Modify: `src/components/app-shell.tsx`

- [ ] **Step 1: Improve the header**

- Larger app title
- Milwaukee blue background for header instead of plain white
- Larger context pills (assessed value, tax amount)
- Better contrast and readability

- [ ] **Step 2: Improve the tab navigation**

- Larger tab labels with descriptions
- Better active state styling
- Add brief description under each tab name:
  - Receipt: "Your tax breakdown"
  - Explore: "Interactive budgets"
  - Simulate: "What-if scenarios"
  - Ask: "Chat with the budget"

- [ ] **Step 3: Increase base font sizes**

Audit all tab content components for text-xs and text-sm usage. Bump minimum to text-sm (was text-xs) and text-base (was text-sm) for body content.

- [ ] **Step 4: Commit**

```bash
git add src/components/app-shell.tsx
git commit -m "feat: polish app shell with larger text, Milwaukee identity, better navigation"
```

### Task 8: Polish individual tab UX

**Files:**
- Modify: `src/components/tabs/tax-receipt.tsx` -- larger text, clearer hierarchy
- Modify: `src/components/tabs/ask-chat.tsx` -- larger messages, better starter cards
- Modify: `src/components/tabs/explore-budgets.tsx` -- larger labels
- Modify: `src/components/tabs/budget-simulator.tsx` -- larger labels, better slider readability

- [ ] **Step 1: Increase text sizes in tax-receipt.tsx**

- Line item text: text-sm → text-base
- Dollar amounts: ensure font-bold and large enough to read
- Section headings: text-lg → text-xl
- Explanation text: text-xs → text-sm minimum

- [ ] **Step 2: Improve ask-chat.tsx**

- Message bubbles: text-sm → text-base
- Starter question cards: larger text, more padding
- Input field: larger (py-2 → py-3)
- Remove the mock response disclaimer text (the API works)

- [ ] **Step 3: Polish explore-budgets.tsx and budget-simulator.tsx**

- Treemap labels: increase font sizes in rich text config
- Summary bar numbers: ensure they're large and bold
- Slider labels: text-xs → text-sm
- Budget amounts: ensure readability

- [ ] **Step 4: Commit**

```bash
git add src/components/tabs/
git commit -m "feat: increase font sizes and improve readability across all tabs"
```

---

## Chunk 4: Demo video preparation

### Task 9: Write the demo video script

**Files:**
- Create: `docs/DEMO_SCRIPT.md`

The video must be ~3 minutes, include #AmazonNova hashtag, and demonstrate:
1. The problem (budget PDFs nobody reads)
2. The solution (personalized tax receipt + 4 modes)
3. Technical depth (multi-agent architecture, document understanding)
4. Cross-city comparison (Nova 2 Lite reading PDFs)
5. Knowledge base RAG with source citations

- [ ] **Step 1: Write the demo script**

Structure:
- 0:00-0:20 -- Hook: "Milwaukee spends $1.7 billion a year. Do you know where your tax dollars go?"
- 0:20-0:50 -- Landing page: enter address, see personalized tax receipt
- 0:50-1:20 -- Tax receipt walkthrough: line items, explanations, "did you know" facts
- 1:20-1:40 -- Explore tab: treemap drill-down
- 1:40-2:00 -- Ask tab: "Why did the MPS levy increase?" (shows KB RAG with source citation)
- 2:00-2:20 -- Simulate tab: cut police 10%, see tax impact
- 2:20-2:40 -- Cross-city comparison: "How does Milwaukee compare to Madison?"
- 2:40-2:55 -- Architecture slide: 8 Nova 2 Lite agents, document understanding pipeline, Bedrock KB
- 2:55-3:00 -- Close: "Budget Compass. Built with Amazon Nova."

- [ ] **Step 2: Commit**

```bash
git add docs/DEMO_SCRIPT.md
git commit -m "docs: add demo video script for hackathon submission"
```

### Task 10: Final pre-submission checklist

- [ ] **Step 1: Verify all env vars are set on Vercel**

Check that Vercel has:
- `AWS_ACCESS_KEY_ID` (rotated key!)
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION=us-east-1`
- `BEDROCK_KNOWLEDGE_BASE_ID`

- [ ] **Step 2: Deploy to Vercel and smoke test**

```bash
git push origin main
```

Then test on budget-compass.vercel.app:
- Address autocomplete works
- Tax receipt loads
- Ask chat connects to real Nova agents (not mock fallback)
- Explore treemap renders
- Simulator sliders work

- [ ] **Step 3: Record demo video**

Follow the script in `docs/DEMO_SCRIPT.md`. Upload to YouTube as unlisted.

- [ ] **Step 4: Submit on Devpost**

- Category: Agentic AI
- Include: video link, GitHub repo link, description, Nova integration details
- Share repo with testing@devpost.com and Amazon-Nova-hackathon@amazon.com
