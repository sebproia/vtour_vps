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

const EMOJIS = ["🌮", "🍕", "🍔", "🍣", "🔥", "🤯", "🤤", "🤢", "🤩"];
const SCORES = Array.from({ length: 10 }, (_, i) => i + 1);

export default function GuestApp({ tourId }: { tourId: string }) {
  const tId = tourId as Id<"tours">;
  const tour = useQuery(api.places.getTourInfo, { tourId: tId });
  const places = useQuery(api.places.getPlacesByTour, { tourId: tId });
  
  const [name, setName] = useState("");
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem(`vitour_${tId}_name`);
    if (savedName) {
      setName(savedName);
      setHasJoined(true);
    }
  }, [tId]);

  const joinTour = () => {
    if (!name.trim()) return;
    localStorage.setItem(`vitour_${tId}_name`, name);
    setHasJoined(true);
  };

  if (tour === undefined || places === undefined) {
    return <div className="animate-pulse text-center mt-20 text-xl font-display font-bold">Loading... 🍩</div>;
  }
  if (tour === null) return <div className="text-center mt-20 text-xl font-display text-destructive">Tour not found!</div>;

  // Onboarding Screen
  if (!hasJoined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8 text-center animate-in fade-in zoom-in duration-500">
        <Image 
          src="/logo.png" 
          alt="Vitour Logo" 
          width={150} 
          height={150} 
          className="drop-shadow-2xl animate-bounce mix-blend-multiply contrast-125" 
        />
        <div>
          <h1 className="text-5xl font-display font-black text-primary drop-shadow-sm leading-tight">Join<br/>{tour.name}</h1>
          <p className="text-xl text-muted-foreground mt-4 font-medium">What's your name, hungry traveler?</p>
        </div>
        
        <div className="w-full space-y-4 bg-card p-6 rounded-[2rem] border-4 border-primary/20 shadow-xl">
          <Input 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="e.g. Vito 🌮" 
            className="h-16 text-2xl text-center rounded-2xl border-2 font-display font-black"
          />
          <Button 
            onClick={joinTour}
            disabled={!name.trim()}
            className="w-full h-16 text-2xl font-display font-black bg-secondary text-secondary-foreground rounded-2xl hover:bg-secondary/90 shadow-[0_6px_0_hsl(190,80%,40%)] hover:shadow-[0_2px_0_hsl(190,80%,40%)] hover:translate-y-1 transition-all"
          >
            LET'S EAT!
          </Button>
        </div>
      </div>
    );
  }

  // Waiting Screen
  if (tour.status === "draft") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-6">
        <div className="text-8xl">⏰</div>
        <h2 className="text-4xl font-display font-black text-foreground">Hold tight, {name}!</h2>
        <p className="text-2xl text-muted-foreground font-medium bg-muted p-6 rounded-3xl border-4 border-dashed border-border">
          The tour hasn't started yet.<br/>We are waiting for the organizer.
        </p>
      </div>
    );
  }

  const currentPlace = places.find(p => p.order === tour.currentStepIndex);

  // Live Screen
  if (tour.status === "live" && currentPlace) {
    return (
      <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
        <div className="flex justify-between items-center bg-primary text-primary-foreground p-4 rounded-3xl border-4 border-primary-foreground/20 shadow-lg">
          <div className="font-display font-black text-xl">📍 STOP {currentPlace.order + 1}/{places.length}</div>
          <div className="font-display font-bold bg-white/20 px-3 py-1 rounded-full">{name}</div>
        </div>

        <div className="text-center space-y-2 mt-8">
          <h2 className="text-5xl font-display font-black text-foreground drop-shadow-sm leading-none">{currentPlace.name}</h2>
          <p className="text-xl text-muted-foreground font-medium">{currentPlace.address}</p>
          {currentPlace.adminComment && (
            <div className="inline-block mt-4 bg-primary/10 border-2 border-primary/20 text-primary px-4 py-2 rounded-2xl">
              <span className="font-bold text-lg">💡 Tip :</span> <span className="text-lg font-medium">{currentPlace.adminComment}</span>
            </div>
          )}
        </div>

        <TastingCard placeId={currentPlace._id} guestName={name} />

        {/* Mystery Mode / Route */}
        {tour.currentStepIndex < places.length - 1 && (
          <div className="mt-12 text-center p-6 bg-card rounded-[2rem] border-4 border-dashed border-muted relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10"></div>
            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-500">🤫</div>
            <h3 className="text-2xl font-display font-black text-foreground relative z-20">Prochaine adresse...</h3>
            <p className="text-xl font-bold bg-primary text-primary-foreground px-4 py-1 rounded-full inline-block mt-2 relative z-20 transform -rotate-2">Mystère !</p>
            <div className="mt-4 blur-sm opacity-50 user-select-none flex justify-center w-full">
              <div className="h-4 w-3/4 bg-muted rounded"></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Completed Screen
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-6">
      <div className="text-8xl">🏆</div>
      <h2 className="text-4xl font-display font-black text-foreground">Tour Completed!</h2>
      <p className="text-2xl text-muted-foreground font-medium bg-green-500/10 text-green-700 p-6 rounded-3xl border-4 border-green-500/20 mb-8">
        You made it to the end.<br/>Hope you enjoyed the food!
      </p>
      <Link href={`/recap/${tourId}`} className="w-full">
        <Button className="w-full h-16 text-2xl font-display font-black bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 shadow-[0_6px_0_hsl(330,80%,40%)] hover:translate-y-1 transition-all">
          VIEW PHOTOS & RECAP 📸
        </Button>
      </Link>
    </div>
  );
}


