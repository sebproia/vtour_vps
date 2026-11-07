"use client";
import { useState, useSyncExternalStore, useCallback, useId } from "react";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import Link from "next/link";
const subscribe = (callback: () => void) => {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
};
export default function SaveRecap({
  tourId,
  participants,
  completed,
}: {
  tourId: Id<"tours">;
  participants: string[];
  completed: boolean;
}) {
  const id = useId();
  const { user, isLoaded, isSignedIn } = useUser();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const saved = useQuery(
    api.savedRecaps.getSaved,
    isAuthenticated ? { tourId } : "skip",
  );
  const save = useMutation(api.savedRecaps.save);
  const [choice, setChoice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const readGuest = useCallback(() => {
    try {
      return localStorage.getItem(`vitour_${tourId}_name`) || "";
    } catch {
      return "";
    }
  }, [tourId]);
  const guest = useSyncExternalStore(subscribe, readGuest, () => "");
  const selected =
    choice ??
    [saved?.participantName, guest, user?.firstName].find(
      (name) => name && participants.includes(name),
    ) ??
    "";
  const path = `/recap/${tourId}`;
  return (
    <section
      aria-label="Enregistrer le tour dans mon compte"
      className="w-full rounded-2xl border-2 border-primary/20 bg-card p-4 space-y-3"
    >
      <h3 className="text-xl font-display font-black">
        {saved ? "Ton récap est dans ton carnet" : "Garde tes découvertes"}
      </h3>
      <p className="text-sm text-foreground/75">
        Enregistre ce tour dans ton compte pour retrouver tes avis, ton nombre
        d’adresses testées et tes meilleures découvertes.
      </p>
      {!completed ? (
        <p className="text-sm font-bold">
          L’enregistrement sera disponible une fois le tour terminé.
        </p>
      ) : !isLoaded ? (
        <p role="status">Chargement du compte…</p>
      ) : !isSignedIn ? (
        <div className="space-y-2">
          <SignUpButton
            mode="modal"
            forceRedirectUrl={path}
            signInForceRedirectUrl={path}
          >
            <Button className="w-full min-h-11 rounded-xl">
              Créer un compte
            </Button>
          </SignUpButton>
          <SignInButton
            mode="modal"
            forceRedirectUrl={path}
            signUpForceRedirectUrl={path}
          >
            <Button variant="outline" className="w-full min-h-11 rounded-xl">
              Se connecter
            </Button>
          </SignInButton>
        </div>
      ) : !isAuthenticated || isLoading || saved === undefined ? (
        <p role="status">Synchronisation de ton compte…</p>
      ) : (
        <div className="space-y-3">
          {participants.length > 0 ? (
            <>
              <label htmlFor={id} className="block text-sm font-bold">
                Le prénom utilisé pour tes avis
              </label>
              <select
                id={id}
                value={selected}
                disabled={saving}
                onChange={(event) => {
                  setChoice(event.target.value);
                  setMessage("");
                }}
                className="w-full min-h-11 rounded-xl border-2 border-border bg-card px-3 text-base"
              >
                <option value="">Choisir mon prénom</option>
                {participants.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-foreground/70">
                Pour les avis déposés sans compte, choisis le prénom que tu
                utilisais. Seules les adresses que tu as notées compteront ; les
                arrêts passés sans note sont exclus.
              </p>
            </>
          ) : (
            <p className="text-sm">
              Aucun avis à associer pour l’instant : ce tour sera enregistré
              sans ajouter d’adresse à tes statistiques.
            </p>
          )}
          <Button
            className="w-full min-h-11 rounded-xl"
            disabled={
              saving ||
              (participants.length > 0 && !participants.includes(selected))
            }
            onClick={async () => {
              if (saving) return;
              setSaving(true);
              setError("");
              setMessage("");
              try {
                await save({ tourId, participantName: selected || undefined });
                setMessage("Récap enregistré dans ton compte.");
              } catch {
                setError(
                  "Impossible d’enregistrer ce tour. Vérifie le prénom choisi et ta connexion, puis réessaie.",
                );
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving
              ? "Enregistrement…"
              : saved
                ? "Actualiser mon récap"
                : "Enregistrer ce tour"}
          </Button>
          {message && (
            <p role="status" className="text-sm text-green-800">
              {message}
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <Link
            href="/mes-recaps"
            className="inline-flex min-h-11 items-center font-bold text-sm underline underline-offset-2"
          >
            Ouvrir mon carnet →
          </Link>
        </div>
      )}
    </section>
  );
}
