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

  // Compress image client-side to keep high quality but small file size (fluidity)
  const compressImage = (file: File): Promise<Blob | File> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith("image/")) {
        resolve(file);
        return;
      }

      const img = document.createElement("img");
      const reader = new FileReader();

      reader.onload = (e) => {
        if (!e.target?.result) {
          resolve(file);
          return;
        }
        img.src = e.target.result as string;
      };

      img.onload = () => {
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          0.88 // Best balance: 88% quality is highly detailed but very lightweight (150-250KB)
        );
      };

      img.onerror = () => {
        resolve(file);
      };

      reader.onerror = () => {
        resolve(file);
      };

      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    setIsUploading(true);
    try {
      // Compress image prior to uploading (reduces raw file from ~5-10MB to ~150-250KB)
      const fileToUpload = await compressImage(rawFile);

      // 1. Get short-lived upload URL
      const postUrl = await generateUploadUrl();
      
      // 2. Upload file
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": fileToUpload.type },
        body: fileToUpload,
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
    <div className="mt-6 pt-4 border-t-2 border-dashed border-border/80 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-display font-black text-foreground flex items-center gap-2">
          <Camera className="text-primary w-5 h-5" /> Live Feed
        </h3>
        <Button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="rounded-xl font-bold font-display shadow-[0_4px_0_hsl(190,80%,40%)] hover:translate-y-1 hover:shadow-[0_2px_0_hsl(190,80%,40%)] transition-all bg-secondary hover:bg-secondary/90 text-secondary-foreground"
        >
          {isUploading ? "Uploading... ⏳" : <><ImagePlus className="mr-2 w-4 h-4" /> Add Photo</>}
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
            {photo.url && (
              <Image 
                src={photo.url} 
                alt="Food photo" 
                fill 
                sizes="(max-width: 480px) 50vw, 200px"
                quality={88}
                className="object-cover group-hover:scale-110 transition-transform duration-500" 
              />
            )}
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
              <span className="text-white text-xs font-bold shadow-black drop-shadow-md">📸 by {photo.uploaderName}</span>
            </div>
          </div>
        ))}

        {photos && photos.length === 0 && (
          <div className="col-span-2 text-center py-8 text-muted-foreground/50 border-4 border-dashed rounded-2xl border-muted">
            <span className="text-4xl block mb-2">📸</span>
            <p className="font-medium text-xs">No photos yet.<br/>Be the first to snap this dish!</p>
          </div>
        )}
      </div>
    </div>
  );
}
