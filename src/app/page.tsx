import { auth } from "@clerk/nextjs/server";
import { SignInButton, UserButton } from "@clerk/nextjs";
import TourList from "@/components/TourList";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Shrikhand } from "next/font/google";
import AuthSync from "@/components/AuthSync";

const shrikhand = Shrikhand({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-primary relative overflow-hidden">
        <AuthSync />
        {/* Retro checkered pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{
            backgroundImage: "linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)",
            backgroundSize: "60px 60px",
            backgroundPosition: "0 0, 30px 30px"
          }}
        />
        <div className="z-10 text-center space-y-4 p-6 md:p-10 w-full max-w-lg bg-white/10 backdrop-blur-xl rounded-[3rem] border-4 border-white/20 shadow-2xl relative">
          
          <div className="relative w-full flex flex-col items-center mt-4 mb-8">
            <div className="relative w-64 h-64 mx-auto animate-[spin_12s_linear_infinite]">
              <Image 
                src="/donut.png" 
                alt="Donut Logo" 
                fill
                className="object-contain scale-125 drop-shadow-2xl mix-blend-multiply contrast-125" 
              />
            </div>
            
            {/* Title floating over the donut */}
            <div className={`absolute top-[85%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] md:w-[130%] z-20 pointer-events-none mt-4 ${shrikhand.className}`}>
              <h1 className="text-7xl sm:text-[6rem] tracking-tight text-white drop-shadow-[0_8px_0_#ff2a6d,0_2px_15px_rgba(0,0,0,0.5)] transform -rotate-6 text-center leading-none" style={{ WebkitTextStroke: '2px #ff2a6d' }}>
                Vitour
              </h1>
            </div>
          </div>

          <div className="space-y-2 pb-6">
            <p className="text-3xl font-display font-black text-white drop-shadow-md z-30 relative decoration-[#ff2a6d] decoration-4 underline-offset-8">
              ça vaut le détour
            </p>
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
      
      <main className="w-full max-w-6xl mx-auto px-3 sm:px-6 pt-8 sm:pt-16 space-y-6 relative z-10">
        <div className="flex justify-between items-center bg-card p-3 sm:p-4 rounded-2xl border-2 border-border shadow-md select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 p-1 flex-shrink-0">
               <Image src="/donut.png" alt="Vito" width={22} height={22} className="drop-shadow-sm mix-blend-multiply contrast-125 animate-[spin_12s_linear_infinite]" />
            </div>
            <h1 className={`text-2xl sm:text-3xl tracking-tight text-primary drop-shadow-sm ${shrikhand.className}`}>
              Vitour
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <UserButton appearance={{ elements: { userButtonAvatarBox: "w-9 h-9" } }} />
          </div>
        </div>

        <TourList />
      </main>
    </div>
  );
}
