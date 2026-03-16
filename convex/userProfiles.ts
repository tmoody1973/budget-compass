import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getProfile = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query("userProfiles")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();
  },
});

export const saveProfile = mutation({
  args: {
    clerkId: v.string(),
    assessedValue: v.optional(v.number()),
    address: v.optional(v.string()),
    aldermanicDistrict: v.optional(v.string()),
    policeDistrict: v.optional(v.string()),
    fireStation: v.optional(v.string()),
    persona: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("userProfiles", {
      ...args,
      updatedAt: Date.now(),
    });
  },
});
