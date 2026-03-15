# Nova Act Budget Finder Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Nova Act-powered search that finds city budget PDFs on government websites, letting users compare any city with Milwaukee.

**Architecture:** A standalone FastAPI service on Railway wraps the Nova Act SDK. The Next.js app proxies requests to it via `/api/find-budget`. Found PDFs are analyzed by the existing `/api/analyze-budget` route (Nova 2 Lite document understanding) and added to the comparison dropdown.

**Tech Stack:** Python 3.12+, FastAPI, nova-act SDK, uvicorn, Railway, Next.js API routes, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-15-nova-act-budget-finder-design.md`

---

## Chunk 1: Nova Act FastAPI service

### Task 1: Create the Nova Act service

**Files:**
- Create: `nova-act-service/main.py`
- Create: `nova-act-service/requirements.txt`
- Create: `nova-act-service/Procfile`

- [ ] **Step 1: Create requirements.txt**

```
fastapi>=0.115.0
uvicorn>=0.32.0
nova-act>=3.0.0
pydantic>=2.0.0
```

- [ ] **Step 2: Create Procfile**

```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

- [ ] **Step 3: Create main.py**

```python
import os
import asyncio
from typing import Optional
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from nova_act import NovaAct

app = FastAPI(title="Budget Compass - Nova Act Budget Finder")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

FIND_BUDGET_SECRET = os.environ.get("FIND_BUDGET_SECRET", "")


class FindBudgetRequest(BaseModel):
    city: str
    state: str


class BudgetResult(BaseModel):
    title: str
    url: str
    source_page: str
    file_type: str


class FindBudgetResponse(BaseModel):
    status: str
    city: str
    state: str
    results: list[BudgetResult]
    search_steps: list[str]
    error: Optional[str] = None


def verify_auth(authorization: Optional[str]) -> None:
    if not FIND_BUDGET_SECRET:
        return  # No secret configured, allow all (dev mode)
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization")
    token = authorization[7:]
    if token != FIND_BUDGET_SECRET:
        raise HTTPException(status_code=403, detail="Invalid token")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/find-budget", response_model=FindBudgetResponse)
async def find_budget(
    req: FindBudgetRequest,
    authorization: Optional[str] = Header(None),
):
    verify_auth(authorization)

    city = req.city.strip()
    state = req.state.strip().upper()

    if not city or not state:
        raise HTTPException(status_code=400, detail="city and state are required")

    steps: list[str] = []
    results: list[dict] = []

    try:
        # Stage 1: Google search for budget PDFs
        search_query = f"{city} {state} city budget 2025 2026 PDF site:.gov"
        steps.append(f"Searching Google for '{search_query}'")

        with NovaAct(starting_page="https://www.google.com") as nova:
            # Search Google
            nova.act(
                f"Search for: {search_query}. "
                f"Type the query into the search box and press Enter."
            )
            steps.append("Google search complete")

            # Extract top results
            search_results = nova.act(
                "Look at the search results. Find the top 3 results that link to "
                "government websites (.gov) related to city or municipal budgets. "
                "Return each result's title and URL.",
                schema={
                    "type": "object",
                    "properties": {
                        "results": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "title": {"type": "string"},
                                    "url": {"type": "string"},
                                },
                                "required": ["title", "url"],
                            },
                        }
                    },
                    "required": ["results"],
                },
            )

            gov_urls = []
            if search_results.matches_schema and search_results.parsed_response:
                gov_urls = search_results.parsed_response.get("results", [])
                steps.append(f"Found {len(gov_urls)} government website results")

            # If no .gov results, try Wisconsin Policy Forum fallback
            if not gov_urls:
                fallback_query = f"site:wispolicyforum.org budget brief {city}"
                steps.append(f"No .gov results. Trying fallback: '{fallback_query}'")
                nova.act(f"Search for: {fallback_query}")

                fallback_results = nova.act(
                    "Find any results linking to PDF budget briefs. "
                    "Return the title and URL for each.",
                    schema={
                        "type": "object",
                        "properties": {
                            "results": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "title": {"type": "string"},
                                        "url": {"type": "string"},
                                    },
                                    "required": ["title", "url"],
                                },
                            }
                        },
                        "required": ["results"],
                    },
                )
                if fallback_results.matches_schema and fallback_results.parsed_response:
                    gov_urls = fallback_results.parsed_response.get("results", [])
                    steps.append(f"Found {len(gov_urls)} results from Wisconsin Policy Forum")

            if not gov_urls:
                steps.append("No budget documents found")
                return FindBudgetResponse(
                    status="no_results",
                    city=city,
                    state=state,
                    results=[],
                    search_steps=steps,
                )

            # Stage 2: Navigate to the most promising result and find PDF links
            target_url = gov_urls[0]["url"]
            steps.append(f"Navigating to: {target_url}")
            nova.act(f"Navigate to {target_url}")

            # Stage 3: Extract PDF links from the page
            pdf_extraction = nova.act(
                "Look at this page and find all links to PDF documents related to "
                "budgets, financial reports, or budget summaries. "
                "Return the title/text of each link and its full URL. "
                "Only include links that end in .pdf or are clearly PDF downloads.",
                schema={
                    "type": "object",
                    "properties": {
                        "pdf_links": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "title": {"type": "string"},
                                    "url": {"type": "string"},
                                },
                                "required": ["title", "url"],
                            },
                        }
                    },
                    "required": ["pdf_links"],
                },
            )

            if pdf_extraction.matches_schema and pdf_extraction.parsed_response:
                pdf_links = pdf_extraction.parsed_response.get("pdf_links", [])
                steps.append(f"Found {len(pdf_links)} PDF links on the page")

                for link in pdf_links[:5]:  # Cap at 5 results
                    results.append({
                        "title": link.get("title", "Budget Document"),
                        "url": link.get("url", ""),
                        "source_page": target_url,
                        "file_type": "pdf",
                    })
            else:
                steps.append("Could not extract PDF links from the page")

                # Fallback: add the .gov search results directly
                for r in gov_urls[:3]:
                    results.append({
                        "title": r.get("title", "Budget Page"),
                        "url": r.get("url", ""),
                        "source_page": "google.com",
                        "file_type": "page",
                    })
                steps.append("Returning search result URLs instead")

    except Exception as e:
        steps.append(f"Error: {str(e)}")
        return FindBudgetResponse(
            status="error",
            city=city,
            state=state,
            results=[BudgetResult(**r) for r in results],
            search_steps=steps,
            error=str(e),
        )

    return FindBudgetResponse(
        status="success" if results else "no_results",
        city=city,
        state=state,
        results=[BudgetResult(**r) for r in results],
        search_steps=steps,
    )
```

