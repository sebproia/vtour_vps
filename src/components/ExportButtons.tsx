"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share, Loader2, ImageDown } from "lucide-react";
import { domToPng, domToCanvas } from "modern-screenshot";
import jsPDF from "jspdf";

interface ExportButtonsProps {
  targetId: string;
  tourName: string;
}

export default function ExportButtons({ targetId, tourName }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const safeName = tourName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');

  const handleExportPDF = async () => {
    const element = document.getElementById(targetId);
    if (!element) return;

    setIsExporting(true);
    setExportStatus("Generating PDF...");
    try {
      const canvas = await domToCanvas(element, { 
        scale: 2, 
        backgroundColor: "#fdfbf7",
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;

      const imgWidthPx = canvas.width;
      const imgHeightPx = canvas.height;
      const imgAspect = imgHeightPx / imgWidthPx;
      const totalImgHeightMm = usableWidth * imgAspect;

      if (totalImgHeightMm <= usableHeight) {
        const imgData = canvas.toDataURL("image/jpeg", 0.92);
        pdf.addImage(imgData, "JPEG", margin, margin, usableWidth, totalImgHeightMm);
        
        // Add explicit text link for mobile compatibility
        pdf.setFontSize(11);
        pdf.setTextColor(255, 42, 109);
        // Place it just below the image, or at the bottom margin if it fills the page
        const yPos = Math.min(pageHeight - 4, margin + totalImgHeightMm + 6);
        pdf.textWithLink("🔗 Click here to view online", pageWidth / 2, yPos, { url: window.location.href, align: "center" });
      } else {
        const pxPerMm = imgWidthPx / usableWidth;
        const sliceHeightPx = usableHeight * pxPerMm;
        const totalPages = Math.ceil(imgHeightPx / sliceHeightPx);

        for (let page = 0; page < totalPages; page++) {
          if (page > 0) pdf.addPage();
          const sourceY = page * sliceHeightPx;
          const sourceH = Math.min(sliceHeightPx, imgHeightPx - sourceY);
          const destH = sourceH / pxPerMm;

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

          if (page === totalPages - 1) {
            pdf.setFontSize(11);
            pdf.setTextColor(255, 42, 109);
            pdf.textWithLink("🔗 Click here to view online", pageWidth / 2, pageHeight - 4, { url: window.location.href, align: "center" });
          }
        }
      }

      pdf.save(`Food-Tour-${safeName}.pdf`);
      setExportStatus("PDF saved! ✅");
    } catch (err) {
      console.error("Erreur PDF:", err);
      setExportStatus("PDF error ❌");
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportStatus(null), 3000);
    }
  };

  const handleDownloadImage = async () => {
    const element = document.getElementById(targetId);
    if (!element) return;

    setIsExporting(true);
    setExportStatus("Generating image...");
    try {
      // Use scale 1 on mobile to avoid memory issues, scale 2 on desktop
      const dataUrl = await domToPng(element, { 
        backgroundColor: '#fdfbf7', 
        scale: 2,
      });

      // Try native share first (works on mobile)
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `Food-Tour-${safeName}.png`, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `Food Tour: ${tourName}`,
            text: "Check out this food tour recap!",
            files: [file],
          });
          setExportStatus("Shared! ✅");
        } catch (error: unknown) {
          // User cancelled share — fall back to download
          if ((error as Error)?.name !== 'AbortError') {
            downloadBlob(blob, `Food-Tour-${safeName}.png`);
            setExportStatus("Downloaded! ✅");
          }
        }
      } else {
        // Fallback: direct download
        downloadBlob(blob, `Food-Tour-${safeName}.png`);
        setExportStatus("Downloaded! ✅");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      setExportStatus("Error ❌");
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportStatus(null), 3000);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    // Required for iOS Safari
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    // Cleanup after a delay (mobile needs time)
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  };

  return (
    <div className="space-y-2 w-full">
      {exportStatus && (
        <p className="text-center text-sm font-medium text-muted-foreground animate-in fade-in">{exportStatus}</p>
      )}
      <div className="flex gap-3 w-full">
        <Button 
          onClick={handleDownloadImage}
          disabled={isExporting}
          className="flex-1 h-12 rounded-2xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-[0_4px_0_hsl(220,90%,30%)] hover:shadow-[0_0px_0_hsl(220,90%,30%)] hover:translate-y-1 transition-all text-sm"
        >
          {isExporting ? <Loader2 className="animate-spin w-4 h-4" /> : <ImageDown className="mr-1.5 w-4 h-4" />} 
          Save Image
        </Button>
        <Button 
          onClick={handleExportPDF}
          disabled={isExporting}
          className="flex-1 h-12 rounded-2xl font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-[0_4px_0_hsl(45,90%,40%)] hover:shadow-[0_0px_0_hsl(45,90%,40%)] hover:translate-y-1 transition-all text-sm"
        >
          {isExporting ? <Loader2 className="animate-spin w-4 h-4" /> : <Download className="mr-1.5 w-4 h-4" />} 
          Save PDF
        </Button>
      </div>
    </div>
  );
}
