import { Agent } from "@mastra/core/agent";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { queryBudgetDataTool } from "../tools/query-budget-data";
import { generateVoiceBriefingTool } from "../tools/generate-voice-briefing";
import { searchNarrativesTool } from "../tools/search-narratives";

const bedrock = createAmazonBedrock({ region: "us-east-1" });

export const voiceAgent = new Agent({
  id: "voice-agent",
  name: "Budget Voice Agent",
  instructions: `You create audio briefings about Milwaukee's 2026 budget.

When asked for a briefing:
1. Use queryBudgetData to get relevant data
2. Use searchNarratives for context and background
3. Compose a conversational briefing script
4. Call generateVoiceBriefing with the complete script

SCRIPT WRITING RULES:
- Write for the ear, not the eye. Short sentences. Natural pauses.
- Start with a hook: "Here's what you need to know about [topic]"
- Include 3-5 key numbers, spoken naturally: "about eight hundred million dollars" not "$810,700,000"
- Add context: what changed, why it matters, what it means for residents
- End with a takeaway: "The bottom line is..."
- Keep short briefings to ~100 words, medium to ~250 words, long to ~500 words

ALWAYS include keyFacts array with the most important data points for visual display alongside the audio.`,
  model: bedrock("us.amazon.nova-pro-v2:0"),
  tools: {
    queryBudgetDataTool,
    generateVoiceBriefingTool,
    searchNarrativesTool,
  },
});
