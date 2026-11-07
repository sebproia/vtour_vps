// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { useWalkingTimes } from "../src/hooks/useWalkingTimes";
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
test("Google receives single-pair requests and every leg stays visible beyond ten stops", async () => {
  const request = vi.fn().mockResolvedValue({
    rows: [
      {
        elements: [{ status: "OK", duration: { value: 120, text: "2 min" }, distance: { value: 200, text: "200 m" } }],
      },
    ],
  });
  vi.stubGlobal("google", {
    maps: {
      DistanceMatrixService: class {
        getDistanceMatrix = request;
      },
      TravelMode: { WALKING: "WALKING" },
    },
  });
  const places = Array.from({ length: 13 }, (_, i) => ({
    _id: `p${i}`,
    address: `Address ${i}`,
  }));
  const { result } = renderHook(() => useWalkingTimes(places, true));
  await waitFor(() =>
    expect(Object.keys(result.current.travelSeconds)).toHaveLength(12),
  );
  expect(request).toHaveBeenCalledTimes(12);
  expect(
    Object.values(result.current.travelMeters).reduce((a, b) => a + b, 0),
  ).toBe(2400);
  expect(result.current.pendingLegs).toBe(0);
  for (const [args] of request.mock.calls) {
    expect(args.origins).toHaveLength(1);
    expect(args.destinations).toHaveLength(1);
    expect(args.travelMode).toBe("WALKING");
  }
});
