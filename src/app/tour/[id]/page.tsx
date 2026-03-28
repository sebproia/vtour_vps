import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import TourDetails from "@/components/TourDetails";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function TourPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  const { id } = await params;

  if (!userId) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <div 
        className="fixed inset-0 opacity-[0.02] pointer-events-none" 
        style={{
          backgroundImage: "linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)",
          backgroundSize: "40px 40px",
          backgroundPosition: "0 0, 20px 20px"
        }}
      />
      
      <main className="w-full max-w-6xl mx-auto px-3 sm:px-6 pt-4 sm:pt-8 pb-12 space-y-4 sm:space-y-6 relative z-10">
        <div className="flex justify-between items-center bg-card p-3 sm:p-4 rounded-2xl border-2 border-border shadow-md">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-10 h-10 flex items-center justify-center rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors border border-border">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-display font-black text-primary drop-shadow-sm tracking-tight">Tour Builder</h1>
          </div>
          <UserButton appearance={{ elements: { userButtonAvatarBox: "w-10 h-10" } }} />
        </div>

        <TourDetails tourId={id} />
      </main>
    </div>
  );
}
