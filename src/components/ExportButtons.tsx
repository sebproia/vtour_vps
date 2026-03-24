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

  const captureRecap = async () => {
    const element = document.getElementById(targetId);
    if (!element) return null;
    setIsExporting(true);
    try {
      const canvas = await domToCanvas(element, { scale: 1, backgroundColor: "#fdfbf7" });
      return canvas;
    } catch (err) {
      console.error("Erreur de capture:", err);
      return null;
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    const canvas = await captureRecap();
    if (!canvas) return;
    
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Food-Tour-${tourName.replace(/\s+/g, '-')}.pdf`);
  };

  const handleShareImage = async () => {
    const element = document.getElementById(targetId);
    if (!element) return;

    setIsExporting(true);
    try {
      const dataUrl = await domToPng(element, { backgroundColor: '#fdfbf7', scale: 1 });
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      const file = new File([blob], `Food-Tour-${tourName.replace(/\s+/g, '-')}.png`, { type: "image/png" });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `Food Tour: ${tourName}`,
            text: "Check out this amazing food tour recap !",
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
