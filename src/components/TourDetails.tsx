"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import QRCode from "react-qr-code";
import { MapPin, PlusCircle, Plus, CheckCircle, Navigation, Play, FastForward, QrCode, Flag, Sparkles, Loader2, Pause, X, Pencil, Check, Share2, ChevronLeft, ChevronRight, Navigation2, Globe, Lock } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useLoadScript } from "@react-google-maps/api";

const libraries: "places"[] = ["places"];
import { useUser } from "@clerk/nextjs";
import TastingCard from "@/components/TastingCard";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";

const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-muted animate-pulse rounded-xl border-2 flex items-center justify-center font-display font-medium text-muted-foreground">Loading Map...🗺️</div>
});

export default function TourDetails({ tourId }: { tourId: string }) {
  const { user } = useUser();
  const adminName = user?.firstName || "L'Organisateur ✌️";
  const tId = tourId as Id<"tours">;
  
  const tour = useQuery(api.places.getTourInfo, { tourId: tId });
  const places = useQuery(api.places.getPlacesByTour, { tourId: tId });
  
  const addPlace = useMutation(api.places.addPlace);
  const startLiveMode = useMutation(api.places.startLiveMode);
  const nextStep = useMutation(api.places.nextStep);
  const endLiveMode = useMutation(api.places.endLiveMode);
  const optimizeRoute = useMutation(api.places.optimizeRoute);
  const reorderPlacesMutation = useMutation(api.places.reorderPlaces);
  const pauseTour = useMutation(api.places.pauseTour);
  const deletePlace = useMutation(api.places.deletePlace);
  const renameTour = useMutation(api.tours.renameTour);
  const toggleTourPublic = useMutation(api.tours.toggleTourPublic);

  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newAdminComment, setNewAdminComment] = useState("");
  const [newCoordinate, setNewCoordinate] = useState<{lat: number, lng: number} | undefined>();
  const [mapPickerKey, setMapPickerKey] = useState(0);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [copied, setCopied] = useState(false);
  const [expandedPlaceId, setExpandedPlaceId] = useState<string | null>(null);
  const [viewIndex, setViewIndex] = useState<number>(0);

  const [newOpeningHours, setNewOpeningHours] = useState("");
  const [newGooglePlaceId, setNewGooglePlaceId] = useState("");
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [travelTimes, setTravelTimes] = useState<Record<string, string>>({});

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  useEffect(() => {
    if (!isLoaded || !places || places.length < 2) {
      setTravelTimes({});
      return;
    }

    try {
      const service = new google.maps.DistanceMatrixService();
      
      const origins = places.slice(0, -1).map(p => {
        if (p.coordinates) return new google.maps.LatLng(p.coordinates.lat, p.coordinates.lng);
        return p.address;
      });
      
      const destinations = places.slice(1).map(p => {
        if (p.coordinates) return new google.maps.LatLng(p.coordinates.lat, p.coordinates.lng);
        return p.address;
      });

      service.getDistanceMatrix({
        origins,
        destinations,
        travelMode: google.maps.TravelMode.WALKING,
      }, (response, status) => {
        if (status === "OK" && response) {
          const times: Record<string, string> = {};
          for (let i = 0; i < origins.length; i++) {
            const element = response.rows[i]?.elements[i];
            if (element && element.status === "OK") {
              times[places[i]._id] = element.duration.text;
            }
          }
          setTravelTimes(times);
        }
      });
    } catch (err) {
      console.error("Error calculating travel times:", err);
    }
  }, [isLoaded, places]);

  const getFullItineraryUrl = () => {
    if (!places || places.length === 0) return "";
    if (places.length === 1) {
      const p = places[0];
      const dest = p.coordinates ? `${p.coordinates.lat},${p.coordinates.lng}` : encodeURIComponent(p.address);
      return `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=walking`;
    }
    
    const firstPlace = places[0];
    const lastPlace = places[places.length - 1];
    if (!firstPlace || !lastPlace) return "";
    
    const origin = firstPlace.coordinates 
      ? `${firstPlace.coordinates.lat},${firstPlace.coordinates.lng}` 
      : encodeURIComponent(firstPlace.address);
      
    const destination = lastPlace.coordinates 
      ? `${lastPlace.coordinates.lat},${lastPlace.coordinates.lng}` 
      : encodeURIComponent(lastPlace.address);
      
    const waypoints = places.slice(1, -1).map(p => {
      return p.coordinates ? `${p.coordinates.lat},${p.coordinates.lng}` : encodeURIComponent(p.address);
    }).join("|");
    
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ""}&travelmode=walking`;
  };

  // Synchroniser viewIndex avec le currentStepIndex du serveur
  useEffect(() => {
    if (tour !== undefined && tour !== null) {
      setViewIndex(tour.currentStepIndex);
    }
  }, [tour?.currentStepIndex]);

  const handleShare = async () => {
    if (!tour || typeof window === "undefined") return;
    const joinUrl = `${window.location.origin}/join/${tourId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Rejoins le tour : ${tour.name}! 🍔`,
          text: `Suis l'itinéraire de notre Food Tour "${tour.name}" en direct ! 🍩`,
          url: joinUrl,
        });
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          return;
        }
        console.log("Share failed, falling back to copy:", err);
      }
    }
    
    // Fallback to copy to clipboard
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      await optimizeRoute({ tourId: tId });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleRename = async () => {
    if (!renameValue.trim() || !user?.id) return;
    await renameTour({ tourId: tId, name: renameValue.trim() });
    setIsRenaming(false);
  };

  const onDragEnd = async (result: DropResult) => {
    if (!places) return;
    if (!result.destination || result.source.index === result.destination.index) return;
    
    const items = Array.from(places);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    const updates = items.map((item, index) => ({ _id: item._id, order: index }));
    await reorderPlacesMutation({ tourId: tId, updates });
  };

  const handleAddPlace = async () => {
    if (!tour || !newName.trim() || !newAddress.trim()) return;
    
    let finalInsertIndex: number | undefined = undefined;
    if (insertIndex !== null) {
      finalInsertIndex = insertIndex;
    } else if (tour.status === "live") {
      finalInsertIndex = tour.currentStepIndex + 1;
    }

    await addPlace({
      tourId: tId,
      name: newName,
      address: newAddress,
      coordinates: newCoordinate,
      adminComment: newAdminComment.trim() || undefined,
      openingHours: newOpeningHours || undefined,
      googlePlaceId: newGooglePlaceId || undefined,
      insertAtIndex: finalInsertIndex,
    });
    
    setNewName("");
    setNewAddress("");
    setNewAdminComment("");
    setNewCoordinate(undefined);
    setNewOpeningHours("");
    setNewGooglePlaceId("");
    setInsertIndex(null);
    setIsAddModalOpen(false);
    setMapPickerKey(k => k + 1);
  };

  if (tour === undefined || places === undefined) {
    return <div className="text-xl font-display font-black animate-pulse text-muted-foreground mt-12 text-center">Loading tour details... 🍔</div>;
  }

  if (tour === null) {
    return <div className="text-xl font-display font-bold text-destructive text-center">Tour not found!</div>;
  }

  const isDraft = tour.status === "draft";
  const isLive = tour.status === "live";

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Tour Header — compact on mobile */}
      <div className="flex flex-col gap-3 bg-primary/5 p-4 sm:p-6 border-2 sm:border-4 border-primary/20 rounded-2xl sm:rounded-[2rem] shadow-lg">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {isRenaming ? (
              <div className="flex items-center gap-2">
                <Input 
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRename()}
                  className="h-10 text-lg font-bold rounded-xl border-2"
                />
                <Button size="sm" onClick={handleRename} className="h-10 w-10 rounded-xl bg-green-500 hover:bg-green-600 text-white p-0">
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsRenaming(false)} className="h-10 w-10 rounded-xl p-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-4xl font-display font-black text-foreground drop-shadow-sm truncate">{tour.name}</h2>
                <button 
                  onClick={() => { setRenameValue(tour.name); setIsRenaming(true); }}
                  className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted hover:bg-muted-foreground/20 flex items-center justify-center transition-colors"
                  title="Renommer"
                >
                  <Pencil className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className={`text-sm font-bold py-0.5 px-3 rounded-full border-2 font-display ${
                isLive ? "bg-red-500 text-white border-red-700 animate-pulse" :
                tour.status === "completed" ? "bg-green-500 text-white border-green-700" :
                "bg-accent text-accent-foreground border-accent-foreground/10"
              }`}>
                {tour.status.toUpperCase()}
              </span>
              <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-0.5 rounded-full border border-primary/20">
                📅 {new Date(tour.date || tour._creationTime).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
              </span>
              <span className="text-sm font-medium text-muted-foreground">{places.length} stops</span>
            </div>
          </div>
        </div>

        {/* Action buttons — responsive row */}
        <div className="flex flex-wrap gap-2">
          <Dialog>
            <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap h-10 sm:h-12 px-3 sm:px-5 text-sm sm:text-base rounded-xl border-2 font-display font-black bg-card hover:bg-muted transition-all">
              <QrCode className="mr-1.5 w-4 h-4 sm:w-5 sm:h-5" /> QR
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-md mx-auto border-4 border-primary/20 rounded-[2rem] bg-card p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle className="text-2xl sm:text-3xl font-display font-black text-center text-primary">Join the Tour! 🍩</DialogTitle>
              </DialogHeader>
              <div 
                className="flex justify-center p-4 bg-white rounded-2xl border-2 border-muted mx-auto shadow-inner mt-2"
                style={{ colorScheme: "light" }}
              >
                <QRCode 
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/join/${tourId}`} 
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  style={{ colorScheme: "light" }}
                />
              </div>
              <p className="text-center text-sm font-medium text-muted-foreground mt-2">
                Scan this with your phone camera!
              </p>
              <div className="flex flex-col items-center gap-3 mt-4 border-t-2 border-border/50 pt-4">
                <Button
                  onClick={handleShare}
                  className="w-full flex items-center justify-center gap-2 h-11 px-4 text-sm font-display font-black rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[0_3px_0_hsl(190,80%,40%)] hover:translate-y-0.5 hover:shadow-[0_1px_0_hsl(190,80%,40%)] transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" /> LIEN COPIÉ ! 📋
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" /> PARTAGER LE LIEN
                    </>
                  )}
                </Button>
                <span className="text-[10px] text-muted-foreground break-all text-center max-w-[280px]">
                  {typeof window !== "undefined" ? `${window.location.origin}/join/${tourId}` : ""}
                </span>
              </div>
            </DialogContent>
          </Dialog>

          {isDraft && places.length > 0 && (
            <Button size="sm" onClick={() => startLiveMode({ tourId: tId })} className="h-10 sm:h-12 px-4 sm:px-6 text-sm sm:text-base rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_0_hsl(330,80%,40%)] hover:shadow-[0_2px_0_hsl(330,80%,40%)] hover:translate-y-0.5 transition-all font-display font-black">
              <Play className="mr-1.5 w-4 h-4" /> {tour.currentStepIndex > 0 ? "RESUME" : "START"}
            </Button>
          )}
          {tour.status === "completed" && (
            <Link href={`/recap/${tourId}`}>
              <Button size="sm" className="h-10 sm:h-12 px-4 sm:px-6 text-sm sm:text-base rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_0_hsl(330,80%,40%)] hover:shadow-[0_2px_0_hsl(330,80%,40%)] hover:translate-y-0.5 transition-all font-display font-black">
                VIEW RECAP 📸
              </Button>
            </Link>
          )}

          {/* Toggle Public on Marketplace */}
          <Button
            size="sm"
            onClick={async () => {
              try {
                await toggleTourPublic({ tourId: tId, isPublic: !tour.isPublic });
              } catch (error) {
                console.error("Error toggling public status:", error);
                alert("Erreur lors de la publication : " + (error as Error).message);
              }
            }}
            className={`h-10 sm:h-12 px-3.5 sm:px-5 text-sm sm:text-base rounded-xl border-2 font-display font-black hover:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5 ${
              tour.isPublic
                ? "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600 shadow-[0_3px_0_hsl(150,80%,25%)] hover:shadow-[0_1px_0_hsl(150,80%,25%)]"
                : "bg-card hover:bg-muted text-muted-foreground border-border shadow-[0_3px_0_hsl(0,0%,80%)] hover:shadow-[0_1px_0_hsl(0,0%,80%)] dark:shadow-[0_3px_0_hsl(0,0%,20%)] dark:hover:shadow-[0_1px_0_hsl(0,0%,20%)]"
            }`}
          >
            {tour.isPublic ? (
              <>
                <Globe className="w-4 h-4" /> PUBLIC (MARKETPLACE)
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" /> RENDRE PUBLIC
              </>
            )}
          </Button>
        </div>
      </div>

      {isLive ? (
        // ------------------ RUN DECK VIEW ------------------
        <div className="w-full max-w-xl mx-auto space-y-6 pb-24 animate-in fade-in duration-500">
          {/* Header Controls inside deck */}
          <div className="flex justify-between items-center bg-card p-4 rounded-2xl border-2 border-border shadow-md">
            <span className="text-lg font-display font-black text-primary">
              📍 RUN MODE
            </span>
            <Button 
              size="sm" 
              onClick={() => pauseTour({ tourId: tId })} 
              className="h-9 px-3 text-sm rounded-xl bg-amber-500 text-white hover:bg-amber-600 font-display font-black shadow-[0_3px_0_hsl(45,90%,35%)] hover:translate-y-0.5 transition-all cursor-pointer"
            >
              <Pause className="mr-1 w-3.5 h-3.5" /> PAUSE / DRAFT
            </Button>
          </div>

          {/* Progress dots & stop numbers */}
          {places.length > 0 && (
            <div className="flex flex-col gap-2 bg-card p-4 rounded-2xl border-2 border-border shadow-md">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Progression</span>
                <span className="text-sm font-display font-black text-foreground">
                  Stop {viewIndex + 1} / {places.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {places.map((p, idx) => (
                  <button
                    key={p._id}
                    onClick={() => setViewIndex(idx)}
                    className={`h-3 rounded-full transition-all duration-300 ${
                      idx === viewIndex 
                        ? "w-10 bg-primary shadow-sm" 
                        : idx === tour.currentStepIndex
                        ? "w-3 bg-secondary animate-pulse"
                        : idx < tour.currentStepIndex
                        ? "w-3 bg-green-500"
                        : "w-3 bg-muted hover:bg-muted-foreground/30"
                    }`}
                    title={`Aller au stop ${idx + 1}`}
                  />
                ))}
              </div>
              {viewIndex < places.length - 1 && travelTimes[places[viewIndex]._id] && (
                <div className="text-[11px] font-bold text-primary flex items-center gap-1 mt-1 pt-2 border-t border-border/40 select-none">
                  <span>🚶 prochain arrêt : {travelTimes[places[viewIndex]._id].replace('mins', 'min')}</span>
                </div>
              )}
            </div>
          )}

          {/* Cards Carousel Frame */}
          {places.length > 0 && (() => {
            const activePlace = places[viewIndex];
            if (!activePlace) return null;

            const isCurrentStep = tour.currentStepIndex === activePlace.order;
            const isPassed = tour.currentStepIndex > activePlace.order;
            const isUpcoming = tour.currentStepIndex < activePlace.order;

            const handleDragEnd = (event: any, info: any) => {
              const swipeThreshold = 50; // pixels
              if (info.offset.x < -swipeThreshold) {
                // Swiped left -> Go to next stop
                if (viewIndex < places.length - 1) {
                  setViewIndex(viewIndex + 1);
                }
              } else if (info.offset.x > swipeThreshold) {
                // Swiped right -> Go to previous stop
                if (viewIndex > 0) {
                  setViewIndex(viewIndex - 1);
                }
              }
            };

            return (
              <div className="relative overflow-visible min-h-[400px]">
                {/* Visual swipe arrows on sides (only on desktop/hover) */}
                <div className="absolute top-1/2 -left-12 -translate-y-1/2 hidden md:block">
                  <Button
                    size="icon"
                    variant="outline"
                    disabled={viewIndex === 0}
                    onClick={() => setViewIndex(viewIndex - 1)}
                    className="w-10 h-10 rounded-full bg-card shadow-md border-2 hover:bg-muted"
                  >
                    <ChevronLeft className="w-6 h-6 text-foreground" />
                  </Button>
                </div>
                <div className="absolute top-1/2 -right-12 -translate-y-1/2 hidden md:block">
                  <Button
                    size="icon"
                    variant="outline"
                    disabled={viewIndex === places.length - 1}
                    onClick={() => setViewIndex(viewIndex + 1)}
                    className="w-10 h-10 rounded-full bg-card shadow-md border-2 hover:bg-muted"
                  >
                    <ChevronRight className="w-6 h-6 text-foreground" />
                  </Button>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={viewIndex}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.6}
                    onDragEnd={handleDragEnd}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-card border-4 border-primary/20 rounded-[2.5rem] p-4 sm:p-6 shadow-2xl space-y-4 touch-none cursor-grab active:cursor-grabbing relative overflow-hidden"
                  >
                    {/* Top status bar of card */}
                    <div className="flex justify-between items-center pb-2 border-b-2 border-border/50">
                      <span className={`text-xs font-bold font-display px-3 py-1 rounded-full border-2 ${
                        isCurrentStep ? "bg-secondary text-secondary-foreground border-secondary animate-pulse" :
                        isPassed ? "bg-green-100 text-green-700 border-green-300" :
                        "bg-muted text-muted-foreground border-muted-foreground/20"
                      }`}>
                        {isCurrentStep ? "📍 EN COURS" :
                         isPassed ? "✅ TERMINÉ" :
                         "🔒 ARRÊT FUTUR"}
                      </span>
                      <span className="text-sm font-bold font-display text-muted-foreground bg-muted/30 px-3 py-1 rounded-full">
                        {activePlace.order + 1} / {places.length}
                      </span>
                    </div>

                    {/* Establishment Info */}
                    <div className="space-y-2 pt-2">
                      <h3 className="text-2xl sm:text-3xl font-display font-black text-foreground drop-shadow-sm leading-tight">
                        {activePlace.name}
                      </h3>
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <div className="flex flex-col gap-1 min-w-0">
                          <p className="text-muted-foreground text-sm flex items-center gap-1 truncate">
                            <MapPin className="text-primary w-4 h-4 flex-shrink-0" /> {activePlace.address}
                          </p>
                          {activePlace.openingHours && (
                            <p className="text-[11px] font-bold text-amber-600 flex items-center gap-1 pl-5">
                              🕒 {activePlace.openingHours}
                            </p>
                          )}
                        </div>
                        {activePlace.coordinates && (
                          <button 
                            className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-colors flex-shrink-0 cursor-pointer"
                            onClick={() => {
                              window.open(`https://www.google.com/maps/dir/?api=1&destination=${activePlace.coordinates?.lat},${activePlace.coordinates?.lng}`, '_blank');
                            }}
                            title="Itinéraire Maps"
                          >
                            <Navigation2 className="w-4 h-4 fill-primary" /> 
                          </button>
                        )}
                      </div>
                      {activePlace.adminComment && (
                        <div className="bg-primary/5 p-3 rounded-xl border border-primary/10 text-primary font-medium text-sm flex gap-2 items-start">
                          <span>💡</span>
                          <span className="italic">{activePlace.adminComment}</span>
                        </div>
                      )}
                    </div>

                    {/* Tasting Card & Live feedback (Locked for future stops) */}
                    <div className="pt-4 border-t-2 border-border/50">
                      {isUpcoming ? (
                        <div className="p-6 text-center bg-muted/30 rounded-2xl border-2 border-dashed border-border/60 text-muted-foreground animate-in fade-in duration-300">
                          <span className="text-4xl block mb-2">🔒</span>
                          <p className="font-display font-black text-sm">Arrêt non encore actif</p>
                          <p className="text-xs font-medium mt-1">Lisez et lancez cet arrêt pour que le groupe puisse y participer et donner son avis !</p>
                        </div>
                      ) : (
                        <TastingCard key={activePlace._id} placeId={activePlace._id} guestName={adminName} />
                      )}
                    </div>

                    {/* Main action button at bottom of active card */}
                    <div className="pt-4 border-t-2 border-border/50">
                      {isCurrentStep ? (
                        activePlace.order < places.length - 1 ? (
                          <Button 
                            onClick={async () => {
                              await nextStep({ tourId: tId });
                            }}
                            className="w-full h-12 text-base font-display font-black bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[0_3px_0_hsl(190,80%,40%)] hover:shadow-[0_1px_0_hsl(190,80%,40%)] hover:translate-y-0.5 transition-all rounded-xl flex items-center justify-center gap-2"
                          >
                            Arrêt suivant 🚀
                          </Button>
                        ) : (
                          <Button 
                            onClick={async () => {
                              await endLiveMode({ tourId: tId });
                            }}
                            className="w-full h-12 text-base font-display font-black bg-green-600 hover:bg-green-700 text-white shadow-[0_3px_0_hsl(140,80%,30%)] hover:shadow-[0_1px_0_hsl(140,80%,30%)] hover:translate-y-0.5 transition-all rounded-xl flex items-center justify-center gap-2"
                          >
                            Terminer le tour 🏆
                          </Button>
                        )
                      ) : isPassed ? (
                        <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-700 text-xs sm:text-sm font-semibold text-center rounded-xl">
                          ✅ Cet arrêt est terminé. Vos notes, commentaires et photos restent modifiables ci-dessus !
                        </div>
                      ) : (
                        <Button 
                          onClick={async () => {
                            // Activer cet arrêt directement en avançant l'index d'étape
                            await nextStep({ tourId: tId });
                          }}
                          className="w-full h-12 text-base font-display font-black bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_3px_0_hsl(330,80%,40%)] hover:shadow-[0_1px_0_hsl(330,80%,40%)] hover:translate-y-0.5 transition-all rounded-xl flex items-center justify-center gap-2"
                        >
                          Lancer l&apos;arrêt 🚀
                        </Button>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Left/Right swipe indicators for mobile */}
                <div className="flex justify-between items-center text-[10px] text-muted-foreground/60 px-4 pt-3 select-none">
                  <span>← Glisser pour reculer</span>
                  <span>Glisser pour avancer →</span>
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        // ------------------ DRAFT / COMPLETED VIEW ------------------
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column: Places List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl sm:text-2xl font-display font-black text-foreground flex items-center gap-2 mr-2">
                <MapPin className="text-primary w-5 h-5 sm:w-6 sm:h-6" /> Trajet
              </h3>
              {places.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => window.open(getFullItineraryUrl(), '_blank')}
                  className="h-8 px-3 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[0_2px_0_hsl(190,80%,40%)] hover:translate-y-0.5 transition-all text-xs font-display font-black flex items-center gap-1 cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" /> Itinéraire Complet
                </Button>
              )}
              {isDraft && places.length > 2 && (
                <Button 
                  size="sm" 
                  onClick={handleOptimize} 
                  disabled={isOptimizing} 
                  title="Optimiser le parcours" 
                  className="h-8 w-8 rounded-lg bg-amber-500 text-white hover:bg-amber-600 shadow-[0_2px_0_hsl(45,90%,35%)] hover:translate-y-0.5 transition-all flex items-center justify-center cursor-pointer"
                >
                  {isOptimizing ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </Button>
              )}
            </div>
            
            <div className="space-y-3">
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="places-list">
                  {(provided) => (
                    <div 
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      {places.map((place, index) => {
                        const isCurrentStep = isLive && tour.currentStepIndex === place.order;
                        const isPassed = tour.currentStepIndex > place.order || tour.status === "completed";
                        const isExpanded = expandedPlaceId === place._id || isCurrentStep;
                        
                        return (
                          <div key={place._id}>
                            <Draggable 
                              draggableId={place._id} 
                              index={index}
                              isDragDisabled={!isDraft}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  style={{ ...provided.draggableProps.style }}
                                >
                                  <Card 
                                    className={`border-2 rounded-xl sm:rounded-2xl overflow-hidden transition-all relative ${
                                      isCurrentStep ? "border-secondary bg-secondary/10 shadow-lg z-10" : 
                                      isPassed ? "border-muted bg-muted/20 opacity-70 cursor-pointer hover:opacity-100 hover:border-secondary/50" :
                                      "border-border bg-card cursor-pointer hover:border-secondary/50"
                                    } ${snapshot.isDragging ? "shadow-2xl ring-2 ring-primary z-50" : ""} ${isDraft ? "cursor-grab active:cursor-grabbing" : ""}`}
                                    {...(isDraft ? provided.dragHandleProps : {})}
                                    onClick={() => {
                                      if (!isDraft) {
                                        setExpandedPlaceId(expandedPlaceId === place._id ? null : place._id);
                                      }
                                    }}
                                  >
                                    <div className="flex p-3 sm:p-4 gap-3 items-start">
                                      <div className={`w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 flex items-center justify-center rounded-full border-2 font-display font-black text-base sm:text-lg ${
                                        isCurrentStep ? "bg-secondary text-secondary-foreground border-secondary" : 
                                        isPassed ? "bg-muted text-muted-foreground border-muted-foreground/30" : 
                                        "bg-background text-foreground border-border"
                                      }`}>
                                        {place.order + 1}
                                      </div>
                                      <div className="flex-grow min-w-0">
                                        <h4 className={`text-base sm:text-lg font-bold font-display truncate ${isPassed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                          {place.name}
                                        </h4>
                                        {place.adminComment && (
                                          <p className="text-primary font-medium text-sm mt-0.5 truncate">💡 {place.adminComment}</p>
                                        )}
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                                          <p className="text-muted-foreground text-sm flex items-center gap-1 truncate">
                                            <Navigation className="w-3 h-3 flex-shrink-0" /> {place.address}
                                          </p>
                                          {place.openingHours && (
                                            <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-0.5 select-none">
                                              🕒 {place.openingHours}
                                            </span>
                                          )}
                                        </div>
                                        {tour.status !== "completed" && place.coordinates && (
                                          <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="mt-2 rounded-lg border text-xs h-7 font-bold flex items-center gap-1 cursor-pointer"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              window.open(`https://www.google.com/maps/dir/?api=1&destination=${place.coordinates?.lat},${place.coordinates?.lng}`, '_blank');
                                            }}
                                          >
                                            <Navigation className="w-3 h-3" /> Itinéraire
                                          </Button>
                                        )}
                                      </div>
                                      {isPassed && <CheckCircle className="w-5 h-5 text-green-500 absolute top-3 right-3 flex-shrink-0" />}
                                      {isDraft && (
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); deletePlace({ placeId: place._id }); }}
                                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center transition-all"
                                          title="Supprimer ce stop"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                    {isExpanded && (
                                      <div 
                                        className="px-3 pb-3 sm:px-4 sm:pb-4 border-t-2 border-secondary/20 pt-4 bg-secondary/5"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <TastingCard key={place._id} placeId={place._id} guestName={adminName} />
                                      </div>
                                    )}
                                  </Card>
                                </div>
                              )}
                            </Draggable>

                            {/* Walking transit connector and Inline insertion divider */}
                            {index < places.length - 1 && (
                              <div className="relative my-2 pl-14 min-h-[32px] flex items-center select-none animate-in fade-in duration-300 animate-out fade-out">
                                {/* Vertical dashed line aligned with numbers */}
                                <div className="absolute left-[30px] sm:left-[36px] top-0 bottom-0 w-0.5 border-l-2 border-dashed border-border/80"></div>
                                
                                {/* Centered timeline circle button for inserting stop */}
                                {isDraft && (
                                  <button
                                    onClick={() => {
                                      setInsertIndex(index + 1);
                                      setIsAddModalOpen(true);
                                    }}
                                    className="absolute left-[16px] sm:left-[22px] top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-secondary hover:bg-primary text-secondary-foreground hover:text-primary-foreground border-2 border-background shadow-md hover:-translate-y-1 hover:scale-105 transition-all flex items-center justify-center cursor-pointer"
                                    title="Insérer un arrêt ici"
                                  >
                                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                                  </button>
                                )}

                                {/* Walking distance tag next to the timeline */}
                                {travelTimes[place._id] && (
                                  <span className="ml-2 flex items-center gap-1 bg-muted/70 px-2.5 py-0.5 rounded-full border border-border/60 text-[10px] font-bold text-muted-foreground shadow-sm">
                                    🚶 {travelTimes[place._id]} de marche
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              {places.length === 0 && (
                <div className="text-center py-8 bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
                  <p className="text-base text-muted-foreground font-medium">Your tour is empty!</p>
                  <p className="text-sm text-muted-foreground mt-1">Add your first tasty stop below 👇</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Add Place Form */}
          <div className="space-y-4">
            <h3 className="text-xl sm:text-2xl font-display font-black text-foreground flex items-center gap-2">
              <PlusCircle className="text-secondary w-5 h-5 sm:w-6 sm:h-6" /> Add Stop
            </h3>
            
            <Card className="border-2 border-border rounded-xl sm:rounded-2xl bg-card overflow-hidden">
              <CardContent className="p-4 sm:p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold font-display">Restaurant Name</label>
                  <Input 
                    placeholder="e.g. Joe's Pizza" 
                    className="h-10 text-sm rounded-lg border-2"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    disabled={tour.status === "completed"}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold font-display">Pin the Location</label>
                  {tour.status !== "completed" ? (
                    <MapPicker 
                      key={mapPickerKey}
                      tourDate={tour.date || undefined}
                      onLocationSelect={(nameFromMap, addr, lat, lng, openingHours, googlePlaceId) => {
                        setNewName(nameFromMap);
                        setNewAddress(addr);
                        setNewCoordinate({ lat, lng });
                        setNewOpeningHours(openingHours || "");
                        setNewGooglePlaceId(googlePlaceId || "");
                      }} 
                    />
                  ) : (
                    <div className="h-[150px] w-full bg-muted rounded-lg flex items-center justify-center font-medium opacity-50 border text-sm">
                      Tour is completed
                    </div>
                  )}
                  {newAddress && (
                    <div className="space-y-3">
                      <div className="p-2.5 bg-primary/10 rounded-lg border border-primary/20 flex gap-2 items-center">
                        <MapPin className="text-primary flex-shrink-0 w-4 h-4" />
                        <span className="text-xs font-medium truncate">{newAddress}</span>
                      </div>
                      {newOpeningHours && (
                        <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 flex gap-2 items-center">
                          <span className="text-xs font-bold text-amber-600">🕒 {newOpeningHours}</span>
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold font-display">Plat recommandé (Optionnel)</label>
                        <Input 
                          placeholder="Ex: Prenez le menu signature !" 
                          className="h-10 text-sm rounded-lg border-2"
                          value={newAdminComment}
                          onChange={(e) => setNewAdminComment(e.target.value)}
                          disabled={tour.status === "completed"}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <Button 
                  onClick={handleAddPlace} 
                  className="w-full h-10 text-base rounded-lg font-display font-black bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_3px_0_hsl(330,80%,40%)] hover:shadow-[0_1px_0_hsl(330,80%,40%)] hover:translate-y-0.5 transition-all cursor-pointer"
                  disabled={tour.status === "completed" || !newName.trim() || !newAddress.trim()}
                >
                  ADD TO TOUR
                </Button>
                {tour.status === "completed" && <p className="text-center text-xs text-muted-foreground font-medium">Tour is completed.</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Dialog for inline stop insertion */}
      <Dialog open={isAddModalOpen} onOpenChange={(open) => {
        setIsAddModalOpen(open);
        if (!open) {
          setInsertIndex(null);
          setNewName("");
          setNewAddress("");
          setNewAdminComment("");
          setNewCoordinate(undefined);
          setNewOpeningHours("");
          setNewGooglePlaceId("");
        }
      }}>
        <DialogContent className="w-[95vw] sm:max-w-md mx-auto border-4 border-primary/20 rounded-[2rem] bg-card p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-display font-black text-center text-primary">
              Insérer un arrêt à la position {insertIndex || 1} 📍
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-bold font-display">Nom du restaurant</label>
              <Input 
                placeholder="Ex: Joe's Pizza" 
                className="h-10 text-sm rounded-lg border-2"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-bold font-display">Localiser l&apos;adresse</label>
              {isLoaded ? (
                <MapPicker 
                  key={`inline-picker-${insertIndex}`}
                  tourDate={tour.date || undefined}
                  onLocationSelect={(nameFromMap, addr, lat, lng, openingHours, googlePlaceId) => {
                    setNewName(nameFromMap);
                    setNewAddress(addr);
                    setNewCoordinate({ lat, lng });
                    setNewOpeningHours(openingHours || "");
                    setNewGooglePlaceId(googlePlaceId || "");
                  }} 
                />
              ) : (
                <div className="h-[150px] w-full bg-muted rounded-lg flex items-center justify-center font-medium opacity-50 border text-sm">
                  Loading Map...
                </div>
              )}
              {newAddress && (
                <div className="space-y-3">
                  <div className="p-2.5 bg-primary/10 rounded-lg border border-primary/20 flex gap-2 items-center">
                    <MapPin className="text-primary flex-shrink-0 w-4 h-4" />
                    <span className="text-xs font-medium truncate">{newAddress}</span>
                  </div>
                  {newOpeningHours && (
                    <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 flex gap-2 items-center">
                      <span className="text-xs font-bold text-amber-600 font-display">🕒 {newOpeningHours}</span>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold font-display">Plat recommandé (Optionnel)</label>
                    <Input 
                      placeholder="Ex: Prenez le menu signature !" 
                      className="h-10 text-sm rounded-lg border-2"
                      value={newAdminComment}
                      onChange={(e) => setNewAdminComment(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-grow rounded-xl h-11 border-2 font-display font-black cursor-pointer text-foreground"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setInsertIndex(null);
                }}
              >
                ANNULER
              </Button>
              <Button 
                onClick={handleAddPlace} 
                className="flex-grow h-11 rounded-xl font-display font-black bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_3px_0_hsl(330,80%,40%)] hover:shadow-[0_1px_0_hsl(330,80%,40%)] hover:translate-y-0.5 transition-all cursor-pointer"
                disabled={!newName.trim() || !newAddress.trim()}
              >
                INSÉRER STOP
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
