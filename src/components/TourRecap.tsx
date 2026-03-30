"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Shrikhand } from "next/font/google";

const shrikhand = Shrikhand({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const ExportButtons = dynamic(() => import("./ExportButtons"), { ssr: false });

export default function TourRecap({ tourId }: { tourId: string }) {
  const recap = useQuery(api.tours.getTourRecap, { tourId: tourId as Id<"tours"> });
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  // Track which photo index is shown per place
  const [photoIndexes, setPhotoIndexes] = useState<Record<string, number>>({});

  if (recap === undefined) {
    return <div className="text-xl font-display font-black animate-pulse text-muted-foreground mt-12 text-center">Loading your memories... 📸</div>;
  }
  
  if (recap === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="text-6xl">🔍</div>
        <h2 className="text-2xl font-display font-black text-foreground">Tour not found!</h2>
        <p className="text-base text-muted-foreground font-medium">This tour may have been deleted or the link is invalid.</p>
        <Link href="/">
          <Button className="h-12 px-6 text-lg font-display font-black bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 shadow-[0_4px_0_hsl(330,80%,40%)] hover:translate-y-1 transition-all">
            Go to Homepage 🏠
          </Button>
        </Link>
      </div>
    );
  }

  const tourDate = new Date(recap.tour._creationTime).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  let totalScore = 0;
  let scoreCount = 0;
  recap.places.forEach(place => {
    place.ratings.forEach(r => {
      if (r.score !== undefined && r.score !== null) {
        totalScore += r.score;
        scoreCount++;
      }
    });
  });
  const globalScore = scoreCount > 0 ? (totalScore / scoreCount).toFixed(1) : null;

  const getAllComments = (ratings: typeof recap.places[0]["ratings"]) => {
    return ratings
      .filter(r => r.comment && r.comment.trim())
      .map(r => r.comment!);
  };

  const cyclePhoto = (placeId: string, total: number, direction: 1 | -1) => {
    setPhotoIndexes(prev => {
      const current = prev[placeId] || 0;
      const next = (current + direction + total) % total;
      return { ...prev, [placeId]: next };
    });
  };

  return (
    <>
      {/* Fullscreen Photo Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button 
            className="absolute top-6 right-6 w-12 h-12 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-colors"
            onClick={(e) => { e.stopPropagation(); setSelectedPhoto(null); }}
          >
             <X className="w-8 h-8" />
          </button>
          <div className="relative w-full max-w-4xl h-[80vh] flex justify-center items-center">
            <img src={selectedPhoto} alt="Tour Photo" crossOrigin="anonymous" className="object-contain max-h-full max-w-full rounded-xl" />
          </div>
        </div>
      )}

      <div className="space-y-6 animate-in fade-in duration-700">
        {/* Exportable area — single column, card layout */}
        <div id="recap-content-area" className="bg-[hsl(45,50%,97%)] pt-6 pb-6 px-3 sm:px-4 rounded-2xl" style={{ maxWidth: '480px', margin: '0 auto' }}>
          
          {/* Header */}
          <div className="text-center space-y-1.5 mb-8">
            <div className="relative w-full flex flex-col items-center mb-6">
              <div className="relative w-28 h-28 mx-auto animate-[spin_12s_linear_infinite]">
                <Image 
                  src="/donut.png" 
                  alt="Vitour Logo" 
                  width={112}
                  height={112}
                  className="scale-125 drop-shadow-md contrast-125" 
                />
              </div>
              <div className={`absolute top-[85%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full z-20 pointer-events-none mt-2 ${shrikhand.className}`}>
                <h1 className="text-5xl tracking-tight text-white drop-shadow-[0_4px_0_#ff2a6d,0_2px_8px_rgba(0,0,0,0.5)] transform -rotate-6 text-center leading-none" style={{ WebkitTextStroke: '1.5px #ff2a6d' }}>
                  Vitour
                </h1>
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-black text-primary drop-shadow-sm leading-tight mt-2 pb-1 relative z-30">
              {recap.tour.name}
            </h2>
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-muted-foreground font-medium">{tourDate}</p>
              {globalScore && (
                <span className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-black border border-yellow-200 shadow-sm font-display relative z-30">
                  Global Note: ⭐ {globalScore}/10
                </span>
              )}
            </div>
          </div>

          {/* Place cards — photo on top, info below */}
          <div className="space-y-3">
            {recap.places
              .sort((a, b) => a.order - b.order)
              .map((place) => {
                const averageScore = place.ratings.length > 0
                  ? (place.ratings.reduce((acc, curr) => acc + (curr.score || 0), 0) / place.ratings.length).toFixed(1)
                  : null;
                const currentPhotoIndex = photoIndexes[place._id] || 0;
                const currentPhoto = place.photos[currentPhotoIndex]?.url || place.photos[0]?.url;
                const totalPhotos = place.photos.length;
                const comments = getAllComments(place.ratings);

                return (
                  <div key={place._id} className="rounded-xl overflow-hidden bg-white shadow-sm border border-gray-200">
                    {/* Photo section */}
                    {currentPhoto ? (
                      <div className="relative w-full" style={{ aspectRatio: '16/10' }}>
                        <img 
                          src={currentPhoto} 
                          alt={place.name} 
                          crossOrigin="anonymous"
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setSelectedPhoto(currentPhoto)}
                        />
                        
                        {/* Photo navigation arrows */}
                        {totalPhotos > 1 && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); cyclePhoto(place._id, totalPhotos, -1); }}
                              className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); cyclePhoto(place._id, totalPhotos, 1); }}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                            {/* Dots indicator */}
                            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
                              {place.photos.map((_, i) => (
                                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentPhotoIndex ? 'bg-white' : 'bg-white/40'}`} />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="w-full bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10" style={{ aspectRatio: '16/10' }} />
                    )}

                    {/* Info section — below photo */}
                    <div className="p-3 space-y-1.5">
                      {/* Name + Score row */}
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-display font-black text-foreground leading-tight truncate">
                          {place.name}
                        </h3>
                        {averageScore && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className="text-yellow-500 text-sm">⭐</span>
                            <span className="text-foreground font-black text-lg">{averageScore}</span>
                            <span className="text-muted-foreground text-[10px] font-bold">/10</span>
                          </div>
                        )}
                      </div>

                      {/* Address */}
                      <p className="text-muted-foreground text-xs leading-tight">
                        {place.address}
                      </p>

                      {/* Comments — plain text, no bubble */}
                      {comments.length > 0 && (
                        <div className="pt-1 space-y-0.5">
                          {comments.map((c, i) => (
                            <p key={i} className="text-xs text-muted-foreground italic leading-snug">
                              &ldquo;{c}&rdquo;
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 items-center pt-2 pb-20 px-3 w-full max-w-md mx-auto">
          <ExportButtons targetId="recap-content-area" tourName={recap.tour.name} />

          <Link href="/" className="w-full">
            <Button size="lg" className="w-full h-12 text-base rounded-2xl bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[0_4px_0_hsl(190,80%,40%)] hover:shadow-[0_2px_0_hsl(190,80%,40%)] hover:translate-y-1 transition-all font-display font-black">
              CREATE YOUR OWN TOUR
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
