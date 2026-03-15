import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import { comparisonCities, getComparisonSummary } from "../../../data/comparison";

const CONVEX_URL =
  process.env.NEXT_PUBLIC_CONVEX_URL ??
  process.env.CONVEX_URL ??
  "https://polished-cuttlefish-191.convex.cloud";

const convex = new ConvexHttpClient(CONVEX_URL);
const budgetApi = anyApi["budget"];

export const queryBudgetDataTool = createTool({
  id: "query-budget-data",
  description: `Query Milwaukee's 2026 budget database for exact fiscal data.
    Use for ANY question about dollar amounts, headcounts, tax rates, or department budgets.
    Available queries: getCityOverview, getAllBudgetSections, getBudgetSection,
    getDepartmentBudget, getDepartmentExpenditures, getDepartmentRevenues,
    getAllDepartmentTotals, getAllDepartments, getDepartmentMeta,
    getDepartmentServices, getDepartmentPerformance, getAllPositions,
    getHistoricalBySection, getTaxLevyBreakdown, compareDepartments,
    topDepartmentsBySpending, categoryBreakdown, searchNarratives,
    getComparisonData (cross-city budget comparison with Madison, WI - extracted from PDFs using Nova 2 Lite document understanding).`,
  inputSchema: z.object({
    queryName: z
      .enum([
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
        "getComparisonData",
      ])
      .describe("Which query function to call. Use getComparisonData for cross-city comparisons."),
    args: z
      .record(z.any())
      .optional()
      .describe(
        "Arguments object, e.g. { department: 'Police' } or { section: 'A' } or { dept1: 'Police', dept2: 'Fire' } or { searchQuery: 'library' }"
      ),
  }),
  outputSchema: z.object({
    data: z.any(),
    source: z.string(),
    formattedTable: z.string().optional(),
  }),
  // Control what the LLM sees — send pre-formatted text instead of raw JSON
  toModelOutput: ({ data, source, formattedTable }) => {
    if (formattedTable) {
      return {
        type: "text" as const,
        value: `${source}\n${formattedTable}\n\nIMPORTANT: The table above contains verified data. Include it EXACTLY in your response. Do NOT reorder rows or reassign numbers.`,
      };
    }
    return { type: "json" as const, value: { data, source } };
  },
  execute: async (input) => {
    // Handle cross-city comparison query locally (not in Convex)
    if (input.queryName === "getComparisonData") {
      return {
        data: {
          summary: getComparisonSummary(),
          cities: comparisonCities,
          note: "Comparison data extracted from official budget PDFs using Amazon Nova 2 Lite document understanding. Madison data from Wisconsin Policy Forum Budget Brief.",
        },
        source: "Nova 2 Lite Document Understanding: Wisconsin city budget PDFs",
      };
    }

    const queryFn = budgetApi[input.queryName];
    const result = await convex.query(queryFn, input.args ?? {});

    // Pre-format data as markdown table so the LLM doesn't scramble name-to-number mappings
    let formattedTable = "";
    if (Array.isArray(result) && result.length > 0) {
      const first = result[0];
      if (first && typeof first === "object" && ("name" in first || "department" in first)) {
        const nameKey = "name" in first ? "name" : "department";
        const numericKeys = Object.keys(first).filter(
          (k) => k !== nameKey && k !== "_id" && k !== "_creationTime" && typeof first[k] === "number"
        );
        if (numericKeys.length > 0) {
          const headers = [nameKey, ...numericKeys];
          formattedTable = `\n\nPRE-FORMATTED TABLE (copy this EXACTLY into your response, do NOT reorder or change any values):\n\n`;
          formattedTable += `| ${headers.map((h) => h.charAt(0).toUpperCase() + h.slice(1)).join(" | ")} |\n`;
          formattedTable += `| ${headers.map(() => "---").join(" | ")} |\n`;
          for (const row of result.slice(0, 15)) {
            const cells = headers.map((h) => {
              const val = row[h];
              if (typeof val === "number" && val > 1000) {
                return `$${val.toLocaleString("en-US")}`;
              }
              return String(val ?? "");
            });
            formattedTable += `| ${cells.join(" | ")} |\n`;
          }
        }
      }
    }

    return {
      data: result,
      source: `Convex: budget.${input.queryName}`,
      ...(formattedTable ? { formattedTable } : {}),
    };
  },
});
