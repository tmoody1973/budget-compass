import { NextRequest, NextResponse } from "next/server";
import { mastra } from "../../../mastra";

export const maxDuration = 10;

export async function POST(req: NextRequest) {
  try {
    const { item, budget, yourShare, jurisdiction, context } = await req.json();

    const agent = mastra.getAgent("receiptInsightsAgent");

    const prompt = `Explain this Milwaukee tax line item in exactly 2 sentences, plain language, for a resident who wants to understand what their money funds.

Line item: ${item}
Jurisdiction: ${jurisdiction}
Total budget: $${budget.toLocaleString()}
This resident's share: $${yourShare.toFixed(2)}/year
${context ? `Additional context: ${context}` : ""}

Output ONLY the 2-sentence explanation. No JSON, no bullet points, no preamble.`;

    const result = await agent.generate(prompt);

    return NextResponse.json({ explanation: result.text.trim() });
  } catch (error) {
    console.error("Receipt explain error:", error);
    return NextResponse.json({ explanation: "" }, { status: 500 });
  }
}
