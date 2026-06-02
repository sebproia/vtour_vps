"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import PhotoWall from "@/components/PhotoWall";
import { Loader2, Send } from "lucide-react";

export default function TastingCard({ placeId, guestName }: { placeId: Id<"places">, guestName: string }) {
  const addRating = useMutation(api.ratings.addRating);
  const ratings = useQuery(api.ratings.getRatingsByPlace, { placeId });
  const [selectedScore, setSelectedScore] = useState<number | null>(5.0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const touchStartAngle = useRef<number>(0);
  const touchStartScore = useRef<number>(5.0);
  const [isDragging, setIsDragging] = useState(false);

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
            {ratings.filter(r => r.score !== undefined && r.score !== null).map(r => (
              <div key={r._id} className="flex flex-col gap-1 bg-muted/60 px-4 py-2.5 rounded-xl border border-border/60">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-foreground">{r.guestName}</span>
                  <span className="font-black text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg text-xs border border-primary/20 flex-shrink-0">
                    {r.score}/10
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

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isSubmitting) return;
    e.preventDefault();
    
    const element = e.currentTarget;
    element.setPointerCapture(e.pointerId);
    
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    
    touchStartAngle.current = Math.atan2(dy, dx);
    touchStartScore.current = selectedScore !== null && selectedScore !== -1 ? selectedScore : 5.0;
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || isSubmitting) return;
    e.preventDefault();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    
    const currentAngle = Math.atan2(dy, dx);
    let diff = currentAngle - touchStartAngle.current;
    
    if (diff > Math.PI) diff -= 2 * Math.PI;
    if (diff < -Math.PI) diff += 2 * Math.PI;
    
    const deltaScore = (diff / (2 * Math.PI)) * 9;
    const newScore = Math.max(1, Math.min(10, touchStartScore.current + deltaScore));
    setSelectedScore(Number(newScore.toFixed(1)));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDragging(false);
  };

  const getAvatarSrc = (score: number) => {
    if (score < 3.5) return "/grade-disgusted.png";
    if (score < 5.5) return "/grade-skeptical.png";
    if (score < 8.0) return "/grade-happy.png";
    return "/grade-laughing.png";
  };

  const scoreVal = selectedScore !== null && selectedScore !== -1 ? selectedScore : 5.0;
  const donutRotation = (scoreVal - 1.0) * 40; // 40 degrees per score unit (360 / 9)

  return (
    <div className="space-y-4 pt-2">
      <h3 className="text-lg font-display font-black text-center text-foreground select-none">
        {selectedScore === -1 ? "Vous passez ce stop ⏭️" : "C'était bon ? 😋"}
      </h3>
      
      {selectedScore !== -1 ? (
        <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto select-none">
          {/* Dial container */}
          <div 
            className="relative w-56 h-56 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{ touchAction: "none" }}
          >
            {/* Rotating Donut image */}
            <div 
              className="absolute inset-0 transition-transform duration-75 ease-out select-none pointer-events-none"
              style={{ 
                transform: `rotate(${donutRotation}deg)`,
                backgroundImage: "url('/donut-dial.png')",
                backgroundSize: "contain",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat"
              }}
            />
            
            {/* Center Hole cutout & Fixed character avatar */}
            <div className="absolute w-[95px] h-[95px] rounded-full bg-card border-4 border-primary/20 overflow-hidden shadow-inner flex items-center justify-center pointer-events-none select-none">
              <img 
                src={getAvatarSrc(scoreVal)} 
                alt="Avatar note" 
                className="w-[85px] h-[85px] object-contain select-none pointer-events-none"
              />
            </div>
          </div>

          {/* Rating Score Text */}
          <div className="text-center select-none">
            <div className="text-3xl font-display font-black text-primary drop-shadow-sm select-none">
              {scoreVal.toFixed(1)} <span className="text-lg text-muted-foreground">/ 10</span>
            </div>
            <p className="text-[10px] text-muted-foreground/60 mt-1 select-none font-bold">
              Faites tourner le donut pour ajuster votre note 🍩
            </p>
          </div>

          <button 
            onClick={handlePass}
            disabled={isSubmitting}
            className="text-xs font-semibold underline decoration-dotted text-muted-foreground hover:text-amber-500 transition-colors cursor-pointer select-none"
          >
            Passer cet arrêt ⏭️
          </button>
        </div>
      ) : (
        <div className="text-center select-none py-6 space-y-4">
          <p className="text-sm font-semibold text-muted-foreground">Vous avez choisi de passer cet arrêt.</p>
          <button 
            onClick={() => setSelectedScore(5.0)}
            className="h-10 px-6 text-sm font-display font-black bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_3px_0_hsl(330,80%,40%)] hover:translate-y-0.5 transition-all rounded-xl cursor-pointer"
          >
            Donner une note 🍩
          </button>
        </div>
      )}

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
                  <Send className="w-4 h-4" />
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
