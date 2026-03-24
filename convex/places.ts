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
