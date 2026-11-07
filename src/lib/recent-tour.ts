export const RECENT_TOUR_KEY = "vitour_recent_tour_v1";
export const RECENT_TOUR_EVENT = "vitour-recent-tour";
export interface RecentTourInfo {
  id: string;
  name: string;
  status: "draft" | "live" | "completed";
}
export function parseRecentTour(raw: string): RecentTourInfo | null {
  try {
    const tour: unknown = JSON.parse(raw);
    if (!tour || typeof tour !== "object") return null;
    const value = tour as Record<string, unknown>;
    if (
      typeof value.id !== "string" ||
      !/^[a-zA-Z0-9]{1,128}$/.test(value.id) ||
      typeof value.name !== "string" ||
      typeof value.status !== "string" ||
      !["draft", "live", "completed"].includes(String(value.status))
    )
      return null;
    return value as unknown as RecentTourInfo;
  } catch {
    return null;
  }
}
export function rememberTour(tour: RecentTourInfo) {
  try {
    const raw = JSON.stringify(tour);
    if (localStorage.getItem(RECENT_TOUR_KEY) === raw) return;
    localStorage.setItem(RECENT_TOUR_KEY, raw);
    window.dispatchEvent(new Event(RECENT_TOUR_EVENT));
  } catch {
    /* Restricted storage must not prevent joining a tour. */
  }
}
