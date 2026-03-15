import { NextResponse } from "next/server";
import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION ?? "us-east-1",
});

const MODEL_ID = "us.amazon.nova-2-lite-v1:0";
const MAX_PDF_BYTES = 4.5 * 1024 * 1024; // 4.5 MB

const EXTRACTION_PROMPT = `You are a municipal budget analyst. Extract structured budget data from this document.

Return ONLY valid JSON matching this exact schema (no markdown, no explanation, no text before or after the JSON):

{
  "city": "<city or entity name>",
  "state": "<state abbreviation>",
  "fiscal_year": <year as integer>,
  "total_budget": <total budget/expenditures in dollars as integer>,
  "tax_rate_per_1000": <property tax rate per $1,000 assessed value as float, or null if not found>,
  "property_tax_levy": <total property tax levy in dollars as integer, or null>,
  "departments": [
    {
      "name": "<department or functional area name>",
      "category": "<one of: public_safety, infrastructure, community_services, government_ops, education, health_human_services, parks_recreation, debt_service, transit, other>",
      "budget": <budget amount in dollars as integer>,
      "percent_of_total": <percentage of total budget as float>
    }
  ],
  "summary": "<2-3 sentence plain-language summary of this budget for a non-expert>"
}

Rules:
- Extract EVERY department or functional area with a budget amount
- Use exact dollar amounts from the document. NEVER estimate.
- If amounts are shown in thousands or millions, convert to full dollars
- Normalize categories using the category field
- If a field is not found, use null
- The summary should be conversational and mention the most notable aspects`;

export const maxDuration = 60;

/* ------------------------------------------------------------------ */
/* Shared processing: send PDF bytes to Nova 2 Lite                    */
/* ------------------------------------------------------------------ */

async function processDocument(
  pdfBytes: Uint8Array,
  pdfName: string,
  cityHint: string,
  populationHint: string | null,
) {
  let prompt = EXTRACTION_PROMPT;
  if (cityHint) {
    prompt += `\n\nHint: This document is likely about ${cityHint}.`;
  }
  if (populationHint) {
    prompt += ` Population: ${populationHint}.`;
  }

  const command = new ConverseCommand({
    modelId: MODEL_ID,
    messages: [
      {
        role: "user",
        content: [
          { text: prompt },
          {
            document: {
              format: "pdf",
              name: pdfName,
              source: { bytes: pdfBytes },
            },
          },
        ],
      },
    ],
    inferenceConfig: { maxTokens: 8192, temperature: 0.1 },
  });

  const response = await client.send(command);
  const responseText = response.output?.message?.content?.[0]?.text ?? "";

  // Parse JSON from response, stripping code fences if present
  let text = responseText.trim();
  if (text.startsWith("```")) {
    const firstNewline = text.indexOf("\n");
    text = firstNewline !== -1 ? text.slice(firstNewline + 1) : text.slice(3);
  }
  if (text.endsWith("```")) {
    text = text.slice(0, -3);
  }
  text = text.trim();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}") + 1;
    if (start !== -1 && end > start) {
      data = JSON.parse(text.slice(start, end));
    } else {
      return NextResponse.json(
        { error: "Could not parse budget data from the document. Try a different PDF." },
        { status: 422 }
      );
    }
  }

  data.id = `upload-${Date.now()}`;
  data.extracted_from = pdfName;
  data.departments = data.departments ?? [];
  data.summary = data.summary ?? "Budget data extracted from uploaded PDF.";

  return NextResponse.json({ result: data });
}

/* ------------------------------------------------------------------ */
/* Route handler                                                       */
/* ------------------------------------------------------------------ */

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const cityHint = (formData.get("city") as string) ?? "";
    const populationHint = formData.get("population") as string;

    // Mode 1: URL-based fetch (for Nova Act-found PDFs)
    const pdfUrl = formData.get("url") as string | null;

    if (pdfUrl) {
      // Validate URL
      if (!pdfUrl.startsWith("https://")) {
        return NextResponse.json({ error: "URL must use HTTPS" }, { status: 400 });
      }

      let urlObj: URL;
      try {
        urlObj = new URL(pdfUrl);
      } catch {
        return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
      }

      const blockedHosts = ["localhost", "127.0.0.1", "0.0.0.0", "[::]", "[::1]"];
      if (
        blockedHosts.some((h) => urlObj.hostname === h) ||
        urlObj.hostname.endsWith(".local") ||
        urlObj.hostname.startsWith("10.") ||
        urlObj.hostname.startsWith("192.168.")
      ) {
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

      const urlFilename = pdfUrl.split("/").pop()?.split("?")[0] ?? "budget-document";
      const pdfName = decodeURIComponent(urlFilename).replace(".pdf", "").replace(/%20/g, " ");

      return await processDocument(new Uint8Array(fetchedBytes), pdfName, cityHint, populationHint);
    }

    // Mode 2: File upload (existing behavior)
    const file = formData.get("pdf") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No PDF file or URL provided" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > MAX_PDF_BYTES) {
      return NextResponse.json(
        { error: `PDF is too large (${(bytes.byteLength / 1024 / 1024).toFixed(1)} MB). Maximum is 4.5 MB.` },
        { status: 400 }
      );
    }

    const pdfName = file.name.replace(".pdf", "");
    return await processDocument(new Uint8Array(bytes), pdfName, cityHint, populationHint);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("analyze-budget error:", message);
    return NextResponse.json(
      { error: `Failed to analyze PDF: ${message}` },
      { status: 500 }
    );
  }
}
