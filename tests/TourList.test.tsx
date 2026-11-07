// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getFunctionName } from "convex/server";
import TourList from "../src/components/TourList";
const state = vi.hoisted(() => ({ mutate: vi.fn() }));
const tour = {
  _id: "tour123",
  _creationTime: 1,
  name: "Le tour test",
  status: "live",
  stopsCount: 3,
  date: "2026-11-08",
  previewPhotos: [],
  averageScore: null,
};
vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isLoading: false, isAuthenticated: true }),
  useQuery: (ref: Parameters<typeof getFunctionName>[0]) =>
    getFunctionName(ref).endsWith("getMyTours") ? [tour] : [],
  useMutation:
    (ref: Parameters<typeof getFunctionName>[0]) => (args: unknown) =>
      state.mutate(getFunctionName(ref), args),
}));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  vi.restoreAllMocks();
});
test("creation retains entered fields after failure and prevents duplicate submission while pending", async () => {
  const user = userEvent.setup();
  render(<TourList />);
  await user.click(screen.getByRole("button", { name: "Créer un tour" }));
  await user.type(screen.getByLabelText("Nom du tour"), "Burgers à Paris");
  state.mutate.mockRejectedValueOnce(new Error("offline"));
  await user.click(screen.getByRole("button", { name: "Créer le tour" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "informations sont conservées",
  );
  expect(screen.getByLabelText("Nom du tour")).toHaveValue("Burgers à Paris");
  state.mutate.mockImplementation(() => new Promise(() => {}));
  await user.click(screen.getByRole("button", { name: "Créer le tour" }));
  expect(screen.getByRole("button", { name: "Création…" })).toBeDisabled();
  expect(state.mutate).toHaveBeenLastCalledWith("tours:createTour", {
    name: "Burgers à Paris",
    date: undefined,
  });
});
test("secondary actions are labelled and destructive changes require confirmation", async () => {
  const user = userEvent.setup();
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  render(<TourList />);
  expect(
    screen.getByRole("link", { name: /Reprendre le tour/ }),
  ).toHaveAttribute("href", "/tour/tour123");
  expect(screen.getByText("En cours")).toBeInTheDocument();
  await user.click(screen.getByLabelText("Options pour Le tour test"));
  await user.click(screen.getByRole("button", { name: "Supprimer le tour" }));
  expect(confirm).toHaveBeenCalled();
  expect(state.mutate).not.toHaveBeenCalled();
  await user.click(screen.getByLabelText("Options pour Le tour test"));
  state.mutate.mockResolvedValue(null);
  await user.click(
    screen.getByRole("button", { name: "Partager dans Découvrir" }),
  );
  expect(state.mutate).toHaveBeenCalledWith("tours:toggleTourPublic", {
    tourId: "tour123",
    isPublic: true,
  });
});
test("discovery has a useful empty state and no nested interactive links", async () => {
  const user = userEvent.setup();
  const { container } = render(<TourList />);
  expect(container.querySelector("a button, a a")).toBeNull();
  await user.click(screen.getByRole("button", { name: "Découvrir" }));
  expect(screen.getByRole("button", { name: "Découvrir" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(
    screen.getByText("Les découvertes arrivent bientôt"),
  ).toBeInTheDocument();
});
