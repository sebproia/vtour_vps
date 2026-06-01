"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";

export default function AuthSync() {
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      console.log("[AuthSync] Client is signed in but server rendered logged-out view. Reloading...");
      window.location.reload();
    }
  }, [isSignedIn, isLoaded]);

  return null;
}