- [ ] **Step 4: Commit**

```bash
git add nova-act-service/
git commit -m "feat: add Nova Act budget finder FastAPI service"
```

---

## Chunk 2: Next.js proxy route + analyze-budget URL mode

### Task 2: Create the find-budget proxy route

**Files:**
- Create: `src/app/api/find-budget/route.ts`

- [ ] **Step 1: Create the proxy route**

```typescript
import { NextResponse } from "next/server";

const SERVICE_URL = process.env.NOVA_ACT_SERVICE_URL ?? "";
const SECRET = process.env.FIND_BUDGET_SECRET ?? "";

export const maxDuration = 60;

export async function POST(req: Request) {
  if (!SERVICE_URL) {
    return NextResponse.json(
      { error: "Nova Act service not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();

    const res = await fetch(`${SERVICE_URL}/find-budget`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(SECRET ? { Authorization: `Bearer ${SECRET}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to reach budget finder service: ${message}` },
      { status: 502 }
    );
  }
}
```

- [ ] **Step 2: Add to public routes in middleware**

In `src/middleware.ts`, add `"/api/find-budget(.*)"` to the `isPublicRoute` matcher (already done for analyze-budget).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/find-budget/route.ts src/middleware.ts
git commit -m "feat: add /api/find-budget proxy route to Nova Act service"
```

### Task 3: Add URL-based fetch mode to analyze-budget

**Files:**
- Modify: `src/app/api/analyze-budget/route.ts`

- [ ] **Step 1: Add URL fetch path before the existing file upload logic**

After `const formData = await req.formData();`, add:

```typescript
// URL-based fetch mode (for Nova Act-found PDFs)
const pdfUrl = formData.get("url") as string | null;

