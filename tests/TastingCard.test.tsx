// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TastingCard from "../src/components/TastingCard";
import type { Id } from "../convex/_generated/dataModel";

const state = vi.hoisted(() => ({
  mutate: vi.fn(),
  ratings: [] as { _id: string; guestName: string; score: number; comment: string }[],
}));
vi.mock("convex/react", () => ({
  useQuery: () => state.ratings,
  useMutation: () => state.mutate,
}));
vi.mock("@/components/PhotoWall", () => ({ default: () => null }));
afterEach(() => { cleanup(); vi.resetAllMocks(); state.ratings = []; });

test.each([false, true])("Enter adds newlines without submitting; the button sends the complete comment (guest=%s)", async isGuestView => {
  const user = userEvent.setup();
  state.mutate.mockResolvedValue(null);
  render(<TastingCard placeId={"place-1" as Id<"places">} guestName="Alex" isGuestView={isGuestView} />);
  const comment = screen.getByRole("textbox", { name: "Commentaire (optionnel)" });
  await user.type(comment, "Très bon{Enter}À refaire{Enter}{Enter}Merci !");
  expect(comment).toHaveValue("Très bon\nÀ refaire\n\nMerci !");
  expect(state.mutate).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Valider mon avis" }));
  expect(state.mutate).toHaveBeenCalledExactlyOnceWith({
    placeId: "place-1", guestName: "Alex", score: 5, comment: "Très bon\nÀ refaire\n\nMerci !",
  });
});

test("editing an existing comment also preserves Enter until explicit validation", async () => {
  state.ratings = [{ _id: "rating-1", guestName: "Alex", score: 8, comment: "Première ligne" }];
  state.mutate.mockResolvedValue(null);
  const user = userEvent.setup();
  render(<TastingCard placeId={"place-1" as Id<"places">} guestName="Alex" />);
  await user.click(screen.getByRole("button", { name: "Modifier mon avis" }));
  const comment = screen.getByRole("textbox", { name: "Commentaire (optionnel)" });
  await user.click(comment);
  await user.keyboard("{End}{Enter}Deuxième ligne");
  expect(comment).toHaveValue("Première ligne\nDeuxième ligne");
  expect(state.mutate).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Valider mon avis" }));
  expect(state.mutate).toHaveBeenCalledExactlyOnceWith({
    placeId: "place-1", guestName: "Alex", score: 8, comment: "Première ligne\nDeuxième ligne",
  });
});
