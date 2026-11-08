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
  click: undefined as undefined | ((event: unknown) => void),
  details: vi.fn(),
  geocode: vi.fn(),
}));
vi.mock("@react-google-maps/api", () => ({
  useLoadScript: () => ({ isLoaded: true }),
  GoogleMap: ({
    children,
    center,
    onClick,
  }: {
    children: React.ReactNode;
    center: unknown;
    onClick: (event: unknown) => void;
  }) => {
    state.click = onClick;
    return (
      <div data-testid="map" data-center={JSON.stringify(center)}>
        {children}
      </div>
    );
  },
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
  vi.stubGlobal("google", {
    maps: {
      SymbolPath: { CIRCLE: 0 },
      places: {
        PlacesService: class {
          getDetails = state.details;
        },
      },
      Geocoder: class {
        geocode = state.geocode;
      },
    },
  });
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

test("clicking a restaurant fetches its business name instead of reverse geocoding its street", () => {
  const select = vi.fn(),
    stop = vi.fn();
  state.details.mockImplementation((_args, callback) =>
    callback(
      {
        name: "Boulangerie de la place",
        formatted_address: "1 place Jean Monnet",
        place_id: "bakery",
        opening_hours: {
          weekday_text: [
            "lundi: 09:00–18:00",
            "mardi: 09:00–18:00",
            "mercredi: 09:00–18:00",
            "jeudi: 09:00–18:00",
            "vendredi: 09:00–18:00",
            "samedi: 09:00–18:00",
            "dimanche: 09:00–18:00",
          ],
        },
      },
      "OK",
    ),
  );
  render(<MapPicker onLocationSelect={select} />);
  act(() =>
    state.click?.({
      latLng: { lat: () => 48, lng: () => 2 },
      placeId: "bakery",
      stop,
    }),
  );
  expect(stop).toHaveBeenCalled();
  expect(state.details).toHaveBeenCalledWith(
    expect.objectContaining({ placeId: "bakery" }),
    expect.any(Function),
  );
  expect(state.geocode).not.toHaveBeenCalled();
  expect(select).toHaveBeenCalledWith(
    "Boulangerie de la place",
    "1 place Jean Monnet",
    48,
    2,
    expect.any(String),
    "bakery",
    expect.any(Array),
  );
});
test("an older restaurant details response cannot replace a newer selection", () => {
  const select = vi.fn(),
    callbacks: ((place: unknown, status: string) => void)[] = [];
  state.details.mockImplementation((_args, callback) =>
    callbacks.push(callback),
  );
  render(<MapPicker onLocationSelect={select} />);
  act(() => {
    state.click?.({
      latLng: { lat: () => 48, lng: () => 2 },
      placeId: "old",
      stop: vi.fn(),
    });
    state.click?.({
      latLng: { lat: () => 49, lng: () => 3 },
      placeId: "new",
      stop: vi.fn(),
    });
  });
  act(() => {
    callbacks[1](
      {
        name: "Nouveau restaurant",
        formatted_address: "Lyon",
        place_id: "new",
      },
      "OK",
    );
    callbacks[0](
      { name: "Ancien", formatted_address: "Paris", place_id: "old" },
      "OK",
    );
  });
  expect(select).toHaveBeenCalledTimes(1);
  expect(select.mock.calls[0][0]).toBe("Nouveau restaurant");
});
test("a plain map position asks for a name instead of using the street as restaurant name", () => {
  const select = vi.fn();
  state.geocode.mockImplementation((_args, callback) =>
    callback([{ formatted_address: "1 place Jean Monnet" }], "OK"),
  );
  render(<MapPicker onLocationSelect={select} />);
  act(() => state.click?.({ latLng: { lat: () => 48, lng: () => 2 } }));
  expect(select.mock.calls[0].slice(0, 2)).toEqual(["", "1 place Jean Monnet"]);
  expect(screen.getByRole("status")).toHaveTextContent(
    "Ajoute le nom du restaurant",
  );
});
