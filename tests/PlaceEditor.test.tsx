// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Doc } from "../convex/_generated/dataModel";
import PlaceEditor from "../src/components/PlaceEditor";

const { save } = vi.hoisted(() => ({ save: vi.fn() }));
vi.mock("convex/react", () => ({ useMutation: () => save }));
vi.mock("next/dynamic", () => ({
  default: () =>
    function Picker({
      onLocationSelect,
      initialLocation,
    }: {
      onLocationSelect: (...args: unknown[]) => void;
      initialLocation?: { lat: number };
    }) {
      return (
        <>
          <input aria-label="Recherche adresse" />
          <button
            type="button"
            onClick={() =>
              onLocationSelect("New restaurant", "New address", 49, 3)
            }
          >
            Choose location ({initialLocation?.lat})
          </button>
        </>
      );
    },
}));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
const place = {
  _id: "place-1",
  _creationTime: 1,
  tourId: "tour-1",
  name: "Original",
  address: "Old address",
  order: 2,
  coordinates: { lat: 48, lng: 2 },
  adminComment: "Soup",
  googlePlaceId: "old",
  openingHours: "12–14",
} as Doc<"places">;

test("prefills the existing place and saves a new location against its original id", async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  save.mockResolvedValue(null);
  render(<PlaceEditor place={place} onClose={onClose} />);
  expect(screen.getByLabelText("Nom du restaurant")).toHaveValue("Original");
  expect(screen.getByText("Old address")).toBeInTheDocument();
  expect(screen.getByLabelText("Plat recommandé (optionnel)")).toHaveValue(
    "Soup",
  );
  await user.click(
    screen.getByRole("button", { name: "Choose location (48)" }),
  );
  expect(screen.getByText("New address")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Enregistrer" }));
  expect(save).toHaveBeenCalledExactlyOnceWith({
    placeId: "place-1",
    name: "New restaurant",
    address: "New address",
    coordinates: { lat: 49, lng: 3 },
    adminComment: "Soup",
    openingHours: undefined,
    googlePlaceId: undefined,
  });
  expect(onClose).toHaveBeenCalledOnce();
  expect(place.address).toBe("Old address");
});

test("cancel discards selected changes without calling the mutation", async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  const { unmount } = render(<PlaceEditor place={place} onClose={onClose} />);
  await user.click(
    screen.getByRole("button", { name: "Choose location (48)" }),
  );
  await user.click(screen.getByRole("button", { name: "Annuler" }));
  expect(save).not.toHaveBeenCalled();
  expect(onClose).toHaveBeenCalledOnce();
  unmount();
  render(<PlaceEditor place={place} onClose={onClose} />);
  expect(screen.getByText("Old address")).toBeInTheDocument();
  expect(screen.getByLabelText("Nom du restaurant")).toHaveValue("Original");
});

test("shows failed saves without losing the draft and allows retry", async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  save
    .mockRejectedValueOnce(new Error("Unavailable"))
    .mockResolvedValueOnce(null);
  render(<PlaceEditor place={place} onClose={onClose} />);
  await user.click(
    screen.getByRole("button", { name: "Choose location (48)" }),
  );
  await user.click(screen.getByRole("button", { name: "Enregistrer" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Impossible d’enregistrer",
  );
  expect(onClose).not.toHaveBeenCalled();
  expect(screen.getByText("New address")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Enregistrer" }));
  expect(onClose).toHaveBeenCalledOnce();
});

test("prevents duplicate saves or cancellation while the mutation is pending", async () => {
  const user = userEvent.setup();
  let resolve!: (value: null) => void;
  save.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  render(<PlaceEditor place={place} onClose={vi.fn()} />);
  await user.click(screen.getByRole("button", { name: "Enregistrer" }));
  expect(
    screen.getByRole("button", { name: "Enregistrement…" }),
  ).toBeDisabled();
  expect(screen.getByRole("button", { name: "Annuler" })).toBeDisabled();
  expect(screen.getByLabelText("Nom du restaurant")).toBeDisabled();
  await act(async () => {
    resolve(null);
  });
});

test("requires a map selection for legacy places without coordinates and rejects blank names", async () => {
  const user = userEvent.setup();
  render(
    <PlaceEditor
      place={{ ...place, coordinates: undefined }}
      onClose={vi.fn()}
    />,
  );
  expect(screen.getByRole("button", { name: "Enregistrer" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Choose location ()" }));
  expect(screen.getByRole("button", { name: "Enregistrer" })).toBeEnabled();
  await user.clear(screen.getByLabelText("Nom du restaurant"));
  expect(screen.getByRole("button", { name: "Enregistrer" })).toBeDisabled();
});

test("Enter in map search never submits the old address while choosing a suggestion", async () => {
  const user = userEvent.setup();
  render(<PlaceEditor place={place} onClose={vi.fn()} />);
  await user.type(
    screen.getByLabelText("Recherche adresse"),
    "New restaurant{Enter}",
  );
  expect(save).not.toHaveBeenCalled();
});
