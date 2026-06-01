"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Sparkles } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    deferredPrompt: BeforeInstallPromptEvent | null;
  }
}

export default function InstallBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1. Check if already installed or dismissed
    if (typeof window === "undefined") return;

    const isStandalone = 
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ||
      false;

    const isDismissed = localStorage.getItem("vitour_pwa_dismissed") === "true";

    if (isStandalone || isDismissed) {
      return;
    }

    // 2. Check if the prompt event is already available (wrap in setTimeout to avoid synchronous setState in effect)
    if (window.deferredPrompt) {
      setTimeout(() => setIsVisible(true), 0);
    }

    // 3. Listen for custom installable event
    const handleInstallable = () => {
      setIsVisible(true);
    };

    const handleInstalled = () => {
      setIsVisible(false);
    };

    window.addEventListener("pwa-installable", handleInstallable);
    window.addEventListener("pwa-installed", handleInstalled);

    return () => {
      window.removeEventListener("pwa-installable", handleInstallable);
      window.removeEventListener("pwa-installed", handleInstalled);
    };
  }, []);


  const handleInstallClick = async () => {
    const promptEvent = window.deferredPrompt;
    if (!promptEvent) return;

    // Show the browser install prompt
    promptEvent.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await promptEvent.userChoice;
    console.log(`[PWA] User choice outcome: ${outcome}`);

    // We no longer need the prompt, clear it
    window.deferredPrompt = null;
    setIsVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("vitour_pwa_dismissed", "true");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg"
        >
          <div className="relative overflow-hidden bg-card/85 backdrop-blur-xl border-2 border-primary/40 rounded-3xl p-5 shadow-[0_20px_50px_rgba(242,64,153,0.15)] flex flex-col sm:flex-row items-center gap-4">
            
            {/* Ambient retro glowing backgrounds */}
            <div className="absolute -top-12 -left-12 w-24 h-24 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-secondary/20 rounded-full blur-2xl pointer-events-none" />

            {/* Icon / Brand */}
            <div className="relative flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-[0_4px_15px_rgba(242,64,153,0.3)]">
              <Sparkles className="w-6 h-6 text-white animate-pulse" />
            </div>

            {/* Copy */}
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-display font-bold text-lg text-foreground flex items-center justify-center sm:justify-start gap-1">
                Installez l&apos;app Vitour
              </h3>
              <p className="text-muted-foreground text-sm font-sans mt-0.5 leading-relaxed">
                Ajoutez Vitour à votre écran d&apos;accueil pour partager vos food tours en un clin d&apos;œil !
              </p>
            </div>


            {/* Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Plus tard
              </button>
              <button
                onClick={handleInstallClick}
                className="relative px-5 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold font-sans text-xs rounded-2xl flex items-center gap-1.5 transition-all shadow-[0_4px_12px_rgba(242,64,153,0.4)] active:scale-95 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Installer
              </button>
            </div>

            {/* Absolute close button on top right for mobile/easy dismiss */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-muted-foreground/60 hover:text-foreground p-1 rounded-full hover:bg-foreground/5 transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
