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
            className="w-full h-16 text-2xl font-display font-black bg-secondary text-secondary-foreground rounded-2xl hover:bg-secondary/90 shadow-[0_6px_0_oklch(0.5_0.15_190)] hover:shadow-[0_2px_0_oklch(0.5_0.15_190)] hover:translate-y-1 transition-all"
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
        </div>

        <TastingCard placeId={currentPlace._id} guestName={name} />
        
        {/* Photo Wall Section */}
        <PhotoWall placeId={currentPlace._id} guestName={name} />
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
        <Button className="w-full h-16 text-2xl font-display font-black bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 shadow-[0_6px_0_oklch(0.65_0.25_15)] hover:translate-y-1 transition-all">
          VIEW PHOTOS & RECAP 📸
        </Button>
      </Link>
    </div>
  );
}

// Photo Wall Child Component
function PhotoWall({ placeId, guestName }: { placeId: Id<"places">, guestName: string }) {
  const photos = useQuery(api.photos.getPhotosByPlace, { placeId });
  const generateUploadUrl = useMutation(api.photos.generateUploadUrl);
  const savePhoto = useMutation(api.photos.savePhoto);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Get short-lived upload URL
      const postUrl = await generateUploadUrl();
      
      // 2. Upload file
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      
      // 3. Save reference in DB
      await savePhoto({
        placeId,
        uploaderName: guestName,
        storageId,
      });
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Oops! Impossible de charger la photo.");
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="border-4 border-primary/20 bg-card rounded-[2rem] shadow-xl mt-8">
      <CardContent className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-display font-black text-foreground flex items-center gap-2">
            <Camera className="text-primary w-6 h-6" /> Live Feed
          </h3>
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="rounded-xl font-bold font-display shadow-[0_4px_0_oklch(0.5_0.15_190)] hover:translate-y-1 hover:shadow-[0_2px_0_oklch(0.5_0.15_190)] transition-all bg-secondary hover:bg-secondary/90 text-secondary-foreground"
          >
            {isUploading ? "Uploading... ⏳" : <><ImagePlus className="mr-2 w-5 h-5" /> Add Photo</>}
          </Button>
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleUpload} 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {photos?.map((photo) => (
            <div key={photo._id} className="relative aspect-square border-4 border-border rounded-2xl overflow-hidden shadow-sm group">
              {photo.url && <Image src={photo.url} alt="Food photo" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />}
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                <span className="text-white text-xs font-bold shadow-black drop-shadow-md">📸 by {photo.uploaderName}</span>
              </div>
            </div>
          ))}

          {photos && photos.length === 0 && (
            <div className="col-span-2 text-center py-8 text-muted-foreground/50 border-4 border-dashed rounded-2xl border-muted">
              <span className="text-4xl block mb-2">📸</span>
              <p className="font-medium">No photos yet.<br/>Be the first to snap this dish!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Child Component for the Rating UI
function TastingCard({ placeId, guestName }: { placeId: Id<"places">, guestName: string }) {
  const addRating = useMutation(api.ratings.addRating);
  const ratings = useQuery(api.ratings.getRatingsByPlace, { placeId });
  
  const hasRated = ratings?.some(r => r.guestName === guestName);

  if (ratings === undefined) return null;

  if (hasRated) {
    return (
      <Card className="border-4 border-green-500/30 bg-green-500/5 rounded-[2rem] shadow-xl mt-8">
        <CardContent className="p-8 text-center space-y-4">
          <div className="text-5xl">✅</div>
          <h3 className="text-3xl font-display font-black text-green-700">Noted!</h3>
          <p className="text-lg font-medium text-green-700/80">Wait for the organizer to move to the next stop.</p>
          
          <div className="mt-6 p-4 bg-white rounded-2xl border-4 border-green-500/20 text-left">
            <h4 className="font-display font-bold text-lg mb-2">Group Vibe:</h4>
            <div className="flex flex-wrap gap-2">
              {ratings.map(r => (
                <div key={r._id} className="bg-muted px-3 py-1 rounded-full font-medium text-lg flex gap-2 items-center">
                  <span className="font-bold text-primary">{r.score}/10</span> <span className="text-sm opacity-70">{r.guestName}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-4 border-secondary rounded-[2rem] bg-secondary/5 shadow-2xl mt-8 transform hover:scale-[1.02] transition-transform">
      <CardContent className="p-6 space-y-6">
        <h3 className="text-3xl font-display font-black text-center text-foreground">How is the food?</h3>
        <div className="grid grid-cols-5 gap-3">
          {SCORES.map(score => (
            <Button 
              key={score}
              onClick={() => addRating({ placeId, guestName, score })}
              className="text-2xl h-16 bg-card hover:bg-accent border-4 border-border rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 font-display font-black"
              variant="outline"
            >
              {score}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
