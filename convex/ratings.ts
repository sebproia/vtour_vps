import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getRatingsByPlace = query({
  args: { placeId: v.id("places") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ratings")
      .withIndex("by_place", (q) => q.eq("placeId", args.placeId))
      .order("desc")
      .collect();
  },
});

export const addRating = mutation({
  args: { 
    placeId: v.id("places"), 
    guestName: v.string(), 
    score: v.optional(v.number()),
    comment: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Vérifier si ce guest a déjà noté cette place
    const existingRatings = await ctx.db
      .query("ratings")
      .withIndex("by_place", (q) => q.eq("placeId", args.placeId))
      .collect();

    const existingRating = existingRatings.find(r => r.guestName === args.guestName);

    if (existingRating) {
      return await ctx.db.patch(existingRating._id, {
        score: args.score,
        comment: args.comment,
      });
    }

    return await ctx.db.insert("ratings", {
      placeId: args.placeId,
      guestName: args.guestName,
      score: args.score,
      comment: args.comment,
    });
  },
});
