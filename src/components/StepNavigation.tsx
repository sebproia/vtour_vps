"use client";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
export default function StepNavigation({
  index,
  count,
  onChange,
  guest = false,
}: {
  index: number;
  count: number;
  onChange: (index: number) => void;
  guest?: boolean;
}) {
  const button = `inline-flex size-11 shrink-0 items-center justify-center rounded-xl border-2 disabled:opacity-30 ${guest ? "border-white/40 bg-white/15 text-white" : "border-border bg-card text-foreground"}`;
  return (
    <nav
      aria-label="Navigation entre les étapes"
      className="flex items-center gap-2 select-none"
    >
      <button
        type="button"
        className={button}
        aria-label="Étape précédente"
        disabled={index <= 0}
        onClick={() => onChange(index - 1)}
      >
        <ChevronLeft aria-hidden="true" className="size-5" />
      </button>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={(_event, info) => {
          if (info.offset.x < -50 && index < count - 1) onChange(index + 1);
          if (info.offset.x > 50 && index > 0) onChange(index - 1);
        }}
        className={`min-h-11 flex-1 flex items-center justify-center rounded-xl px-2 text-center text-xs font-bold touch-pan-y cursor-grab ${guest ? "bg-white/15 text-white" : "bg-muted/50 text-foreground"}`}
      >
        ← Glisser ici · {index + 1}/{count} →
      </motion.div>
      <button
        type="button"
        className={button}
        aria-label="Étape suivante"
        disabled={index >= count - 1}
        onClick={() => onChange(index + 1)}
      >
        <ChevronRight aria-hidden="true" className="size-5" />
      </button>
    </nav>
  );
}
