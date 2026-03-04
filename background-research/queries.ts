import { query } from "./_generated/server";
import { v } from "convex/values";

// ---- City Overview ----
export const getCityOverview = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("cityOverview").first();
  },
});

// ---- Budget Sections ----
export const getAllBudgetSections = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("budgetSections").collect();
  },
});

export const getBudgetSection = query({
  args: { section: v.string() },
  handler: async (ctx, { section }) => {
    return await ctx.db
      .query("budgetSections")
      .withIndex("by_section", (q) => q.eq("section", section))
      .first();
  },
});

// ---- Department Budgets ----
export const getDepartmentBudget = query({
  args: { department: v.string() },
  handler: async (ctx, { department }) => {
    return await ctx.db
      .query("departmentBudgets")
      .withIndex("by_department", (q) => q.eq("department", department))
      .collect();
  },
});

export const getDepartmentExpenditures = query({
  args: { department: v.string() },
  handler: async (ctx, { department }) => {
    return (
      await ctx.db
        .query("departmentBudgets")
        .withIndex("by_department_category", (q) =>
          q.eq("department", department).eq("category", "expenditure")
        )
        .collect()
    );
  },
});

export const getDepartmentRevenues = query({
  args: { department: v.string() },
  handler: async (ctx, { department }) => {
    return await ctx.db
      .query("departmentBudgets")
      .withIndex("by_department_category", (q) =>
        q.eq("department", department).eq("category", "revenue")
      )
      .collect();
  },
});

export const getAllDepartmentTotals = query({
  args: {},
  handler: async (ctx) => {
    const metas = await ctx.db.query("departmentMeta").collect();
    return metas
      .filter((m) => m.totalExpenditures2026 != null)
      .sort((a, b) => (b.totalExpenditures2026 ?? 0) - (a.totalExpenditures2026 ?? 0));
  },
});

// ---- Department Meta ----
export const getAllDepartments = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("departmentMeta").collect();
  },
});

export const getDepartmentMeta = query({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    return await ctx.db
      .query("departmentMeta")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();
  },
});

// ---- Services ----
export const getDepartmentServices = query({
  args: { department: v.string() },
  handler: async (ctx, { department }) => {
    return await ctx.db
      .query("departmentServices")
      .withIndex("by_department", (q) => q.eq("department", department))
      .collect();
  },
});

// ---- Performance Measures ----
export const getDepartmentPerformance = query({
  args: { department: v.string() },
  handler: async (ctx, { department }) => {
    return await ctx.db
      .query("performanceMeasures")
      .withIndex("by_department", (q) => q.eq("department", department))
      .collect();
  },
});

// ---- Positions ----
export const getAllPositions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("positions").collect();
  },
});

// ---- Historical ----
export const getHistoricalBySection = query({
  args: { section: v.string() },
  handler: async (ctx, { section }) => {
    return await ctx.db
      .query("historicalComparison")
      .withIndex("by_section", (q) => q.eq("section", section))
      .collect();
  },
});

// ---- Narrative Search (full-text) ----
export const searchNarratives = query({
  args: { searchQuery: v.string() },
  handler: async (ctx, { searchQuery }) => {
    return await ctx.db
      .query("departmentNarratives")
      .withSearchIndex("search_text", (q) => q.search("fullText", searchQuery))
      .take(5);
  },
});

// ---- Aggregation Helpers ----

// Get total tax levy breakdown
export const getTaxLevyBreakdown = query({
  args: {},
  handler: async (ctx) => {
    const sections = await ctx.db.query("budgetSections").collect();
    const taxFunded = sections.filter((s) => s.taxLevy2026 > 0);
    const total = taxFunded.reduce((sum, s) => sum + s.taxLevy2026, 0);
    return {
      total,
      breakdown: taxFunded.map((s) => ({
        section: s.section,
        name: s.name,
        taxLevy2026: s.taxLevy2026,
        pctOfTotal: ((s.taxLevy2026 / total) * 100).toFixed(1),
        taxRate2026: s.taxRate2026,
      })),
    };
  },
});

// Compare any two departments
export const compareDepartments = query({
  args: { dept1: v.string(), dept2: v.string() },
  handler: async (ctx, { dept1, dept2 }) => {
    const [meta1, meta2, budget1, budget2] = await Promise.all([
      ctx.db.query("departmentMeta").withIndex("by_name", (q) => q.eq("name", dept1)).first(),
      ctx.db.query("departmentMeta").withIndex("by_name", (q) => q.eq("name", dept2)).first(),
      ctx.db.query("departmentBudgets").withIndex("by_department", (q) => q.eq("department", dept1)).collect(),
      ctx.db.query("departmentBudgets").withIndex("by_department", (q) => q.eq("department", dept2)).collect(),
    ]);
    return { dept1: { meta: meta1, budget: budget1 }, dept2: { meta: meta2, budget: budget2 } };
  },
});

// Top N departments by proposed 2026 expenditures
export const topDepartmentsBySpending = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const metas = await ctx.db.query("departmentMeta").collect();
    return metas
      .filter((m) => m.totalExpenditures2026 != null)
      .sort((a, b) => (b.totalExpenditures2026 ?? 0) - (a.totalExpenditures2026 ?? 0))
      .slice(0, limit ?? 10);
  },
});

// Budget category breakdown across all departments
export const categoryBreakdown = query({
  args: {},
  handler: async (ctx) => {
    const budgets = await ctx.db.query("departmentBudgets").collect();
    const expenditures = budgets.filter(
      (b) => b.category === "expenditure" && b.lineItem !== "Total" && b.lineItem !== "Total + ARPA"
    );

    const byLineItem: Record<string, number> = {};
    for (const e of expenditures) {
      const key = e.lineItem;
      byLineItem[key] = (byLineItem[key] ?? 0) + (e.proposed2026 ?? 0);
    }

    return Object.entries(byLineItem)
      .map(([lineItem, total]) => ({ lineItem, total }))
      .sort((a, b) => b.total - a.total);
  },
});
