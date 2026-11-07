import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import TourScanner from "@/components/TourScanner";

export default function ScanPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-md space-y-5">
        <Link href="/" className="inline-flex min-h-11 items-center gap-1 text-sm font-bold">
          <ChevronLeft className="size-4" aria-hidden="true" /> Accueil
        </Link>
        <header className="space-y-2">
          <h1 className="font-display text-3xl font-black text-foreground">Rejoindre un tour</h1>
          <p className="text-sm text-foreground/80">Scanne le QR code de ton organisateur pour participer, sans créer de compte.</p>
        </header>
        <TourScanner />
      </div>
    </main>
  );
}
