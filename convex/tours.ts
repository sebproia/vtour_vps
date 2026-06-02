import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getMyTours = query({
  args: { organizerId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const organizerId = identity ? identity.subject : args.organizerId;
    if (!organizerId) return [];
    const tours = await ctx.db
      .query("tours")
      .filter((q) => q.eq(q.field("organizerId"), organizerId))
      .order("desc")
      .collect();
    
    return Promise.all(tours.map(async (tour) => {
      const places = await ctx.db
        .query("places")
        .withIndex("by_tour", (q) => q.eq("tourId", tour._id))
        .collect();

      let averageScore = null;
      if (tour.status === "completed") {
        let sum = 0;
        let count = 0;
        await Promise.all(places.map(async (place) => {
          const ratings = await ctx.db
            .query("ratings")
            .withIndex("by_place", (q) => q.eq("placeId", place._id))
            .collect();
          for (const r of ratings) {
            if (r.score !== undefined && r.score !== null) {
              sum += r.score;
              count++;
            }
          }
        }));
        if (count > 0) averageScore = Number((sum / count).toFixed(1));
      }

      let previewPhotos: string[] = [];
      for (const place of places) {
        const photos = await ctx.db
          .query("photos")
          .withIndex("by_place", (q) => q.eq("placeId", place._id))
          .collect();
        for (const photo of photos) {
          const url = await ctx.storage.getUrl(photo.storageId);
          if (url) previewPhotos.push(url);
          if (previewPhotos.length >= 3) break;
        }
        if (previewPhotos.length >= 3) break;
      }

      return { ...tour, stopsCount: places.length, averageScore, previewPhotos };
    }));
  },
});

export const createTour = mutation({
  args: { 
    name: v.string(), 
    date: v.optional(v.string()),
    organizerId: v.optional(v.string()) 
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const organizerId = identity ? identity.subject : args.organizerId;
    if (!organizerId) throw new Error("Unauthenticated");

    return await ctx.db.insert("tours", {
      name: args.name,
      organizerId: organizerId,
      status: "draft",
      currentStepIndex: 0,
      date: args.date,
    });
  },
});

export const renameTour = mutation({
  args: { tourId: v.id("tours"), name: v.string(), organizerId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const organizerId = identity ? identity.subject : args.organizerId;
    if (!organizerId) throw new Error("Unauthenticated");

    const tour = await ctx.db.get(args.tourId);
    if (!tour) throw new Error("Tour not found");
    if (tour.organizerId !== organizerId) throw new Error("Unauthorized");
    await ctx.db.patch(args.tourId, { name: args.name });
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
  args: { tourId: v.id("tours"), organizerId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const organizerId = identity ? identity.subject : args.organizerId;
    if (!organizerId) throw new Error("Unauthenticated");

    const tour = await ctx.db.get(args.tourId);
    if (!tour) throw new Error("Tour not found");
    if (tour.organizerId !== organizerId) throw new Error("Unauthorized");

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
  args: { tourId: v.id("tours"), organizerId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const organizerId = identity ? identity.subject : args.organizerId;
    if (!organizerId) throw new Error("Unauthenticated");

    const tour = await ctx.db.get(args.tourId);
    if (!tour) throw new Error("Tour not found");
    if (tour.organizerId !== organizerId) throw new Error("Unauthorized");

    const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
    const newTourId = await ctx.db.insert("tours", {
      name: `${tour.name} (${today})`,
      organizerId: organizerId,
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
        openingHours: place.openingHours,
        googlePlaceId: place.googlePlaceId,
        description: place.description,
      });
    }

    return newTourId;
  }
});

export const toggleTourPublic = mutation({
  args: { tourId: v.id("tours"), isPublic: v.boolean(), organizerId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const organizerId = identity ? identity.subject : args.organizerId;
    if (!organizerId) throw new Error("Unauthenticated");

    const tour = await ctx.db.get(args.tourId);
    if (!tour) throw new Error("Tour not found");
    if (tour.organizerId !== organizerId) throw new Error("Unauthorized");

    await ctx.db.patch(args.tourId, { isPublic: args.isPublic });
  }
});

export const getPublicTours = query({
  args: {},
  handler: async (ctx) => {
    const tours = await ctx.db
      .query("tours")
      .filter((q) => q.eq(q.field("isPublic"), true))
      .order("desc")
      .collect();
    
    return Promise.all(tours.map(async (tour) => {
      const places = await ctx.db
        .query("places")
        .withIndex("by_tour", (q) => q.eq("tourId", tour._id))
        .collect();

      let averageScore = null;
      if (tour.status === "completed") {
        let sum = 0;
        let count = 0;
        await Promise.all(places.map(async (place) => {
          const ratings = await ctx.db
            .query("ratings")
            .withIndex("by_place", (q) => q.eq("placeId", place._id))
            .collect();
          for (const r of ratings) {
            if (r.score !== undefined && r.score !== null) {
              sum += r.score;
              count++;
            }
          }
        }));
        if (count > 0) averageScore = Number((sum / count).toFixed(1));
      }

      let previewPhotos: string[] = [];
      for (const place of places) {
        const photos = await ctx.db
          .query("photos")
          .withIndex("by_place", (q) => q.eq("placeId", place._id))
          .collect();
        for (const photo of photos) {
          const url = await ctx.storage.getUrl(photo.storageId);
          if (url) previewPhotos.push(url);
          if (previewPhotos.length >= 3) break;
        }
        if (previewPhotos.length >= 3) break;
      }

      return { ...tour, stopsCount: places.length, averageScore, previewPhotos };
    }));
  },
});

export const importPublicTour = mutation({
  args: { tourId: v.id("tours"), organizerId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const organizerId = identity ? identity.subject : args.organizerId;
    if (!organizerId) throw new Error("Unauthenticated");

    const tour = await ctx.db.get(args.tourId);
    if (!tour) throw new Error("Tour not found");
    if (!tour.isPublic) throw new Error("This tour is private");

    const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
    const newTourId = await ctx.db.insert("tours", {
      name: `${tour.name} (Importé ${today})`,
      organizerId: organizerId,
      status: "draft",
      currentStepIndex: 0,
      isPublic: false,
      date: tour.date,
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
        openingHours: place.openingHours,
        googlePlaceId: place.googlePlaceId,
        description: place.description,
      });
    }

    return newTourId;
  }
});