if (pdfUrl) {
  // Validate URL
  if (!pdfUrl.startsWith("https://")) {
    return NextResponse.json({ error: "URL must use HTTPS" }, { status: 400 });
  }
  const urlObj = new URL(pdfUrl);
  const blockedHosts = ["localhost", "127.0.0.1", "0.0.0.0", "[::]", "[::1]"];
  if (blockedHosts.some((h) => urlObj.hostname === h || urlObj.hostname.endsWith(".local"))) {
    return NextResponse.json({ error: "Invalid URL host" }, { status: 400 });
  }

  // Fetch the PDF
  const pdfRes = await fetch(pdfUrl, { redirect: "follow" });
  if (!pdfRes.ok) {
    return NextResponse.json(
      { error: `Failed to fetch PDF: HTTP ${pdfRes.status}` },
      { status: 422 }
    );
  }

  const contentType = pdfRes.headers.get("content-type") ?? "";
  if (!contentType.includes("pdf") && !contentType.includes("octet-stream")) {
    return NextResponse.json(
      { error: `URL does not point to a PDF (content-type: ${contentType})` },
      { status: 422 }
    );
  }

  const fetchedBytes = await pdfRes.arrayBuffer();
  if (fetchedBytes.byteLength > MAX_PDF_BYTES) {
    return NextResponse.json(
      { error: `PDF is too large (${(fetchedBytes.byteLength / 1024 / 1024).toFixed(1)} MB). Maximum is 4.5 MB.` },
      { status: 400 }
    );
  }

  // Extract filename from URL for the document name
  const urlFilename = pdfUrl.split("/").pop()?.split("?")[0] ?? "budget-document";
  const pdfName = urlFilename.replace(".pdf", "").replace(/%20/g, " ");
  const pdfBytes = new Uint8Array(fetchedBytes);

  // Use the same Converse API call as file upload
  // (jump to the shared processing logic below)
  return await processDocument(pdfBytes, pdfName, cityHint, populationHint);
}
```

Refactor: Extract the Converse API call into a shared `processDocument()` function that both the file upload path and URL fetch path call. This avoids duplicating the Bedrock call + JSON parsing logic.

- [ ] **Step 2: Verify build**

```bash
npx next build 2>&1 | tail -15
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/analyze-budget/route.ts
git commit -m "feat: add URL-based PDF fetch mode to analyze-budget route"
```

---

## Chunk 3: Frontend search UI

### Task 4: Add budget search to Ask tab

**Files:**
- Modify: `src/components/tabs/ask-chat.tsx`

- [ ] **Step 1: Add search state and types**

Add to the component state:
```typescript
// Nova Act search state
const [searchCity, setSearchCity] = useState("");
const [isSearching, setIsSearching] = useState(false);
const [searchSteps, setSearchSteps] = useState<string[]>([]);
const [searchResults, setSearchResults] = useState<{ title: string; url: string; source_page: string; file_type: string }[]>([]);
const [searchError, setSearchError] = useState<string | null>(null);
```

Extend the `ComparisonBudget.source` type:
```typescript
source: "pre-loaded" | "uploaded" | "nova-act";
```

- [ ] **Step 2: Add search handler**

```typescript
const handleBudgetSearch = useCallback(async () => {
  if (!searchCity.trim()) return;
  setIsSearching(true);
  setSearchError(null);
  setSearchResults([]);
  setSearchSteps(["Starting Nova Act search..."]);

  // Parse "Green Bay, WI" format
  const parts = searchCity.split(",").map((s) => s.trim());
  const city = parts[0] ?? searchCity;
  const state = parts[1] ?? "WI";

  try {
    const res = await fetch("/api/find-budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city, state }),
    });

    const data = await res.json();

    if (!res.ok) {
      setSearchError(data.error ?? "Search failed");
      return;
    }

    setSearchSteps(data.search_steps ?? []);
    setSearchResults(data.results ?? []);

    if (!data.results?.length) {
      setSearchError(`No budget documents found for ${city}, ${state}. Try a different city name.`);
    }
  } catch {
    setSearchError("Could not reach the budget finder service.");
  } finally {
    setIsSearching(false);
  }
}, [searchCity]);
```

- [ ] **Step 3: Add analyze-from-URL handler**

```typescript
const handleAnalyzeUrl = useCallback(async (url: string, title: string) => {
  setIsUploading(true);
  setUploadError(null);

  try {
    const formData = new FormData();
    formData.append("url", url);

    const res = await fetch("/api/analyze-budget", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      setUploadError(data.error ?? "Failed to analyze PDF");
      return;
    }

    const result = data.result;
    const newBudget: ComparisonBudget = {
      id: result.id ?? `nova-act-${Date.now()}`,
      city: result.city ?? title,
      state: result.state ?? "??",
      fiscal_year: result.fiscal_year ?? 2025,
      total_budget: result.total_budget ?? 0,
      departments: result.departments ?? [],
      summary: result.summary,
      source: "nova-act",
    };

    setAvailableBudgets((prev) => [...prev, newBudget]);
    setSelectedBudgetId(newBudget.id);
    setSearchResults([]);
    setSearchCity("");

    const sysMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: `Nova found and analyzed **${newBudget.city}**'s budget (${newBudget.fiscal_year}). Total: **${formatCurrency(newBudget.total_budget)}** with ${newBudget.departments.length} departments.\n\n${newBudget.summary ?? ""}\n\nTry: "How does Milwaukee compare to ${newBudget.city}?"`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, sysMsg]);
    setUsedRealApi(true);
  } catch {
    setUploadError("Failed to analyze the PDF. Try uploading manually.");
  } finally {
    setIsUploading(false);
  }
}, []);
```

- [ ] **Step 4: Add search UI below the comparison dropdown**

In the top bar area, after the Upload PDF button, add:

```tsx
{/* Nova Act budget search */}
<div className="flex w-full items-center gap-2 border-t-2 border-gray-900 px-4 py-2">
  <input
    type="text"
    value={searchCity}
    onChange={(e) => setSearchCity(e.target.value)}
    onKeyDown={(e) => { if (e.key === "Enter") handleBudgetSearch(); }}
    placeholder="Find a city's budget (e.g., Green Bay, WI)"
    disabled={isSearching}
    className="flex-1 border-2 border-black px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-mke-blue disabled:opacity-50"
  />
  <button
    onClick={handleBudgetSearch}
    disabled={isSearching || !searchCity.trim()}
    className="border-2 border-black bg-purple-200 px-3 py-1.5 text-sm font-bold shadow-[2px_2px_0px_0px_#111] transition-all hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#111] disabled:opacity-50"
  >
    {isSearching ? "Searching..." : "Find Budget"}
  </button>
