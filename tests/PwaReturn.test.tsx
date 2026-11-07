// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ContinueInApp from "../src/components/ContinueInApp";
import RecentTour from "../src/components/RecentTour";
import { rememberTour, parseRecentTour } from "../src/lib/recent-tour";
import PWARegister from "../src/components/PWARegister";
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function displayMode(installed: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({
      matches: installed,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  });
}
test("PWA handoff stays hidden inside the installed app", () => {
  displayMode(true);
  render(<ContinueInApp path="/join/abc123" />);
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
test("browser handoff copies a valid same-origin invitation rather than pretending to force an app launch", async () => {
  displayMode(false);
  const user = userEvent.setup();
  const copy = vi
    .spyOn(navigator.clipboard, "writeText")
    .mockResolvedValue(undefined);
  render(<ContinueInApp path="/join/abc123" />);
  await user.click(screen.getByRole("button", { name: /Tu as déjà la PWA/ }));
  await user.click(
    screen.getByRole("button", { name: "Copier le lien pour la PWA" }),
  );
  expect(copy).toHaveBeenCalledWith(`${window.location.origin}/join/abc123`);
  expect(await screen.findByRole("status")).toHaveTextContent(
    "Ouvre maintenant l’app",
  );
});
test("the home resume link follows the most recent tour and switches to recap on completion", () => {
  render(<RecentTour />);
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  act(() => rememberTour({ id: "abc123", name: "Food tour", status: "live" }));
  expect(screen.getByRole("link")).toHaveAttribute("href", "/join/abc123");
  act(() =>
    rememberTour({ id: "abc123", name: "Food tour", status: "completed" }),
  );
  expect(screen.getByRole("link")).toHaveAttribute("href", "/recap/abc123");
  expect(
    parseRecentTour('{"id":"https://evil.test","name":"X","status":"live"}'),
  ).toBeNull();
});
test("the service worker registers even if the page finished loading before hydration", () => {
  vi.spyOn(document, "readyState", "get").mockReturnValue("complete");
  const register = vi.fn().mockResolvedValue({});
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { register },
  });
  render(<PWARegister />);
  expect(register).toHaveBeenCalledExactlyOnceWith("/sw.js");
});
