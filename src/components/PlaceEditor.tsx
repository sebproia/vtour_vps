"use client";

import { useId, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TastePicker, type TasteTag } from "@/components/PlaceTags";

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

  const [weeklyOpeningHours, setWeeklyOpeningHours] = useState(
    place.weeklyOpeningHours,
  );
  const [tags, setTags] = useState<TasteTag[]>(place.tags || []);
  const searchSubmit = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  return (
    <form
      className="min-w-0 space-y-4"
      aria-label={`Modifier ${place.name}`}
      onKeyDown={(event) => {
        if (
          event.key === "Enter" &&
          event.target instanceof HTMLInputElement &&
          event.target.dataset.mapSearch === "true"
        ) {
          searchSubmit.current = true;
          setTimeout(() => {
            searchSubmit.current = false;
          }, 0);
        }
      }}
      onSubmit={async (event) => {
        event.preventDefault();
        if (searchSubmit.current || isSaving || !name.trim() || !address.trim())
          return;
        setIsSaving(true);
        setError("");
        try {
          await updatePlace({
            placeId: place._id,
            name: name.trim(),
            address,
            coordinates,
            adminComment: adminComment.trim() || undefined,
            openingHours: weeklyOpeningHours ? openingHours : undefined,
            googlePlaceId,
            weeklyOpeningHours,
            tags,
          });
          onClose();
        } catch {
          setError(
            "Impossible d’enregistrer cet arrêt. Vérifiez votre connexion et que le parcours n’est pas terminé, puis réessayez.",
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
        <div className="space-y-1.5">
          <label htmlFor={`${id}-address`} className="text-sm font-bold">
            Adresse
          </label>
          <Input
            id={`${id}-address`}
            className="h-11 rounded-xl border-2"
            value={address}
            onChange={(event) => {
              setAddress(event.target.value);
              setCoordinates(undefined);
              setGooglePlaceId(undefined);
              setOpeningHours(undefined);
              setWeeklyOpeningHours(undefined);
            }}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Saisissez l’adresse directement ou choisissez un nouveau lieu sur la
          carte.
        </p>
        <div inert={isSaving}>
          <MapPicker
            key={
              coordinates ? `${coordinates.lat},${coordinates.lng}` : "manual"
            }
            initialLocation={coordinates}
            initialSelection={coordinates ? {name,address} : undefined}
            tourDate={tourDate}
            onLocationSelect={(
              selectedName,
              selectedAddress,
              lat,
              lng,
              hours,
              placeId,
              week,
            ) => {
              setName(selectedName);
              setAddress(selectedAddress);
              setCoordinates({ lat, lng });
              setOpeningHours(hours);
              setGooglePlaceId(placeId);
              setWeeklyOpeningHours(week);
            }}
          />
        </div>

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
        <TastePicker value={tags} onChange={setTags} />
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
            disabled={isSaving || !name.trim() || !address.trim()}
          >
            {isSaving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
