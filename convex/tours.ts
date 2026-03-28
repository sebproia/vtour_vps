import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getMyTours = query({
  args: { organizerId: v.string() },
  handler: async (ctx, args) => {
    const tours = await ctx.db
      .query("tours")
      .filter((q) => q.eq(q.field("organizerId"), args.organizerId))
      .order("desc")
      .collect();
    
    return Promise.all(tours.map(async (tour) => {
      const places = await ctx.db
        .query("places")
        .withIndex("by_tour", (q) => q.eq("tourId", tour._id))
        .collect();
      return { ...tour, stopsCount: places.length };
    }));
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

export const deleteTour = mutation({
  args: { tourId: v.id("tours"), organizerId: v.string() },
  handler: async (ctx, args) => {
    const tour = await ctx.db.get(args.tourId);
    if (!tour) throw new Error("Tour not found");
    if (tour.organizerId !== args.organizerId) throw new Error("Unauthorized");

    const places = await ctx.db
      .query("places")
      .withIndex("by_tour", (q) => q.eq("tourId", args.tourId))
      .collect();

    for (const place of places) {
      const ratings = await ctx.db
        .query("ratings")
        .withIndex("by_place", (q) => q.eq("placeId", place._id))
        .collect();
      for (const r of ratings) await ctx.db.delete(r._id);

      const photos = await ctx.db
        .query("photos")
        .withIndex("by_place", (q) => q.eq("placeId", place._id))
        .collect();
      for (const p of photos) {
        await ctx.storage.delete(p.storageId);
        await ctx.db.delete(p._id);
      }

      await ctx.db.delete(place._id);
    }
    await ctx.db.delete(args.tourId);
  }
});

export const duplicateTour = mutation({
  args: { tourId: v.id("tours"), organizerId: v.string() },
  handler: async (ctx, args) => {
    const tour = await ctx.db.get(args.tourId);
    if (!tour) throw new Error("Tour not found");
    if (tour.organizerId !== args.organizerId) throw new Error("Unauthorized");

    const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
    const newTourId = await ctx.db.insert("tours", {
      name: `${tour.name} (${today})`,
      organizerId: args.organizerId,
      status: "draft",
      currentStepIndex: 0,
    });

    const places = await ctx.db
      .query("places")
      .withIndex("by_tour", (q) => q.eq("tourId", args.tourId))
      .collect();

    for (const place of places) {
      await ctx.db.insert("places", {
        tourId: newTourId,
        name: place.name,
        address: place.address,
        order: place.order,
        coordinates: place.coordinates,
        adminComment: place.adminComment,
      });
    }

    return newTourId;
  }
});
