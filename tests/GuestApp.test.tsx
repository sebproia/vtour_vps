// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getFunctionName } from "convex/server";
import GuestApp from "../src/components/GuestApp";
const state = vi.hoisted(() => ({
  places: [{_id:"place-1",name:"Active restaurant",address:"Paris",order:0}],
  mutate: vi.fn(),
}));
vi.mock("convex/react", () => ({
  useQuery: (ref: Parameters<typeof getFunctionName>[0]) => {
    const name = getFunctionName(ref);
    if (name.endsWith("getTourInfo")) return {_id:"tour-1",name:"Tour",status:"live",currentStepIndex:0};
    if (name.endsWith("getPlacesByTour")) return state.places;
    return [];
  },
  useMutation: () => state.mutate,
}));
vi.mock("@react-google-maps/api", () => ({useLoadScript:()=>({isLoaded:false})}));
vi.mock("@/components/PhotoWall", () => ({default:()=>null}));
afterEach(() => {cleanup();localStorage.clear();vi.resetAllMocks();});
test("adding and editing future stops does not remount or clear a participant's unfinished review", async () => {
  const user = userEvent.setup();
  const view = render(<GuestApp tourId="tour-1" />);
  await user.type(screen.getByPlaceholderText("Ton prénom 🌮"), "Alex");
  await user.click(screen.getByRole("button", {name:/LET.*EAT/}));
  const comment = await screen.findByRole("textbox", {name:"Commentaire (optionnel)"});
  await user.type(comment,"Très bon{Enter}Avis en cours…");
  state.places = [...state.places,{_id:"place-2",name:"New restaurant",address:"New address",order:1}];
  view.rerender(<GuestApp tourId="tour-1" />);
  expect(screen.getByRole("textbox", {name:"Commentaire (optionnel)"})).toBe(comment);
  expect(comment).toHaveValue("Très bon\nAvis en cours…");
  expect(state.mutate).not.toHaveBeenCalled();
  expect(screen.queryByText(/Waiting for the organizer/)).not.toBeInTheDocument();
});