</div>

{/* Search progress */}
{isSearching && searchSteps.length > 0 && (
  <div className="border-t border-purple-200 bg-purple-50 px-4 py-2">
    {searchSteps.map((step, i) => (
      <div key={i} className="flex items-center gap-2 text-sm text-purple-800">
        <span>{i === searchSteps.length - 1 ? "⏳" : "✓"}</span>
        <span>{step}</span>
      </div>
    ))}
  </div>
)}

{/* Search results */}
{searchResults.length > 0 && (
  <div className="border-t-2 border-gray-900 bg-green-50 px-4 py-2">
    <p className="mb-2 text-sm font-bold text-green-800">
      Found {searchResults.length} budget document{searchResults.length !== 1 ? "s" : ""}:
    </p>
    {searchResults.map((r, i) => (
      <div key={i} className="flex items-center justify-between gap-2 py-1.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{r.title}</p>
          <p className="truncate text-xs text-gray-500">{r.source_page}</p>
        </div>
        <button
          onClick={() => handleAnalyzeUrl(r.url, r.title)}
          disabled={isUploading}
          className="shrink-0 border-2 border-black bg-green-200 px-3 py-1 text-sm font-bold shadow-[2px_2px_0px_0px_#111] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#111] disabled:opacity-50"
        >
          {isUploading ? "Analyzing..." : "Analyze"}
        </button>
      </div>
    ))}
  </div>
)}

{/* Search error */}
{searchError && (
  <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
    {searchError}
  </div>
)}
```

- [ ] **Step 5: Verify build**

```bash
npx next build 2>&1 | tail -15
```

- [ ] **Step 6: Commit**

```bash
git add src/components/tabs/ask-chat.tsx
git commit -m "feat: add Nova Act budget search UI with find + analyze flow"
```

---

## Chunk 4: Deploy + verify

### Task 5: Deploy Nova Act service to Railway

- [ ] **Step 1: Create Railway project**

Push `nova-act-service/` to a new GitHub repo or deploy directly via Railway CLI. Set environment variables:
- `NOVA_ACT_API_KEY` (from nova.amazon.com/act)
- `FIND_BUDGET_SECRET` (generate a random string)

- [ ] **Step 2: Set Vercel environment variables**

In Vercel dashboard, add:
- `NOVA_ACT_SERVICE_URL` = Railway service URL (e.g., `https://nova-act-service-production.up.railway.app`)
- `FIND_BUDGET_SECRET` = same shared secret as Railway

- [ ] **Step 3: Push and deploy**

```bash
git push origin main
```

- [ ] **Step 4: Smoke test the full flow**

1. Open budget-compass.vercel.app
2. Go to Ask tab
3. Type "Madison, WI" in the Find Budget field
4. Wait for Nova Act to search (~20 seconds)
5. Click Analyze on a found PDF
6. Wait for Nova 2 Lite extraction (~15 seconds)
7. Verify the budget appears in the comparison dropdown
8. Ask: "How does Milwaukee compare to Madison?"

### Task 6: Update demo script

- [ ] **Step 1: Add Nova Act demo flow to docs/DEMO_SCRIPT.md**

Update the document understanding section (2:05-2:30) to show the live Nova Act search flow instead of just the pre-extracted data. The video should show:
1. Type a city name in the search field
2. Watch the progress steps appear in real time
3. See the found PDFs listed
4. Click Analyze
5. Nova 2 Lite reads the PDF
6. Budget appears in dropdown

- [ ] **Step 2: Commit**

```bash
git add docs/DEMO_SCRIPT.md
git commit -m "docs: update demo script with Nova Act live search flow"
```
