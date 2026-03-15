# Nova Act Budget Finder — Design Spec

## Goal

Add a Nova Act-powered budget discovery service that lets users search for any city's budget documents by name. Nova Act navigates government websites, finds budget PDF links, and returns them to the user. The user picks a PDF, and the existing Nova 2 Lite document understanding pipeline extracts structured data for comparison.

## Architecture

```
User types "Green Bay, WI" in Ask tab search field
    ↓
Next.js /api/find-budget (proxy route)
    ↓
Railway FastAPI service (nova-act-service/)
    ↓
Nova Act SDK opens browser
  → Google search: "{city} {state} city budget 2025 PDF site:.gov"
  → Navigate to top result (city's budget page)
  → Extract PDF links from the page
    ↓
Returns: [{ title, url, source_page, file_type }] + search_steps[]
    ↓
Frontend displays found PDFs with "Analyze" buttons
    ↓
User clicks "Analyze" → /api/analyze-budget?url={pdf_url}
    ↓
Nova 2 Lite reads PDF via Bedrock Converse API
    ↓
Structured JSON added to comparison dropdown
```

## Nova Act Service (Railway)

**Stack:** Python 3.12+, FastAPI, nova-act SDK, uvicorn

**Endpoint:** `POST /find-budget`

Request:
```json
{ "city": "Green Bay", "state": "WI" }
```

Response:
```json
{
  "status": "success",
  "city": "Green Bay",
  "state": "WI",
  "results": [
    {
      "title": "2025 Adopted Budget",
      "url": "https://www.greenbaywi.gov/.../2025-Budget.pdf",
      "source_page": "https://www.greenbaywi.gov/Archive/36",
      "file_type": "pdf"
    }
  ],
  "search_steps": [
    "Searched Google for 'Green Bay WI city budget 2025 PDF'",
    "Navigated to greenbaywi.gov budget archive",
    "Found 2 budget PDF links"
  ]
}
```

**Nova Act logic (3 stages):**

1. Google search for `"{city} {state} city budget 2025 2026 PDF site:.gov"`. Extract top 3-5 URLs.
2. Navigate to the most promising government website result. Find the budget page.
3. Extract all PDF links from the page with their titles.

**Fallback:** If no .gov results, search `site:wispolicyforum.org budget brief {city}`.

**Timeout:** 60 seconds max per request. Return partial results if timeout is hit.

**Auth:** `NOVA_ACT_API_KEY` environment variable (required). `FIND_BUDGET_SECRET` shared secret between Vercel proxy and Railway (required — prevents public abuse of browser sessions).

**Health check:** `GET /health` returns `{"status": "ok"}`. Used for Railway warm-up pings to avoid cold start delays during demos.

**Deployment:**
- `Procfile`: `web: uvicorn main:app --host 0.0.0.0 --port $PORT`
- `requirements.txt`: `fastapi`, `uvicorn`, `nova-act`
- Railway environment: `NOVA_ACT_API_KEY`, `FIND_BUDGET_SECRET`

## Next.js Proxy Route

**File:** `src/app/api/find-budget/route.ts`

Forwards POST body to Railway service URL. Adds `Authorization: Bearer {FIND_BUDGET_SECRET}` header. Returns response as-is. Keeps the Nova Act API key server-side.

Must set `export const maxDuration = 60` to prevent Vercel 504 timeout (Nova Act sessions take 15-30 seconds).

Environment variables: `NOVA_ACT_SERVICE_URL` (Railway URL), `FIND_BUDGET_SECRET` (shared secret)

## Analyze Budget Route Modification

**File:** `src/app/api/analyze-budget/route.ts`

Add support for URL-based PDF analysis in addition to file upload:
- If `formData` contains a `url` field instead of a `pdf` file, fetch the PDF from that URL
- **URL validation:** Must be `https://` only. Reject `http://`, `file://`, `localhost`, private IPs.
- **Content-type check:** Verify the fetched response has `application/pdf` content type (don't rely on URL extension).
- **Size guard:** Apply the existing 4.5 MB limit to the fetched bytes.
- Convert to bytes, then process with the existing Nova 2 Lite Converse API call
- Same response format as file upload

## Frontend Changes

**File:** `src/components/tabs/ask-chat.tsx`

Add below the comparison dropdown:
- Text input: "Find a city's budget..." with Search button
- Loading state panel with search_steps progress
- Results list with PDF title, source URL, and "Analyze" button per result
- "Analyze" button triggers: fetch PDF URL → send to /api/analyze-budget → add to dropdown
- Nova Act-found budgets use `source: "nova-act"` in the ComparisonBudget type (extend existing union: `"pre-loaded" | "uploaded" | "nova-act"`)

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `nova-act-service/main.py` | Create | FastAPI service with /find-budget endpoint |
| `nova-act-service/requirements.txt` | Create | Python dependencies |
| `nova-act-service/Procfile` | Create | Railway deployment config |
| `src/app/api/find-budget/route.ts` | Create | Proxy route to Railway service |
| `src/app/api/analyze-budget/route.ts` | Modify | Add URL-based PDF fetch mode |
| `src/components/tabs/ask-chat.tsx` | Modify | Add search field + results UI |
| `src/middleware.ts` | Modify | Add /api/find-budget to public routes |

## Risks

- **Government websites vary wildly** -- Nova Act may not find PDFs on some city sites. The fallback to Wisconsin Policy Forum helps for WI cities.
- **Nova Act session time** -- 15-30 seconds is a visible delay. The search_steps progress mitigates this.
- **PDF URLs may be behind redirects or auth** -- The analyze-budget URL fetch needs to follow redirects and handle failures gracefully.
- **Railway cold starts** -- First request after idle may take 10+ seconds. The `/health` endpoint enables warm-up pings.
- **SSRF on URL fetch** -- The `/api/analyze-budget` URL mode accepts arbitrary URLs. Mitigated by https-only validation and rejecting private/localhost addresses.
- **Vercel proxy timeout** -- Must set `maxDuration = 60` on the proxy route or it will 504 before Nova Act returns.
- **Concurrent browser sessions** -- Multiple simultaneous requests open multiple Chromium instances. Railway free tier may be memory-constrained. Acceptable for hackathon demo but would need a queue in production.
- **Wisconsin-specific fallback** -- The `wispolicyforum.org` fallback only covers WI cities. Noted as a scope limitation, not a general solution.
