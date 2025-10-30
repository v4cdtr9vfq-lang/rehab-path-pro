import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Calendar, Loader2, Trash2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";

interface ProgressReport {
  id: string;
  start_date: string;
  end_date: string;
  report_content: string;
  created_at: string;
}

export default function ProgressReports() {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'es' ? es : enUS;
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("last_week");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ProgressReport | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [reportToEmail, setReportToEmail] = useState<ProgressReport | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

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
          title: t('common.error'),
          description: t('progress.loginRequiredReport'),
          variant: "destructive",
        });
        return;
      }

      const { startDate, endDate } = calculateDateRange(selectedPeriod);

      const { data, error } = await supabase.functions.invoke("generate-progress-report", {
        body: { startDate, endDate, language: i18n.language },
      });

      if (error) {
        if (error.message?.includes("429")) {
          toast({
            title: t('progress.limitExceeded'),
            description: t('progress.limitExceededDescription'),
            variant: "destructive",
          });
        } else if (error.message?.includes("402")) {
          toast({
            title: t('progress.paymentRequired'),
            description: t('progress.paymentRequiredDescription'),
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      if (data?.report) {
        toast({
          title: t('progress.reportGenerated'),
          description: t('progress.reportGeneratedSuccess'),
        });
        await loadReports();
      }
    } catch (error: any) {
      console.error("Error generating report:", error);
      toast({
        title: t('common.error'),
        description: error.message || t('progress.errorGeneratingReport'),
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
        title: t('progress.reportDeleted'),
        description: t('progress.reportDeletedSuccess'),
      });

      await loadReports();
    } catch (error: any) {
      console.error("Error deleting report:", error);
      toast({
        title: t('common.error'),
        description: t('progress.errorDeletingReport'),
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setReportToDelete(null);
    }
  };

  const handleEmailClick = (report: ProgressReport, e: React.MouseEvent) => {
    e.stopPropagation();
    setReportToEmail(report);
    setShowEmailDialog(true);
  };

  const sendReportEmail = async () => {
    if (!reportToEmail || !recipientEmail) return;

    setIsSendingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-report-email", {
        body: {
          recipientEmail,
          reportContent: reportToEmail.report_content,
          reportPeriod: `${format(new Date(reportToEmail.start_date), "d MMM", { locale: dateLocale })} - ${format(new Date(reportToEmail.end_date), "d MMM yyyy", { locale: dateLocale })}`,
          reportDate: format(new Date(reportToEmail.created_at), "d MMMM yyyy", { locale: dateLocale })
        },
      });

      if (error) throw error;

      toast({
        title: t('progress.emailSent'),
        description: `${t('progress.emailSentSuccess')} ${recipientEmail}`,
      });

      setShowEmailDialog(false);
      setRecipientEmail("");
    } catch (error: any) {
      console.error("Error sending email:", error);
      const errorMessage = error.message || t('progress.errorGeneratingReport');
      toast({
        title: t('progress.errorSendingEmail'),
        description: errorMessage,
        variant: "destructive",
        duration: 8000,
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const getPeriodLabel = (period: string) => {
    const labels: Record<string, string> = {
      last_week: t('progress.lastWeek'),
      last_month: t('progress.lastMonth'),
      last_3_months: t('progress.last3Months'),
      last_6_months: t('progress.last6Months'),
      last_year: t('progress.lastYear'),
    };
    return labels[period] || period;
  };

  return (
    <>
      <Card className="border-sidebar-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('progress.progressReports')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium whitespace-nowrap">{t('progress.timePeriod')}</label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue placeholder={t('progress.selectPeriod')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_week">{t('progress.lastWeek')}</SelectItem>
                <SelectItem value="last_month">{t('progress.lastMonth')}</SelectItem>
                <SelectItem value="last_3_months">{t('progress.last3Months')}</SelectItem>
                <SelectItem value="last_6_months">{t('progress.last6Months')}</SelectItem>
                <SelectItem value="last_year">{t('progress.lastYear')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={generateReport}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isGenerating ? t('progress.generatingReport') : t('progress.generateReport')}
          </Button>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">{t('progress.reportHistory')}</h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {reports.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('progress.noReportsYet')}
                </p>
              ) : (
                reports.map((report) => (
                  <Card key={report.id} className="p-3 hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => openReport(report)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          <span className="font-medium">
                            {format(new Date(report.created_at), "d MMM yyyy", { locale: dateLocale })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('progress.period')}: {format(new Date(report.start_date), "d MMM", { locale: dateLocale })} - {format(new Date(report.end_date), "d MMM", { locale: dateLocale })}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button variant="ghost" size="sm" onClick={(e) => {
                          e.stopPropagation();
                          openReport(report);
                        }}>
                          {t('progress.view')}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => handleEmailClick(report, e)}
                          className="hover:bg-accent"
                        >
                          <Mail className="h-4 w-4" />
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
            <DialogTitle>{t('progress.progressReport')}</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground pb-4 border-b">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{t('progress.generated')}: {format(new Date(selectedReport.created_at), "d MMMM yyyy", { locale: dateLocale })}</span>
                </div>
                <div>
                  {t('progress.period')}: {format(new Date(selectedReport.start_date), "d MMM", { locale: dateLocale })} - {format(new Date(selectedReport.end_date), "d MMM yyyy", { locale: dateLocale })}
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
            <AlertDialogTitle>{t('progress.deleteReport')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('progress.deleteReportDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('progress.sendReportEmail')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('progress.recipientEmail')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('progress.emailPlaceholder')}
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={sendReportEmail} 
                disabled={!recipientEmail || isSendingEmail}
              >
                {isSendingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSendingEmail ? t('progress.sending') : t('progress.send')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}