import { useCallback, useEffect } from "react";
import { downloadEmotionsPDF } from "@/utils/exportEmotionsPDF";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ExportEmotions = () => {
  const handleDownload = useCallback(() => {
    try {
      console.log("[export-emotions] generating PDF");
      downloadEmotionsPDF();
      toast.success("PDF generado y descargado");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[export-emotions] PDF generation failed", error);
      toast.error(`No se pudo generar el PDF: ${message}`);
    }
  }, []);

  useEffect(() => {
    // SEO básico para esta página utilitaria
    document.title = "Descargar PDF de emociones";
    const metaName = "description";
    const content = "Descarga el listado de emociones en PDF para el Diario de Emociones.";
    let meta = document.querySelector(`meta[name='${metaName}']`) as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = metaName;
      document.head.appendChild(meta);
    }
    meta.content = content;
    // Nota: evitamos auto-descarga para no chocar con bloqueos del navegador.
  }, [handleDownload]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <section className="w-full max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Descargar PDF de emociones</CardTitle>
            <CardDescription>
              Si tu navegador bloqueó la descarga automática, pulsa el botón.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button onClick={handleDownload} className="w-full">
              Descargar PDF
            </Button>
            <p className="text-sm text-muted-foreground">
              Nombre del archivo: <span className="font-medium">listado-emociones.pdf</span>
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default ExportEmotions;
