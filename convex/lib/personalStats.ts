export interface PersonalAddress {
  name: string;
  address: string;
  googlePlaceId?: string;
  coordinates?: { lat: number; lng: number };
  score?: number;
  comment?: string;
  tags?: ("sweet" | "savory")[];
}
export function validScore(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 1 &&
    value <= 10
  );
}
export function addressKey(place: PersonalAddress) {
  const normalize = (value: string) =>
    value
      .normalize("NFKC")
      .toLocaleLowerCase("fr-FR")
      .trim()
      .replace(/\s+/g, " ");
  return place.googlePlaceId
    ? `google:${place.googlePlaceId}`
    : `address:${normalize(place.name)}|${normalize(place.address)}`;
}
export function personalStats(recaps: { places: PersonalAddress[] }[]) {
  const addresses = new Map<
    string,
    {
      key: string;
      name: string;
      address: string;
      googlePlaceId?: string;
      coordinates?: { lat: number; lng: number };
      visits: number;
      sum: number;
      ratings: number;
    }
  >();
  for (const recap of recaps)
    for (const place of recap.places) {
      const key = addressKey(place);
      const record = addresses.get(key) || {
        key,
        name: place.name,
        address: place.address,
        googlePlaceId: place.googlePlaceId,
        coordinates: place.coordinates,
        visits: 0,
        sum: 0,
        ratings: 0,
      };
      record.visits++;
      if (validScore(place.score)) {
        record.sum += place.score;
        record.ratings++;
      }
      addresses.set(key, record);
    }
  const topAddresses = [...addresses.values()]
    .filter((p) => p.ratings > 0)
    .map(({ sum, ratings, ...place }) => ({
      ...place,
      averageScore: sum / ratings,
    }))
    .sort(
      (a, b) =>
        b.averageScore - a.averageScore ||
        b.visits - a.visits ||
        a.name.localeCompare(b.name, "fr"),
    )
    .slice(0, 5);
  return {
    totalTours: recaps.length,
    totalAddresses: addresses.size,
    topAddresses,
  };
}
