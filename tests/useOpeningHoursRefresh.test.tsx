// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { useOpeningHoursRefresh } from "../src/hooks/useOpeningHoursRefresh";
import type { Doc } from "../convex/_generated/dataModel";
const { save } = vi.hoisted(() => ({ save: vi.fn() }));
vi.mock("convex/react", () => ({ useMutation: () => save }));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});
const legacy = { _id: "place-1", googlePlaceId: "google-1" } as Doc<"places">;
test("legacy Google schedules are saved for the selected date", async () => {
  save.mockResolvedValue(null);
  const get = vi.fn((_request, callback) =>
    callback({ opening_hours: { weekday_text: [] } }, "OK"),
  );
  vi.stubGlobal("google", {
    maps: {
      places: {
        PlacesServiceStatus: { OK: "OK" },
        PlacesService: class {
          getDetails = get;
        },
      },
    },
  });
  renderHook(() => useOpeningHoursRefresh([legacy], "2026-11-09", true));
  await waitFor(() =>
    expect(save).toHaveBeenCalledExactlyOnceWith({
      placeId: "place-1",
      googlePlaceId: "google-1",
      expectedDate: "2026-11-09",
      weeklyOpeningHours: [],
    }),
  );
});
test("a response for a date abandoned while Google was loading is ignored", async () => {
  save.mockResolvedValue(null);
  const callbacks: ((result: unknown, status: string) => void)[] = [];
  const get = vi.fn((_request, callback) => callbacks.push(callback));
  vi.stubGlobal("google", {
    maps: {
      places: {
        PlacesServiceStatus: { OK: "OK" },
        PlacesService: class {
          getDetails = get;
        },
      },
    },
  });
  const { rerender } = renderHook(
    ({ date }) => useOpeningHoursRefresh([legacy], date, true),
    { initialProps: { date: "2026-11-09" } },
  );
  rerender({ date: "2026-11-10" });
  await act(async () =>
    callbacks[0]({ opening_hours: { weekday_text: [] } }, "OK"),
  );
  expect(save).not.toHaveBeenCalled();
  await act(async () =>
    callbacks[1]({ opening_hours: { weekday_text: [] } }, "OK"),
  );
  expect(save).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ expectedDate: "2026-11-10" }),
  );
});
