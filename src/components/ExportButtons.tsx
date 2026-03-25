"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share, Loader2 } from "lucide-react";
import { domToPng, domToCanvas } from "modern-screenshot";
import jsPDF from "jspdf";

interface ExportButtonsProps {
  targetId: string;
  tourName: string;
}

export default function ExportButtons({ targetId, tourName }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    const element = document.getElementById(targetId);
    if (!element) return;

    setIsExporting(true);
    try {
      // Capture at higher resolution for quality
      const canvas = await domToCanvas(element, { 
        scale: 2, 
        backgroundColor: "#fdfbf7",
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // mm margin on each side
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;

      // Calculate the image dimensions relative to the PDF page
      const imgWidthPx = canvas.width;
      const imgHeightPx = canvas.height;
      const imgAspect = imgHeightPx / imgWidthPx;
      const totalImgHeightMm = usableWidth * imgAspect;

      // If it fits on one page, just add it
      if (totalImgHeightMm <= usableHeight) {
        const imgData = canvas.toDataURL("image/jpeg", 0.92);
        pdf.addImage(imgData, "JPEG", margin, margin, usableWidth, totalImgHeightMm);
      } else {
        // Multi-page: slice the canvas into page-sized chunks
        const pxPerMm = imgWidthPx / usableWidth;
        const sliceHeightPx = usableHeight * pxPerMm;
        const totalPages = Math.ceil(imgHeightPx / sliceHeightPx);

        for (let page = 0; page < totalPages; page++) {
          if (page > 0) pdf.addPage();

          const sourceY = page * sliceHeightPx;
          const sourceH = Math.min(sliceHeightPx, imgHeightPx - sourceY);
          const destH = (sourceH / pxPerMm);

          // Create a sub-canvas for this page slice
          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = imgWidthPx;
          pageCanvas.height = sourceH;
          const ctx = pageCanvas.getContext("2d");
          if (!ctx) continue;

          ctx.fillStyle = "#fdfbf7";
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(canvas, 0, sourceY, imgWidthPx, sourceH, 0, 0, imgWidthPx, sourceH);

          const pageData = pageCanvas.toDataURL("image/jpeg", 0.92);
          pdf.addImage(pageData, "JPEG", margin, margin, usableWidth, destH);
        }
      }

      pdf.save(`Food-Tour-${tourName.replace(/\s+/g, '-')}.pdf`);
    } catch (err) {
      console.error("Erreur PDF:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareImage = async () => {
    const element = document.getElementById(targetId);
    if (!element) return;

    setIsExporting(true);
    try {
      // Capture at scale 2 for good quality
      const dataUrl = await domToPng(element, { 
        backgroundColor: '#fdfbf7', 
        scale: 2,
      });
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      const file = new File([blob], `Food-Tour-${tourName.replace(/\s+/g, '-')}.png`, { type: "image/png" });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `Food Tour: ${tourName}`,
            text: "Check out this amazing food tour recap!",
            files: [file],
          });
        } catch (error) {
          console.log("Partage annulé ou échoué", error);
        }
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error generating or sharing image:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex gap-4 w-full">
      <Button 
        onClick={handleShareImage}
        disabled={isExporting}
        className="flex-1 h-14 rounded-2xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-[0_4px_0_hsl(220,90%,30%)] hover:shadow-[0_0px_0_hsl(220,90%,30%)] hover:translate-y-1 transition-all"
      >
        {isExporting ? <Loader2 className="animate-spin" /> : <Share className="mr-2" />} 
        Share Image
      </Button>
      <Button 
        onClick={handleExportPDF}
        disabled={isExporting}
        className="flex-1 h-14 rounded-2xl font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-[0_4px_0_hsl(45,90%,40%)] hover:shadow-[0_0px_0_hsl(45,90%,40%)] hover:translate-y-1 transition-all"
      >
        {isExporting ? <Loader2 className="animate-spin" /> : <Download className="mr-2" />} 
        Save PDF
      </Button>
    </div>
  );
}
