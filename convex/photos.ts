import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const savePhoto = mutation({
  args: {
    placeId: v.id("places"),
    uploaderName: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("photos", {
      placeId: args.placeId,
      uploaderName: args.uploaderName,
      storageId: args.storageId,
    });
  },
});

export const getPhotosByPlace = query({
  args: { placeId: v.id("places") },
  handler: async (ctx, args) => {
    const photos = await ctx.db
      .query("photos")
      .withIndex("by_place", (q) => q.eq("placeId", args.placeId))
      .order("desc")
      .collect();

    // Map the storageId to actual URLs
    return Promise.all(
      photos.map(async (photo) => ({
        ...photo,
        url: await ctx.storage.getUrl(photo.storageId),
      }))
    );
  },
});
