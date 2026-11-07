// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getFunctionName } from "convex/server";
import TourDetails from "../src/components/TourDetails";

const state = vi.hoisted(() => ({
  status: "draft",
  mutate: vi.fn(),
  places: [
    {
      _id: "place-1",
      _creationTime: 1,
      tourId: "tour-1",
      name: "Original",
      address: "Old address",
      order: 0,
      coordinates: { lat: 48, lng: 2 },
    },
  ],
}));
vi.mock("convex/react", () => ({
  useQuery: (ref: Parameters<typeof getFunctionName>[0]) =>
    getFunctionName(ref).endsWith("getTourInfo")
      ? {
          _id: "tour-1",
          _creationTime: 1,
          name: "Tour",
          status: state.status,
          currentStepIndex: 0,
        }
      : state.places,
  useMutation: () => state.mutate,
}));
vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: { id: "owner" } }),
}));
vi.mock("@react-google-maps/api", () => ({
  useLoadScript: () => ({ isLoaded: false }),
}));
vi.mock("@/components/TastingCard", () => ({ default: () => null }));
vi.mock("next/dynamic", () => ({
  default: () =>
    function Picker({
      onLocationSelect,
    }: {
      onLocationSelect: (...args: unknown[]) => void;
    }) {
      return (
        <button
          type="button"
          onClick={() =>
            onLocationSelect("New restaurant", "New address", 49, 3)
          }
        >
          Select map location
        </button>
      );
    },
}));
afterEach(() => {
  cleanup();
  state.status = "draft";
  vi.resetAllMocks();
});

test("opens an existing draft stop editor, cancels without writes, then saves its original id", async () => {
  const user = userEvent.setup();
  state.mutate.mockResolvedValue(null);
  render(<TourDetails tourId="tour-1" />);
  await user.click(screen.getByRole("button", { name: "Modifier Original" }));
  expect(
    screen.getByRole("form", { name: "Modifier Original" }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Annuler" }));
  expect(
    screen.queryByRole("form", { name: "Modifier Original" }),
  ).not.toBeInTheDocument();
  expect(state.mutate).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Modifier Original" }));
  await user.click(
    screen.getAllByRole("button", { name: "Select map location" })[0],
  );
  await user.click(screen.getByRole("button", { name: "Enregistrer" }));
  expect(state.mutate).toHaveBeenCalledWith(
    expect.objectContaining({
      placeId: "place-1",
      address: "New address",
      coordinates: { lat: 49, lng: 3 },
    }),
  );
  expect(
    screen.queryByRole("form", { name: "Modifier Original" }),
  ).not.toBeInTheDocument();
});

test.each(["live", "completed"])(
  "does not offer address edits for %s tours",
  (status) => {
    state.status = status;
    render(<TourDetails tourId="tour-1" />);
    expect(
      screen.queryByRole("button", { name: "Modifier Original" }),
    ).not.toBeInTheDocument();
  },
);
