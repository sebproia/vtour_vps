"use client";

import { useState, useCallback, useRef } from "react";
import { useLoadScript, GoogleMap, Marker, Autocomplete } from "@react-google-maps/api";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

const libraries: "places"[] = ["places"];

interface MapPickerProps {
  onLocationSelect: (name: string, address: string, lat: number, lng: number) => void;
  initialLocation?: { lat: number; lng: number };
}

export default function MapPicker({ onLocationSelect, initialLocation }: MapPickerProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const [mapCenter, setMapCenter] = useState(initialLocation || { lat: 48.8566, lng: 2.3522 }); // Paris par défaut
  const [markerPos, setMarkerPos] = useState<{lat: number, lng: number} | null>(initialLocation || null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const address = place.formatted_address || "Unknown address";
        const name = place.name || address.split(',')[0];
        
        setMapCenter({ lat, lng });
        setMarkerPos({ lat, lng });
        onLocationSelect(name, address, lat, lng);
      }
    }
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPos({ lat, lng });
      
      // Geocoding inverse manuel pour un clic aléatoire
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const address = results[0].formatted_address;
          const name = address.split(',')[0]; // Extrait sommaire du nom
          onLocationSelect(name, address, lat, lng);
        } else {
          onLocationSelect("Lieu cliqué", "Adresse inconnue", lat, lng);
        }
      });
    }
  };

  if (loadError) return <div className="p-4 text-red-500 border border-red-500 rounded-xl">Error loading Google Maps</div>;
  if (!isLoaded) return <div className="h-[300px] w-full bg-muted rounded-xl flex items-center justify-center border-2"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <Autocomplete 
        onLoad={onLoad} 
        onPlaceChanged={onPlaceChanged}
        options={{
          componentRestrictions: { country: "fr" }
        }}
      >
        <Input 
          type="text" 
          placeholder="Search for a restaurant or place..." 
          className="h-14 text-lg rounded-xl border-2 pl-4 shadow-sm"
        />
      </Autocomplete>

      <div className="h-[300px] w-full rounded-xl overflow-hidden border-2 z-0 relative shadow-inner">
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={mapCenter}
          zoom={15}
          onClick={handleMapClick}
          options={{ disableDefaultUI: true, zoomControl: true }}
        >
          {markerPos && <Marker position={markerPos} animation={google.maps.Animation.DROP} />}
        </GoogleMap>
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm z-[1000] pointer-events-none">
          Click map or use search 📍
        </div>
      </div>
    </div>
  );
}
