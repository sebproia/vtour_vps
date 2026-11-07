import { validScore } from "../../convex/lib/personalStats";
export { validScore };
export function averageScore(ratings: { score?: number }[]): number | null {
  const values = ratings.map((r) => r.score).filter(validScore);
  return values.length
    ? values.reduce((a, b) => a + b, 0) / values.length
    : null;
}
export function rankRecapPlaces<
  T extends {
    _id: string;
    order: number;
    name: string;
    ratings: { score?: number }[];
  },
>(places: T[]) {
  const rated = places
    .map((place) => ({ ...place, averageScore: averageScore(place.ratings) }))
    .filter(
      (place): place is T & { averageScore: number } =>
        place.averageScore !== null,
    );
  const top = [...rated]
    .sort((a, b) => b.averageScore - a.averageScore || a.order - b.order)
    .slice(0, 3);
  const flop = [...rated]
    .sort((a, b) => a.averageScore - b.averageScore || a.order - b.order)
    .slice(0, 3);
  return {
    top,
    flop,
    ratedCount: rated.length,
    overlap: top.some((p) => flop.some((f) => f._id === p._id)),
  };
}
export function mapsPlaceUrl(place: {
  name: string;
  address: string;
  googlePlaceId?: string;
  coordinates?: { lat: number; lng: number };
}) {
  const query = place.coordinates
    ? `${place.coordinates.lat},${place.coordinates.lng}`
    : `${place.name}, ${place.address}`;
  const params = new URLSearchParams({ api: "1", query });
  if (place.googlePlaceId) params.set("query_place_id", place.googlePlaceId);
  return `https://www.google.com/maps/search/?${params}`;
}
export function formatDistance(meters: number) {
  return meters < 1000
    ? `${Math.round(meters)} m`
    : `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(meters / 1000)} km`;
}
export function vitoAvatar(score: number) {
  const version = "v=4";
  if (score < 3.5)
    return {
      src: `/grade-disgusted.png?${version}`,
      size: 155,
      offsetClass: "",
    };
  if (score < 6)
    return {
      src: `/grade-skeptical.png?${version}`,
      size: 170,
      offsetClass: "",
    };
  if (score < 7.5)
    return { src: `/grade-happy.png?${version}`, size: 190, offsetClass: "" };
  if (score < 9)
    return { src: `/grade-smiling.png?${version}`, size: 172, offsetClass: "" };
  return {
    src: `/grade-laughing.png?${version}`,
    size: 200,
    offsetClass: "-translate-x-1",
  };
}
