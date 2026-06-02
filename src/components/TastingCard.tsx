"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import PhotoWall from "@/components/PhotoWall";
import { Loader2 } from "lucide-react";

const SCORES = Array.from({ length: 10 }, (_, i) => i + 1);

export default function TastingCard({ placeId, guestName }: { placeId: Id<"places">, guestName: string }) {
  const addRating = useMutation(api.ratings.addRating);
  const ratings = useQuery(api.ratings.getRatingsByPlace, { placeId });
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [comment, isEditing]);
  
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
              <div key={r._id} className="flex flex-col gap-1 bg-muted/60 px-4 py-2.5 rounded-xl border border-border/60">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-foreground">{r.guestName}</span>
                  <span className="font-black text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg text-xs border border-primary/20 flex-shrink-0">
                    {r.score !== undefined && r.score !== null ? `${r.score}/10` : "⏭️ Passe"}
                  </span>
                </div>
                {r.comment && (
                  <p className="text-xs text-muted-foreground italic mt-0.5 whitespace-pre-wrap break-words">
                    &ldquo;{r.comment}&rdquo;
                  </p>
                )}
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
    try {
      await addRating({ 
        placeId, 
        guestName, 
        score: selectedScore === -1 ? undefined : selectedScore,
        comment: comment.trim() || undefined
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("Erreur lors de la soumission de la note : " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePass = async () => {
    setIsSubmitting(true);
    try {
      await addRating({ 
        placeId, 
        guestName, 
        score: undefined,
        comment: undefined
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error passing stop:", error);
      alert("Erreur lors du passage de l'arrêt : " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
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
        <div className="pt-4 border-t-2 border-dashed border-border/80 animate-in fade-in slide-in-from-top-4">
          <div className="flex gap-2 items-end">
            <div className="relative flex-grow flex items-end bg-card rounded-xl border-2 border-border focus-within:border-primary/50 transition-colors">
              <textarea 
                ref={textareaRef}
                rows={1}
                placeholder="Un mot à dire ? (Optionnel) 🌮"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!isSubmitting) {
                      handleSubmit();
                    }
                  }
                }}
                className="w-full pr-12 pl-4 py-2.5 bg-transparent text-foreground font-medium focus:outline-none transition-colors text-sm resize-none overflow-y-hidden min-h-[44px] max-h-[150px] leading-relaxed"
                disabled={isSubmitting}
              />
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="absolute right-1 bottom-1 w-9 h-9 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                title="Envoyer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <span className="text-base">💬</span>
                )}
              </button>
            </div>
            {isEditing && (
              <button
                onClick={() => setIsEditing(false)}
                className="text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer flex-shrink-0 pb-3"
              >
                Annuler
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Live Feed at the bottom, flat */}
      <PhotoWall placeId={placeId} guestName={guestName} />
    </div>
  );
}
