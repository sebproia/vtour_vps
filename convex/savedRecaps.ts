import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  personalStats,
  validScore,
  type PersonalAddress,
} from "./lib/personalStats";

export const save = mutation({
  args: { tourId: v.id("tours"), participantName: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const tour = await ctx.db.get(args.tourId);
    if (!tour) throw new Error("Tour not found");
    if (tour.status !== "completed")
      throw new Error("Only completed tours can be saved");
    const places = await ctx.db
      .query("places")
      .withIndex("by_tour", (q) => q.eq("tourId", tour._id))
      .collect();
    const personal: PersonalAddress[] = [];
    let participantFound = false;
    for (const place of places.sort((a, b) => a.order - b.order)) {
      const ratings = await ctx.db
        .query("ratings")
        .withIndex("by_place", (q) => q.eq("placeId", place._id))
        .order("desc")
        .collect();
      const rating = args.participantName
        ? ratings.find((r) => r.guestName === args.participantName)
        : undefined;
      if (!rating) continue;
      participantFound = true;
      // Passing a stop is not a tasting. Legacy emoji-only opinions still count as rated.
      if (!validScore(rating.score) && !rating.emojiRating) continue;
      personal.push({
        name: place.name,
        address: place.address,
        googlePlaceId: place.googlePlaceId,
        coordinates: place.coordinates,
        score: validScore(rating.score) ? rating.score : undefined,
        comment: rating.comment,
        tags: place.tags,
      });
    }
    if (args.participantName && !participantFound)
      throw new Error("Participant not found in this tour");
    const existing = await ctx.db
      .query("savedRecaps")
      .withIndex("by_user_tour", (q) =>
        q.eq("userId", identity.subject).eq("tourId", tour._id),
      )
      .unique();
    const snapshot = {
      userId: identity.subject,
      tourId: tour._id,
      name: tour.name,
      date: tour.date,
      participantName: args.participantName,
      savedAt: Date.now(),
      places: personal,
    };
    if (existing) {
      await ctx.db.patch(existing._id, snapshot);
      return existing._id;
    }
    return ctx.db.insert("savedRecaps", snapshot);
  },
});
export const getSaved = query({
  args: { tourId: v.id("tours") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const recap = await ctx.db
      .query("savedRecaps")
      .withIndex("by_user_tour", (q) =>
        q.eq("userId", identity.subject).eq("tourId", args.tourId),
      )
      .unique();
    return recap
      ? {
          participantName: recap.participantName,
          savedAt: recap.savedAt,
          ratedPlaces: recap.places.length,
        }
      : null;
  },
});
export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const saved = await ctx.db
      .query("savedRecaps")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
    const recaps = await Promise.all(
      saved
        .sort((a, b) => b.savedAt - a.savedAt)
        .map(async (recap) => ({
          ...recap,
          sourceAvailable: !!(await ctx.db.get(recap.tourId)),
        })),
    );
    return { recaps, ...personalStats(saved) };
  },
});
