"use client";

import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2, Copy, Download, Globe, Pencil } from "lucide-react";

interface TourWithPhotos {
  _id: Id<"tours">;
  _creationTime: number;
  name: string;
  organizerId: string;
  status: "draft" | "live" | "completed";
  currentStepIndex: number;
  date?: string;
  isPublic?: boolean;
  stopsCount: number;
  averageScore: number | null;
  previewPhotos: string[];
}

export default function TourList() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const tours = useQuery(api.tours.getMyTours, isAuthenticated ? {} : "skip") as TourWithPhotos[] | undefined;
  const publicTours = useQuery(api.tours.getPublicTours, isAuthenticated ? {} : "skip") as TourWithPhotos[] | undefined;
  
  const createTour = useMutation(api.tours.createTour);
  const deleteTour = useMutation(api.tours.deleteTour);
  const duplicateTour = useMutation(api.tours.duplicateTour);
  const importPublicTour = useMutation(api.tours.importPublicTour);

  const [activeTab, setActiveTab] = useState<"my-tours" | "marketplace">("my-tours");
  const [newTourName, setNewTourName] = useState("");
  const [newTourDate, setNewTourDate] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newTourName.trim()) return;
    await createTour({ name: newTourName, date: newTourDate || undefined });
    setNewTourName("");
    setNewTourDate("");
    setIsCreating(false);
  };

  const handleImport = async (tourId: any) => {
    if (confirm("Importer ce food tour ? Cela va créer une copie vierge sous votre compte afin que vous puissiez l'adapter !")) {
      setIsImporting(tourId);
      try {
        const newTourId = await importPublicTour({ tourId });
        window.location.href = `/tour/${newTourId}`;
      } catch (error) {
        console.error("Error importing tour:", error);
        alert("Erreur lors de l'import : " + (error as Error).message);
      } finally {
        setIsImporting(null);
      }
    }
  };

  if (isLoading || !isAuthenticated || tours === undefined || publicTours === undefined) {
    return <div className="text-xl font-bold font-display animate-pulse text-muted-foreground mt-12">Loading your tours... 🍩</div>;
  }

  return (
    <div className="space-y-6 mt-6">
      {/* Dynamic diner-style tabs */}
      <div className="flex gap-2 p-1.5 bg-card/60 backdrop-blur-sm rounded-2xl border-2 border-border shadow-inner max-w-sm sm:max-w-md select-none">
        <button
          onClick={() => setActiveTab("my-tours")}
          className={`flex-grow py-2.5 px-4 sm:px-6 text-sm font-display font-black rounded-xl transition-all cursor-pointer ${
            activeTab === "my-tours"
              ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/10"
          }`}
        >
          🍩 Mes Tours
        </button>
        <button
          onClick={() => setActiveTab("marketplace")}
          className={`flex-grow py-2.5 px-4 sm:px-6 text-sm font-display font-black rounded-xl transition-all cursor-pointer ${
            activeTab === "marketplace"
              ? "bg-secondary text-secondary-foreground shadow-md scale-[1.02]"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/10"
          }`}
        >
          🌐 Découvrir
        </button>
      </div>

      {activeTab === "my-tours" ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Create New Tour UI */}
          {isCreating ? (
            <Card className="border-4 border-secondary/50 rounded-[2rem] bg-secondary/10 shadow-lg">
              <CardContent className="pt-6 flex flex-col sm:flex-row gap-4 items-end sm:items-center">
                <div className="flex-1 space-y-1 w-full">
                  <label className="text-xs font-bold text-muted-foreground/80 pl-1">Nom du Tour 🍔</label>
                  <Input 
                    autoFocus
                    placeholder="e.g. Best Burgers in Brooklyn" 
                    className="h-14 text-xl rounded-xl border-2 font-medium bg-card"
                    value={newTourName}
                    onChange={(e) => setNewTourName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  />
                </div>
                <div className="w-full sm:w-56 space-y-1">
                  <label className="text-xs font-bold text-muted-foreground/80 pl-1">Date du Tour 📅</label>
                  <Input 
                    type="date"
                    className="h-14 text-lg rounded-xl border-2 font-medium bg-card block w-full"
                    value={newTourDate}
                    onChange={(e) => setNewTourDate(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 w-full sm:w-auto pt-5 sm:pt-0">
                  <Button size="lg" className="h-14 px-8 text-lg font-black font-display bg-primary text-primary-foreground rounded-xl flex-grow sm:flex-grow-0 cursor-pointer" onClick={handleCreate}>
                    Enregistrer
                  </Button>
                  <Button size="lg" variant="ghost" className="h-14 font-black cursor-pointer" onClick={() => setIsCreating(false)}>
                    Annuler
                  </Button>
                </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tours.map((tour) => (
              <div key={tour._id} className="relative group">
                <Link href={`/tour/${tour._id}`} className="block">
                  <Card className="border-2 sm:border-4 border-primary/20 rounded-[2rem] overflow-hidden shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-1.5 hover:border-primary/40 bg-card">
                    {/* Visual Preview Photos */}
                    {tour.previewPhotos && tour.previewPhotos.length > 0 ? (
                      <div className="flex gap-1.5 px-4 pt-4 select-none">
                        {tour.previewPhotos.map((url, i) => (
                          <div key={i} className="relative flex-1 aspect-[4/3] rounded-xl overflow-hidden border border-border shadow-sm">
                            <img src={url} alt="Aperçu" className="object-cover w-full h-full" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 pt-4 select-none">
                        <div className="w-full h-12 bg-muted/30 rounded-xl border border-dashed border-border/60 flex items-center justify-center text-xs font-bold text-muted-foreground/50">
                          🍩 Pas encore de photos de dégustation
                        </div>
                      </div>
                    )}

                    <CardHeader className="pt-4 pb-4">
                      <CardTitle className="text-xl sm:text-2xl font-bold flex items-center justify-between font-display gap-2">
                        <span className="truncate">{tour.name}</span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {tour.isPublic && (
                            <span className="text-[9px] font-black py-0.5 px-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-900 flex items-center gap-0.5" title="Public sur Découvrir">
                              <Globe className="w-2.5 h-2.5" /> PUB
                            </span>
                          )}
                          <span className={`text-xs font-bold py-0.5 px-3 rounded-full border ${
                            tour.status === "live" ? "bg-red-500 text-white border-red-700 animate-pulse" :
                            tour.status === "completed" ? "bg-green-500 text-white border-green-700" :
                            "bg-accent text-accent-foreground border-accent-foreground/10"
                          }`}>
                            {tour.status.toUpperCase()}
                          </span>
                        </div>
                      </CardTitle>
                      <CardDescription className="text-xs font-medium flex flex-wrap items-center gap-x-2.5 gap-y-1.5 mt-1">
                        <span className="text-primary font-bold">📅 {(() => {
                          const dateStr = tour.date || new Date(tour._creationTime).toISOString().split('T')[0];
                          try {
                            const d = new Date(dateStr);
                            return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
                          } catch {
                            return dateStr;
                          }
                        })()}</span>
                        <span className="text-muted-foreground/60">•</span>
                        <span>{tour.stopsCount} stop{tour.stopsCount !== 1 ? "s" : ""}</span>
                        {tour.status === "completed" && tour.averageScore && (
                          <span className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-300 px-2 py-0.5 rounded-full text-[10px] font-bold border border-yellow-200 dark:border-yellow-900 ml-auto">
                            ⭐ {tour.averageScore}/10
                          </span>
                        )}
                      </CardDescription>
                    </CardHeader>
                    
                    {/* Compact actions container */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/40 px-4 pb-4 mt-1" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">Actions rapides</span>
                      <div className="flex gap-2">
                        <Link href={`/tour/${tour._id}`} title="Gérer le tour" onClick={(e) => e.stopPropagation()}>
                          <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border border-border hover:bg-secondary/10 hover:text-secondary-foreground hover:border-secondary transition-colors cursor-pointer">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-9 w-9 rounded-full border border-border hover:bg-secondary/10 hover:text-secondary-foreground hover:border-secondary transition-colors cursor-pointer"
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (confirm("Dupliquer ce tour ? (Les notes et photos ne seront pas copiées)")) {
                              await duplicateTour({ tourId: tour._id });
                            }
                          }}
                          title="Dupliquer le tour"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="icon"
                          className="h-9 w-9 rounded-full bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900 border border-transparent hover:border-red-200 dark:hover:border-red-800 transition-colors cursor-pointer"
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (confirm("Are you sure you want to delete this tour and all its memories?")) {
                              await deleteTour({ tourId: tour._id });
                            }
                          }}
                          title="Supprimer le tour"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Link>
              </div>
            ))}

            {tours.length === 0 && !isCreating && (
              <div className="col-span-full text-center py-20 bg-muted/20 rounded-[3rem] border-4 border-dashed border-muted">
                <h3 className="text-3xl font-display font-black text-muted-foreground/50">No tours yet!</h3>
                <p className="text-xl text-muted-foreground/40 mt-2 font-medium">Click &quot;+ NEW TOUR&quot; to start your first incredible food journey.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-primary/5 p-4 rounded-2xl border-2 border-primary/10 max-w-xl text-sm text-primary font-medium flex items-start gap-2.5">
            <span className="text-xl">💡</span>
            <p>Découvrez tous les parcours partagés par d&apos;autres gourmets. Vous pouvez les **importer** pour créer une copie vierge à votre nom et l&apos;ajuster à votre goût !</p>
          </div>

          {/* Public Tours Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicTours.map((tour) => (
              <Card key={tour._id} className="border-2 sm:border-4 border-secondary/20 rounded-[2rem] overflow-hidden shadow-xl hover:shadow-secondary/30 transition-all bg-card">
                {/* Visual Preview Photos */}
                {tour.previewPhotos && tour.previewPhotos.length > 0 ? (
                  <div className="flex gap-1.5 px-4 pt-4 select-none">
                    {tour.previewPhotos.map((url, i) => (
                      <div key={i} className="relative flex-1 aspect-[4/3] rounded-xl overflow-hidden border border-border shadow-sm">
                        <img src={url} alt="Aperçu" className="object-cover w-full h-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 pt-4 select-none">
                    <div className="w-full h-12 bg-muted/30 rounded-xl border border-dashed border-border/60 flex items-center justify-center text-xs font-bold text-muted-foreground/50">
                      🍩 Pas encore de photos de dégustation
                    </div>
                  </div>
                )}

                <CardHeader className="pt-4 pb-4">
                  <CardTitle className="text-xl sm:text-2xl font-bold font-display truncate">
                    {tour.name}
                  </CardTitle>
                  <CardDescription className="text-xs font-medium flex flex-wrap items-center gap-x-2.5 gap-y-1.5 mt-1">
                    <span className="text-secondary font-bold">📅 {(() => {
                      const dateStr = tour.date || new Date(tour._creationTime).toISOString().split('T')[0];
                      try {
                        const d = new Date(dateStr);
                        return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
                      } catch {
                        return dateStr;
                      }
                    })()}</span>
                    <span className="text-muted-foreground/60">•</span>
                    <span>{tour.stopsCount} stop{tour.stopsCount !== 1 ? "s" : ""}</span>
                    {tour.status === "completed" && tour.averageScore && (
                      <span className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-300 px-2 py-0.5 rounded-full text-[10px] font-bold border border-yellow-200 dark:border-yellow-900 ml-auto">
                        ⭐ {tour.averageScore}/10
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                
                {/* Compact actions container */}
                <div className="flex items-center justify-between pt-3 border-t border-border/40 px-4 pb-4 mt-1">
                  <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">Découverte</span>
                  <Button 
                    disabled={isImporting !== null}
                    onClick={() => handleImport(tour._id)}
                    className="h-9 px-4 text-xs font-display font-black border-2 rounded-xl bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-[0_2.5px_0_hsl(190,80%,40%)] hover:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isImporting === tour._id ? (
                      <>Importation...</>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" /> Importer 📥
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            ))}

            {publicTours.length === 0 && (
              <div className="col-span-full text-center py-20 bg-muted/20 rounded-[3rem] border-4 border-dashed border-muted">
                <h3 className="text-3xl font-display font-black text-muted-foreground/50">La Marketplace est vide !</h3>
                <p className="text-xl text-muted-foreground/40 mt-2 font-medium">Soyez le premier à partager un tour public en cliquant sur &quot;Rendre Public&quot; dans l&apos;écran de gestion.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
