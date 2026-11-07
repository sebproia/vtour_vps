import { expect, test } from "vitest";
import {
  calculateWalkingLegs,
  formatWalkingTime,
  type WalkingLeg,
} from "../src/lib/walking-times";
const places = Array.from({ length: 15 }, (_, i) => ({
  _id: `p${i}`,
  address: `Address ${i}`,
}));
test("fifteen stops produce fourteen adjacent legs with at most two requests in flight", async () => {
  let active = 0,
    max = 0;
  const calls: string[] = [];
  const result: Record<string, WalkingLeg> = {};
  await calculateWalkingLegs(
    places,
    async (from, to) => {
      active++;
      max = Math.max(max, active);
      calls.push(`${from._id}:${to._id}`);
      await Promise.resolve();
      active--;
      return 600;
    },
    (id, leg) => {
      result[id] = leg;
    },
  );
  expect(calls).toEqual(
    places.slice(0, -1).map((p, i) => `${p._id}:${places[i + 1]._id}`),
  );
  expect(max).toBeLessThanOrEqual(2);
  expect(Object.keys(result)).toHaveLength(14);
  expect(result.p12).toEqual({ status: "ok", seconds: 600, text: "10 min" });
});
test("an unavailable leg remains visible and does not discard successful durations", async () => {
  const result: Record<string, WalkingLeg> = {};
  await calculateWalkingLegs(
    places.slice(0, 4),
    async (from) => {
      if (from._id === "p1") throw new Error("ZERO_RESULTS");
      return 3600;
    },
    (id, leg) => {
      result[id] = leg;
    },
  );
  expect(result.p0.text).toBe("1 h");
  expect(result.p1).toEqual({
    status: "unavailable",
    text: "Trajet indisponible",
  });
  expect(result.p2.text).toBe("1 h");
});
test("cancelled route calculations never publish obsolete results", async () => {
  let cancelled = false,
    updates = 0;
  await calculateWalkingLegs(
    places,
    async () => {
      cancelled = true;
      return 100;
    },
    () => {
      updates++;
    },
    () => cancelled,
  );
  expect(updates).toBe(0);
});
test("duration labels carry minutes into hours and keep multi-day walks explicit", () => {
  expect(formatWalkingTime(3599)).toBe("1 h");
  expect(formatWalkingTime(60)).toBe("1 min");
  expect(formatWalkingTime(176400)).toBe("2 j 1 h");
});
