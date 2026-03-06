import { Agent } from "@mastra/core/agent";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";

const bedrock = createAmazonBedrock({ region: "us-east-1" });

export const receiptInsightsAgent = new Agent({
  id: "receipt-insights-agent",
  name: "Receipt Insights Generator",
  instructions: `You generate 3-4 short, personalized insights about a Milwaukee property owner's tax bill.

RULES:
- Output ONLY a JSON array of 3-4 strings. No other text, no markdown, no explanation.
- Each insight is 1 sentence, conversational, and uses real numbers provided.
- Include relatable comparisons (daily coffee, Netflix subscription, etc.)
- Reference Milwaukee-specific context (2024 MPS referendum, assessed value growth, etc.)
- If persona is "student", use simpler language. If "journalist", include more policy context.
- Never estimate — only use the exact numbers provided.

Example output:
["Your daily police spending: $2.34 — about 1 coffee", "MPS gets 43¢ of every dollar because of the 2024 voter-approved referendum", "Your tax rate dropped 9% but your bill may have risen due to higher assessed values", "You pay $287/month — less than a car payment"]`,
  model: bedrock("us.amazon.nova-2-lite-v1:0"),
});
