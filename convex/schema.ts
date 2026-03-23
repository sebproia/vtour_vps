import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tours: defineTable({
    name: v.string(),
    status: v.union(v.literal("draft"), v.literal("live"), v.literal("completed")),
    currentStepIndex: v.number(),
    organizerId: v.string(), // Clerk user ID
  }),
  
  places: defineTable({
    tourId: v.id("tours"),
    name: v.string(),
    address: v.string(),
    order: v.number(),
    description: v.optional(v.string()),
    coordinates: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
      })
    ),
    adminComment: v.optional(v.string()),
  }).index("by_tour", ["tourId"]),

  ratings: defineTable({
    placeId: v.id("places"),
    guestName: v.string(),
    score: v.optional(v.number()), // Note de 1 à 10
    emojiRating: v.optional(v.string()), // Rétrocompatibilité
    comment: v.optional(v.string()),
  }).index("by_place", ["placeId"]),

  photos: defineTable({
    placeId: v.id("places"),
    storageId: v.id("_storage"),
    uploaderName: v.string(),
  }).index("by_place", ["placeId"]),
});
