"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { Camera, ImagePlus, ChevronLeft, ChevronRight } from "lucide-react";
import TastingCard from "@/components/TastingCard";
import { motion, AnimatePresence } from "framer-motion";
import { useLoadScript } from "@react-google-maps/api";

const libraries: "places"[] = ["places"];

export default function GuestApp({ tourId }: { tourId: string }) {
  const tId = tourId as Id<"tours">;
  const tour = useQuery(api.places.getTourInfo, { tourId: tId });
  const places = useQuery(api.places.getPlacesByTour, { tourId: tId });
  
  const [name, setName] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const [expandedPlaceId, setExpandedPlaceId] = useState<string | null>(null);
  const [viewIndex, setViewIndex] = useState<number>(0);
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

  // Sync viewIndex with the tour's current step when it changes
  useEffect(() => {
    if (tour !== undefined && tour !== null) {
      setViewIndex(tour.currentStepIndex);
    }
  }, [tour?.currentStepIndex]);

  useEffect(() => {
    const savedName = localStorage.getItem(`vitour_${tId}_name`);
    if (savedName) {
      setTimeout(() => {
        setName(savedName);
        setHasJoined(true);
      }, 0);
    }
  }, [tId]);

  const joinTour = () => {
    if (!name.trim()) return;
    localStorage.setItem(`vitour_${tId}_name`, name);
    setHasJoined(true);
  };

  if (tour === undefined || places === undefined) {
    return <div className="animate-pulse text-center mt-20 text-xl font-display font-bold text-white">Loading... 🍩</div>;
  }
  if (tour === null) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="text-6xl">🔍</div>
      <h2 className="text-2xl font-display font-black text-white drop-shadow-md">Tour not found!</h2>
      <p className="text-base text-white/70 font-medium">This tour may have been deleted.</p>
      <Link href="/">
        <Button className="h-12 px-6 text-lg font-display font-black bg-white text-[hsl(330,80%,50%)] rounded-2xl hover:bg-white/90 shadow-[0_4px_0_hsl(330,80%,40%)] hover:translate-y-1 transition-all">
          Go to Homepage 🏠
        </Button>
      </Link>
    </div>
  );

  // Onboarding Screen — Pink design matching landing page
  if (!hasJoined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[85vh] text-center animate-in fade-in zoom-in duration-500">
        {/* Donut logo spinning */}
        <div className="mb-6">
          <Image 
            src="/donut.png" 
            alt="Vitour Donut" 
            width={140} 
            height={140} 
            className="drop-shadow-2xl animate-spin-slow" 
            style={{ animationDuration: "8s" }}
          />
        </div>

        {/* Card container */}
        <div className="w-full bg-white/15 backdrop-blur-sm rounded-[2rem] p-5 shadow-2xl border-2 border-white/20 space-y-5">
          <div>
            <h1 className="text-3xl sm:text-4xl font-display font-black text-white drop-shadow-md leading-tight">
              Join<br/>{tour.name}
            </h1>
            <p className="text-base sm:text-lg text-white/80 mt-2 font-medium italic font-display">ça vaut le détour</p>
          </div>
          
          <Input 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Ton prénom 🌮" 
            className="h-14 text-xl text-center rounded-2xl border-2 border-white/30 bg-white/90 font-display font-black placeholder:text-gray-400 placeholder:font-normal text-gray-800"
          />
          <Button 
            onClick={joinTour}
            disabled={!name.trim()}
            className="w-full h-14 text-xl font-display font-black bg-[hsl(190,80%,50%)] text-white rounded-2xl hover:bg-[hsl(190,80%,45%)] shadow-[0_6px_0_hsl(190,80%,35%)] hover:shadow-[0_2px_0_hsl(190,80%,35%)] hover:translate-y-1 transition-all"
          >
            LET&apos;S EAT! 🍽️
          </Button>
        </div>
      </div>
    );
  }

  // Waiting Screen
  if (tour.status === "draft") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-6">
        <div className="text-7xl">⏰</div>
        <h2 className="text-3xl font-display font-black text-white drop-shadow-md">Hold tight, {name}!</h2>
        <p className="text-lg text-white/80 font-medium bg-white/10 backdrop-blur-sm p-5 rounded-2xl border-2 border-white/20 font-display">
          The tour hasn&apos;t started yet.<br/>Waiting for the organizer…
        </p>
      </div>
    );
  }


  const currentPlace = places.find(p => p.order === tour.currentStepIndex);

  // Live Screen
  if (tour.status === "live" && currentPlace) {
    const displayPlace = places[viewIndex] || currentPlace;
    
    const isCurrentStep = tour.currentStepIndex === displayPlace.order;
    const isPassed = tour.currentStepIndex > displayPlace.order;
    const isUpcoming = tour.currentStepIndex < displayPlace.order;

    const handleDragEnd = (event: any, info: any) => {
      const swipeThreshold = 130; // pixels
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

    const previousPlace = places.find(p => p.order === displayPlace.order - 1);
    const travelTimeToActive = previousPlace ? travelTimes[previousPlace._id] : null;

    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        {/* Status bar */}
        <div className="flex justify-end items-center select-none">
          <div className="font-display font-bold bg-white/15 backdrop-blur-sm border border-white/25 text-white px-4 py-1.5 rounded-full text-sm shadow-md">{name}</div>
        </div>

        {/* Progress dots & stop numbers */}
        {places.length > 0 && (
          <div className="flex flex-col gap-2 bg-white/15 backdrop-blur-sm p-4 rounded-2xl border-2 border-white/20 shadow-lg select-none">
            <div className="flex justify-between items-center text-white">
              <span className="text-xs font-bold uppercase tracking-wider text-white/70">Progression</span>
              <span className="text-sm font-display font-black">
                Arrêt {viewIndex + 1} / {places.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {places.map((p, idx) => (
                <button
                  key={p._id}
                  onClick={() => setViewIndex(idx)}
                  className={`h-3 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === viewIndex 
                      ? "w-10 bg-[hsl(190,80%,50%)] shadow-sm" 
                      : idx === tour.currentStepIndex
                      ? "w-3 bg-white animate-pulse"
                      : idx < tour.currentStepIndex
                      ? "w-3 bg-emerald-400"
                      : "w-3 bg-white/20 hover:bg-white/40"
                  }`}
                  title={`Aller à l'arrêt ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Cards Carousel Frame */}
        <div className="relative overflow-visible min-h-[400px]">
          {/* Visual swipe arrows on sides (only on desktop/hover) */}
          <div className="absolute top-1/2 -left-12 -translate-y-1/2 hidden md:block">
            <Button
              size="icon"
              variant="outline"
              disabled={viewIndex === 0}
              onClick={() => setViewIndex(viewIndex - 1)}
              className="w-10 h-10 rounded-full bg-white/15 border-2 border-white/20 text-white shadow-md hover:bg-white/25 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </div>
          <div className="absolute top-1/2 -right-12 -translate-y-1/2 hidden md:block">
            <Button
              size="icon"
              variant="outline"
              disabled={viewIndex === places.length - 1}
              onClick={() => setViewIndex(viewIndex + 1)}
              className="w-10 h-10 rounded-full bg-white/15 border-2 border-white/20 text-white shadow-md hover:bg-white/25 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
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
              className="bg-white/15 backdrop-blur-sm border-2 border-white/20 rounded-[2.2rem] p-5 sm:p-6 shadow-2xl space-y-4 touch-none cursor-grab active:cursor-grabbing text-white relative overflow-hidden"
            >
              {/* Top status bar of card */}
              <div className="flex justify-between items-center pb-2 border-b-2 border-white/10 select-none">
                <span className={`text-[10px] sm:text-xs font-bold font-display px-3 py-1 rounded-full border-2 ${
                  isCurrentStep ? "bg-white text-[hsl(330,80%,50%)] border-white animate-pulse" :
                  isPassed ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" :
                  "bg-white/10 text-white/50 border-white/10"
                }`}>
                  {isCurrentStep ? "📍 EN COURS" :
                   isPassed ? "✅ TERMINÉ" :
                   "🔒 ARRÊT FUTUR"}
                </span>
                <span className="text-xs sm:text-sm font-bold font-display text-white/60 bg-white/10 px-3 py-1 rounded-full">
                  {displayPlace.order + 1} / {places.length}
                </span>
              </div>

              {/* Establishment Info */}
              <div className="space-y-2 pt-2 text-center">
                <h2 className="text-2xl sm:text-3xl font-display font-black text-white drop-shadow-md leading-tight">
                  {isUpcoming ? "Arrêt Mystère 🤫" : displayPlace.name}
                </h2>
                {isUpcoming ? (
                  travelTimeToActive && (
                    <p className="text-sm font-bold text-white/80 flex items-center justify-center gap-1 select-none pt-0.5">
                      <span>🚶 {travelTimeToActive.replace('mins', 'min')}</span>
                    </p>
                  )
                ) : (
                  <p className="text-sm sm:text-base text-white/70 font-medium">
                    {displayPlace.address}
                  </p>
                )}
                {displayPlace.adminComment && !isUpcoming && (
                  <div className="inline-block mt-2 bg-white/15 border border-white/20 text-white px-3 py-1.5 rounded-xl text-sm text-left">
                    <span className="font-bold">💡</span> <span className="font-medium">{displayPlace.adminComment}</span>
                  </div>
                )}
              </div>

              {/* Tasting Card (Locked for future stops) */}
              <div className="pt-4 border-t-2 border-white/10">
                {isUpcoming ? (
                  <div className="p-6 text-center bg-white/5 rounded-2xl border-2 border-dashed border-white/25 text-white/80 animate-in fade-in duration-300">
                    <span className="text-4xl block mb-2">🔒</span>
                    <p className="font-display font-black text-sm">Arrêt non encore actif</p>
                    <p className="text-xs font-medium mt-1">
                      Attendez que l&apos;organisateur lance cet arrêt pour pouvoir y participer et donner votre avis !
                    </p>
                  </div>
                ) : (
                  <TastingCard key={displayPlace._id} placeId={displayPlace._id} guestName={name} isGuestView={true} />
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Left/Right swipe indicators for mobile */}
          <div className="flex justify-between items-center text-[10px] text-white/50 px-4 pt-3 select-none">
            <span>← Glisser pour reculer</span>
            <span>Glisser pour avancer →</span>
          </div>
        </div>
      </div>
    );
  }

  // Completed Screen
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-6">
      <div className="text-7xl">🏆</div>
      <h2 className="text-3xl font-display font-black text-white drop-shadow-md">Tour Completed!</h2>
      <p className="text-lg text-white/80 font-medium bg-white/10 backdrop-blur-sm p-5 rounded-2xl border-2 border-white/20">
        You made it to the end.<br/>Hope you enjoyed the food!
      </p>
      <Link href={`/recap/${tourId}`} className="w-full">
        <Button className="w-full h-14 text-xl font-display font-black bg-white text-[hsl(330,80%,50%)] rounded-2xl hover:bg-white/90 shadow-[0_6px_0_hsl(330,80%,40%)] hover:translate-y-1 transition-all">
          VIEW RECAP 📸
        </Button>
      </Link>
    </div>
  );
}
