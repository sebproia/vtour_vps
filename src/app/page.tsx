import { auth } from "@clerk/nextjs/server";
import { SignInButton, UserButton } from "@clerk/nextjs";
import TourList from "@/components/TourList";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-primary relative overflow-hidden">
        {/* Retro checkered pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{
            backgroundImage: "linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)",
            backgroundSize: "60px 60px",
            backgroundPosition: "0 0, 30px 30px"
          }}
        />
        <div className="z-10 text-center space-y-8 p-10 max-w-lg bg-white/10 backdrop-blur-xl rounded-[3rem] border-4 border-white/20 shadow-2xl">
          <Image 
            src="/logo.png" 
            alt="Vitour Logo" 
            width={240} 
            height={240} 
            className="mx-auto drop-shadow-2xl animate-bounce [animation-duration:3s] mix-blend-multiply contrast-125" 
          />
          <div className="space-y-2">
            <h1 className="text-7xl font-display font-black tracking-tighter text-white drop-shadow-md">VITOUR</h1>
            <p className="text-2xl font-medium text-white/90">Good vibes & great food. 🍩</p>
          </div>
          <SignInButton mode="modal">
            <Button size="lg" className="w-full text-xl h-16 rounded-2xl font-display font-black bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-transform hover:scale-105 shadow-[0_8px_0_hsl(190,80%,40%)] hover:shadow-[0_4px_0_hsl(190,80%,40%)] hover:translate-y-1">
              START ORGANIZING
            </Button>
          </SignInButton>
        </div>
      </div>
    );
  }

  // Dashboard for logged-in Organizer
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
      
      <main className="container mx-auto p-6 pt-32 space-y-8 relative z-10">
        <div className="flex justify-between items-center bg-card p-8 rounded-3xl border-4 border-border shadow-xl">
          <div className="flex gap-6 items-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center p-2 border-2 border-primary">
               <Image src="/logo.png" alt="Vito" width={60} height={60} className="drop-shadow-sm mix-blend-multiply contrast-125" />
            </div>
            <div>
              <h1 className="text-5xl font-display font-black text-primary drop-shadow-sm tracking-tight">My Tours</h1>
              <p className="text-xl font-medium text-muted-foreground mt-2">Ready for the next bite, Vito? 🍔</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <UserButton appearance={{ elements: { userButtonAvatarBox: "w-12 h-12" } }} />
          </div>
        </div>

        <TourList organizerId={userId} />
      </main>
    </div>
  );
}
