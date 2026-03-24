import GuestApp from "@/components/GuestApp";

export default async function JoinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="min-h-screen bg-[hsl(330,80%,60%)] relative overflow-x-hidden">
      {/* Checkered pattern like landing page */}
      <div 
        className="absolute inset-0 opacity-[0.06] pointer-events-none" 
        style={{
          backgroundImage: "linear-gradient(45deg, #fff 25%, transparent 25%, transparent 75%, #fff 75%, #fff), linear-gradient(45deg, #fff 25%, transparent 25%, transparent 75%, #fff 75%, #fff)",
          backgroundSize: "30px 30px",
          backgroundPosition: "0 0, 15px 15px"
        }}
      />
      <main className="relative z-10 px-4 py-6 w-full max-w-md mx-auto">
        <GuestApp tourId={id} />
      </main>
    </div>
  );
}
