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
import { Camera, ImagePlus } from "lucide-react";
import TastingCard from "@/components/TastingCard";

export default function GuestApp({ tourId }: { tourId: string }) {
  const tId = tourId as Id<"tours">;
  const tour = useQuery(api.places.getTourInfo, { tourId: tId });
  const places = useQuery(api.places.getPlacesByTour, { tourId: tId });
  
  const [name, setName] = useState("");
  const [hasJoined, setHasJoined] = useState(false);

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
    return (
      <div key={currentPlace._id} className="space-y-4 animate-in slide-in-from-right-8 duration-500">
        {/* Status bar */}
        <div className="flex justify-between items-center bg-white/15 backdrop-blur-sm text-white p-3 rounded-2xl border-2 border-white/20 shadow-lg">
          <div className="font-display font-black text-sm">📍 STOP {currentPlace.order + 1}/{places.length}</div>
          <div className="font-display font-bold bg-white/20 px-3 py-1 rounded-full text-sm">{name}</div>
        </div>

        {/* Current place */}
        <div className="text-center space-y-1 mt-2">
          <h2 className="text-2xl sm:text-3xl font-display font-black text-white drop-shadow-md leading-tight">{currentPlace.name}</h2>
          <p className="text-sm sm:text-base text-white/70 font-medium">{currentPlace.address}</p>
          {currentPlace.adminComment && (
            <div className="inline-block mt-2 bg-white/15 border border-white/20 text-white px-3 py-1.5 rounded-xl text-sm">
              <span className="font-bold">💡</span> <span className="font-medium">{currentPlace.adminComment}</span>
            </div>
          )}
        </div>

        {/* Tasting card */}
        <TastingCard key={currentPlace._id} placeId={currentPlace._id} guestName={name} />

        {/* Mystery next stop */}
        {tour.currentStepIndex < places.length - 1 && (
          <div className="mt-6 text-center p-4 bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-dashed border-white/20 relative overflow-hidden">
            <div className="text-4xl mb-2">🤫</div>
            <h3 className="text-lg font-display font-black text-white">Prochaine adresse...</h3>
            <p className="text-sm font-bold bg-white/20 text-white px-3 py-0.5 rounded-full inline-block mt-1 transform -rotate-2">Mystère !</p>
          </div>
        )}
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
