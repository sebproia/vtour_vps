// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TourDateEditor from "../src/components/TourDateEditor";
import type { Id } from "../convex/_generated/dataModel";
const { save } = vi.hoisted(() => ({ save: vi.fn() }));
vi.mock("convex/react", () => ({ useMutation: () => save }));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
test("editing and saving the tour date calls only the date mutation", async () => {
  const user = userEvent.setup();
  save.mockResolvedValue(null);
  render(<TourDateEditor tourId={"tour-1" as Id<"tours">} date="2026-11-09" />);
  await user.click(
    screen.getByRole("button", { name: "Modifier la date du food tour" }),
  );
  const input = screen.getByLabelText("Date du food tour");
  await user.clear(input);
  await user.type(input, "2026-11-10");
  await user.click(screen.getByRole("button", { name: "Enregistrer la date" }));
  expect(save).toHaveBeenCalledExactlyOnceWith({
    tourId: "tour-1",
    date: "2026-11-10",
  });
});
test("a failed date save keeps the chosen date for retry", async () => {
  const user = userEvent.setup();
  save.mockRejectedValue(new Error("offline"));
  render(<TourDateEditor tourId={"tour-1" as Id<"tours">} date="2026-11-09" />);
  await user.click(
    screen.getByRole("button", { name: "Modifier la date du food tour" }),
  );
  await user.click(screen.getByRole("button", { name: "Enregistrer la date" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Impossible");
  expect(screen.getByLabelText("Date du food tour")).toHaveValue("2026-11-09");
});
