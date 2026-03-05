import { query } from "./_generated/server";
import { v } from "convex/values";

export const getOverview = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("countyOverview").first();
  },
});

export const getDepartments = query({
  args: { functionalArea: v.optional(v.string()) },
  handler: async (ctx, { functionalArea }) => {
    if (functionalArea) {
      return await ctx.db
        .query("countyDepartments")
        .withIndex("by_functional_area", (q) =>
          q.eq("functionalArea", functionalArea)
        )
        .collect();
    }
    return await ctx.db.query("countyDepartments").collect();
  },
});

export const getRevenue = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("countyRevenue").collect();
  },
});

export const getTopDepartments = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const all = await ctx.db.query("countyDepartments").collect();
    const sorted = all.sort((a, b) => b.expenditure2026 - a.expenditure2026);
    return sorted.slice(0, limit ?? 5);
  },
});
