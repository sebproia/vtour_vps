"use client";
import { useLoadScript } from "@react-google-maps/api";
import { Footprints } from "lucide-react";
import { useWalkingTimes } from "@/hooks/useWalkingTimes";
import { formatDistance } from "@/lib/recap-summary";
const libraries: "places"[] = ["places"];
export default function NotebookDistance({
  recaps,
}: {
  recaps: {
    _id: string;
    route?: { address: string; coordinates?: { lat: number; lng: number } }[];
  }[];
}) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });
  const places = recaps.flatMap((recap) =>
    (recap.route || []).map((place, index) => ({
      ...place,
      _id: `${recap._id}:${index}`,
      routeGroup: recap._id,
    })),
  );
  const expected = recaps.reduce(
    (sum, r) => sum + Math.max(0, (r.route?.length || 0) - 1),
    0,
  );
  const unknown = recaps.some((r) => r.route === undefined);
  const { travelMeters, pendingLegs } = useWalkingTimes(
    places,
    isLoaded,
    Boolean(loadError),
  );
  const known = Object.keys(travelMeters).length;
  const total = Object.values(travelMeters).reduce((sum, n) => sum + n, 0);
  const partial = unknown || known < expected;
  const label = known
    ? formatDistance(total)
    : pendingLegs
      ? "Calcul en cours…"
      : partial
        ? "Indisponible"
        : "0 m";
  return (
    <section
      aria-label="Distance cumulée des tours"
      className="rounded-2xl border-2 border-secondary/30 bg-secondary/10 p-4"
    >
      <div className="flex items-center gap-3">
        <Footprints
          className="size-6 shrink-0 text-foreground"
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-bold">Distance totale à pied</p>
          <p
            role="status"
            className="font-display text-3xl font-black text-foreground"
          >
            {label}
            {known > 0 && partial ? " (partielle)" : ""}
          </p>
        </div>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-foreground/75">
        Estimation entre les étapes de tes tours enregistrés, sans suivi GPS.
        {partial && !pendingLegs
          ? " Certains trajets ne sont pas disponibles."
          : ""}
      </p>
    </section>
  );
}
