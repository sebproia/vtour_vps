"use client";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import {
  RECENT_TOUR_EVENT,
  RECENT_TOUR_KEY,
  parseRecentTour,
} from "@/lib/recent-tour";
const subscribe = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener(RECENT_TOUR_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(RECENT_TOUR_EVENT, callback);
  };
};
const read = () => {
  try {
    return localStorage.getItem(RECENT_TOUR_KEY) || "";
  } catch {
    return "";
  }
};
export default function RecentTour() {
  const raw = useSyncExternalStore(subscribe, read, () => "");
  const tour = parseRecentTour(raw);
  if (!tour) return null;
  return (
    <Link
      href={
        tour.status === "completed" ? `/recap/${tour.id}` : `/join/${tour.id}`
      }
      className="block w-full max-w-lg rounded-2xl border-2 border-secondary bg-white p-3 text-left text-foreground shadow-sm"
    >
      <span className="block text-xs font-bold">
        {tour.status === "completed"
          ? "📖 Retrouver mon dernier récap"
          : "🍩 Reprendre mon dernier tour"}
      </span>
      <span className="block font-display text-lg font-black break-words">
        {tour.name} →
      </span>
    </Link>
  );
}
