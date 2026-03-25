"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";

const ExportButtons = dynamic(() => import("./ExportButtons"), { ssr: false });

export default function TourRecap({ tourId }: { tourId: string }) {
  const recap = useQuery(api.tours.getTourRecap, { tourId: tourId as Id<"tours"> });
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  if (recap === undefined) {
    return <div className="text-2xl font-display font-black animate-pulse text-muted-foreground mt-12 text-center">Loading your memories... 📸</div>;
  }
  
  if (recap === null) {
    return <div className="text-center mt-20 text-xl font-display text-destructive">Tour not found!</div>;
  }

  // Format date from Convex _creationTime
  const tourDate = new Date(recap.tour._creationTime).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // Pick one random anonymous comment per place (with comment)
  const getHighlightComment = (ratings: typeof recap.places[0]["ratings"]) => {
    const withComments = ratings.filter(r => r.comment && r.comment.trim());
    if (withComments.length === 0) return null;
    return withComments[0].comment;
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
        {/* Exportable area */}
        <div id="recap-content-area" className="bg-[hsl(45,50%,97%)] pt-8 pb-8 px-4 rounded-3xl" style={{ maxWidth: '500px', margin: '0 auto' }}>
          
          {/* Header: Logo + Title + Date */}
          <div className="text-center space-y-2 mb-8">
            <Link href="/" className="absolute left-4 top-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-white transition-colors border border-gray-200 z-20 hidden md:flex">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex justify-center mb-3">
              <Image src="/donut.png" alt="Vitour" width={80} height={80} className="drop-shadow-md" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-primary drop-shadow-sm leading-tight">
              {recap.tour.name}
            </h1>
            <p className="text-sm text-muted-foreground font-medium">{tourDate}</p>
          </div>

          {/* Grid of place cards — Instagram style */}
          <div className="grid grid-cols-2 gap-3">
            {recap.places
              .sort((a, b) => a.order - b.order)
              .map((place) => {
                const averageScore = place.ratings.length > 0
                  ? (place.ratings.reduce((acc, curr) => acc + (curr.score || 0), 0) / place.ratings.length).toFixed(1)
                  : null;
                const heroPhoto = place.photos[0]?.url;
                const extraPhotos = place.photos.length - 1;
                const comment = getHighlightComment(place.ratings);

                return (
                  <div 
                    key={place._id} 
                    className="relative rounded-2xl overflow-hidden border-2 border-secondary/30 shadow-md group"
                    style={{ minHeight: '220px' }}
                  >
                    {/* Background photo or gradient */}
                    {heroPhoto ? (
                      <img 
                        src={heroPhoto} 
                        alt={place.name} 
                        crossOrigin="anonymous"
                        className="absolute inset-0 w-full h-full object-cover"
                        onClick={() => heroPhoto && setSelectedPhoto(heroPhoto)}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20" />
                    )}

                    {/* Dark gradient overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

                    {/* Extra photos indicator */}
                    {extraPhotos > 0 && (
                      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                        +{extraPhotos} 📸
                      </div>
                    )}

                    {/* Card content overlay */}
                    <div className="relative z-10 h-full flex flex-col justify-between p-3" style={{ minHeight: '220px' }}>
                      {/* Restaurant name */}
                      <h3 className="text-base sm:text-lg font-display font-black text-white drop-shadow-lg leading-tight">
                        {place.name}
                      </h3>

                      {/* Bottom section: score + comment */}
                      <div className="space-y-1.5 mt-auto">
                        {/* Score badge */}
                        {averageScore && (
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-400 text-sm">⭐</span>
                            <span className="text-white font-black text-xl drop-shadow-md">{averageScore}</span>
                            <span className="text-white/70 text-xs font-bold">/10 Avg</span>
                          </div>
                        )}

                        {/* Address */}
                        <p className="text-white/70 text-[10px] sm:text-xs leading-tight font-medium line-clamp-2">
                          {place.address}
                        </p>

                        {/* Anonymous comment bubble */}
                        {comment && (
                          <div className="bg-secondary/90 text-secondary-foreground rounded-xl px-2 py-1.5 mt-1 shadow-md">
                            <p className="text-[10px] sm:text-xs font-bold leading-tight italic line-clamp-2">
                              "{comment}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Footer watermark */}
          <div className="text-center mt-6 opacity-50">
            <p className="text-xs font-display font-bold text-muted-foreground">Made with Vitour 🍩</p>
          </div>
        </div>

        {/* Action Buttons (outside exportable area) */}
        <div className="flex flex-col gap-4 items-center pt-4 pb-24 px-4 w-full max-w-md mx-auto">
          <ExportButtons targetId="recap-content-area" tourName={recap.tour.name} />

          <Link href="/" className="w-full">
            <Button size="lg" className="w-full h-14 md:text-lg text-base rounded-2xl bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[0_4px_0_hsl(190,80%,40%)] hover:shadow-[0_2px_0_hsl(190,80%,40%)] hover:translate-y-1 transition-all font-display font-black">
              CREATE YOUR OWN TOUR
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
