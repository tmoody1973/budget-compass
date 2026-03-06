import { NextResponse } from "next/server";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION ?? "us-east-1",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { assessedValue, totalTax, persona, jurisdictions, topic } = body;

    const jBreakdown = (jurisdictions ?? [])
      .map(
        (j: { shortName: string; yourShare: number; pct: number }) =>
          `${j.shortName}: $${j.yourShare.toFixed(2)} (${j.pct.toFixed(0)}%)`
      )
      .join(", ");

    const topicFocus = topic ? `Focus especially on: ${topic}. ` : "";

    const prompt = `You are an NPR-quality radio journalist producing a budget briefing for a Milwaukee homeowner.

${topicFocus}Write a compelling, natural-sounding briefing script (~400-500 words) that will be read aloud by an AI voice.

USER CONTEXT:
- Home assessed value: $${assessedValue?.toLocaleString() ?? "200,000"}
- Total annual property tax: $${totalTax?.toFixed(2) ?? "4,484"}
- Tax breakdown: ${jBreakdown || "MPS 43%, City 34%, County 14%, MMSD 6%, MATC 3%"}
- Persona: ${persona || "citizen"}

SCRIPT REQUIREMENTS:
1. Open with a hook: "Good morning. Here's what you need to know about your Milwaukee tax dollars."
2. Start with the user's personal numbers - make it feel like THEIR briefing
3. Cover the key story: all five tax rates dropped, but bills may still be higher due to assessment increases
4. Highlight 2-3 surprising findings or important trends
5. Include specific department comparisons (e.g., police vs. libraries, MPS spending per pupil)
6. End with a takeaway and invitation to explore more
7. Write for the EAR - short sentences, natural pauses, conversational rhythm
8. Use phrases like "Here's what's interesting..." and "Now here's the thing..."
9. Round numbers: say "about three hundred million" not "$307,482,100"
10. No markdown formatting, headers, or bullet points - pure spoken-word script

Also produce a keyFacts array with the 4-5 most important data points for visual display.

Respond in JSON format:
{
  "script": "the full briefing script text",
  "keyFacts": [{ "fact": "description", "value": "$X" }]
}`;

    const command = new InvokeModelCommand({
      modelId: "us.amazon.nova-pro-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        messages: [{ role: "user", content: [{ text: prompt }] }],
        inferenceConfig: {
          maxTokens: 1024,
          temperature: 0.7,
          topP: 0.9,
        },
      }),
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const text =
      responseBody?.output?.message?.content?.[0]?.text ??
      responseBody?.content?.[0]?.text ??
      "";

    // Parse JSON response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json(parsed);
      }
    } catch {
      // If JSON parsing fails, return the text as script
    }

    return NextResponse.json({
      script: text,
      keyFacts: [],
    });
  } catch (err) {
    console.error("[voice-briefing] Error:", err);
    return NextResponse.json(
      { error: "Failed to generate briefing" },
      { status: 500 }
    );
  }
}
