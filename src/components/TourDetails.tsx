"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import QRCode from "react-qr-code";
import { MapPin, PlusCircle, CheckCircle, Navigation, Play, FastForward, QrCode, Flag, Sparkles, Loader2, GripVertical, Pause, X } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useUser } from "@clerk/nextjs";
import TastingCard from "@/components/TastingCard";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

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

  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newAdminComment, setNewAdminComment] = useState("");
  const [newCoordinate, setNewCoordinate] = useState<{lat: number, lng: number} | undefined>();
  const [mapPickerKey, setMapPickerKey] = useState(0);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      await optimizeRoute({ tourId: tId });
    } finally {
      setIsOptimizing(false);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!places) return;
    if (!result.destination || result.source.index === result.destination.index) return;
    
    const items = Array.from(places);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Create optimistic updates right away to avoid visual lag before server response (optional but good)
    const updates = items.map((item, index) => ({ _id: item._id, order: index }));
    await reorderPlacesMutation({ tourId: tId, updates });
  };

  const handleAddPlace = async () => {
    if (!newName.trim() || !newAddress.trim()) return;
    await addPlace({
      tourId: tId,
      name: newName,
      address: newAddress,
      coordinates: newCoordinate,
      adminComment: newAdminComment.trim() || undefined
    });
    setNewName("");
    setNewAddress("");
    setNewAdminComment("");
    setNewCoordinate(undefined);
    setMapPickerKey(k => k + 1);
  };

  if (tour === undefined || places === undefined) {
    return <div className="text-2xl font-display font-black animate-pulse text-muted-foreground mt-12 text-center">Loading tour details... 🍔</div>;
  }

  if (tour === null) {
    return <div className="text-2xl font-display font-bold text-destructive text-center">Tour not found!</div>;
  }

  const isDraft = tour.status === "draft";
  const isLive = tour.status === "live";

  return (
    <div className="space-y-8">
      {/* Tour Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-primary/5 p-8 border-4 border-primary/20 rounded-[2rem] shadow-lg">
        <div>
          <h2 className="text-5xl font-display font-black text-foreground drop-shadow-sm">{tour.name}</h2>
          <div className="flex items-center gap-4 mt-4">
            <span className={`text-lg font-bold py-1 px-5 rounded-full border-2 font-display ${
              isLive ? "bg-red-500 text-white border-red-700 animate-pulse" :
              tour.status === "completed" ? "bg-green-500 text-white border-green-700" :
              "bg-accent text-accent-foreground border-accent-foreground/10"
            }`}>
              {tour.status.toUpperCase()}
            </span>
            <span className="text-xl font-medium text-muted-foreground">{places.length} stops</span>
          </div>
        </div>

        {/* Action Buttons based on status */}
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <Dialog>
            <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap h-16 px-6 text-xl rounded-2xl border-4 font-display font-black bg-card hover:bg-muted transition-all">
              <QrCode className="mr-2 w-6 h-6" /> INVITE (QR)
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-md mx-auto border-4 border-primary/20 rounded-[2rem] bg-card p-6 sm:p-8">
              <DialogHeader>
                <DialogTitle className="text-4xl font-display font-black text-center text-primary drop-shadow-sm">Join the Tour! 🍩</DialogTitle>
              </DialogHeader>
              <div className="flex justify-center p-6 bg-white rounded-3xl border-4 border-muted mx-auto shadow-inner mt-4">
                <QRCode value={`${typeof window !== "undefined" ? window.location.origin : ""}/join/${tourId}`} size={250} />
              </div>
              <p className="text-center text-lg font-medium text-muted-foreground mt-4">
                Scan this with your phone camera to start the tasting!
              </p>
            </DialogContent>
          </Dialog>

          {isDraft && places.length > 0 && (
            <Button size="lg" onClick={() => startLiveMode({ tourId: tId })} className="h-16 px-8 text-xl rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_6px_0_hsl(330,80%,40%)] hover:shadow-[0_2px_0_hsl(330,80%,40%)] hover:translate-y-1 transition-all font-display font-black">
              <Play className="mr-2 w-6 h-6" /> START LIVE
            </Button>
          )}
          {isLive && (
            <>
              <Button size="lg" onClick={() => pauseTour({ tourId: tId })} className="h-16 px-6 text-xl rounded-2xl bg-amber-500 text-white hover:bg-amber-600 shadow-[0_6px_0_hsl(45,90%,35%)] hover:shadow-[0_2px_0_hsl(45,90%,35%)] hover:translate-y-1 transition-all font-display font-black">
                <Pause className="mr-2 w-6 h-6" /> PAUSE
              </Button>
              {tour.currentStepIndex < places.length - 1 ? (
                <Button size="lg" onClick={() => nextStep({ tourId: tId })} className="h-16 px-8 text-xl rounded-2xl bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[0_6px_0_hsl(190,80%,40%)] hover:shadow-[0_2px_0_hsl(190,80%,40%)] hover:translate-y-1 transition-all font-display font-black">
                  <FastForward className="mr-2 w-6 h-6" /> NEXT STOP
                </Button>
              ) : (
                <Button size="lg" onClick={() => endLiveMode({ tourId: tId })} className="h-16 px-8 text-xl rounded-2xl bg-green-500 text-white hover:bg-green-600 shadow-[0_6px_0_hsl(140,80%,40%)] hover:shadow-[0_2px_0_hsl(140,80%,40%)] hover:translate-y-1 transition-all font-display font-black">
                  <Flag className="mr-2 w-6 h-6" /> END TOUR
                </Button>
              )}
            </>
          )}
          {tour.status === "completed" && (
            <Link href={`/recap/${tourId}`}>
              <Button size="lg" className="h-16 px-8 text-xl rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_6px_0_hsl(330,80%,40%)] hover:shadow-[0_2px_0_hsl(330,80%,40%)] hover:translate-y-1 transition-all font-display font-black w-full md:w-auto">
                VIEW RECAP 📸
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Places List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
            <h3 className="text-3xl font-display font-black text-foreground flex items-center gap-2">
              <MapPin className="text-primary w-8 h-8" /> Route
            </h3>
            {isDraft && places.length > 2 && (
              <Button 
                size="sm" 
                onClick={handleOptimize} 
                disabled={isOptimizing} 
                title="Optimiser le parcours" 
                className="h-10 w-10 rounded-xl bg-amber-500 text-white hover:bg-amber-600 shadow-[0_3px_0_hsl(45,90%,35%)] hover:shadow-[0_1px_0_hsl(45,90%,35%)] hover:translate-y-0.5 transition-all flex items-center justify-center"
              >
                {isOptimizing ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
              </Button>
            )}
          </div>
          
          <div className="space-y-4">
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="places-list">
                {(provided) => (
                  <div 
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-4"
                  >
                    {places.map((place, index) => {
                      const isCurrentStep = isLive && tour.currentStepIndex === place.order;
                      const isPassed = tour.currentStepIndex > place.order || tour.status === "completed";
                      
                      return (
                        <Draggable 
                          key={place._id} 
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
                              <Card className={`border-4 rounded-[1.5rem] overflow-hidden transition-all relative ${
                                isCurrentStep ? "border-secondary bg-secondary/10 shadow-lg scale-[1.02] z-10" : 
                                isPassed ? "border-muted bg-muted/20 opacity-70" :
                                "border-border bg-card"
                              } ${snapshot.isDragging ? "shadow-2xl ring-4 ring-primary scale-105 z-50" : ""} ${isDraft ? "cursor-grab active:cursor-grabbing" : ""}`}
                                {...(isDraft ? provided.dragHandleProps : {})}
                              >
                                <div className="flex p-4 md:p-6 gap-4 md:gap-6 items-start">
                                  <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full border-4 font-display font-black text-xl ${
                                    isCurrentStep ? "bg-secondary text-secondary-foreground border-secondary" : 
                                    isPassed ? "bg-muted text-muted-foreground border-muted-foreground/30" : 
                                    "bg-background text-foreground border-border"
                                  }`}>
                                    {place.order + 1}
                                  </div>
                                  <div className="flex-grow">
                                    <h4 className={`text-2xl font-bold font-display ${isPassed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                      {place.name}
                                    </h4>
                                    {place.adminComment && (
                                      <p className="text-primary font-medium mt-1">💡 {place.adminComment}</p>
                                    )}
                                    <p className="text-muted-foreground text-lg flex items-center gap-1 mt-1">
                                      <Navigation className="w-4 h-4" /> {place.address}
                                    </p>
                                    {tour.status !== "completed" && place.coordinates && (
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="mt-3 rounded-xl border-2 font-bold flex items-center gap-1"
                                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${place.coordinates?.lat},${place.coordinates?.lng}`, '_blank')}
                                      >
                                        <Navigation className="w-4 h-4" /> Itinéraire
                                      </Button>
                                    )}
                                    
                                    {isCurrentStep && (
                                      <div className="mt-8 border-t-4 border-secondary/20 pt-6 space-y-8">
                                        <TastingCard placeId={place._id} guestName={adminName} />
                                      </div>
                                    )}
                                  </div>
                                  {isPassed && <CheckCircle className="w-8 h-8 text-green-500 absolute top-4 right-4" />}
                                  {isDraft && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); deletePlace({ placeId: place._id }); }}
                                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center transition-all"
                                      title="Supprimer ce stop"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {places.length === 0 && (
              <div className="text-center py-12 bg-muted/20 rounded-[2rem] border-4 border-dashed border-muted">
                <p className="text-xl text-muted-foreground font-medium">Your tour is empty!</p>
                <p className="text-muted-foreground mt-2">Add your first tasty stop on the right 👉</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Add Place Form */}
        <div className="space-y-6">
          <h3 className="text-3xl font-display font-black text-foreground flex items-center gap-2">
            <PlusCircle className="text-secondary w-8 h-8" /> Add Stop
          </h3>
          
          <Card className="border-4 border-border rounded-[1.5rem] bg-card overflow-hidden">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-lg font-bold font-display">Restaurant Name</label>
                <Input 
                  placeholder="e.g. Joe's Pizza" 
                  className="h-14 text-lg rounded-xl border-2"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  disabled={tour.status === "completed"}
                />
              </div>
              <div className="space-y-4">
                <label className="text-lg font-bold font-display">Pin the Location</label>
                {tour.status !== "completed" ? (
                  <MapPicker 
                    key={mapPickerKey}
                    onLocationSelect={(nameFromMap, addr, lat, lng) => {
                      setNewName(nameFromMap);
                      setNewAddress(addr);
                      setNewCoordinate({ lat, lng });
                    }} 
                  />
                ) : (
                  <div className="h-[200px] w-full bg-muted rounded-xl flex items-center justify-center font-medium opacity-50 border-2">
                    Tour is completed
                  </div>
                )}
                {newAddress && (
                  <div className="space-y-4">
                    <div className="p-3 bg-primary/10 rounded-xl border-2 border-primary/20 flex gap-2 items-center">
                      <MapPin className="text-primary flex-shrink-0" />
                      <span className="text-sm font-medium">{newAddress}</span>
                    </div>
                    <div className="space-y-2">
                      <label className="text-lg font-bold font-display">Plat recommandé (Optionnel)</label>
                      <Input 
                        placeholder="Ex: Prenez le menu signature !" 
                        className="h-14 text-lg rounded-xl border-2"
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
                className="w-full h-14 text-xl rounded-xl font-display font-black bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_0_hsl(330,80%,40%)] hover:shadow-[0_2px_0_hsl(330,80%,40%)] hover:translate-y-1 transition-all"
                disabled={tour.status === "completed" || !newName.trim() || !newAddress.trim()}
              >
                ADD TO TOUR
              </Button>
              {tour.status === "completed" && <p className="text-center text-sm text-muted-foreground font-medium">Tour is completed. Cannot add more places.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
