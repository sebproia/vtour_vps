"use client";

import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2, Copy } from "lucide-react";

export default function TourList() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const tours = useQuery(api.tours.getMyTours, isAuthenticated ? {} : "skip");
  const createTour = useMutation(api.tours.createTour);
  const deleteTour = useMutation(api.tours.deleteTour);
  const duplicateTour = useMutation(api.tours.duplicateTour);
  const [newTourName, setNewTourName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!newTourName.trim()) return;
    await createTour({ name: newTourName });
    setNewTourName("");
    setIsCreating(false);
  };

  if (isLoading || !isAuthenticated || tours === undefined) return <div className="text-xl font-bold font-display animate-pulse text-muted-foreground mt-12">Loading your tours... 🍩</div>;

  return (
    <div className="space-y-8 mt-12">
      {/* Create New Tour UI */}
      {isCreating ? (
        <Card className="border-4 border-secondary/50 rounded-[2rem] bg-secondary/10 shadow-lg">
          <CardContent className="pt-6 flex flex-col sm:flex-row gap-4">
            <Input 
              autoFocus
              placeholder="e.g. Best Burgers in Brooklyn" 
              className="h-14 text-xl rounded-xl border-2 font-medium"
              value={newTourName}
              onChange={(e) => setNewTourName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <Button size="lg" className="h-14 px-8 text-lg font-black font-display bg-primary text-primary-foreground rounded-xl" onClick={handleCreate}>
              Save
            </Button>
            <Button size="lg" variant="ghost" className="h-14 font-black" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex justify-start">
          <Button 
            size="lg" 
            onClick={() => setIsCreating(true)}
            className="h-14 px-8 text-xl rounded-2xl bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[0_6px_0_hsl(190,80%,40%)] hover:shadow-[0_2px_0_hsl(190,80%,40%)] hover:translate-y-1 transition-all font-display font-black"
          >
            + NEW TOUR
          </Button>
        </div>
      )}

      {/* Tours Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {tours.map((tour) => (
          <Card key={tour._id} className="border-4 border-primary/20 rounded-[2rem] overflow-hidden shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-2 hover:border-primary/40 bg-card group cursor-pointer">
            <CardHeader className="bg-primary/5 pb-6 border-b-4 border-transparent group-hover:border-primary/10 transition-colors">
              <CardTitle className="text-2xl font-bold flex items-center justify-between font-display">
                {tour.name}
                <span className={`text-sm font-bold py-1 px-4 rounded-full border-2 ${
                  tour.status === "live" ? "bg-red-500 text-white border-red-700 animate-pulse" :
                  tour.status === "completed" ? "bg-green-500 text-white border-green-700" :
                  "bg-accent text-accent-foreground border-accent-foreground/10"
                }`}>
                  {tour.status.toUpperCase()}
                </span>
              </CardTitle>
              <CardDescription className="text-lg font-medium flex items-center gap-3">
                <span>{tour.stopsCount} Stop{tour.stopsCount !== 1 ? "s" : ""} planned</span>
                {tour.status === "completed" && tour.averageScore && (
                  <span className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-sm font-bold border border-yellow-200">
                    ⭐ {tour.averageScore}/10
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              {tour.status === "completed" && (
                <Link href={`/recap/${tour._id}`} className="block w-full">
                  <Button className="w-full text-lg h-12 font-bold font-display border-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_0_hsl(330,80%,40%)] hover:shadow-[0_2px_0_hsl(330,80%,40%)] hover:translate-y-1 transition-all">
                    View Recap 📸
                  </Button>
                </Link>
              )}
              <div className="flex gap-2">
                <Link href={`/tour/${tour._id}`} className="block flex-1">
                  <Button variant="outline" className="w-full text-lg h-12 font-bold font-display border-2 rounded-xl border-border hover:bg-secondary/10 hover:text-secondary-foreground hover:border-secondary transition-colors">
                    Manage Tour
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="h-12 w-12 rounded-xl border-2 hover:bg-secondary/10 hover:text-secondary-foreground hover:border-secondary transition-colors"
                  onClick={async (e) => {
                    e.preventDefault();
                    if (confirm("Dupliquer ce tour ? (Les notes et photos ne seront pas copiées)")) {
                      await duplicateTour({ tourId: tour._id });
                    }
                  }}
                  title="Dupliquer le tour"
                >
                  <Copy className="w-5 h-5" />
                </Button>
                <Button 
                  variant="destructive" 
                  className="h-12 w-12 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 border-2 border-transparent hover:border-red-300 transition-colors"
                  onClick={async (e) => {
                    e.preventDefault();
                    if (confirm("Are you sure you want to delete this tour and all its memories?")) {
                      await deleteTour({ tourId: tour._id });
                    }
                  }}
                  title="Supprimer le tour"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {tours.length === 0 && !isCreating && (
          <div className="col-span-full text-center py-20 bg-muted/20 rounded-[3rem] border-4 border-dashed border-muted">
            <h3 className="text-3xl font-display font-black text-muted-foreground/50">No tours yet!</h3>
            <p className="text-xl text-muted-foreground/40 mt-2 font-medium">Click &quot;+ NEW TOUR&quot; to start your first incredible food journey.</p>
          </div>
        )}
      </div>
    </div>
  );
}
