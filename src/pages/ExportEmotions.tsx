import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { downloadEmotionsPDF } from "@/utils/exportEmotionsPDF";
import { toast } from "sonner";

const ExportEmotions = () => {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      downloadEmotionsPDF();
      toast.success("PDF descargado correctamente");
    } catch (error) {
      toast.error("Error al generar el PDF");
      console.error(error);
    }
    // Redirect back after download
    setTimeout(() => navigate(-1), 500);
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Generando PDF...</p>
    </div>
  );
};

export default ExportEmotions;
