import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  BedrockAgentRuntimeClient,
  RetrieveCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";

const client = new BedrockAgentRuntimeClient({
  region: process.env.AWS_REGION ?? "us-east-1",
});

const KNOWLEDGE_BASE_ID = process.env.BEDROCK_KNOWLEDGE_BASE_ID ?? "";

// Map S3 file names to friendly names and public PDF paths
const SOURCE_MAP: Record<string, { name: string; url: string }> = {
  "2026CityBudgetBrief": {
    name: "City of Milwaukee Budget Brief (Wisconsin Policy Forum)",
    url: "/docs/city-budget-brief.pdf",
  },
  "BudgetBrief_2026MilwaukeeCounty": {
    name: "Milwaukee County Budget Brief (Wisconsin Policy Forum)",
    url: "/docs/county-budget-brief.pdf",
  },
  "BudgetBrief_2026MPS": {
    name: "MPS Budget Brief (Wisconsin Policy Forum)",
    url: "/docs/mps-budget-brief.pdf",
  },
  "2026-Proposed-Plan-and-Executive-Budget-Summary": {
    name: "2026 City Proposed Budget",
    url: "/docs/city-proposed-budget.pdf",
  },
  "ProposedBudgetSummary": {
    name: "MPS 2025-26 Proposed Budget Summary",
    url: "/docs/mps-budget-brief.pdf",
  },
  "2026-Adopted-Operating-Budget": {
    name: "Milwaukee County 2026 Adopted Operating Budget",
    url: "/docs/county-budget-brief.pdf",
  },
};

function resolveSource(s3Uri: string): { name: string; url: string } {
  // Extract filename from S3 URI like s3://bucket/path/filename.pdf
  const filename = s3Uri.split("/").pop()?.replace(".pdf", "") ?? "";

  for (const [key, value] of Object.entries(SOURCE_MAP)) {
    if (filename.includes(key)) return value;
  }

  return {
    name: filename || "Budget Document",
    url: "",
  };
}

export const searchBudgetDocsTool = createTool({
  id: "search-budget-docs",
  description: `Search Milwaukee budget documents and policy briefs using Amazon Bedrock Knowledge Bases (RAG).
    Use for "why" questions, policy context, department descriptions, and analysis that goes beyond raw numbers.
    Returns relevant passages with source document name, page number, and link.
    IMPORTANT: Always include the sources in your response using this format:
    📄 Source: [document name], page X`,
  inputSchema: z.object({
    query: z
      .string()
      .describe("Natural language question to search budget documents for"),
    numberOfResults: z
      .number()
      .optional()
      .default(5)
      .describe("Number of results to return (default 5)"),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        content: z.string(),
        sourceName: z.string(),
        sourceUrl: z.string(),
        pageNumber: z.number().optional(),
        score: z.number().optional(),
      })
    ),
    knowledgeBaseId: z.string(),
  }),
  execute: async (input) => {
    if (!KNOWLEDGE_BASE_ID) {
      return {
        results: [
          {
            content:
              "Bedrock Knowledge Base not configured. Set BEDROCK_KNOWLEDGE_BASE_ID environment variable.",
            sourceName: "system",
            sourceUrl: "",
            score: 0,
          },
        ],
        knowledgeBaseId: "not-configured",
      };
    }

    const command = new RetrieveCommand({
      knowledgeBaseId: KNOWLEDGE_BASE_ID,
      retrievalQuery: { text: input.query },
      retrievalConfiguration: {
        vectorSearchConfiguration: {
          numberOfResults: input.numberOfResults ?? 5,
        },
      },
    });

    const response = await client.send(command);

    const results = (response.retrievalResults ?? []).map((result) => {
      const s3Uri =
        result.location?.s3Location?.uri ??
        result.location?.type ??
        "unknown";

      const resolved = resolveSource(s3Uri);

      // Extract page number from metadata if available
      const pageNumber =
        (result.metadata?.["x-amz-bedrock-kb-source-page"] as number) ??
        (result.metadata?.["page_number"] as number) ??
        undefined;

      return {
        content: result.content?.text ?? "",
        sourceName: resolved.name,
        sourceUrl: pageNumber
          ? `${resolved.url}#page=${pageNumber}`
          : resolved.url,
        pageNumber,
        score: result.score ?? undefined,
      };
    });

    return {
      results,
      knowledgeBaseId: KNOWLEDGE_BASE_ID,
    };
  },
});
