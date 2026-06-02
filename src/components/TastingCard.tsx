"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PhotoWall from "@/components/PhotoWall";

const SCORES = Array.from({ length: 10 }, (_, i) => i + 1);

export default function TastingCard({ placeId, guestName }: { placeId: Id<"places">, guestName: string }) {
  const addRating = useMutation(api.ratings.addRating);
  const ratings = useQuery(api.ratings.getRatingsByPlace, { placeId });
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const hasRated = ratings?.some(r => r.guestName === guestName);

  if (ratings === undefined) return null;

  if (hasRated && !isEditing) {
    const myRating = ratings.find(r => r.guestName === guestName);
    return (
      <Card className="border-4 border-green-500/30 bg-green-500/5 rounded-[2rem] shadow-xl mt-8 animate-in fade-in zoom-in duration-300">
        <CardContent className="p-8 text-center space-y-4">
          <div className="text-5xl">✅</div>
          <h3 className="text-3xl font-display font-black text-green-700">Noted!</h3>
          <p className="text-lg font-medium text-green-700/80">Wait for the organizer to move to the next stop.</p>
          
          <Button
            onClick={() => {
              if (myRating) {
                setSelectedScore(myRating.score !== undefined && myRating.score !== null ? myRating.score : -1);
                setComment(myRating.comment || "");
                setIsEditing(true);
              }
            }}
            className="px-6 h-11 text-base font-display font-black bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[0_3px_0_hsl(190,80%,40%)] hover:translate-y-0.5 hover:shadow-[0_1px_0_hsl(190,80%,40%)] transition-all rounded-xl"
          >
            Modifier ma note ✏️
          </Button>

          <div className="mt-6 p-4 bg-white rounded-2xl border-4 border-green-500/20 text-left">
            <h4 className="font-display font-bold text-lg mb-2">Group Vibe:</h4>
            <div className="flex flex-col gap-2">
              {ratings.map(r => (
                <div key={r._id} className="bg-muted px-4 py-2 rounded-2xl border-2 border-border flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-primary text-xl">
                      {r.score !== undefined && r.score !== null ? `${r.score}/10` : "⏭️ Passe cet arrêt"}
                    </span> 
                    <span className="text-sm font-bold opacity-70">{r.guestName}</span>
                  </div>
                  {r.comment && <p className="text-sm italic font-medium">&ldquo;{r.comment}&rdquo;</p>}
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t-4 border-green-500/20">
            <PhotoWall placeId={placeId} guestName={guestName} />
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async () => {
    if (selectedScore === null) return;
    setIsSubmitting(true);
    await addRating({ 
      placeId, 
      guestName, 
      score: selectedScore === -1 ? undefined : selectedScore,
      comment: comment.trim() || undefined
    });
    setIsSubmitting(false);
    setIsEditing(false);
  };

  return (
    <Card className="border-4 border-secondary rounded-[2rem] bg-secondary/5 shadow-2xl mt-8 transition-all">
      <CardContent className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        <h3 className="text-xl sm:text-3xl font-display font-black text-center text-foreground">
          {selectedScore === -1 ? "Vous passez ce stop ⏭️" : "How is the food?"}
        </h3>
        
        <div className="flex flex-col gap-2 sm:gap-3 w-full max-w-sm mx-auto">
          <div className="flex justify-between gap-1.5 sm:gap-2">
            {SCORES.slice(0, 5).map(score => (
              <Button 
                key={score}
                onClick={() => setSelectedScore(score)}
                className={`flex-1 h-11 sm:h-14 md:h-16 px-0 text-lg sm:text-xl md:text-2xl border-2 sm:border-[3px] md:border-4 rounded-xl sm:rounded-[1.5rem] shadow-sm hover:-translate-y-1 font-display font-black transition-all ${
                  selectedScore === score 
                    ? "bg-primary text-primary-foreground border-primary scale-110" 
                    : "bg-card hover:bg-accent border-border text-foreground"
                }`}
                variant="outline"
              >
                {score}
              </Button>
            ))}
          </div>
          <div className="flex justify-between gap-1.5 sm:gap-2">
            {SCORES.slice(5, 10).map(score => (
              <Button 
                key={score}
                onClick={() => setSelectedScore(score)}
                className={`flex-1 h-11 sm:h-14 md:h-16 px-0 text-lg sm:text-xl md:text-2xl border-2 sm:border-[3px] md:border-4 rounded-xl sm:rounded-[1.5rem] shadow-sm hover:-translate-y-1 font-display font-black transition-all ${
                  selectedScore === score 
                    ? "bg-primary text-primary-foreground border-primary scale-110" 
                    : "bg-card hover:bg-accent border-border text-foreground"
                }`}
                variant="outline"
              >
                {score}
              </Button>
            ))}
          </div>
          <Button 
            onClick={() => setSelectedScore(-1)}
            className={`w-full h-12 text-sm sm:text-base border-2 sm:border-[3px] rounded-xl shadow-sm hover:-translate-y-0.5 font-display font-black transition-all ${
              selectedScore === -1 
                ? "bg-amber-500 text-white border-amber-600 scale-105" 
                : "bg-card hover:bg-amber-500/10 border-amber-500/30 text-amber-600 hover:text-amber-700"
            }`}
            variant="outline"
          >
            ⏭️ Passer / Ne pas manger ici
          </Button>
        </div>

        {selectedScore !== null && (
          <div className="space-y-4 pt-4 border-t-4 border-primary/10 animate-in fade-in slide-in-from-top-4">
            <div className="space-y-2">
              <label className="text-lg font-bold font-display px-2">
                {selectedScore === -1 ? "Une raison particulière ? (Optionnel)" : "Un mot à dire ? (Optionnel)"}
              </label>
              <textarea 
                className="w-full p-4 rounded-2xl border-4 border-border bg-card text-foreground font-medium resize-none focus:outline-none focus:border-primary/50 transition-colors"
                rows={2}
                placeholder={selectedScore === -1 ? "Ex: Trop rassasié, allergies, ou je regarde ! 🥦" : "Ex: Incroyable, surtout la sauce !"}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {isEditing && (
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  className="flex-1 h-16 text-xl font-display font-black rounded-2xl border-2 hover:bg-muted"
                >
                  ANNULER
                </Button>
              )}
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-[2] h-16 text-2xl font-display font-black bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 shadow-[0_6px_0_hsl(330,80%,40%)] hover:shadow-[0_2px_0_hsl(330,80%,40%)] hover:translate-y-1 transition-all"
              >
                {isSubmitting ? "Envoi..." : selectedScore === -1 ? "VALIDER PASSER 🚀" : "VALIDER MA NOTE 🚀"}
              </Button>
            </div>
          </div>
        )}
        
        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t-4 border-secondary/20">
          <PhotoWall placeId={placeId} guestName={guestName} />
        </div>
      </CardContent>
    </Card>
  );
}
