"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Star, Camera } from "lucide-react";

export default function TourRecap({ tourId }: { tourId: string }) {
  const recap = useQuery(api.tours.getTourRecap, { tourId: tourId as Id<"tours"> });

  if (recap === undefined) {
    return <div className="text-2xl font-display font-black animate-pulse text-muted-foreground mt-12 text-center">Loading your memories... 📸</div>;
  }
  
  if (recap === null) {
    return <div className="text-center mt-20 text-xl font-display text-destructive">Tour not found!</div>;
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="text-center space-y-4 relative">
        <Link href="/" className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors border-2 border-border hidden md:flex">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <span className="text-6xl inline-block mb-4">🏆</span>
        <h1 className="text-5xl md:text-6xl font-display font-black text-primary drop-shadow-sm leading-tight">
          {recap.tour.name}
        </h1>
        <p className="text-2xl text-muted-foreground font-medium">The official Travelogue</p>
      </div>

      <div className="space-y-16">
        {recap.places.map((place, index) => {
          const averageScore = place.ratings.length > 0
            ? (place.ratings.reduce((acc, curr) => acc + curr.score, 0) / place.ratings.length).toFixed(1)
            : "N/A";

          return (
            <div key={place._id} className="relative">
              {/* Connector Line */}
              {index !== recap.places.length - 1 && (
                <div className="absolute left-8 top-24 bottom-[-4rem] w-2 bg-border z-0 hidden md:block" />
              )}
              
              <div className="flex flex-col md:flex-row gap-8 relative z-10">
                {/* Step Indicator */}
                <div className="w-16 h-16 bg-secondary text-secondary-foreground border-4 border-secondary-foreground/20 rounded-full flex items-center justify-center text-3xl font-display font-black shadow-lg flex-shrink-0 mx-auto md:mx-0">
                  {index + 1}
                </div>
                
                <Card className="flex-grow border-4 border-primary/20 bg-card rounded-[2rem] shadow-xl overflow-hidden hover:shadow-primary/30 transition-shadow">
                  <div className="p-8 border-b-4 border-border bg-primary/5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-4xl font-display font-black text-foreground">{place.name}</h2>
                        <p className="text-xl text-muted-foreground font-medium mt-2">{place.address}</p>
                      </div>
                      <div className="bg-white px-4 py-2 rounded-2xl border-4 border-primary/20 shadow-sm flex items-center gap-2">
                        <span className="text-3xl font-black text-primary">{averageScore}</span>
                        <span className="font-bold text-muted-foreground text-sm">/10 Score</span>
                      </div>
                    </div>
                    
                    {place.ratings.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-2">
                        {place.ratings.map(r => (
                          <div key={r._id} className="bg-background border-2 border-border px-3 py-1 rounded-full font-medium text-sm flex gap-2 items-center">
                            <span className="font-bold text-primary">{r.score}/10</span> <span className="opacity-70">{r.guestName}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-8 bg-muted/30">
                    <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                      <Camera className="text-primary" /> Photos ({place.photos.length})
                    </h3>
                    
                    {place.photos.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {place.photos.map(photo => (
                          <div key={photo._id} className="relative aspect-square border-4 border-border rounded-2xl overflow-hidden shadow-sm hover:scale-105 transition-transform">
                            {photo.url && <Image src={photo.url} alt="Food photo" fill className="object-cover" />}
                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                              <span className="text-white text-xs font-bold shadow-black drop-shadow-md">by {photo.uploaderName}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic font-medium">No photos were taken here. Everyone was too busy eating! 🤤</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center pt-12 pb-24">
        <Link href="/">
          <Button size="lg" className="h-16 px-12 text-2xl rounded-[2rem] bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[0_6px_0_oklch(0.5_0.15_190)] hover:shadow-[0_2px_0_oklch(0.5_0.15_190)] hover:translate-y-1 transition-all font-display font-black">
            CREATE YOUR OWN TOUR
          </Button>
        </Link>
      </div>
    </div>
  );
}
