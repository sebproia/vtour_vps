"use client";
import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
function subscribe(callback: () => void) {
  const query = window.matchMedia("(display-mode: standalone)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const standalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
export default function ContinueInApp({ path }: { path: string }) {
  const inApp = useSyncExternalStore(subscribe, standalone, () => true);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  if (inApp) return null;
  const url =
    typeof window !== "undefined" ? `${window.location.origin}${path}` : "";
  return (
    <aside className="mb-4 rounded-2xl border-2 border-white/30 bg-white p-3 text-foreground">
      <button
        type="button"
        aria-expanded={expanded}
        className="flex min-h-11 w-full items-center text-left text-sm font-bold"
        onClick={() => setExpanded((value) => !value)}
      >
        📱 Tu as déjà la PWA Vitour ? {expanded ? "−" : "+"}
      </button>
      {expanded && (
        <div className="space-y-3 pt-2">
          <p className="text-sm">
            Si ce lien s’est ouvert dans le navigateur, copie-le, ouvre Vitour
            depuis son icône puis colle-le dans « Scanner un QR code ».
          </p>
          <Button
            className="w-full min-h-11 rounded-xl"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setError(false);
              } catch {
                setError(true);
              }
            }}
          >
            {copied ? "Lien copié ✓" : "Copier le lien pour la PWA"}
          </Button>
          <input
            aria-label="Lien à ouvrir dans la PWA"
            readOnly
            value={url}
            onFocus={(event) => event.target.select()}
            className="w-full min-h-11 rounded-xl border border-border bg-white px-3 text-xs text-foreground"
          />
          {copied && (
            <p role="status" className="text-sm">
              Ouvre maintenant l’app Vitour et colle le lien dans le scanner.
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-red-700">
              Copie manuellement le lien affiché ci-dessus.
            </p>
          )}
          <p className="text-xs text-foreground/70">
            L’ouverture automatique dans l’app dépend du téléphone et du
            navigateur.
          </p>
        </div>
      )}
    </aside>
  );
}
