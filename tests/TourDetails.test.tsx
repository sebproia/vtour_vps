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
      coordinates: { lat: 48, lng: 2 } as { lat: number; lng: number } | undefined,
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
  state.places = state.places.slice(0, 1);
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


test("opens walking directions during a live tour without pausing or advancing it", async () => {
  const user = userEvent.setup();
  state.status = "live";
  state.places = [...state.places, {
    ...state.places[0], _id: "place-2", name: "Prochain restaurant", order: 1,
    address: "25 rue de Rivoli, Paris", coordinates: undefined,
  }];
  render(<TourDetails tourId="tour-1" />);
  const full = screen.getByRole("link", { name: "Itinéraire complet" });
  expect(full).toHaveAttribute("target", "_blank");
  await user.click(full);
  const next = screen.getByRole("link", { name: "Itinéraire vers le prochain arrêt : Prochain restaurant" });
  const nextUrl = new URL(next.getAttribute("href")!);
  expect(nextUrl.searchParams.get("destination")).toBe("25 rue de Rivoli, Paris");
  expect(nextUrl.searchParams.get("travelmode")).toBe("walking");
  await user.click(next);
  const current = screen.getByRole("link", { name: "Itinéraire vers Original" });
  expect(new URL(current.getAttribute("href")!).searchParams.get("destination")).toBe("48,2");
  await user.click(current);
  expect(state.mutate).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Direct" })).toHaveAttribute("aria-pressed", "true");
});

test("last stop still offers its directions and full route without a nonexistent next stop", () => {
  state.status = "live";
  render(<TourDetails tourId="tour-1" />);
  expect(screen.getByRole("link", { name: "Itinéraire complet" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Itinéraire vers Original" })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /Itinéraire vers le prochain arrêt/ })).not.toBeInTheDocument();
});


test("switches between organization and live without a pause mutation, adds after the active stop", async () => {
  const user = userEvent.setup();
  state.status = "live";
  state.mutate.mockResolvedValue(null);
  render(<TourDetails tourId="tour-1" />);
  await user.click(screen.getByRole("button", { name: "Organisation" }));
  expect(screen.getByText(/Le tour continue pour les participants/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Modifier Original" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "Supprimer Original" })).toBeDisabled();
  expect(state.mutate).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Select map location" }));
  await user.click(screen.getByRole("button", { name: "ADD TO TOUR" }));
  expect(state.mutate).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
    tourId: "tour-1", name: "New restaurant", insertAtIndex: 1,
  }));
  state.mutate.mockClear();
  await user.click(screen.getByRole("button", { name: "Direct" }));
  expect(screen.getByRole("link", { name: "Itinéraire complet" })).toBeInTheDocument();
  expect(state.mutate).not.toHaveBeenCalled();
});
