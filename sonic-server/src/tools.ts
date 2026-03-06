/**
 * Tool execution for Nova Sonic mid-conversation queries.
 * Standalone — does not import from the Mastra tools to keep sonic-server independent.
 */

import { ConvexHttpClient } from "convex/browser";
import {
  BedrockAgentRuntimeClient,
  RetrieveCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";
import { anyApi } from "convex/server";

/* ------------------------------------------------------------------ */
/* Clients                                                              */
/* ------------------------------------------------------------------ */

const CONVEX_URL =
  process.env.NEXT_PUBLIC_CONVEX_URL ??
  process.env.CONVEX_URL ??
  "https://polished-cuttlefish-191.convex.cloud";

const convex = new ConvexHttpClient(CONVEX_URL);
const budgetApi = anyApi["budget"];

const bedrockAgent = new BedrockAgentRuntimeClient({
  region: process.env.AWS_REGION ?? "us-east-1",
});

const KNOWLEDGE_BASE_ID = process.env.BEDROCK_KNOWLEDGE_BASE_ID ?? "";

/* ------------------------------------------------------------------ */
/* Tool definitions (for Nova Sonic tool config)                        */
/* ------------------------------------------------------------------ */

export const TOOL_DEFINITIONS = [
  {
    toolName: "queryBudgetData",
    description:
      "Query Milwaukee's 2026 budget database for exact fiscal data. Available queries: getCityOverview, getAllBudgetSections, getBudgetSection, getDepartmentBudget, getDepartmentExpenditures, getDepartmentRevenues, getAllDepartmentTotals, getAllDepartments, getDepartmentMeta, getDepartmentServices, getDepartmentPerformance, getAllPositions, getHistoricalBySection, getTaxLevyBreakdown, compareDepartments, topDepartmentsBySpending, categoryBreakdown, searchNarratives.",
    inputSchema: {
      type: "object",
      properties: {
        queryName: {
          type: "string",
          description: "Which Convex query function to call",
          enum: [
            "getCityOverview",
            "getAllBudgetSections",
            "getBudgetSection",
            "getDepartmentBudget",
            "getDepartmentExpenditures",
            "getDepartmentRevenues",
            "getAllDepartmentTotals",
            "getAllDepartments",
            "getDepartmentMeta",
            "getDepartmentServices",
            "getDepartmentPerformance",
            "getAllPositions",
            "getHistoricalBySection",
            "getTaxLevyBreakdown",
            "compareDepartments",
            "topDepartmentsBySpending",
            "categoryBreakdown",
            "searchNarratives",
          ],
        },
        args: {
          type: "object",
          description:
            'Arguments object, e.g. { "department": "Police" } or { "section": "A" }',
        },
      },
      required: ["queryName"],
    },
  },
  {
    toolName: "searchBudgetDocs",
    description:
      "Search Milwaukee budget documents and policy briefs using RAG. Use for policy context, department descriptions, and analysis beyond raw numbers.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Natural language question to search budget documents for",
        },
        numberOfResults: {
          type: "number",
          description: "Number of results to return (default 3)",
        },
      },
      required: ["query"],
    },
  },
  {
    toolName: "searchNarratives",
    description:
      "Search budget narrative text for qualitative context about departments, policies, and explanations.",
    inputSchema: {
      type: "object",
      properties: {
        searchQuery: {
          type: "string",
          description: "What to search for in budget narratives",
        },
      },
      required: ["searchQuery"],
    },
  },
];

/* ------------------------------------------------------------------ */
/* Tool execution                                                       */
/* ------------------------------------------------------------------ */

export async function executeTool(
  toolName: string,
  input: Record<string, unknown>
): Promise<string> {
  try {
    switch (toolName) {
      case "queryBudgetData": {
        const queryName = input.queryName as string;
        const args = (input.args as Record<string, unknown>) ?? {};
        const queryFn = budgetApi[queryName];
        const result = await convex.query(queryFn, args);
        return JSON.stringify({ data: result, source: `Convex: budget.${queryName}` });
      }

      case "searchBudgetDocs": {
        if (!KNOWLEDGE_BASE_ID) {
          return JSON.stringify({
            results: [{ content: "Knowledge Base not configured", sourceName: "system" }],
          });
        }
        const command = new RetrieveCommand({
          knowledgeBaseId: KNOWLEDGE_BASE_ID,
          retrievalQuery: { text: input.query as string },
          retrievalConfiguration: {
            vectorSearchConfiguration: {
              numberOfResults: (input.numberOfResults as number) ?? 3,
            },
          },
        });
        const response = await bedrockAgent.send(command);
        const results = (response.retrievalResults ?? []).map((r) => ({
          content: r.content?.text ?? "",
          score: r.score,
        }));
        return JSON.stringify({ results });
      }

      case "searchNarratives": {
        const results = await convex.query(budgetApi.searchNarratives, {
          searchQuery: input.searchQuery as string,
        });
        const mapped = (results || []).map((r: Record<string, unknown>) => ({
          department: r.department ?? "",
          excerpt: ((r.fullText as string) ?? "").substring(0, 500),
        }));
        return JSON.stringify({ results: mapped });
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[tools] Error executing ${toolName}:`, message);
    return JSON.stringify({ error: message });
  }
}
