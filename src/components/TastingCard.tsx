"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import PhotoWall from "@/components/PhotoWall";
import { Loader2, Send } from "lucide-react";
import { motion } from "framer-motion";

export default function TastingCard({ 
  placeId, 
  guestName, 
  isGuestView = false 
}: { 
  placeId: Id<"places">, 
  guestName: string, 
  isGuestView?: boolean 
}) {
  const addRating = useMutation(api.ratings.addRating);
  const ratings = useQuery(api.ratings.getRatingsByPlace, { placeId });
  const [selectedScore, setSelectedScore] = useState<number | null>(5.0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastAngle = useRef<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [shouldWiggle, setShouldWiggle] = useState(true);

  useEffect(() => {
    if (isDragging) {
      setShouldWiggle(false);
    }
  }, [isDragging]);

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
          <h3 className="text-2xl font-display font-black text-emerald-400 drop-shadow-sm">Noté !</h3>
          <p className={`text-xs font-semibold ${isGuestView ? "text-white/70" : "text-muted-foreground"}`}>En attente du lancement de l&apos;arrêt suivant…</p>
          
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
            Modifier mon avis
          </Button>

          {isGuestView && (
            <div className="text-[10px] font-bold text-white/40 flex items-center justify-center gap-1 select-none pt-1 animate-pulse">
              <span>Glissez pour naviguer</span> <span>→</span>
            </div>
          )}
        </div>

        {/* Group Vibe - Clean flat list with dashed separator */}
        <div className={`mt-6 pt-4 border-t-2 border-dashed text-left space-y-3 ${isGuestView ? "border-white/30" : "border-border/80"}`}>
          <h4 className={`font-display font-black text-lg ${isGuestView ? "text-white drop-shadow-sm" : "text-primary"}`}>Group Vibe</h4>
          <div className="grid grid-cols-1 gap-2">
            {ratings.filter(r => r.score !== undefined && r.score !== null).map(r => (
              <div key={r._id} className={`flex flex-col gap-1 bg-muted/60 px-4 py-2.5 rounded-xl border ${isGuestView ? "border-white/20" : "border-border/60"}`}>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-foreground">{r.guestName}</span>
                  <span className={`font-black px-2.5 py-0.5 rounded-lg text-xs flex-shrink-0 ${
                    isGuestView
                      ? "text-white bg-primary border border-primary/30"
                      : "text-primary bg-primary/10 border border-primary/20"
                  }`}>
                    {r.score!.toFixed(1)}/10
                  </span>
                </div>
                {r.comment && (
                  <p className="text-xs text-foreground/75 italic mt-0.5 whitespace-pre-wrap break-words">
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
        score: selectedScore === -1 ? undefined : Math.round(selectedScore * 10) / 10,
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
    e.stopPropagation();
    
    const element = e.currentTarget;
    element.setPointerCapture(e.pointerId);
    
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    
    lastAngle.current = Math.atan2(dy, dx);
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || isSubmitting) return;
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    
    const currentAngle = Math.atan2(dy, dx);
    let diff = currentAngle - lastAngle.current;
    
    if (diff > Math.PI) diff -= 2 * Math.PI;
    if (diff < -Math.PI) diff += 2 * Math.PI;
    
    const deltaScore = (diff / (2 * Math.PI)) * 9;
    const currentScore = selectedScore !== null && selectedScore !== -1 ? selectedScore : 5.0;
    const newScore = Math.max(1, Math.min(10, currentScore + deltaScore));
    
    setSelectedScore(newScore);
    lastAngle.current = currentAngle;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDragging(false);
  };

  const getAvatarConfig = (score: number) => {
    const version = "v=4";
    if (score < 3.5) return { src: `/grade-disgusted.png?${version}`, size: 155, offsetClass: "" };
    if (score < 6.0) return { src: `/grade-skeptical.png?${version}`, size: 170, offsetClass: "" };
    if (score < 7.5) return { src: `/grade-happy.png?${version}`, size: 190, offsetClass: "" };
    if (score < 9.0) return { src: `/grade-smiling.png?${version}`, size: 172, offsetClass: "" };
    return { src: `/grade-laughing.png?${version}`, size: 200, offsetClass: "-translate-x-1" };
  };

  const scoreVal = selectedScore !== null && selectedScore !== -1 ? selectedScore : 5.0;
  const donutRotation = (scoreVal - 1.0) * 40; // 40 degrees per score unit (360 / 9)
  
  const { src: avatarSrc, size: avatarSize, offsetClass: avatarOffset } = getAvatarConfig(scoreVal);

  return (
    <div className="space-y-4 pt-2">
      <h3 className={`text-lg font-display font-black text-center select-none ${isGuestView ? "text-white drop-shadow-sm" : "text-foreground"}`}>
        {selectedScore === -1 ? "Vous passez ce stop" : "C'était bon ?"}
      </h3>
      
      {selectedScore !== -1 ? (
        <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto select-none">
          {/* Dial container */}
          <div 
            className="relative w-56 h-56 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            style={{ touchAction: "none" }}
          >
            {/* Subtle rotation track */}
            <svg 
              className={`absolute w-[248px] h-[248px] pointer-events-none select-none z-0 animate-[spin_60s_linear_infinite] ${isGuestView ? "text-white/30" : "text-primary/20"}`} 
              viewBox="0 0 100 100"
              style={{
                left: "calc(50% - 124px)",
                top: "calc(50% - 124px)"
              }}
            >
              <circle 
                cx="50" 
                cy="50" 
                r="47" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeDasharray="4 6" 
              />
            </svg>

            {/* Left Rotation Hint */}
            <motion.div 
              className={`absolute -left-9 top-1/2 pointer-events-none select-none flex flex-col items-center ${
                isGuestView 
                  ? "text-white/80 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" 
                  : "text-primary/80 drop-shadow-[0_0_8px_rgba(244,63,94,0.15)]"
              }`}
              style={{ y: "-50%" }}
              animate={{ 
                opacity: [0.4, 0.95, 0.4], 
                y: ["-50%", "-54%", "-50%"],
                x: [0, 4, 0]
              }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
            >
              <svg width="26" height="34" viewBox="0 0 24 32" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transform rotate-[-20deg]">
                <path d="M4 28 C 1 20, 4 10, 14 6" />
                <path d="M8 6 L14 6 L14 12" />
              </svg>
            </motion.div>

            {/* Right Rotation Hint */}
            <motion.div 
              className={`absolute -right-9 top-1/2 pointer-events-none select-none flex flex-col items-center ${
                isGuestView 
                  ? "text-white/80 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" 
                  : "text-primary/80 drop-shadow-[0_0_8px_rgba(244,63,94,0.15)]"
              }`}
              style={{ y: "-50%" }}
              animate={{ 
                opacity: [0.4, 0.95, 0.4], 
                y: ["-50%", "-46%", "-50%"],
                x: [0, -4, 0]
              }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut", delay: 1.1 }}
            >
              <svg width="26" height="34" viewBox="0 0 24 32" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transform rotate-[160deg]">
                <path d="M4 28 C 1 20, 4 10, 14 6" />
                <path d="M8 6 L14 6 L14 12" />
              </svg>
            </motion.div>

            {/* Rotating Donut image */}
            <motion.div 
              className="absolute inset-0 select-none pointer-events-none z-10"
              animate={
                shouldWiggle 
                  ? { rotate: [donutRotation, donutRotation - 15, donutRotation + 12, donutRotation - 8, donutRotation + 4, donutRotation] } 
                  : { rotate: donutRotation }
              }
              transition={
                shouldWiggle 
                  ? { duration: 1.4, ease: "easeInOut" } 
                  : { type: "tween", duration: 0.05 }
              }
              onAnimationComplete={() => setShouldWiggle(false)}
              style={{ 
                backgroundImage: "url('/donut-dial.png?v=4')",
                backgroundSize: "contain",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat"
              }}
            />
            
            {/* Center Hole cutout & Fixed character avatar */}
            <div className="absolute w-[90px] h-[90px] rounded-full bg-card border-4 border-primary/20 shadow-inner flex items-center justify-center pointer-events-none select-none">
              <img 
                src={avatarSrc} 
                alt="Avatar note" 
                className={`max-w-none object-contain select-none pointer-events-none z-10 translate-y-2.5 transition-all duration-75 ${avatarOffset}`}
                style={{ width: `${avatarSize}px`, height: `${avatarSize}px` }}
              />
            </div>
          </div>

          {/* Rating Score Text */}
          <div className="text-center select-none">
            <div className={`text-3xl font-display font-black drop-shadow-sm select-none ${isGuestView ? "text-white" : "text-primary"}`}>
              {scoreVal.toFixed(1)} <span className={`text-lg ${isGuestView ? "text-white/70" : "text-muted-foreground"}`}>/ 10</span>
            </div>
            <p className={`text-[10px] mt-1 select-none font-bold ${isGuestView ? "text-white/80" : "text-muted-foreground/60"}`}>
              Faites tourner le donut pour ajuster votre note 🍩
            </p>
          </div>

          <button 
            onClick={handlePass}
            disabled={isSubmitting}
            className={`text-xs font-semibold underline decoration-dotted transition-colors cursor-pointer select-none ${
              isGuestView ? "text-white/80 hover:text-white" : "text-muted-foreground hover:text-amber-500"
            }`}
          >
            Passer cet arrêt
          </button>
        </div>
      ) : (
        <div className="text-center select-none py-6 space-y-4">
          <p className={`text-sm font-semibold ${isGuestView ? "text-white/80" : "text-muted-foreground"}`}>Vous avez choisi de passer cet arrêt.</p>
          <div className="flex flex-col items-center gap-3">
            <button 
              onClick={() => setSelectedScore(5.0)}
              className={`h-10 px-6 text-sm font-display font-black transition-all rounded-xl cursor-pointer shadow-[0_3px_0_hsl(330,80%,40%)] hover:translate-y-0.5 ${
                isGuestView 
                  ? "bg-white text-[hsl(330,80%,50%)] hover:bg-white/90" 
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              Donner une note
            </button>
            {isEditing && (
              <button
                onClick={() => setIsEditing(false)}
                className={`text-xs font-bold underline decoration-dotted transition-colors cursor-pointer ${
                  isGuestView ? "text-white/80 hover:text-white" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Annuler
              </button>
            )}
          </div>
        </div>
      )}

      {selectedScore !== null && selectedScore !== -1 && (
        <div className={`pt-4 border-t-2 border-dashed animate-in fade-in slide-in-from-top-4 space-y-4 ${isGuestView ? "border-white/30" : "border-border/80"}`}>
          <div className="flex flex-col gap-3">
            <div className="bg-card rounded-xl border-2 border-border focus-within:border-primary/50 transition-colors">
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
                className="w-full px-4 py-2.5 bg-transparent text-foreground font-medium focus:outline-none transition-colors text-sm resize-none overflow-y-hidden min-h-[44px] max-h-[150px] leading-relaxed"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="flex flex-col items-center gap-2.5 w-full">
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`w-full h-12 text-base font-display font-black rounded-xl hover:translate-y-0.5 active:translate-y-1 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 ${
                  isGuestView
                    ? "bg-[hsl(190,80%,50%)] text-white hover:bg-[hsl(190,80%,45%)] shadow-[0_4px_0_hsl(190,80%,35%)] hover:shadow-[0_1px_0_hsl(190,80%,35%)]"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_0_hsl(330,80%,40%)] hover:shadow-[0_1px_0_hsl(330,80%,40%)]"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Validation...
                  </>
                ) : (
                  "Valider mon avis"
                )}
              </Button>
              
              {isEditing && (
                <button
                  onClick={() => setIsEditing(false)}
                  className={`text-xs font-bold underline decoration-dotted transition-colors cursor-pointer py-1 ${
                    isGuestView ? "text-white/80 hover:text-white" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Annuler la modification
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Live Feed at the bottom, flat */}
      <PhotoWall placeId={placeId} guestName={guestName} />
    </div>
  );
}
