import TourRecap from "@/components/TourRecap";
import ContinueInApp from "@/components/ContinueInApp";

export default async function RecapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="min-h-screen bg-background relative font-sans text-foreground">
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: "linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)",
          backgroundSize: "40px 40px",
          backgroundPosition: "0 0, 20px 20px"
        }}
      />
      <main className="relative z-10 p-6 md:p-12 max-w-4xl mx-auto h-screen overflow-y-auto">
        <ContinueInApp path={`/join/${id}`}/>
        <TourRecap tourId={id} />
      </main>
    </div>
  );
}
