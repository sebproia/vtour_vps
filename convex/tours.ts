import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getMyTours = query({
  args: { organizerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tours")
      .filter((q) => q.eq(q.field("organizerId"), args.organizerId))
      .order("desc")
      .collect();
  },
});

export const createTour = mutation({
  args: { name: v.string(), organizerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tours", {
      name: args.name,
      organizerId: args.organizerId,
      status: "draft",
      currentStepIndex: 0,
    });
  },
});

export const getTourRecap = query({
  args: { tourId: v.id("tours") },
  handler: async (ctx, args) => {
    const tour = await ctx.db.get(args.tourId);
    if (!tour) return null;

    const places = await ctx.db
      .query("places")
      .withIndex("by_tour", (q) => q.eq("tourId", args.tourId))
      .collect();

    const recapPlaces = await Promise.all(places.map(async (place) => {
      const photos = await ctx.db
        .query("photos")
        .withIndex("by_place", (q) => q.eq("placeId", place._id))
        .collect();
      
      const photosWithUrls = await Promise.all(photos.map(async (p) => ({
        ...p,
        url: await ctx.storage.getUrl(p.storageId)
      })));

      const ratings = await ctx.db
        .query("ratings")
        .withIndex("by_place", (q) => q.eq("placeId", place._id))
        .collect();

      return {
        ...place,
        photos: photosWithUrls,
        ratings
      };
    }));

    return { tour, places: recapPlaces };
  }
});
