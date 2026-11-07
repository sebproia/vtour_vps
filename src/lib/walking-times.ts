export interface RoutePlace {
  _id: string;
  address: string;
  coordinates?: { lat: number; lng: number };
}
export type WalkingLeg =
  | { status: "ok"; seconds: number; text: string; meters?: number }
  | { status: "unavailable"; text: string };
export function formatWalkingTime(seconds: number) {
  const minutes = Math.max(0, Math.round(seconds / 60));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const rest = minutes % 60;
  return [
    days ? `${days} j` : "",
    hours ? `${hours} h` : "",
    rest || (!days && !hours) ? `${rest} min` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/** One request per adjacent pair, never an N×N matrix; failures remain local to a leg. */
export async function calculateWalkingLegs(
  places: RoutePlace[],
  lookup: (
    from: RoutePlace,
    to: RoutePlace,
  ) => Promise<number | { seconds: number; meters?: number }>,
  onResult: (id: string, result: WalkingLeg) => void,
  cancelled = () => false,
) {
  let next = 0;
  async function worker() {
    while (next < places.length - 1 && !cancelled()) {
      const index = next++;
      let result: WalkingLeg;
      try {
        const route = await lookup(places[index], places[index + 1]);
        const seconds = typeof route === "number" ? route : route.seconds;
        const meters = typeof route === "number" ? undefined : route.meters;
        if (!Number.isFinite(seconds) || seconds < 0)
          throw new Error("Invalid duration");
        result = {
          status: "ok",
          seconds,
          text: formatWalkingTime(seconds),
          ...(meters !== undefined && Number.isFinite(meters) && meters >= 0
            ? { meters }
            : {}),
        };
      } catch {
        result = { status: "unavailable", text: "Trajet indisponible" };
      }
      if (!cancelled()) onResult(places[index]._id, result);
    }
  }
  await Promise.all([worker(), worker()]);
}
