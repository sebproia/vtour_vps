"use client";

import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Trash2,
  Copy,
  Download,
  Globe,
  Plus,
  MoreHorizontal,
  CalendarDays,
  MapPin,
  ArrowRight,
} from "lucide-react";

interface TourWithPhotos {
  _id: Id<"tours">;
  _creationTime: number;
  name: string;
  organizerId: string;
  status: "draft" | "live" | "completed";
  currentStepIndex: number;
  date?: string;
  isPublic?: boolean;
  stopsCount: number;
  averageScore: number | null;
  previewPhotos: string[];
}
const statusLabel = {
  draft: "En préparation",
  live: "En cours",
  completed: "Terminé",
};
function tourDate(tour: TourWithPhotos) {
  const date = tour.date
    ? new Date(`${tour.date}T12:00:00`)
    : new Date(tour._creationTime);
  return Number.isNaN(date.getTime())
    ? "Date à préciser"
    : date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

export default function TourList() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const tours = useQuery(
    api.tours.getMyTours,
    isAuthenticated ? {} : "skip",
  ) as TourWithPhotos[] | undefined;
  const publicTours = useQuery(
    api.tours.getPublicTours,
    isAuthenticated ? {} : "skip",
  ) as TourWithPhotos[] | undefined;
  const createTour = useMutation(api.tours.createTour);
  const deleteTour = useMutation(api.tours.deleteTour);
  const duplicateTour = useMutation(api.tours.duplicateTour);
  const importPublicTour = useMutation(api.tours.importPublicTour);
  const toggleTourPublic = useMutation(api.tours.toggleTourPublic);
  const [activeTab, setActiveTab] = useState<"mine" | "discover">("mine");
  const [isCreating, setIsCreating] = useState(false);
  const [newTourName, setNewTourName] = useState("");
  const [newTourDate, setNewTourDate] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!newTourName.trim() || busy) return;
    setBusy("create");
    setError("");
    try {
      await createTour({
        name: newTourName.trim(),
        date: newTourDate || undefined,
      });
      setNewTourName("");
      setNewTourDate("");
      setIsCreating(false);
    } catch {
      setError(
        "Le tour n’a pas pu être créé. Tes informations sont conservées, réessaie.",
      );
    } finally {
      setBusy(null);
    }
  }
  async function runAction(
    tourId: Id<"tours">,
    action: () => Promise<unknown>,
  ) {
    if (busy) return;
    setBusy(tourId);
    setError("");
    try {
      await action();
    } catch {
      setError(
        "Cette action n’a pas abouti. Vérifie ta connexion et réessaie.",
      );
    } finally {
      setBusy(null);
    }
  }

  if (
    isLoading ||
    !isAuthenticated ||
    tours === undefined ||
    publicTours === undefined
  )
    return (
      <p role="status" className="py-6 font-bold">
        Chargement de tes tours…
      </p>
    );
  const visibleTours = activeTab === "mine" ? tours : publicTours;
  return (
    <section aria-labelledby="tours-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id="tours-heading" className="font-display text-2xl font-black">
            Tes food tours
          </h1>
          <p className="mt-1 text-sm text-foreground/75">
            Prépare ta prochaine balade gourmande.
          </p>
        </div>
        <Button
          onClick={() => {
            setActiveTab("mine");
            setIsCreating(true);
            setError("");
          }}
          className="min-h-11 rounded-xl bg-secondary text-secondary-foreground font-display font-bold shadow-[0_3px_0_hsl(190,80%,40%)] hover:bg-secondary/90"
        >
          <Plus className="size-4" aria-hidden="true" /> Créer un tour
        </Button>
      </div>
      <div
        role="group"
        aria-label="Afficher les tours"
        className="flex gap-1 rounded-xl border border-border bg-card p-1 sm:w-fit"
      >
        {(
          [
            { key: "mine", label: "Mes tours" },
            { key: "discover", label: "Découvrir" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            aria-pressed={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`min-h-11 flex-1 rounded-lg px-5 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${activeTab === tab.key ? "bg-primary text-foreground shadow-sm" : "text-foreground/75 hover:bg-primary/5"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      {busy && busy !== "create" && (
        <p role="status" className="text-sm">
          Mise à jour du tour…
        </p>
      )}
      {activeTab === "mine" && isCreating && (
        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-2xl border-2 border-secondary/40 bg-card p-4"
        >
          <h2 className="font-display text-lg font-bold">Nouveau food tour</h2>
          <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
            <div className="space-y-1.5">
              <label htmlFor="new-tour-name" className="text-sm font-bold">
                Nom du tour
              </label>
              <Input
                id="new-tour-name"
                autoFocus
                required
                placeholder="Ex. Les meilleurs burgers de Paris"
                value={newTourName}
                disabled={busy === "create"}
                onChange={(e) => setNewTourName(e.target.value)}
                className="min-h-11 rounded-xl bg-background text-base"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="new-tour-date" className="text-sm font-bold">
                Date <span className="font-normal">(facultatif)</span>
              </label>
              <Input
                id="new-tour-date"
                type="date"
                value={newTourDate}
                disabled={busy === "create"}
                onChange={(e) => setNewTourDate(e.target.value)}
                className="min-h-11 min-w-0 rounded-xl bg-background text-base"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              disabled={busy !== null || !newTourName.trim()}
              className="min-h-11 rounded-xl text-foreground"
            >
              {busy === "create" ? "Création…" : "Créer le tour"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busy === "create"}
              onClick={() => setIsCreating(false)}
              className="min-h-11 rounded-xl"
            >
              Annuler
            </Button>
          </div>
        </form>
      )}
      {activeTab === "discover" && (
        <p className="text-sm leading-relaxed text-foreground/75">
          Des parcours partagés par la communauté. Copie un tour dans ton espace
          pour l’adapter et le vivre à ton rythme.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visibleTours.map((tour) => {
          const mine = activeTab === "mine";
          const href =
            !mine || tour.status === "completed"
              ? `/recap/${tour._id}`
              : `/tour/${tour._id}`;
          return (
            <article
              key={tour._id}
              className="relative rounded-2xl border-2 border-primary/15 bg-card shadow-sm"
            >
              {tour.previewPhotos?.length > 0 && (
                <div
                  className="flex h-28 gap-1 overflow-hidden rounded-t-[14px]"
                  aria-hidden="true"
                >
                  {tour.previewPhotos.slice(0, 3).map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt=""
                      loading="lazy"
                      className="min-w-0 flex-1 object-cover"
                    />
                  ))}
                </div>
              )}
              <div className="space-y-3 p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                  <span
                    className={`rounded-full px-2.5 py-1 ${tour.status === "live" ? "bg-primary/10 text-foreground" : "bg-secondary/10 text-foreground"}`}
                  >
                    {statusLabel[tour.status]}
                  </span>
                  {tour.isPublic && (
                    <span className="inline-flex items-center gap-1 text-foreground/75">
                      <Globe className="size-3.5" aria-hidden="true" />
                      Partagé
                    </span>
                  )}
                  {tour.averageScore !== null && (
                    <span className="ml-auto text-foreground">
                      ⭐ {tour.averageScore}/10
                    </span>
                  )}
                </div>
                <h2 className="font-display text-xl font-black leading-snug break-words">
                  <Link
                    href={href}
                    className="after:absolute after:inset-0 after:z-10 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                  >
                    {tour.name}
                  </Link>
                </h2>
                <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground/75">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-4" aria-hidden="true" />
                    {tourDate(tour)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4" aria-hidden="true" />
                    {tour.stopsCount} adresse{tour.stopsCount !== 1 ? "s" : ""}
                  </span>
                </p>
              </div>
              <div
                className="relative z-20 flex items-center justify-between gap-2 border-t border-border/60 px-3 py-2"
                onClick={(e) => e.stopPropagation()}
              >
                <Link
                  href={href}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-bold hover:bg-secondary/10 focus-visible:outline-2 focus-visible:outline-primary"
                >
                  {!mine || tour.status === "completed"
                    ? "Voir le récap"
                    : tour.status === "live"
                      ? "Reprendre le tour"
                      : "Préparer le tour"}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                {mine ? (
                  <details
                    className="relative"
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        e.currentTarget.open = false;
                        e.currentTarget.querySelector("summary")?.focus();
                      }
                    }}
                  >
                    <summary
                      aria-label={`Options pour ${tour.name}`}
                      className="flex size-11 cursor-pointer list-none items-center justify-center rounded-xl border border-border hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden"
                    >
                      <MoreHorizontal className="size-5" aria-hidden="true" />
                    </summary>
                    <div className="absolute right-0 bottom-full z-40 mb-2 w-64 max-w-[calc(100vw-3rem)] rounded-xl border-2 border-border bg-card p-1 shadow-lg">
                      <button
                        type="button"
                        disabled={busy !== null}
                        className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm hover:bg-muted disabled:opacity-50"
                        onClick={(e) => {
                          e.currentTarget
                            .closest("details")
                            ?.removeAttribute("open");
                          void runAction(tour._id, () =>
                            toggleTourPublic({
                              tourId: tour._id,
                              isPublic: !tour.isPublic,
                            }),
                          );
                        }}
                      >
                        <Globe className="size-4" aria-hidden="true" />
                        {tour.isPublic
                          ? "Ne plus partager"
                          : "Partager dans Découvrir"}
                      </button>
                      <button
                        type="button"
                        disabled={busy !== null}
                        className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm hover:bg-muted disabled:opacity-50"
                        onClick={(e) => {
                          e.currentTarget
                            .closest("details")
                            ?.removeAttribute("open");
                          if (
                            confirm(
                              "Créer une copie de ce tour ? Les notes et les photos ne seront pas copiées.",
                            )
                          )
                            void runAction(tour._id, () =>
                              duplicateTour({ tourId: tour._id }),
                            );
                        }}
                      >
                        <Copy className="size-4" aria-hidden="true" />
                        Dupliquer le tour
                      </button>
                      <button
                        type="button"
                        disabled={busy !== null}
                        className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                        onClick={(e) => {
                          e.currentTarget
                            .closest("details")
                            ?.removeAttribute("open");
                          if (
                            confirm(
                              "Supprimer ce tour, ses notes et ses photos ? Cette action est définitive.",
                            )
                          )
                            void runAction(tour._id, () =>
                              deleteTour({ tourId: tour._id }),
                            );
                        }}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        Supprimer le tour
                      </button>
                    </div>
                  </details>
                ) : (
                  <Button
                    disabled={busy !== null}
                    variant="outline"
                    className="min-h-11 rounded-xl text-sm"
                    onClick={() => {
                      if (
                        confirm(
                          "Ajouter une copie de ce parcours à tes tours ? Ses notes et photos ne seront pas copiées.",
                        )
                      )
                        void runAction(tour._id, async () => {
                          const id = await importPublicTour({
                            tourId: tour._id,
                          });
                          window.location.href = `/tour/${id}`;
                        });
                    }}
                  >
                    <Download className="size-4" aria-hidden="true" />
                    {busy === tour._id ? "Ajout…" : "Ajouter à mes tours"}
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {visibleTours.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-border bg-card p-6 text-center">
          <h2 className="font-display text-xl font-bold">
            {activeTab === "mine"
              ? "Ton premier tour commence ici"
              : "Les découvertes arrivent bientôt"}
          </h2>
          <p className="mt-2 text-sm text-foreground/75">
            {activeTab === "mine"
              ? "Choisis un nom, ajoute tes adresses et invite tes amis."
              : "Les tours partagés par la communauté apparaîtront ici."}
          </p>
        </div>
      )}
    </section>
  );
}
