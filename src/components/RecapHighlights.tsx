import { rankRecapPlaces, formatDistance } from "@/lib/recap-summary";
const medalTones = [
  { face: "#f9d66c", edge: "#9a6500", ribbon: "#e9b33e" },
  { face: "#e4e9ef", edge: "#657485", ribbon: "#acb8c7" },
  { face: "#e7b48d", edge: "#92522e", ribbon: "#c58960" },
];
function RankMedal({ rank }: { rank: number }) {
  const tone = medalTones[rank - 1];
  return (
    <svg
      aria-hidden="true"
      width="40"
      height="48"
      viewBox="0 0 40 48"
      className="shrink-0 drop-shadow-sm"
    >
      <path
        d="M10 27 7 45 20 38 33 45 30 27"
        fill={tone.ribbon}
        stroke={tone.edge}
        strokeWidth="1.5"
      />
      <circle
        cx="20"
        cy="18"
        r="16"
        fill={tone.face}
        stroke={tone.edge}
        strokeWidth="1.5"
      />
      <circle
        cx="20"
        cy="18"
        r="12"
        fill="none"
        stroke={tone.edge}
        strokeOpacity=".35"
      />
      <text
        x="20"
        y="24"
        textAnchor="middle"
        fontSize="18"
        fontWeight="900"
        fill={tone.edge}
      >
        {rank}
      </text>
    </svg>
  );
}
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
          {
            title: "Top 3",
            subtitle: "Les coups de cœur du groupe",
            items: top,
            tone: "border-secondary/30 bg-secondary/5",
          },
          {
            title: "Flop 3",
            subtitle: "Les moins bien notées",
            items: flop,
            tone: "border-primary/20 bg-primary/5",
          },
        ].map((list) => (
          <div
            key={list.title}
            className={`rounded-2xl border-2 ${list.tone} p-3`}
          >
            <h3 className="text-xl font-display font-black">{list.title}</h3>
            <p className="mb-3 text-xs text-foreground/75">{list.subtitle}</p>
            {list.items.length ? (
              <ol className="space-y-2">
                {list.items.map((place, index) => (
                  <li
                    key={place._id}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-white p-2 text-sm"
                  >
                    <RankMedal rank={index + 1} />
                    <a
                      className="flex min-h-11 min-w-0 flex-1 items-center font-bold underline decoration-dotted underline-offset-2 break-words"
                      href={`#recap-stop-${place._id}`}
                    >
                      {place.name}
                    </a>
                    <span className="shrink-0 rounded-lg bg-accent/15 px-2 py-1 font-black">
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
