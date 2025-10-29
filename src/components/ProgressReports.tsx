import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FileText, Calendar, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ProgressReport {
  id: string;
  start_date: string;
  end_date: string;
  report_content: string;
  created_at: string;
}

export default function ProgressReports() {
  const { toast } = useToast();
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("last_week");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ProgressReport | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("progress_reports")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error: any) {
      console.error("Error loading reports:", error);
    }
  };

  const calculateDateRange = (period: string) => {
    const today = new Date();
    let startDate = new Date();

    switch (period) {
      case "last_week":
        startDate.setDate(today.getDate() - 7);
        break;
      case "last_month":
        startDate.setMonth(today.getMonth() - 1);
        break;
      case "last_3_months":
        startDate.setMonth(today.getMonth() - 3);
        break;
      case "last_6_months":
        startDate.setMonth(today.getMonth() - 6);
        break;
      case "last_year":
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      default:
        startDate.setDate(today.getDate() - 7);
    }

    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: today.toISOString().split("T")[0],
    };
  };

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para generar un informe",
          variant: "destructive",
        });
        return;
      }

      const { startDate, endDate } = calculateDateRange(selectedPeriod);

      const { data, error } = await supabase.functions.invoke("generate-progress-report", {
        body: { startDate, endDate },
      });

      if (error) {
        if (error.message?.includes("429")) {
          toast({
            title: "Límite excedido",
            description: "Has alcanzado el límite de solicitudes. Intenta más tarde.",
            variant: "destructive",
          });
        } else if (error.message?.includes("402")) {
          toast({
            title: "Pago requerido",
            description: "Se requiere añadir fondos a tu cuenta de Lovable AI.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      if (data?.report) {
        toast({
          title: "Informe generado",
          description: "Tu informe de progreso ha sido generado exitosamente",
        });
        await loadReports();
      }
    } catch (error: any) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo generar el informe",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const openReport = (report: ProgressReport) => {
    setSelectedReport(report);
    setShowReportDialog(true);
  };

  const handleDeleteClick = (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setReportToDelete(reportId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!reportToDelete) return;

    try {
      const { error } = await supabase
        .from("progress_reports")
        .delete()
        .eq("id", reportToDelete);

      if (error) throw error;

      toast({
        title: "Informe eliminado",
        description: "El informe ha sido eliminado correctamente",
      });

      await loadReports();
    } catch (error: any) {
      console.error("Error deleting report:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el informe",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setReportToDelete(null);
    }
  };

  const getPeriodLabel = (period: string) => {
    const labels: Record<string, string> = {
      last_week: "Última semana",
      last_month: "Último mes",
      last_3_months: "Últimos 3 meses",
      last_6_months: "Últimos 6 meses",
      last_year: "Último año",
    };
    return labels[period] || period;
  };

  return (
    <>
      <Card className="border-sidebar-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Informes de progreso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Período temporal</label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_week">Última semana</SelectItem>
                <SelectItem value="last_month">Último mes</SelectItem>
                <SelectItem value="last_3_months">Últimos 3 meses</SelectItem>
                <SelectItem value="last_6_months">Últimos 6 meses</SelectItem>
                <SelectItem value="last_year">Último año</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={generateReport}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isGenerating ? "Generando informe..." : "Generar informe"}
          </Button>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Registro de informes</h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {reports.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay informes generados todavía
                </p>
              ) : (
                reports.map((report) => (
                  <Card key={report.id} className="p-3 hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => openReport(report)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          <span className="font-medium">
                            {format(new Date(report.created_at), "d MMM yyyy", { locale: es })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Período: {format(new Date(report.start_date), "d MMM", { locale: es })} - {format(new Date(report.end_date), "d MMM", { locale: es })}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button variant="ghost" size="sm" onClick={(e) => {
                          e.stopPropagation();
                          openReport(report);
                        }}>
                          Ver
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => handleDeleteClick(report.id, e)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Informe de Progreso</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground pb-4 border-b">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Generado: {format(new Date(selectedReport.created_at), "d MMMM yyyy", { locale: es })}</span>
                </div>
                <div>
                  Período: {format(new Date(selectedReport.start_date), "d MMM", { locale: es })} - {format(new Date(selectedReport.end_date), "d MMM yyyy", { locale: es })}
                </div>
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                {selectedReport.report_content}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar informe?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el informe de progreso. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}