"use client";

import { useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Extend window interface for TypeScript
declare global {
  interface Window {
    deferredPrompt: BeforeInstallPromptEvent | null;
  }
}


export default function PWARegister() {
  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("[PWA] Service Worker registered with scope:", reg.scope);
          })
          .catch((err) => {
            console.error("[PWA] Service Worker registration failed:", err);
          });
      });
    }

    // 2. Listen for BeforeInstallPrompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      window.deferredPrompt = e as BeforeInstallPromptEvent;
      
      console.log("[PWA] beforeinstallprompt event captured");
      // Dispatch custom event to notify the banner
      window.dispatchEvent(new CustomEvent("pwa-installable"));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 3. Listen for successful installation
    const handleAppInstalled = () => {
      console.log("[PWA] App successfully installed!");
      window.deferredPrompt = null;
      window.dispatchEvent(new CustomEvent("pwa-installed"));
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  return null;
}
