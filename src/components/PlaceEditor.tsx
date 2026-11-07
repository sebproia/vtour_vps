"use client";

import { useId, useState } from "react";
import dynamic from "next/dynamic";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";

const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
  loading: () => <p role="status">Chargement de la carte…</p>,
});

export default function PlaceEditor({
  place,
  tourDate,
  onClose,
}: {
  place: Doc<"places">;
  tourDate?: string;
  onClose: () => void;
}) {
  const id = useId();
  const updatePlace = useMutation(api.places.updatePlace);
  const [name, setName] = useState(place.name);
  const [address, setAddress] = useState(place.address);
  const [coordinates, setCoordinates] = useState(place.coordinates);
  const [adminComment, setAdminComment] = useState(place.adminComment || "");
  const [openingHours, setOpeningHours] = useState(place.openingHours);
  const [googlePlaceId, setGooglePlaceId] = useState(place.googlePlaceId);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  return (
    <form
      className="space-y-4"
      aria-label={`Modifier ${place.name}`}
      onSubmit={async (event) => {
        event.preventDefault();
        if (isSaving || !name.trim() || !address.trim() || !coordinates) return;
        setIsSaving(true);
        setError("");
        try {
          await updatePlace({
            placeId: place._id,
            name: name.trim(),
            address,
            coordinates,
            adminComment: adminComment.trim() || undefined,
            openingHours,
            googlePlaceId,
          });
          onClose();
        } catch {
          setError(
            "Impossible d’enregistrer cet arrêt. Vérifiez votre connexion et que le parcours est toujours en brouillon, puis réessayez.",
          );
        } finally {
          setIsSaving(false);
        }
      }}
    >
      <fieldset disabled={isSaving} className="space-y-4 min-w-0">
        <h5 className="font-display font-black text-lg">Modifier cet arrêt</h5>
        <div className="space-y-1.5">
          <label htmlFor={`${id}-name`} className="text-sm font-bold">
            Nom du restaurant
          </label>
          <Input
            id={`${id}-name`}
            autoFocus
            className="h-11 rounded-xl border-2"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Recherchez une adresse ou sélectionnez un point sur la carte pour la
          remplacer.
        </p>
        <div
          inert={isSaving}
          onKeyDown={(event) => {
            // Google autocomplete uses Enter to select a result, not to save the form.
            if (event.key === "Enter") event.preventDefault();
          }}
        >
          <MapPicker
            initialLocation={place.coordinates}
            tourDate={tourDate}
            onLocationSelect={(
              selectedName,
              selectedAddress,
              lat,
              lng,
              hours,
              placeId,
            ) => {
              setName(selectedName);
              setAddress(selectedAddress);
              setCoordinates({ lat, lng });
              setOpeningHours(hours);
              setGooglePlaceId(placeId);
            }}
          />
        </div>
        <p className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/10 p-3 text-sm break-words">
          <MapPin className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{address}</span>
        </p>
        {openingHours && (
          <p className="text-sm text-amber-600">🕒 {openingHours}</p>
        )}
        <div className="space-y-1.5">
          <label htmlFor={`${id}-comment`} className="text-sm font-bold">
            Plat recommandé (optionnel)
          </label>
          <Input
            id={`${id}-comment`}
            className="h-11 rounded-xl border-2"
            value={adminComment}
            onChange={(event) => setAdminComment(event.target.value)}
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl sm:flex-1"
            onClick={onClose}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            className="h-11 rounded-xl sm:flex-1"
            disabled={
              isSaving || !name.trim() || !address.trim() || !coordinates
            }
          >
            {isSaving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
