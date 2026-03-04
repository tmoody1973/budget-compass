import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { ConvexClient } from "convex/browser";
import { anyApi } from "convex/server";

const convex = new ConvexClient(process.env.CONVEX_URL!);

/**
 * Build a Convex function reference from a string like "budget.getCityOverview"
 * without depending on the generated `api` object.
 */
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
    topDepartmentsBySpending, categoryBreakdown, searchNarratives.`,
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
      ])
      .describe("Which Convex query function to call"),
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
  }),
  execute: async (input) => {
    const queryFn = budgetApi[input.queryName];
    const result = await convex.query(queryFn, input.args ?? {});
    return {
      data: result,
      source: `Convex: budget.${input.queryName}`,
    };
  },
});
