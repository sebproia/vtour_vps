"use client";
import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { tourDay } from "../../convex/lib/schedule";

/** Backfill legacy Google schedules; the mutation rejects stale dates/Google IDs. */
export function useOpeningHoursRefresh(
  places: Doc<"places">[] | undefined,
  date: string | undefined,
  ready: boolean,
) {
  const save = useMutation(api.places.updateOpeningHours);
  const [error, setError] = useState({ key: "", message: "" });
  const [retry, setRetry] = useState(0);
  const day = tourDay(date);
  const key = JSON.stringify(
    (places || [])
      .filter(
        (p) =>
          p.googlePlaceId &&
          (p.weeklyOpeningHours === undefined || p.openingHoursDate !== day),
      )
      .map((p) => ({ id: p._id, googlePlaceId: p.googlePlaceId! })),
  );
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    const pending: { id: Doc<"places">["_id"]; googlePlaceId: string }[] =
      JSON.parse(key);
    if (!pending.length) return;
    const service = new google.maps.places.PlacesService(
      document.createElement("div"),
    );
    async function refresh() {
      let failures = 0;
      for (const place of pending) {
        if (cancelled) break;
        try {
          const week = await new Promise<string[]>((resolve, reject) =>
            service.getDetails(
              { placeId: place.googlePlaceId, fields: ["opening_hours"] },
              (result, status) =>
                status === google.maps.places.PlacesServiceStatus.OK
                  ? resolve(result?.opening_hours?.weekday_text || [])
                  : reject(new Error(status)),
            ),
          );
          if (!cancelled)
            await save({
              placeId: place.id,
              googlePlaceId: place.googlePlaceId,
              expectedDate: day,
              weeklyOpeningHours: week,
            });
        } catch {
          failures++;
        }
      }
      if (!cancelled)
        setError({
          key: `${day}:${key}`,
          message: failures
            ? "Certains horaires n’ont pas pu être actualisés."
            : "",
        });
    }
    void refresh();
    return () => {
      cancelled = true;
    };
  }, [key, day, ready, save, retry]);
  return {
    hoursError: error.key === `${day}:${key}` ? error.message : "",
    retryHours: () => {
      setError({ key: "", message: "" });
      setRetry((value) => value + 1);
    },
  };
}
