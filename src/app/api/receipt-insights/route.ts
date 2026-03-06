import { NextRequest, NextResponse } from "next/server";
import { mastra } from "../../../mastra";

export const maxDuration = 15;

export async function POST(req: NextRequest) {
  try {
    const { assessedValue, totalTax, persona, jurisdictions } =
      await req.json();

    const agent = mastra.getAgent("receiptInsightsAgent");

    const prompt = `Generate personalized tax bill insights for this Milwaukee property owner.

Assessed Value: $${assessedValue.toLocaleString()}
Total Annual Tax: $${totalTax.toFixed(2)}
Monthly: $${(totalTax / 12).toFixed(2)}
Daily: $${(totalTax / 365).toFixed(2)}
Persona: ${persona}

Jurisdictions:
${jurisdictions
  .map(
    (j: any) =>
      `- ${j.shortName}: $${j.yourShare.toFixed(2)}/yr (${j.pct.toFixed(0)}% of bill, $${j.rate}/1K rate)`,
  )
  .join("\n")}

Median Milwaukee home: $166,000. All 5 tax rates dropped in 2026 due to rising assessed values. MPS levy grew from 2024 voter referendum.`;

    const result = await agent.generate(prompt);

    let insights: string[];
    try {
      const text = result.text.trim();
      // Try to parse JSON array from the response
      const match = text.match(/\[[\s\S]*\]/);
      insights = match ? JSON.parse(match[0]) : [text];
    } catch {
      // If JSON parsing fails, split by newlines
      insights = result.text
        .split("\n")
        .map((l: string) => l.replace(/^[-*•\d.]+\s*/, "").trim())
        .filter((l: string) => l.length > 10)
        .slice(0, 4);
    }

    return NextResponse.json({ insights });
  } catch (error) {
    console.error("Receipt insights error:", error);
    return NextResponse.json(
      { insights: [], error: "Failed to generate insights" },
      { status: 500 },
    );
  }
}
