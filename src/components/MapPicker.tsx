"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Loader2 } from "lucide-react";

// Le fix des icônes sera effectué une fois monté.

interface MapPickerProps {
  onLocationSelect: (address: string, lat: number, lng: number) => void;
  initialLocation?: { lat: number; lng: number };
}

function LocationMarker({ onLocationSelect, initialLocation }: MapPickerProps) {
  const [position, setPosition] = useState<L.LatLng | null>(
    initialLocation ? new L.LatLng(initialLocation.lat, initialLocation.lng) : null
  );

  useMapEvents({
    async click(e) {
      setPosition(e.latlng);
      
      // Reverse geocoding via OpenStreetMap (Nominatim)
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`
        );
        const data = await response.json();
        const address = data.display_name || "Unknown Location";
        onLocationSelect(address, e.latlng.lat, e.latlng.lng);
      } catch (error) {
        console.error("Geocoding failed:", error);
        onLocationSelect("Unknown address", e.latlng.lat, e.latlng.lng);
      }
    },
  });

  return position === null ? null : <Marker position={position}></Marker>;
}

export default function MapPicker({ onLocationSelect, initialLocation }: MapPickerProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Fix leaflet marker icon loading issue in Next.js
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    });
    setIsClient(true);
  }, []);

  if (!isClient) return <div className="h-[300px] w-full bg-muted rounded-xl flex items-center justify-center border-2"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="h-[300px] w-full rounded-xl overflow-hidden border-2 z-0 relative">
      <MapContainer 
        center={initialLocation || { lat: 48.8566, lng: 2.3522 }} // Default to Paris
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker onLocationSelect={onLocationSelect} initialLocation={initialLocation} />
      </MapContainer>
      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm z-[1000] pointer-events-none">
        Click anywhere to drop a pin 📍
      </div>
    </div>
  );
}
