// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SaveRecap from "../src/components/SaveRecap";
import type { Id } from "../convex/_generated/dataModel";
const state = vi.hoisted(() => ({
  signedIn: false,
  save: vi.fn(),
  saved: null as null | {
    participantName: string;
    savedAt: number;
    ratedPlaces: number;
  },
}));
vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    isLoaded: true,
    isSignedIn: state.signedIn,
    user: state.signedIn ? { firstName: "Sam" } : null,
  }),
  SignInButton: ({
    children,
    forceRedirectUrl,
  }: {
    children: React.ReactNode;
    forceRedirectUrl: string;
  }) => (
    <div data-testid="sign-in" data-return={forceRedirectUrl}>
      {children}
    </div>
  ),
  SignUpButton: ({
    children,
    forceRedirectUrl,
  }: {
    children: React.ReactNode;
    forceRedirectUrl: string;
  }) => (
    <div data-testid="sign-up" data-return={forceRedirectUrl}>
      {children}
    </div>
  ),
}));
vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: state.signedIn, isLoading: false }),
  useQuery: (_ref: unknown, args: unknown) =>
    args === "skip" ? undefined : state.saved,
  useMutation: () => state.save,
}));
afterEach(() => {
  cleanup();
  localStorage.clear();
  state.signedIn = false;
  state.saved = null;
  vi.resetAllMocks();
});
const props = {
  tourId: "tour-1" as Id<"tours">,
  participants: ["Alex", "Léa"],
  completed: true,
};
test("account creation and login keep the current recap as their return target", () => {
  render(<SaveRecap {...props} />);
  expect(
    screen.getByRole("button", { name: "Créer un compte" }),
  ).toBeInTheDocument();
  expect(screen.getByTestId("sign-in")).toHaveAttribute(
    "data-return",
    "/recap/tour-1",
  );
  expect(screen.getByTestId("sign-up")).toHaveAttribute(
    "data-return",
    "/recap/tour-1",
  );
  expect(state.save).not.toHaveBeenCalled();
});
test("an account must select its own participant name instead of receiving the whole group's notes", async () => {
  state.signedIn = true;
  state.save.mockResolvedValue("saved-1");
  const user = userEvent.setup();
  render(<SaveRecap {...props} />);
  expect(
    screen.getByRole("button", { name: "Enregistrer ce tour" }),
  ).toBeDisabled();
  await user.selectOptions(
    screen.getByLabelText("Le prénom utilisé pour tes avis"),
    "Alex",
  );
  await user.click(screen.getByRole("button", { name: "Enregistrer ce tour" }));
  expect(state.save).toHaveBeenCalledExactlyOnceWith({
    tourId: "tour-1",
    participantName: "Alex",
  });
  expect(await screen.findByRole("status")).toHaveTextContent(
    "Récap enregistré",
  );
});
test("a known guest name is preselected and failed saves preserve the selection", async () => {
  state.signedIn = true;
  state.save.mockRejectedValue(new Error("offline"));
  localStorage.setItem("vitour_tour-1_name", "Léa");
  const user = userEvent.setup();
  render(<SaveRecap {...props} />);
  expect(screen.getByLabelText("Le prénom utilisé pour tes avis")).toHaveValue(
    "Léa",
  );
  await user.click(screen.getByRole("button", { name: "Enregistrer ce tour" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Impossible");
  expect(screen.getByLabelText("Le prénom utilisé pour tes avis")).toHaveValue(
    "Léa",
  );
});
