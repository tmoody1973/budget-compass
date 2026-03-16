import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getSessions = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query("chatSessions")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .order("desc")
      .take(20);
  },
});

export const getSession = query({
  args: { id: v.id("chatSessions") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const saveSession = mutation({
  args: {
    clerkId: v.string(),
    title: v.string(),
    messages: v.array(v.object({
      role: v.string(),
      content: v.string(),
      timestamp: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("chatSessions", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateSession = mutation({
  args: {
    id: v.id("chatSessions"),
    messages: v.array(v.object({
      role: v.string(),
      content: v.string(),
      timestamp: v.number(),
    })),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const deleteSession = mutation({
  args: { id: v.id("chatSessions") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
