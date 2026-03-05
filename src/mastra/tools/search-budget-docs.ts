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

export const searchBudgetDocsTool = createTool({
  id: "search-budget-docs",
  description: `Search Milwaukee budget documents and policy briefs using Amazon Bedrock Knowledge Bases (RAG).
    Use for "why" questions, policy context, department descriptions, and analysis that goes beyond raw numbers.
    Examples: "Why is the police budget so large?", "What are the city's budget priorities?",
    "Explain the MPS referendum impact", "What does the Wisconsin Policy Forum say about the county budget?"
    Returns relevant passages with source attribution.`,
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
        source: z.string(),
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
            source: "system",
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

    const results = (response.retrievalResults ?? []).map((result) => ({
      content: result.content?.text ?? "",
      source:
        result.location?.s3Location?.uri ??
        result.location?.type ??
        "unknown",
      score: result.score ?? undefined,
    }));

    return {
      results,
      knowledgeBaseId: KNOWLEDGE_BASE_ID,
    };
  },
});
