/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "../convex/schema";
import { api } from "../convex/_generated/api";

const modules = import.meta.glob("../convex/**/*.ts");

async function setup() {
  const t = convexTest(schema, modules);
  const ids = await t.run(async (ctx) => {
    const tourId = await ctx.db.insert("tours", {
      name: "Food tour",
      status: "draft",
      currentStepIndex: 0,
      organizerId: "owner",
    });
    const placeId = await ctx.db.insert("places", {
      tourId,
      name: "Original",
      address: "Old address",
      order: 0,
      coordinates: { lat: 48, lng: 2 },
      openingHours: "12–14",
      googlePlaceId: "old-google",
      adminComment: "Try the soup",
      description: "Keep description",
    });
    const secondId = await ctx.db.insert("places", {
      tourId,
      name: "Second",
      address: "Second address",
      order: 1,
    });
    const ratingId = await ctx.db.insert("ratings", {
      placeId,
      guestName: "Guest",
      score: 8,
    });
    return { tourId, placeId, secondId, ratingId };
  });
  return { t, owner: t.withIdentity({ subject: "owner" }), ...ids };
}

test("editing a draft place updates its location without changing identity, order or related data", async () => {
  const { t, owner, placeId, secondId, ratingId } = await setup();
  const before = await t.run(async (ctx) => ({
    place: await ctx.db.get(placeId),
    second: await ctx.db.get(secondId),
    rating: await ctx.db.get(ratingId),
  }));
  await owner.mutation(api.places.updatePlace, {
    placeId,
    name: " New name ",
    address: " New address ",
    coordinates: { lat: 49, lng: 3 },
    openingHours: "18–22",
    googlePlaceId: "new-google",
    adminComment: " New recommendation ",
  });
  const after = await t.run(async (ctx) => ({
    place: await ctx.db.get(placeId),
    second: await ctx.db.get(secondId),
    rating: await ctx.db.get(ratingId),
  }));
  expect(after).toEqual({
    ...before,
    place: {
      ...before.place,
      name: "New name",
      address: "New address",
      coordinates: { lat: 49, lng: 3 },
      openingHours: "18–22",
      googlePlaceId: "new-google",
      adminComment: "New recommendation",
    },
  });
});

test.each([
  "anonymous",
  "other",
  "live",
  "completed",
  "missing-place",
  "missing-tour",
])("rejects %s edits without modifying places", async (scenario) => {
  const { t, owner, placeId, tourId } = await setup();
  if (scenario === "live" || scenario === "completed") {
    await t.run(async (ctx) => {
      await ctx.db.patch(tourId, { status: scenario });
    });
  }
  if (scenario === "missing-place")
    await t.run(async (ctx) => {
      await ctx.db.delete(placeId);
    });
  if (scenario === "missing-tour")
    await t.run(async (ctx) => {
      await ctx.db.delete(tourId);
    });
  const before = await t.run(async (ctx) => ctx.db.query("places").collect());
  const client =
    scenario === "anonymous"
      ? t
      : scenario === "other"
        ? t.withIdentity({ subject: "other" })
        : owner;
  await expect(
    client.mutation(api.places.updatePlace, {
      placeId,
      name: "Changed",
      address: "Changed",
      coordinates: { lat: 49, lng: 3 },
    }),
  ).rejects.toThrow();
  expect(await t.run(async (ctx) => ctx.db.query("places").collect())).toEqual(
    before,
  );
});

test.each([
  { name: " " },
  { address: " " },
  { coordinates: { lat: 91, lng: 0 } },
  { coordinates: { lat: 0, lng: -181 } },
  { coordinates: { lat: NaN, lng: 0 } },
  { coordinates: { lat: 0, lng: Infinity } },
])("rejects invalid location data %j", async (invalid) => {
  const { t, owner, placeId } = await setup();
  const before = await t.run(async (ctx) => ctx.db.get(placeId));
  await expect(
    owner.mutation(api.places.updatePlace, {
      placeId,
      name: "Valid",
      address: "Valid",
      coordinates: { lat: 48, lng: 2 },
      ...invalid,
    }),
  ).rejects.toThrow();
  expect(await t.run(async (ctx) => ctx.db.get(placeId))).toEqual(before);
});

test("clears old Google metadata and recommendation when the new selection omits them", async () => {
  const { t, owner, placeId } = await setup();
  await owner.mutation(api.places.updatePlace, {
    placeId,
    name: "Pin",
    address: "New pin",
    coordinates: { lat: 50, lng: 4 },
  });
  const place = await t.run(async (ctx) => ctx.db.get(placeId));
  expect(place).not.toHaveProperty("googlePlaceId");
  expect(place).not.toHaveProperty("openingHours");
  expect(place).not.toHaveProperty("adminComment");
});
