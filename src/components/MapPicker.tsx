"use client";
import { useState, useEffect, useRef } from "react";
import {
  useLoadScript,
  GoogleMap,
  Marker,
  Autocomplete,
} from "@react-google-maps/api";
import { Loader2, LocateFixed } from "lucide-react";
import { Input } from "@/components/ui/input";
import { openingHoursForDate, tourDay } from "../../convex/lib/schedule";
const libraries: "places"[] = ["places"];
type Position = { lat: number; lng: number };
interface MapPickerProps {
  onLocationSelect: (
    name: string,
    address: string,
    lat: number,
    lng: number,
    openingHours?: string,
    googlePlaceId?: string,
    weeklyOpeningHours?: string[],
  ) => void;
  initialLocation?: Position;
  tourDate?: string;
}
export default function MapPicker({
  onLocationSelect,
  initialLocation,
  tourDate,
}: MapPickerProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });
  const [mapCenter, setMapCenter] = useState(
    initialLocation || { lat: 48.8566, lng: 2.3522 },
  );
  const [marker, setMarker] = useState<Position | null>(
    initialLocation || null,
  );
  const [userPosition, setUserPosition] = useState<Position | null>(null);
  const [locate, setLocate] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [locating, setLocating] = useState(false);
  const recenterRequested = useRef(false);
  const selectionRequest = useRef(0);
  useEffect(
    () => () => {
      selectionRequest.current++;
    },
    [],
  );
  const autocomplete = useRef<google.maps.places.Autocomplete | null>(null);
  const map = useRef<google.maps.Map | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const [selectionHint, setSelectionHint] = useState("");
  useEffect(() => {
    let cancelled = false;
    navigator.permissions
      ?.query({ name: "geolocation" })
      .then((permission) => {
        if (!cancelled && permission.state === "granted") setLocate(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!locate || !navigator.geolocation) return;
    let cancelled = false;
    const watch = navigator.geolocation.watchPosition(
      (position) => {
        if (cancelled) return;
        const value = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserPosition(value);
        setLocationError("");
        setLocating(false);
        if (recenterRequested.current) {
          setMapCenter(value);
          recenterRequested.current = false;
        }
      },
      () => {
        if (cancelled) return;
        setLocationError(
          "Position inaccessible. Autorise la localisation pour afficher ta position.",
        );
        setLocating(false);
        setUserPosition(null);
        setLocate(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 },
    );
    return () => {
      cancelled = true;
      navigator.geolocation.clearWatch(watch);
    };
  }, [locate]);
  function applyPlace(
    place: google.maps.places.PlaceResult,
    fallback: Position,
  ) {
    const location = place.geometry?.location;
    const value = location
      ? { lat: location.lat(), lng: location.lng() }
      : fallback;
    const address =
      place.formatted_address ||
      `${value.lat.toFixed(6)}, ${value.lng.toFixed(6)}`;
    const week = place.opening_hours?.weekday_text || [];
    setMapCenter(value);
    setMarker(value);
    setSelectionHint(
      place.name ? "" : "Ajoute le nom du restaurant dans le champ ci-dessus.",
    );
    if (searchInput.current && place.name)
      searchInput.current.value = place.name;
    onLocationSelect(
      place.name || "",
      address,
      value.lat,
      value.lng,
      openingHoursForDate(week, tourDay(tourDate)),
      place.place_id,
      week,
    );
  }
  function selectPlace() {
    const place = autocomplete.current?.getPlace();
    const location = place?.geometry?.location;
    if (!place || !location) return;
    selectionRequest.current++;
    applyPlace(place, { lat: location.lat(), lng: location.lng() });
  }
  function mapClick(event: google.maps.MapMouseEvent) {
    if (!event.latLng) return;
    const request = ++selectionRequest.current;
    const value = { lat: event.latLng.lat(), lng: event.latLng.lng() };
    const placeId = (event as google.maps.IconMouseEvent).placeId;
    setMarker(value);
    setSelectionHint("");
    const geocode = () =>
      new google.maps.Geocoder().geocode(
        { location: value },
        (results, status) => {
          if (request !== selectionRequest.current) return;
          const address =
            status === "OK" ? results?.[0]?.formatted_address : undefined;
          applyPlace({ formatted_address: address }, value);
        },
      );
    if (placeId) {
      event.stop();
      setSelectionHint("Chargement du restaurant…");
      const service = new google.maps.places.PlacesService(
        map.current || document.createElement("div"),
      );
      service.getDetails(
        {
          placeId,
          fields: [
            "name",
            "formatted_address",
            "geometry",
            "opening_hours",
            "place_id",
          ],
        },
        (place, status) => {
          if (request !== selectionRequest.current) return;
          if (status === "OK" && place) applyPlace(place, value);
          else geocode();
        },
      );
    } else geocode();
  }
  if (loadError)
    return (
      <p role="alert" className="p-3 text-sm text-red-700">
        Carte indisponible. Vous pouvez saisir l’adresse manuellement.
      </p>
    );
  if (!isLoaded)
    return (
      <div
        role="status"
        className="h-[300px] flex items-center justify-center bg-muted rounded-xl"
      >
        <Loader2
          className="size-8 animate-spin"
          aria-label="Chargement de la carte"
        />
      </div>
    );
  return (
    <div className="space-y-3">
      <Autocomplete
        onLoad={(instance) => {
          autocomplete.current = instance;
        }}
        onPlaceChanged={selectPlace}
        options={{
          componentRestrictions: { country: "fr" },
          fields: [
            "geometry",
            "formatted_address",
            "name",
            "opening_hours",
            "place_id",
          ],
        }}
      >
        <Input
          ref={searchInput}
          data-map-search="true"
          aria-label="Rechercher un restaurant ou une adresse sur la carte"
          type="text"
          placeholder="Rechercher un restaurant ou une adresse…"
          className="h-12 text-base rounded-xl border-2"
        />
      </Autocomplete>
      <div className="h-[300px] w-full rounded-xl overflow-hidden border-2 relative">
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={mapCenter}
          zoom={15}
          onClick={mapClick}
          onLoad={(instance) => {
            map.current = instance;
          }}
          onUnmount={() => {
            map.current = null;
          }}
          options={{ disableDefaultUI: true, zoomControl: true }}
        >
          {marker && <Marker position={marker} title="Adresse sélectionnée" />}
          {userPosition && (
            <Marker
              position={userPosition}
              title="Ma position"
              zIndex={100}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#1683ff",
                fillOpacity: 1,
                strokeColor: "#fff",
                strokeWeight: 3,
              }}
            />
          )}
        </GoogleMap>
        <button
          type="button"
          aria-label="Recentrer sur ma position"
          disabled={locating}
          className="absolute bottom-8 left-3 min-h-11 flex items-center gap-2 rounded-xl border bg-white px-3 text-sm font-bold text-foreground shadow-md disabled:opacity-60"
          onClick={() => {
            if (!navigator.geolocation) {
              setLocationError(
                "La localisation n’est pas disponible sur cet appareil.",
              );
              return;
            }
            setLocationError("");
            if (userPosition) {
              setMapCenter(userPosition);
              return;
            }
            recenterRequested.current = true;
            setLocating(true);
            setLocate(true);
          }}
        >
          {locating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LocateFixed className="size-4" />
          )}{" "}
          Ma position
        </button>
      </div>
      {selectionHint && (
        <p role="status" className="text-sm text-foreground/75">
          {selectionHint}
        </p>
      )}
      {locationError && (
        <p role="alert" className="text-sm text-red-700">
          {locationError}
        </p>
      )}
    </div>
  );
}
