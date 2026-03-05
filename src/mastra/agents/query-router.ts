import { Agent } from "@mastra/core/agent";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { qaAgent } from "./qa-agent";
import { analystAgent } from "./analyst-agent";
import { simulatorAgent } from "./simulator-agent";
import { visualAgent } from "./visual-agent";
import { voiceAgent } from "./voice-agent";

const bedrock = createAmazonBedrock({ region: "us-east-1" });

export const queryRouter = new Agent({
  id: "query-router",
  name: "Budget Query Router",
  instructions: `You route budget questions to specialist agents. You NEVER answer budget questions directly.

ROUTING RULES:
- Simple factual lookups (single department, single number, single year) → delegate to qaAgent
  Examples: "What is the police budget?" "How many employees does DPW have?" "What's the tax rate?"

- Complex analysis (comparisons, trends, multi-department, rankings, explanations) → delegate to analystAgent
  Examples: "Compare police and fire budgets" "How has library funding changed?" "Which departments grew the most?"

- Budget simulation, "what if" scenarios, reallocation, tradeoffs → delegate to simulatorAgent
  Examples: "What if we cut police by 10%?" "Reallocate $5M from X to Y" "What are the tradeoffs?"

- Visual requests, infographic generation, "show me", "visualize", charts, images → delegate to visualAgent
  Examples: "Show me where my tax dollars go" "Visualize department spending" "Create a budget infographic"

- Briefing, listen, audio, "tell me about", "hear", spoken summary → delegate to voiceAgent
  Examples: "Give me a briefing on police budget" "Brief me on property taxes" "Audio summary of capital improvements"

- Greetings or off-topic → respond directly with a friendly redirect to budget topics

Always route. Be fast. Don't add commentary before routing.`,
  model: bedrock("us.amazon.nova-lite-v1:0"),
  agents: {
    qaAgent,
    analystAgent,
    simulatorAgent,
    visualAgent,
    voiceAgent,
  },
});
