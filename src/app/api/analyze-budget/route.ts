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

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("pdf") as File | null;
    const cityHint = (formData.get("city") as string) ?? "";
    const populationHint = formData.get("population") as string;

    if (!file) {
      return NextResponse.json({ error: "No PDF file provided" }, { status: 400 });
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

    const pdfBytes = new Uint8Array(bytes);
    const pdfName = file.name.replace(".pdf", "");

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

    const responseText =
      response.output?.message?.content?.[0]?.text ?? "";

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
      // Try to find JSON object in the response
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

    // Ensure required fields
    data.id = `upload-${Date.now()}`;
    data.extracted_from = file.name;
    data.departments = data.departments ?? [];
    data.summary = data.summary ?? "Budget data extracted from uploaded PDF.";

    return NextResponse.json({ result: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("analyze-budget error:", message);
    return NextResponse.json(
      { error: `Failed to analyze PDF: ${message}` },
      { status: 500 }
    );
  }
}
