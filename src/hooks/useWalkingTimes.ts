"use client";
import { useEffect, useRef, useState } from "react";
import {
  calculateWalkingLegs,
  type RoutePlace,
  type WalkingLeg,
} from "@/lib/walking-times";

export function useWalkingTimes(
  places: RoutePlace[] | undefined,
  ready: boolean,
  failed = false,
) {
  const key = JSON.stringify(
    (places || []).map((p) => ({
      _id: p._id,
      address: p.address,
      coordinates: p.coordinates,
    })),
  );
  const [state, setState] = useState<{
    key: string;
    legs: Record<string, WalkingLeg>;
  }>({ key: "", legs: {} });
  const cache = useRef(new Map<string, number>());
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    const route: RoutePlace[] = JSON.parse(key);
    const service = new google.maps.DistanceMatrixService();
    const position = (place: RoutePlace) => place.coordinates || place.address;
    void calculateWalkingLegs(
      route,
      async (from, to) => {
        const pair = JSON.stringify([position(from), position(to)]);
        const hit = cache.current.get(pair);
        if (hit !== undefined) return hit;
        async function request(): Promise<number> {
          const response = await service.getDistanceMatrix({
            origins: [position(from)],
            destinations: [position(to)],
            travelMode: google.maps.TravelMode.WALKING,
            language: "fr",
          });
          const element = response.rows[0]?.elements[0];
          if (element?.status !== "OK" || !element.duration)
            throw new Error("No walking route");
          return element.duration.value;
        }
        let seconds: number;
        try {
          seconds = await request();
        } catch (error) {
          // Transient quota/service failures are retried once, without dropping other legs.
          if (
            !String(error).includes("OVER_QUERY_LIMIT") &&
            !String(error).includes("UNKNOWN_ERROR")
          )
            throw error;
          await new Promise((resolve) => setTimeout(resolve, 750));
          if (cancelled) throw error;
          seconds = await request();
        }
        cache.current.set(pair, seconds);
        if (cache.current.size > 200)
          cache.current.delete(cache.current.keys().next().value!);
        return seconds;
      },
      (id, result) =>
        setState((previous) => ({
          key,
          legs: {
            ...(previous.key === key ? previous.legs : {}),
            [id]: result,
          },
        })),
      () => cancelled,
    );
    return () => {
      cancelled = true;
    };
  }, [key, ready]);
  const travelTimes: Record<string, string> = {};
  const travelSeconds: Record<string, number> = {};
  for (const place of (places || []).slice(0, -1)) {
    const leg = state.key === key ? state.legs[place._id] : undefined;
    travelTimes[place._id] =
      leg?.text || (failed ? "Trajet indisponible" : "Calcul en cours…");
    if (leg?.status === "ok") travelSeconds[place._id] = leg.seconds;
  }
  return { travelTimes, travelSeconds };
}
