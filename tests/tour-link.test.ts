import { expect, test } from "vitest";
import { getTourJoinPath } from "../src/lib/tour-link";

const origin = "https://vtour-vps.vercel.app";
test.each([
  ["https://vtour-vps.vercel.app/join/abc123", "/join/abc123"],
  [" /join/abc123/ ", "/join/abc123"],
  ["https://vtour-vps.vercel.app/join/abc123?utm_source=qr#start", "/join/abc123"],
  ["https://evil.example/join/abc123", null],
  ["javascript:alert(1)", null],
  ["https://vtour-vps.vercel.app.evil.example/join/abc123", null],
  ["https://user:pass@vtour-vps.vercel.app/join/abc123", null],
  ["/tour/abc123", null],
  ["/join/abc123/extra", null],
  ["/join/%2F", null],
  ["", null],
])("validates invitation %s", (value, path) => {
  expect(getTourJoinPath(value, origin)).toBe(path);
});
test("accepts canonical invitations inside a preview or custom-domain PWA", () => {
  expect(getTourJoinPath(`${origin}/join/abc123`, "https://preview.vercel.app")).toBe("/join/abc123");
});
