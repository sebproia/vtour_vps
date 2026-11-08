// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import NotebookDistance from "../src/components/NotebookDistance";
vi.mock("@react-google-maps/api", () => ({
  useLoadScript: () => ({ isLoaded: true }),
}));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
test("sums multiple saved routes without a phantom journey between tours", async () => {
  const request = vi
    .fn()
    .mockResolvedValue({
      rows: [
        {
          elements: [
            {
              status: "OK",
              duration: { value: 120 },
              distance: { value: 600 },
            },
          ],
        },
      ],
    });
  vi.stubGlobal("google", {
    maps: {
      TravelMode: { WALKING: "WALKING" },
      DistanceMatrixService: class {
        getDistanceMatrix = request;
      },
    },
  });
  render(
    <NotebookDistance
      recaps={[
        { _id: "a", route: [{ address: "Paris 1" }, { address: "Paris 2" }] },
        { _id: "b", route: [{ address: "Lyon 1" }, { address: "Lyon 2" }] },
      ]}
    />,
  );
  expect(await screen.findByText("1,2 km")).toBeInTheDocument();
  expect(request).toHaveBeenCalledTimes(2);
  expect(screen.queryByText(/partielle/)).not.toBeInTheDocument();
});
test("missing old routes are explicitly partial instead of counted as zero", async () => {
  vi.stubGlobal("google", {
    maps: {
      TravelMode: { WALKING: "WALKING" },
      DistanceMatrixService: class {
        getDistanceMatrix = vi
          .fn()
          .mockResolvedValue({
            rows: [
              {
                elements: [
                  {
                    status: "OK",
                    duration: { value: 120 },
                    distance: { value: 600 },
                  },
                ],
              },
            ],
          });
      },
    },
  });
  render(
    <NotebookDistance
      recaps={[
        { _id: "a", route: [{ address: "Paris 1" }, { address: "Paris 2" }] },
        { _id: "deleted" },
      ]}
    />,
  );
  expect(await screen.findByText("600 m (partielle)")).toBeInTheDocument();
  expect(screen.getByText(/Certains trajets/)).toBeInTheDocument();
});
