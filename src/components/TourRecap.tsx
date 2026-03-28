"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { X } from "lucide-react";
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

  // Format date from Convex _creationTime
  const tourDate = new Date(recap.tour._creationTime).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // Get all anonymous comments for a place
  const getAllComments = (ratings: typeof recap.places[0]["ratings"]) => {
    return ratings
      .filter(r => r.comment && r.comment.trim())
      .map(r => r.comment!);
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
        {/* Exportable area — single column layout */}
        <div id="recap-content-area" className="bg-[hsl(45,50%,97%)] pt-8 pb-8 px-4 rounded-3xl" style={{ maxWidth: '500px', margin: '0 auto' }}>
          
          {/* Header: Logo + Title + Date */}
          <div className="text-center space-y-2 mb-6">
            <div className="flex justify-center mb-2">
              <Image src="/donut.png" alt="Vitour" width={80} height={80} className="drop-shadow-md" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-primary drop-shadow-sm leading-tight">
              {recap.tour.name}
            </h1>
            <p className="text-sm text-muted-foreground font-medium">{tourDate}</p>
          </div>

          {/* Single column list of place cards */}
          <div className="space-y-4">
            {recap.places
              .sort((a, b) => a.order - b.order)
              .map((place) => {
                const averageScore = place.ratings.length > 0
                  ? (place.ratings.reduce((acc, curr) => acc + (curr.score || 0), 0) / place.ratings.length).toFixed(1)
                  : null;
                const heroPhoto = place.photos[0]?.url;
                const extraPhotos = place.photos.length - 1;
                const comments = getAllComments(place.ratings);

                return (
                  <div 
                    key={place._id} 
                    className="relative rounded-2xl overflow-hidden border-2 border-secondary/30 shadow-md"
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

                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/15" />

                    {/* Extra photos indicator */}
                    {extraPhotos > 0 && (
                      <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                        +{extraPhotos} 📸
                      </div>
                    )}

                    {/* Card content overlay */}
                    <div className="relative z-10 p-4" style={{ minHeight: '180px' }}>
                      {/* Restaurant name */}
                      <h3 className="text-xl font-display font-black text-white drop-shadow-lg leading-tight">
                        {place.name}
                      </h3>

                      {/* Bottom section */}
                      <div className="space-y-2 mt-auto pt-6">
                        {/* Score + Address row */}
                        <div className="flex items-end justify-between gap-2">
                          <div>
                            {averageScore && (
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-yellow-400 text-base">⭐</span>
                                <span className="text-white font-black text-2xl drop-shadow-md">{averageScore}</span>
                                <span className="text-white/60 text-xs font-bold">/10 Avg</span>
                              </div>
                            )}
                            <p className="text-white/60 text-xs leading-tight font-medium">
                              {place.address}
                            </p>
                          </div>
                        </div>

                        {/* All anonymous comments */}
                        {comments.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            {comments.map((c, i) => (
                              <div key={i} className="bg-black/50 backdrop-blur-sm text-white rounded-xl px-3 py-1.5 shadow-sm">
                                <p className="text-xs font-bold leading-snug italic">
                                  &ldquo;{c}&rdquo;
                                </p>
                              </div>
                            ))}
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
