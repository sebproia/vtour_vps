"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ImagePlus, QrCode } from "lucide-react";
import type QrScanner from "qr-scanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getTourJoinPath } from "@/lib/tour-link";

export default function TourScanner() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigating = useRef(false);
  const mounted = useRef(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [readingImage, setReadingImage] = useState(false);
  const [error, setError] = useState("");
  const [link, setLink] = useState("");

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const join = useCallback((value: string) => {
    if (!mounted.current || navigating.current) return;
    const path = getTourJoinPath(value, window.location.origin);
    if (!path) {
      setError("Ce QR code ou ce lien ne correspond pas à une invitation Vitour. Essaie celui de ton organisateur.");
      return;
    }
    navigating.current = true;
    scannerRef.current?.stop();
    router.push(path);
  }, [router]);

  useEffect(() => {
    if (!cameraActive) return;
    let cancelled = false;
    let scanner: QrScanner | undefined;
    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera unavailable");
        const { default: Scanner } = await import("qr-scanner");
        if (cancelled || !videoRef.current) return;
        scanner = new Scanner(videoRef.current, result => join(result.data), {
          preferredCamera: "environment",
          maxScansPerSecond: 5,
          returnDetailedScanResult: true,
        });
        scannerRef.current = scanner;
        await scanner.start();
      } catch {
        if (cancelled) return;
        setCameraActive(false);
        setError("Caméra inaccessible. Autorise son accès dans les réglages du navigateur ou de la PWA, ou utilise une photo du QR code ou le lien du tour ci-dessous.");
      }
    }
    void start();
    return () => {
      cancelled = true;
      scanner?.destroy();
      if (scannerRef.current === scanner) scannerRef.current = null;
    };
  }, [cameraActive, join]);

  async function readImage(file: File) {
    scannerRef.current?.stop();
    setCameraActive(false);
    setReadingImage(true);
    setError("");
    try {
      const { default: Scanner } = await import("qr-scanner");
      if (!mounted.current) return;
      const result = await Scanner.scanImage(file, { returnDetailedScanResult: true });
      join(result.data);
    } catch {
      if (mounted.current) setError("Aucun QR code lisible sur cette image. Essaie une photo plus nette ou colle le lien du tour.");
    } finally {
      if (mounted.current) setReadingImage(false);
    }
  }

  return (
    <div className="rounded-3xl border-2 border-primary/20 bg-card p-4 shadow-lg space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-foreground">
        <video ref={videoRef} autoPlay muted playsInline aria-label="Aperçu de la caméra pour scanner le QR code" className={`size-full object-cover ${cameraActive ? "" : "hidden"}`} />
        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white p-6 text-center">
            <QrCode className="size-16 text-secondary" aria-hidden="true" />
            <p className="font-display font-bold">Le QR code te ramène dans le tour</p>
          </div>
        )}
      </div>
      <Button
        className="w-full min-h-12 rounded-xl bg-secondary text-secondary-foreground font-display font-bold"
        disabled={readingImage}
        onClick={() => { setError(""); setCameraActive(active => !active); }}
      >
        <Camera className="size-4" aria-hidden="true" /> {cameraActive ? "Arrêter la caméra" : "Activer la caméra"}
      </Button>
      {cameraActive && <p role="status" className="text-sm text-center">Cadre le QR code : le tour s’ouvrira automatiquement.</p>}
      {error && <p role="alert" className="text-sm text-red-700 bg-red-50 rounded-xl p-3">{error}</p>}
      <Button variant="outline" className="w-full min-h-11 rounded-xl" disabled={readingImage} onClick={() => fileRef.current?.click()}>
        <ImagePlus className="size-4" aria-hidden="true" /> {readingImage ? "Lecture de l’image…" : "Importer une photo du QR code"}
      </Button>
      <input ref={fileRef} type="file" accept="image/*" className="sr-only" aria-label="Photo du QR code" disabled={readingImage} onChange={event => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (file) void readImage(file);
      }} />
      <form className="space-y-2 border-t border-border pt-4" onSubmit={event => { event.preventDefault(); join(link); }}>
        <label htmlFor="tour-invitation" className="text-sm font-bold">Ou colle le lien d’invitation</label>
        <Input id="tour-invitation" type="text" inputMode="url" autoCapitalize="none" autoCorrect="off" placeholder="https://vtour-vps.vercel.app/join/…" value={link} onChange={event => setLink(event.target.value)} className="h-12 rounded-xl" />
        <Button type="submit" className="w-full min-h-11 rounded-xl" disabled={!link.trim()}>Rejoindre le tour</Button>
      </form>
    </div>
  );
}
