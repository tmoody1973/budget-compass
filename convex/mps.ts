import { query } from "./_generated/server";

export const getOverview = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("mpsOverview").first();
  },
});

export const getFundGroups = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("mpsFundGroups").collect();
  },
});

export const getOffices = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("mpsOffices").collect();
  },
});

export const getExpenditures = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("mpsExpenditures").collect();
  },
});

export const getPositions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("mpsPositions").collect();
  },
});

export const getEnrollment = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("mpsEnrollment").collect();
  },
});

export const getForecast = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("mpsForecast").collect();
  },
});
