/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "../convex/schema";
import { api } from "../convex/_generated/api";
const modules = import.meta.glob("../convex/**/*.ts");
async function setup() {
  const t = convexTest(schema, modules),
    owner = t.withIdentity({ subject: "owner" }),
    alex = t.withIdentity({ subject: "alex" }),
    lea = t.withIdentity({ subject: "lea" });
  const tourId = await owner.mutation(api.tours.createTour, {
    name: "Food tour",
  });
  const a = await owner.mutation(api.places.addPlace, {
    tourId,
    name: "Burger",
    address: "Paris",
    googlePlaceId: "burger",
  });
  const b = await owner.mutation(api.places.addPlace, {
    tourId,
    name: "Donut",
    address: "Paris",
    googlePlaceId: "donut",
  });
  const c = await owner.mutation(api.places.addPlace, {
    tourId,
    name: "Passé",
    address: "Paris",
  });
  await t.mutation(api.ratings.addRating, {
    placeId: a,
    guestName: "Alex",
    score: 9,
    comment: "Super",
  });
  await t.mutation(api.ratings.addRating, {
    placeId: b,
    guestName: "Léa",
    score: 10,
  });
  await t.mutation(api.ratings.addRating, { placeId: c, guestName: "Alex" });
  await owner.mutation(api.places.endLiveMode, { tourId });
  return { t, owner, alex, lea, tourId, a, b };
}
test("personal statistics count only the selected participant's scored stops", async () => {
  const { alex, tourId } = await setup();
  await alex.mutation(api.savedRecaps.save, {
    tourId,
    participantName: "Alex",
  });
  const result = await alex.query(api.savedRecaps.getMine, {});
  expect(result.totalAddresses).toBe(1);
  expect(result.totalTours).toBe(1);
  expect(result.topAddresses[0]).toMatchObject({
    name: "Burger",
    averageScore: 9,
  });
  expect(result.recaps[0].places).toHaveLength(1);
  expect(result.recaps[0].places[0].comment).toBe("Super");
});
test("saved recaps are private to the authenticated account and require authentication", async () => {
  const { t, alex, lea, tourId } = await setup();
  await alex.mutation(api.savedRecaps.save, {
    tourId,
    participantName: "Alex",
  });
  expect((await lea.query(api.savedRecaps.getMine, {})).recaps).toEqual([]);
  expect(await lea.query(api.savedRecaps.getSaved, { tourId })).toBeNull();
  await expect(t.query(api.savedRecaps.getMine, {})).rejects.toThrow(
    "Unauthenticated",
  );
  await expect(
    t.mutation(api.savedRecaps.save, { tourId, participantName: "Alex" }),
  ).rejects.toThrow("Unauthenticated");
});
test("saving twice updates a single snapshot and does not modify shared notes", async () => {
  const { t, alex, tourId } = await setup();
  const before = await t.run((ctx) => ctx.db.query("ratings").collect());
  const first = await alex.mutation(api.savedRecaps.save, {
    tourId,
    participantName: "Alex",
  });
  const second = await alex.mutation(api.savedRecaps.save, {
    tourId,
    participantName: "Alex",
  });
  expect(second).toBe(first);
  expect((await alex.query(api.savedRecaps.getMine, {})).totalTours).toBe(1);
  expect(await t.run((ctx) => ctx.db.query("ratings").collect())).toEqual(
    before,
  );
});
test("one address visited in multiple tours is counted once and ranked from personal scores", async () => {
  const { t, owner, alex, tourId } = await setup();
  await alex.mutation(api.savedRecaps.save, {
    tourId,
    participantName: "Alex",
  });
  const second = await owner.mutation(api.tours.duplicateTour, { tourId });
  const places = await t.query(api.places.getPlacesByTour, { tourId: second });
  await t.mutation(api.ratings.addRating, {
    placeId: places[0]._id,
    guestName: "Alex",
    score: 7,
  });
  await owner.mutation(api.places.endLiveMode, { tourId: second });
  await alex.mutation(api.savedRecaps.save, {
    tourId: second,
    participantName: "Alex",
  });
  const result = await alex.query(api.savedRecaps.getMine, {});
  expect(result.totalAddresses).toBe(1);
  expect(result.totalTours).toBe(2);
  expect(result.topAddresses[0]).toMatchObject({ averageScore: 8, visits: 2 });
});
test("deleting the original tour leaves the account's personal notes and counters intact", async () => {
  const { owner, alex, tourId } = await setup();
  await alex.mutation(api.savedRecaps.save, {
    tourId,
    participantName: "Alex",
  });
  await owner.mutation(api.tours.deleteTour, { tourId });
  const result = await alex.query(api.savedRecaps.getMine, {});
  expect(result.totalAddresses).toBe(1);
  expect(result.recaps[0]).toMatchObject({
    sourceAvailable: false,
    places: [expect.objectContaining({ score: 9, comment: "Super" })],
  });
});
test("unknown participants and unfinished tours cannot be silently saved as personal ratings", async () => {
  const { owner, alex, tourId } = await setup();
  await expect(
    alex.mutation(api.savedRecaps.save, { tourId, participantName: "Unknown" }),
  ).rejects.toThrow();
  const draft = await owner.mutation(api.tours.createTour, { name: "Draft" });
  await expect(
    alex.mutation(api.savedRecaps.save, { tourId: draft }),
  ).rejects.toThrow();
});
