// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TourScanner from "../src/components/TourScanner";

const mock = vi.hoisted(() => ({
  push: vi.fn(), start: vi.fn(), stop: vi.fn(), destroy: vi.fn(), scanImage: vi.fn(),
  decode: undefined as undefined | ((value: { data: string }) => void),
}));
vi.mock("next/navigation", () => {
  const router = { push: mock.push };
  return { useRouter: () => router };
});
vi.mock("qr-scanner", () => ({ default: class {
  static scanImage = mock.scanImage;
  start = mock.start;
  stop = mock.stop;
  destroy = mock.destroy;
  constructor(_video: unknown, decode: (value: { data: string }) => void) { mock.decode = decode; }
} }));
afterEach(() => { cleanup(); vi.resetAllMocks(); mock.decode = undefined; });
function cameraAvailable() {
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: vi.fn() } });
  mock.start.mockResolvedValue(undefined);
}

test("camera starts only on request; ignores unrelated QR; stops and navigates once on invitation", async () => {
  cameraAvailable();
  const user = userEvent.setup();
  render(<TourScanner />);
  expect(mock.start).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Activer la caméra" }));
  await waitFor(() => expect(mock.start).toHaveBeenCalledTimes(1));
  act(() => mock.decode?.({ data: "https://evil.example/join/abc123" }));
  expect(screen.getByRole("alert")).toHaveTextContent("ne correspond pas");
  expect(mock.push).not.toHaveBeenCalled();
  act(() => {
    mock.decode?.({ data: "https://vtour-vps.vercel.app/join/abc123" });
    mock.decode?.({ data: "https://vtour-vps.vercel.app/join/abc123" });
  });
  expect(mock.stop).toHaveBeenCalled();
  expect(mock.push).toHaveBeenCalledExactlyOnceWith("/join/abc123");
});

test("destroys camera when leaving the scanner", async () => {
  cameraAvailable();
  const user = userEvent.setup();
  const view = render(<TourScanner />);
  await user.click(screen.getByRole("button", { name: "Activer la caméra" }));
  await waitFor(() => expect(mock.start).toHaveBeenCalled());
  view.unmount();
  expect(mock.destroy).toHaveBeenCalled();
});

test("permission denied leaves photo and link fallbacks usable", async () => {
  cameraAvailable();
  mock.start.mockRejectedValue(new Error("NotAllowedError"));
  const user = userEvent.setup();
  render(<TourScanner />);
  await user.click(screen.getByRole("button", { name: "Activer la caméra" }));
  await screen.findByRole("alert");
  expect(screen.getByRole("button", { name: "Importer une photo du QR code" })).toBeEnabled();
  await user.type(screen.getByLabelText("Ou colle le lien d’invitation"), "https://vtour-vps.vercel.app/join/abc123");
  await user.click(screen.getByRole("button", { name: "Rejoindre le tour" }));
  expect(mock.push).toHaveBeenCalledWith("/join/abc123");
});

test("joins from an imported QR photo", async () => {
  mock.scanImage.mockResolvedValue({ data: "https://vtour-vps.vercel.app/join/abc123" });
  const user = userEvent.setup();
  render(<TourScanner />);
  await user.upload(screen.getByLabelText("Photo du QR code"), new File(["qr"], "qr.png", { type: "image/png" }));
  await waitFor(() => expect(mock.push).toHaveBeenCalledWith("/join/abc123"));
});
