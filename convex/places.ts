import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getPlacesByTour = query({
  args: { tourId: v.id("tours") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("places")
      .withIndex("by_tour", (q) => q.eq("tourId", args.tourId))
      .collect();
  },
});

export const addPlace = mutation({
  args: { 
    tourId: v.id("tours"), 
    name: v.string(), 
    address: v.string(),
    description: v.optional(v.string()),
    coordinates: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number()
      })
    )
  },
  handler: async (ctx, args) => {
    // Get current places to determine the order
    const existingPlaces = await ctx.db
      .query("places")
      .withIndex("by_tour", (q) => q.eq("tourId", args.tourId))
      .collect();
    
    return await ctx.db.insert("places", {
      tourId: args.tourId,
      name: args.name,
      address: args.address,
      description: args.description,
      coordinates: args.coordinates,
      order: existingPlaces.length, // Put it at the end
    });
  },
});

export const getTourInfo = query({
  args: { tourId: v.id("tours") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.tourId);
  },
});

export const startLiveMode = mutation({
  args: { tourId: v.id("tours") },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.tourId, {
      status: "live",
      currentStepIndex: 0
    });
  }
});

export const nextStep = mutation({
  args: { tourId: v.id("tours") },
  handler: async (ctx, args) => {
    const tour = await ctx.db.get(args.tourId);
    if (!tour) throw new Error("Tour not found");
    
    return await ctx.db.patch(args.tourId, {
      currentStepIndex: tour.currentStepIndex + 1
    });
  }
});

export const endLiveMode = mutation({
  args: { tourId: v.id("tours") },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.tourId, {
      status: "completed",
    });
  }
});
