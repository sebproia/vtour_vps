import Link from "next/link";
import { BookOpen, QrCode } from "lucide-react";

export default function HomeNavigation() {
  return (
    <nav aria-label="Accès rapides" className="grid grid-cols-2 gap-3">
      <Link
        href="/scan"
        className="flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-secondary/50 bg-card px-3 py-2 text-sm font-bold transition-colors hover:bg-secondary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
      >
        <QrCode className="size-5 shrink-0" aria-hidden="true" /> Rejoindre un
        tour
      </Link>
      <Link
        href="/mes-recaps"
        className="flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-primary/20 bg-card px-3 py-2 text-sm font-bold transition-colors hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <BookOpen className="size-5 shrink-0" aria-hidden="true" /> Mon carnet
      </Link>
    </nav>
  );
}
