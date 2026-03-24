import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getPlacesByTour = query({
  args: { tourId: v.id("tours") },
  handler: async (ctx, args) => {
    const places = await ctx.db
      .query("places")
      .withIndex("by_tour", (q) => q.eq("tourId", args.tourId))
      .collect();
    return places.sort((a, b) => a.order - b.order);
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
    ),
    adminComment: v.optional(v.string())
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
      adminComment: args.adminComment,
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

export const pauseTour = mutation({
  args: { tourId: v.id("tours") },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.tourId, {
      status: "draft",
    });
  }
});

export const deletePlace = mutation({
  args: { placeId: v.id("places") },
  handler: async (ctx, args) => {
    const place = await ctx.db.get(args.placeId);
    if (!place) throw new Error("Place not found");

    // Delete associated ratings
    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_place", (q) => q.eq("placeId", args.placeId))
      .collect();
    for (const r of ratings) await ctx.db.delete(r._id);

    // Delete associated photos
    const photos = await ctx.db
      .query("photos")
      .withIndex("by_place", (q) => q.eq("placeId", args.placeId))
      .collect();
    for (const p of photos) {
      await ctx.storage.delete(p.storageId);
      await ctx.db.delete(p._id);
    }

    await ctx.db.delete(args.placeId);

    // Re-index remaining places
    const remaining = await ctx.db
      .query("places")
      .withIndex("by_tour", (q) => q.eq("tourId", place.tourId))
      .collect();
    const sorted = remaining.sort((a, b) => a.order - b.order);
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].order !== i) {
        await ctx.db.patch(sorted[i]._id, { order: i });
      }
    }
  }
});

export const optimizeRoute = mutation({
  args: { tourId: v.id("tours") },
  handler: async (ctx, args) => {
    const places = await ctx.db
      .query("places")
      .withIndex("by_tour", (q) => q.eq("tourId", args.tourId))
      .collect();
      
    if (places.length <= 1) return;
    
    // Trier par ordre existant pour avoir toujours le même point de départ (le 1er)
    places.sort((a, b) => a.order - b.order);
    
    const optimized = [places[0]];
    const unvisited = places.slice(1);
    
    while (unvisited.length > 0) {
      const current = optimized[optimized.length - 1];
      if (!current.coordinates) {
        optimized.push(unvisited.shift()!);
        continue;
      }
      
      let nearestIdx = 0;
      let minDistance = Infinity;
      
      for (let i = 0; i < unvisited.length; i++) {
        const candidate = unvisited[i];
        if (!candidate.coordinates) continue;
        
        const dLat = current.coordinates.lat - candidate.coordinates.lat;
        const dLng = current.coordinates.lng - candidate.coordinates.lng;
        const dist = Math.sqrt(dLat * dLat + dLng * dLng); // Euclidean approximation
        
        if (dist < minDistance) {
          minDistance = dist;
          nearestIdx = i;
        }
      }
      
      optimized.push(unvisited[nearestIdx]);
      unvisited.splice(nearestIdx, 1);
    }
    
    // Sauvegarder le nouvel ordre
    for (let i = 0; i < optimized.length; i++) {
      if (optimized[i].order !== i) {
        await ctx.db.patch(optimized[i]._id, { order: i });
      }
    }
  }
});

export const reorderPlaces = mutation({
  args: { 
    tourId: v.id("tours"),
    updates: v.array(v.object({ _id: v.id("places"), order: v.number() }))
  },
  handler: async (ctx, args) => {
    for (const update of args.updates) {
      await ctx.db.patch(update._id, { order: update.order });
    }
  }
});
