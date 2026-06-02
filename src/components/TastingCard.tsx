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
      <div className="text-center space-y-4 pt-2 animate-in fade-in duration-300">
        <div className="flex flex-col items-center gap-2">
          <div className="text-4xl">✅</div>
          <h3 className="text-2xl font-display font-black text-green-600">Noté !</h3>
          <p className="text-xs font-semibold text-muted-foreground">En attente du lancement de l&apos;arrêt suivant…</p>
          
          <Button
            onClick={() => {
              if (myRating) {
                setSelectedScore(myRating.score !== undefined && myRating.score !== null ? myRating.score : -1);
                setComment(myRating.comment || "");
                setIsEditing(true);
              }
            }}
            className="mt-1 h-9 px-4 text-xs font-display font-black bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[0_2px_0_hsl(190,80%,40%)] hover:translate-y-0.5 hover:shadow-[0_0px_0_hsl(190,80%,40%)] transition-all rounded-xl cursor-pointer"
          >
            Modifier mon avis ✏️
          </Button>
        </div>

        {/* Group Vibe - Clean flat list with dashed separator */}
        <div className="mt-6 pt-4 border-t-2 border-dashed border-border/80 text-left space-y-3">
          <h4 className="font-display font-black text-lg text-primary">Group Vibe 🍔</h4>
          <div className="grid grid-cols-1 gap-2">
            {ratings.map(r => (
              <div key={r._id} className="flex justify-between items-center bg-muted/60 px-4 py-2 rounded-xl border border-border/60">
                <span className="text-sm font-bold text-foreground">{r.guestName}</span>
                <div className="flex items-center gap-2">
                  {r.comment && <span className="text-xs text-muted-foreground italic truncate max-w-[160px]">&ldquo;{r.comment}&rdquo;</span>}
                  <span className="font-black text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg text-xs border border-primary/20 flex-shrink-0">
                    {r.score !== undefined && r.score !== null ? `${r.score}/10` : "⏭️ Passe"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Photo Wall - directly inside, flat */}
        <PhotoWall placeId={placeId} guestName={guestName} />
      </div>
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

  const handlePass = async () => {
    setIsSubmitting(true);
    await addRating({ 
      placeId, 
      guestName, 
      score: undefined,
      comment: undefined
    });
    setIsSubmitting(false);
    setIsEditing(false);
  };

  return (
    <div className="space-y-4 pt-2">
      <h3 className="text-lg font-display font-black text-center text-foreground">
        {selectedScore === -1 ? "Vous passez ce stop ⏭️" : "Qu&apos;avez-vous pensé de ce stop ? 🍔"}
      </h3>
      
      <div className="flex flex-col gap-2 w-full max-w-sm mx-auto">
        <div className="flex justify-between gap-1.5">
          {SCORES.slice(0, 5).map(score => (
            <Button 
              key={score}
              onClick={() => setSelectedScore(score)}
              className={`flex-1 h-11 text-base border-2 rounded-xl shadow-sm hover:-translate-y-0.5 font-display font-black transition-all cursor-pointer ${
                selectedScore === score 
                  ? "bg-primary text-primary-foreground border-primary scale-105 shadow-md" 
                  : "bg-card hover:bg-accent border-border text-foreground"
              }`}
              variant="outline"
            >
              {score}
            </Button>
          ))}
        </div>
        <div className="flex justify-between gap-1.5">
          {SCORES.slice(5, 10).map(score => (
            <Button 
              key={score}
              onClick={() => setSelectedScore(score)}
              className={`flex-1 h-11 text-base border-2 rounded-xl shadow-sm hover:-translate-y-0.5 font-display font-black transition-all cursor-pointer ${
                selectedScore === score 
                  ? "bg-primary text-primary-foreground border-primary scale-105 shadow-md" 
                  : "bg-card hover:bg-accent border-border text-foreground"
              }`}
              variant="outline"
            >
              {score}
            </Button>
          ))}
        </div>
        <button 
          onClick={handlePass}
          disabled={isSubmitting}
          className="w-fit mx-auto mt-2 text-xs font-semibold underline decoration-dotted text-muted-foreground hover:text-amber-500 transition-colors cursor-pointer"
        >
          Passer cet arrêt ⏭️
        </button>
      </div>

      {selectedScore !== null && selectedScore !== -1 && (
        <div className="space-y-4 pt-4 border-t-2 border-dashed border-border/80 animate-in fade-in slide-in-from-top-4">
          <div className="space-y-1.5">
            <label className="text-sm font-bold font-display px-1">Un mot à dire ? (Optionnel)</label>
            <textarea 
              className="w-full p-3 rounded-xl border-2 border-border bg-card text-foreground font-medium resize-none focus:outline-none focus:border-primary/50 transition-colors text-sm"
              rows={1.5}
              placeholder="Ex: Incroyable, surtout la sauce !"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {isEditing && (
              <Button
                onClick={() => setIsEditing(false)}
                variant="outline"
                className="flex-1 h-11 text-sm font-display font-black rounded-xl border-2 hover:bg-muted cursor-pointer"
              >
                Annuler
              </Button>
            )}
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-[2] h-11 text-base font-display font-black bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 shadow-[0_3px_0_hsl(330,80%,40%)] hover:shadow-[0_1px_0_hsl(330,80%,40%)] hover:translate-y-0.5 transition-all cursor-pointer"
            >
              {isSubmitting ? "Envoi..." : "Valider ma note 🚀"}
            </Button>
          </div>
        </div>
      )}
      
      {/* Live Feed at the bottom, flat */}
      <PhotoWall placeId={placeId} guestName={guestName} />
    </div>
  );
}
