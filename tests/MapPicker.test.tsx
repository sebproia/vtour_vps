// @vitest-environment jsdom
import React, { useEffect } from "react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MapPicker from "../src/components/MapPicker";
const state = vi.hoisted(() => ({
  watch: vi.fn(),
  clear: vi.fn(),
  position: undefined as undefined | PositionCallback,
  denied: undefined as undefined | PositionErrorCallback,
}));
vi.mock("@react-google-maps/api", () => ({
  useLoadScript: () => ({ isLoaded: true }),
  GoogleMap: ({
    children,
    center,
  }: {
    children: React.ReactNode;
    center: unknown;
  }) => (
    <div data-testid="map" data-center={JSON.stringify(center)}>
      {children}
    </div>
  ),
  Marker: ({ position, title }: { position: unknown; title: string }) => (
    <div title={title} data-position={JSON.stringify(position)} />
  ),
  Autocomplete: ({
    children,
    onLoad,
  }: {
    children: React.ReactNode;
    onLoad: (instance: unknown) => void;
  }) => {
    useEffect(() => {
      onLoad({ getPlace: () => ({}) });
    }, []);
    return <>{children}</>;
  },
}));
beforeEach(() => {
  vi.stubGlobal("google", { maps: { SymbolPath: { CIRCLE: 0 } } });
  Object.defineProperty(navigator, "permissions", {
    configurable: true,
    value: { query: vi.fn().mockResolvedValue({ state: "prompt" }) },
  });
  state.watch.mockImplementation(
    (success: PositionCallback, error: PositionErrorCallback) => {
      state.position = success;
      state.denied = error;
      return 7;
    },
  );
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: { watchPosition: state.watch, clearWatch: state.clear },
  });
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});
test("locating and recentering adds a blue user marker without selecting a restaurant", async () => {
  const user = userEvent.setup(),
    select = vi.fn();
  const view = render(
    <MapPicker
      initialLocation={{ lat: 48, lng: 2 }}
      onLocationSelect={select}
    />,
  );
  expect(state.watch).not.toHaveBeenCalled();
  await user.click(
    screen.getByRole("button", { name: "Recentrer sur ma position" }),
  );
  await waitFor(() => expect(state.watch).toHaveBeenCalled());
  act(() =>
    state.position?.({
      coords: { latitude: 49, longitude: 3 },
    } as GeolocationPosition),
  );
  expect(screen.getByTitle("Ma position")).toHaveAttribute(
    "data-position",
    JSON.stringify({ lat: 49, lng: 3 }),
  );
  expect(screen.getByTitle("Adresse sélectionnée")).toHaveAttribute(
    "data-position",
    JSON.stringify({ lat: 48, lng: 2 }),
  );
  expect(screen.getByTestId("map")).toHaveAttribute(
    "data-center",
    JSON.stringify({ lat: 49, lng: 3 }),
  );
  expect(select).not.toHaveBeenCalled();
  view.unmount();
  expect(state.clear).toHaveBeenCalledWith(7);
});
test("denied geolocation shows a recovery message and leaves map search available", async () => {
  const user = userEvent.setup();
  render(<MapPicker onLocationSelect={vi.fn()} />);
  await user.click(
    screen.getByRole("button", { name: "Recentrer sur ma position" }),
  );
  await waitFor(() => expect(state.watch).toHaveBeenCalled());
  act(() =>
    state.denied?.({ code: 1, message: "Denied" } as GeolocationPositionError),
  );
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Autorise la localisation",
  );
  expect(
    screen.getByRole("textbox", { name: /Rechercher un restaurant/ }),
  ).toBeEnabled();
});
