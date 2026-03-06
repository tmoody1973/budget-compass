import { NextRequest, NextResponse } from "next/server";
import { mastra } from "../../../mastra";

export const maxDuration = 15;

export async function POST(req: NextRequest) {
  try {
    const { assessedValue, totalTax, persona, jurisdictions } =
      await req.json();

    const agent = mastra.getAgent("receiptInsightsAgent");

    const prompt = `Generate a personalized tax story and civic facts for this Milwaukee property owner.

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

    let story: string;
    let didYouKnow: string[];
    try {
      const text = result.text.trim();
      // Try to parse JSON object from the response
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        story = typeof parsed.story === "string" ? parsed.story : "";
        didYouKnow = Array.isArray(parsed.didYouKnow)
          ? parsed.didYouKnow
          : [];
      } else {
        // Fallback: treat entire text as story
        story = text;
        didYouKnow = [];
      }
    } catch {
      story = result.text.trim();
      didYouKnow = [];
    }

    return NextResponse.json({ story, didYouKnow });
  } catch (error) {
    console.error("Receipt insights error:", error);
    return NextResponse.json(
      { story: "", didYouKnow: [], error: "Failed to generate insights" },
      { status: 500 },
    );
  }
}
