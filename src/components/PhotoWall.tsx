"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, ImagePlus } from "lucide-react";
import Image from "next/image";

export default function PhotoWall({ placeId, guestName }: { placeId: Id<"places">, guestName: string }) {
  const photos = useQuery(api.photos.getPhotosByPlace, { placeId });
  const generateUploadUrl = useMutation(api.photos.generateUploadUrl);
  const savePhoto = useMutation(api.photos.savePhoto);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Get short-lived upload URL
      const postUrl = await generateUploadUrl();
      
      // 2. Upload file
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      
      // 3. Save reference in DB
      await savePhoto({
        placeId,
        uploaderName: guestName,
        storageId,
      });
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Oops! Impossible de charger la photo.");
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="border-4 border-primary/20 bg-card rounded-[2rem] shadow-xl mt-8">
      <CardContent className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-display font-black text-foreground flex items-center gap-2">
            <Camera className="text-primary w-6 h-6" /> Live Feed
          </h3>
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="rounded-xl font-bold font-display shadow-[0_4px_0_hsl(190,80%,40%)] hover:translate-y-1 hover:shadow-[0_2px_0_hsl(190,80%,40%)] transition-all bg-secondary hover:bg-secondary/90 text-secondary-foreground"
          >
            {isUploading ? "Uploading... ⏳" : <><ImagePlus className="mr-2 w-5 h-5" /> Add Photo</>}
          </Button>
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleUpload} 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {photos?.map((photo) => (
            <div key={photo._id} className="relative aspect-square border-4 border-border rounded-2xl overflow-hidden shadow-sm group">
              {photo.url && <Image src={photo.url} alt="Food photo" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />}
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                <span className="text-white text-xs font-bold shadow-black drop-shadow-md">📸 by {photo.uploaderName}</span>
              </div>
            </div>
          ))}

          {photos && photos.length === 0 && (
            <div className="col-span-2 text-center py-8 text-muted-foreground/50 border-4 border-dashed rounded-2xl border-muted">
              <span className="text-4xl block mb-2">📸</span>
              <p className="font-medium">No photos yet.<br/>Be the first to snap this dish!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
