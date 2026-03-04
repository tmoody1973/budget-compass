import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { ConvexClient } from "convex/browser";
import { anyApi } from "convex/server";

const convex = new ConvexClient(process.env.CONVEX_URL!);
const budgetApi = anyApi["budget"];

export const searchNarrativesTool = createTool({
  id: "search-narratives",
  description:
    "Search budget document narratives for context about departments, policies, and explanations. Use when you need qualitative context beyond raw numbers.",
  inputSchema: z.object({
    searchQuery: z
      .string()
      .describe("What to search for in budget narratives"),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        department: z.string(),
        pages: z.string(),
        excerpt: z.string(),
      })
    ),
  }),
  execute: async (input) => {
    const results = await convex.query(budgetApi.searchNarratives, {
      searchQuery: input.searchQuery,
    });
    return {
      results: (results || []).map((r: Record<string, unknown>) => ({
        department: (r.department as string) ?? "",
        pages: (r.pages as string) ?? "",
        excerpt: ((r.fullText as string) ?? "").substring(0, 500) + "...",
      })),
    };
  },
});
