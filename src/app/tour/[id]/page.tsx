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

  // The id is the Convex tourId
  return (
    <div className="min-h-screen bg-background relative">
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none" 
        style={{
          backgroundImage: "linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)",
          backgroundSize: "40px 40px",
          backgroundPosition: "0 0, 20px 20px"
        }}
      />
      
      <main className="container mx-auto p-6 pt-12 space-y-8 relative z-10">
        <div className="flex justify-between items-center bg-card p-6 rounded-3xl border-4 border-border shadow-md">
          <div className="flex items-center gap-6">
            <Link href="/" className="w-12 h-12 flex items-center justify-center rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors border-2 border-border">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-4xl font-display font-black text-primary drop-shadow-sm tracking-tight hidden md:block">Tour Builder</h1>
          </div>
          <UserButton appearance={{ elements: { userButtonAvatarBox: "w-12 h-12" } }} />
        </div>

        <TourDetails tourId={id} />
      </main>
    </div>
  );
}
