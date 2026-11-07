"use client";
import { useId, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { tourDay } from "../../convex/lib/schedule";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";
export default function TourDateEditor({
  tourId,
  date,
}: {
  tourId: Id<"tours">;
  date?: string;
}) {
  const id = useId();
  const update = useMutation(api.tours.updateTourDate);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(date || tourDay());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  if (!editing)
    return (
      <Button
        variant="outline"
        size="sm"
        aria-label="Modifier la date du food tour"
        className="min-h-11 rounded-xl text-sm"
        onClick={() => {
          setValue(date || tourDay());
          setEditing(true);
        }}
      >
        📅{" "}
        {date
          ? new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "Définir la date"}
        <Pencil className="size-3" aria-hidden="true" />
      </Button>
    );
  return (
    <form
      className="space-y-2 rounded-xl bg-card p-3 border-2 border-primary/20"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!value || saving) return;
        setSaving(true);
        setError("");
        try {
          await update({ tourId, date: value });
          setEditing(false);
        } catch {
          setError("Impossible de modifier la date. Réessayez.");
        } finally {
          setSaving(false);
        }
      }}
    >
      <label htmlFor={id} className="text-sm font-bold">
        Date du food tour
      </label>
      <Input
        id={id}
        type="date"
        required
        value={value}
        disabled={saving}
        onChange={(event) => setValue(event.target.value)}
        className="h-11"
      />
      <p className="text-xs text-foreground/75">
        Les horaires habituels des adresses seront recalculés pour ce jour.
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving || !value} className="min-h-11">
          {saving ? "Enregistrement…" : "Enregistrer la date"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={saving}
          className="min-h-11"
          onClick={() => setEditing(false)}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}
