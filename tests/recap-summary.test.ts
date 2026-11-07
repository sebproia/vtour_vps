import { expect, test } from "vitest";
import {
  averageScore,
  rankRecapPlaces,
  mapsPlaceUrl,
  vitoAvatar,
  formatDistance,
} from "../src/lib/recap-summary";
test("rankings exclude unscored stops and sort group averages deterministically", () => {
  const places = Array.from({ length: 8 }, (_, i) => ({
    _id: `p${i}`,
    order: i,
    name: `Place ${i}`,
    ratings: [{ score: i + 1 }],
  }));
  const result = rankRecapPlaces([
    ...places,
    {
      _id: "passed",
      order: 8,
      name: "Passed",
      ratings: [{ score: undefined }],
    },
  ]);
  expect(result.top.map((p) => p._id)).toEqual(["p7", "p6", "p5"]);
  expect(result.flop.map((p) => p._id)).toEqual(["p0", "p1", "p2"]);
  expect(result.ratedCount).toBe(8);
  expect(result.overlap).toBe(false);
});
test("empty and sparse rankings never manufacture scores", () => {
  expect(
    averageScore([
      { score: undefined },
      { score: NaN },
      { score: Infinity },
      { score: 11 },
    ]),
  ).toBeNull();
  expect(rankRecapPlaces([]).top).toEqual([]);
  expect(
    rankRecapPlaces([
      { _id: "one", order: 0, name: "One", ratings: [{ score: 9 }] },
    ]).overlap,
  ).toBe(true);
  expect(
    averageScore([{ score: 8 }, { score: 10 }, { score: undefined }]),
  ).toBe(9);
});
test.each([
  [1, "disgusted"],
  [3.5, "skeptical"],
  [6, "happy"],
  [7.5, "smiling"],
  [9, "laughing"],
])("Vito follows the rating scale at %s", (score, face) => {
  expect(vitoAvatar(Number(score)).src).toContain(`grade-${face}.png`);
});
test("Maps links preserve place identity and safely encode addresses", () => {
  const url = new URL(
    mapsPlaceUrl({
      name: "A & B",
      address: "1 rue de l’Église, Paris",
      googlePlaceId: "google-id",
    }),
  );
  expect(url.origin).toBe("https://www.google.com");
  expect(url.searchParams.get("query_place_id")).toBe("google-id");
  expect(url.searchParams.get("query")).toBe("A & B, 1 rue de l’Église, Paris");
  expect(formatDistance(450)).toBe("450 m");
  expect(formatDistance(4200)).toContain("4,2");
});
