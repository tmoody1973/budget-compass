import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Clear all data from a table before re-seeding
export const clearTable = mutation({
  args: { table: v.string() },
  handler: async (ctx, { table }) => {
    const tableName = table as
      | "cityOverview"
      | "budgetSections"
      | "appropriationDetails"
      | "departmentBudgets"
      | "departmentMeta"
      | "departmentServices"
      | "performanceMeasures"
      | "positions"
      | "historicalComparison"
      | "departmentNarratives";
    const rows = await ctx.db.query(tableName).collect();
    for (const row of rows) {
      await ctx.db.delete(row._id);
    }
    return { deleted: rows.length };
  },
});

// ---- Individual insert mutations for each table ----

export const insertCityOverview = mutation({
  args: {
    city: v.string(),
    state: v.string(),
    fiscalYear: v.number(),
    budgetType: v.string(),
    mayor: v.string(),
    totalBudget: v.number(),
    totalTaxLevy: v.number(),
    totalNonTaxLevy: v.number(),
    propertyTaxRatePer1000: v.number(),
    priorYearTaxRate: v.number(),
    taxRateChange: v.number(),
    assessedValue: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("cityOverview", args);
  },
});

export const insertBudgetSection = mutation({
  args: {
    section: v.string(),
    name: v.string(),
    budget2025Adopted: v.number(),
    budget2026Proposed: v.number(),
    budgetChange: v.number(),
    nonTaxLevy2025: v.number(),
    nonTaxLevy2026: v.number(),
    taxLevy2025: v.number(),
    taxLevy2026: v.number(),
    taxLevyChange: v.number(),
    taxRate2025: v.number(),
    taxRate2026: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("budgetSections", args);
  },
});

export const insertAppropriationDetail = mutation({
  args: {
    section: v.string(),
    sectionName: v.string(),
    subsection: v.string(),
    lineItem: v.string(),
    adopted2025: v.optional(v.number()),
    requested2026: v.optional(v.number()),
    proposed2026: v.optional(v.number()),
    changeVs2025: v.optional(v.number()),
    changeVsRequested: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("appropriationDetails", args);
  },
});

export const insertDepartmentBudget = mutation({
  args: {
    department: v.string(),
    category: v.string(),
    lineItem: v.string(),
    actual2024: v.optional(v.number()),
    adopted2025: v.optional(v.number()),
    requested2026: v.optional(v.number()),
    proposed2026: v.optional(v.number()),
    changeVs2025: v.optional(v.number()),
    changeVsRequested: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("departmentBudgets", args);
  },
});

export const insertDepartmentMeta = mutation({
  args: {
    name: v.string(),
    mission: v.string(),
    totalExpenditures2026: v.optional(v.number()),
    totalExpenditures2025: v.optional(v.number()),
    totalRevenue2026: v.optional(v.number()),
    numServices: v.number(),
    numPerfMeasures: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("departmentMeta", args);
  },
});

export const insertDepartmentService = mutation({
  args: {
    department: v.string(),
    name: v.string(),
    operatingBudget: v.optional(v.number()),
    capitalBudget: v.optional(v.number()),
    grantBudget: v.optional(v.number()),
    ftes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("departmentServices", args);
  },
});

export const insertPerformanceMeasure = mutation({
  args: {
    department: v.string(),
    measure: v.string(),
    actual2024: v.optional(v.number()),
    projected2025: v.optional(v.number()),
    planned2026: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("performanceMeasures", args);
  },
});

export const insertPosition = mutation({
  args: {
    department: v.string(),
    adopted2025: v.optional(v.number()),
    requested2026: v.optional(v.number()),
    proposed2026: v.optional(v.number()),
    changeVs2025: v.optional(v.number()),
    changeVsRequested: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("positions", args);
  },
});

export const insertHistoricalComparison = mutation({
  args: {
    section: v.string(),
    lineItem: v.string(),
    actual2023: v.optional(v.number()),
    actual2024: v.optional(v.number()),
    adopted2025: v.optional(v.number()),
    proposed2026: v.optional(v.number()),
    changeVs2025: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("historicalComparison", args);
  },
});

export const insertDepartmentNarrative = mutation({
  args: {
    department: v.string(),
    pages: v.string(),
    fullText: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("departmentNarratives", args);
  },
});
