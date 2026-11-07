"use client";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import VitoSticker from "@/components/VitoSticker";
import { mapsPlaceUrl } from "@/lib/recap-summary";
export default function PersonalRecaps() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const data = useQuery(api.savedRecaps.getMine, isAuthenticated ? {} : "skip");
  if (!isAuthenticated && !isLoading)
    return (
      <p>
        Connecte-toi pour consulter ton carnet.{" "}
        <Link href="/sign-in?redirect_url=%2Fmes-recaps" className="underline">
          Se connecter
        </Link>
      </p>
    );
  if (data === undefined)
    return (
      <p role="status" className="font-display text-lg">
        Chargement de tes récaps…
      </p>
    );
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Récaps enregistrés", value: data.totalTours },
          { label: "Adresses testées", value: data.totalAddresses },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border-2 border-primary/20 bg-card p-4"
          >
            <p className="font-display text-3xl font-black text-primary">
              {item.value}
            </p>
            <p className="text-sm font-bold">{item.label}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-foreground/70">
        Seules tes adresses notées sont comptées. Un même lieu visité plusieurs
        fois ne compte qu’une fois.
      </p>
      <section
        className="rounded-2xl border-2 border-secondary/30 bg-card p-4 space-y-3"
        aria-label="Mes meilleures adresses"
      >
        <h2 className="text-xl font-display font-black">
          🏆 Mes meilleures adresses
        </h2>
        {data.topAddresses.length ? (
          <ol className="space-y-3">
            {data.topAddresses.map((place, index) => (
              <li
                key={place.key}
                className="flex items-center gap-3 border-b border-border/50 pb-3 last:border-0 last:pb-0"
              >
                <VitoSticker score={place.averageScore} size={52} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold break-words">
                    {index + 1}. {place.name}
                  </p>
                  <p className="text-xs text-foreground/70 break-words">
                    {place.address}
                  </p>
                  <p className="text-xs mt-1">
                    Ma moyenne :{" "}
                    <strong>{place.averageScore.toFixed(1)}/10</strong> ·{" "}
                    {place.visits} dégustation{place.visits > 1 ? "s" : ""}
                  </p>
                  <a
                    href={mapsPlaceUrl(place)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center text-xs font-bold underline"
                  >
                    Ouvrir dans Maps ↗
                  </a>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-foreground/70">
            Enregistre un récap avec tes notes pour découvrir ton classement
            personnel.
          </p>
        )}
      </section>
      <section aria-label="Mes tours enregistrés" className="space-y-3">
        <h2 className="text-xl font-display font-black">
          Mes tours enregistrés
        </h2>
        {!data.recaps.length ? (
          <p className="rounded-2xl border-2 border-dashed border-border p-6 text-sm">
            Ton carnet est encore vide. En fin de tour, ouvre son récapitulatif
            puis choisis « Enregistrer ce tour ».
          </p>
        ) : (
          data.recaps.map((recap) => (
            <article
              key={recap._id}
              className="rounded-2xl border-2 border-primary/20 bg-card p-4 space-y-3"
            >
              <div>
                <h3 className="text-lg font-display font-black break-words">
                  {recap.name}
                </h3>
                <p className="text-xs text-foreground/70 mt-1">
                  {recap.date
                    ? new Date(`${recap.date}T12:00:00`).toLocaleDateString(
                        "fr-FR",
                      )
                    : "Date non précisée"}{" "}
                  · {recap.places.length} adresse
                  {recap.places.length > 1 ? "s" : ""} notée
                  {recap.places.length > 1 ? "s" : ""}
                  {recap.participantName
                    ? ` · Avis de ${recap.participantName}`
                    : ""}
                </p>
              </div>
              {recap.sourceAvailable ? (
                <Link
                  href={`/recap/${recap.tourId}`}
                  className="inline-flex min-h-11 items-center rounded-xl border-2 border-secondary px-3 text-sm font-bold"
                >
                  Voir le récap du groupe →
                </Link>
              ) : (
                <p className="text-sm text-foreground/70">
                  Le tour source a été supprimé ; tes avis enregistrés sont
                  conservés ci-dessous.
                </p>
              )}
              {recap.places.length > 0 && (
                <details>
                  <summary className="min-h-11 cursor-pointer py-3 text-sm font-bold">
                    Mes avis enregistrés
                  </summary>
                  <ul className="space-y-3 pt-2">
                    {recap.places.map((place, index) => (
                      <li key={index} className="border-t border-border pt-3">
                        <p className="font-bold text-sm">
                          {place.name}
                          {place.score !== undefined
                            ? ` · ${place.score.toFixed(1)}/10`
                            : ""}
                        </p>
                        {place.comment && (
                          <p className="text-sm whitespace-pre-wrap break-words mt-1">
                            {place.comment}
                          </p>
                        )}
                        <a
                          href={mapsPlaceUrl(place)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-11 items-center text-xs underline"
                        >
                          {place.address} ↗
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}
