import { rankRecapPlaces, formatDistance } from "@/lib/recap-summary";
export default function RecapHighlights({
  places,
  meters,
  pendingLegs,
}: {
  places: {
    _id: string;
    order: number;
    name: string;
    ratings: { score?: number }[];
  }[];
  meters: Record<string, number>;
  pendingLegs: number;
}) {
  const { top, flop, ratedCount, overlap } = rankRecapPlaces(places);
  const expected = Math.max(places.length - 1, 0),
    known = Object.keys(meters).length;
  const sum = Object.values(meters).reduce((a, b) => a + b, 0);
  const distance =
    expected === 0
      ? "0 m"
      : known
        ? formatDistance(sum)
        : pendingLegs
          ? "Calcul en cours…"
          : "Indisponible";
  const partial = expected > 0 && known > 0 && known < expected;
  return (
    <section aria-label="Bilan du food tour" className="space-y-3 mb-6">
      <div className="rounded-2xl border-2 border-secondary/30 bg-secondary/10 p-3 text-center">
        <p className="text-xs font-bold text-foreground/75">
          🚶 Distance à pied estimée entre les étapes
        </p>
        <p className="text-xl font-display font-black text-foreground">
          {distance}
          {partial ? " (partielle)" : ""}
        </p>
        {(partial || (expected > 0 && !known && !pendingLegs)) && (
          <p className="text-xs text-foreground/70">
            Certains trajets ne sont pas disponibles.
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { title: "🏆 Top 3", items: top, tone: "border-secondary/30" },
          { title: "🙈 Flop 3", items: flop, tone: "border-primary/20" },
        ].map((list) => (
          <div
            key={list.title}
            className={`rounded-2xl border-2 ${list.tone} bg-white p-3`}
          >
            <h3 className="text-lg font-display font-black mb-2">
              {list.title}
            </h3>
            {list.items.length ? (
              <ol className="space-y-2">
                {list.items.map((place, index) => (
                  <li
                    key={place._id}
                    className="flex items-start justify-between gap-2 text-sm"
                  >
                    <a
                      className="min-w-0 font-bold underline decoration-dotted underline-offset-2 break-words"
                      href={`#recap-stop-${place._id}`}
                    >
                      {index + 1}. {place.name}
                    </a>
                    <span className="shrink-0 font-black">
                      {place.averageScore.toFixed(1)}/10
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-foreground/70">
                Pas encore d’adresse notée.
              </p>
            )}
          </div>
        ))}
      </div>
      <p className="text-[11px] text-foreground/70">
        Classements selon la moyenne des avis du groupe, sur {ratedCount}{" "}
        adresse{ratedCount > 1 ? "s" : ""} notée{ratedCount > 1 ? "s" : ""}.
        {overlap
          ? " Avec peu d’adresses ou des égalités, les deux classements peuvent se recouper."
          : ""}
      </p>
    </section>
  );
}
