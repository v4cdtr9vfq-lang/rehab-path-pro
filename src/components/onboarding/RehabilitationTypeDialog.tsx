import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const REHABILITATION_TYPES = [
  'adiccion_1',
  'adiccion_2',
  'adiccion_3',
  'alcohol',
  'amor',
  'azucar',
  'cannabis',
  'cocaina',
  'codependencia',
  'comida',
  'compras',
  'drama',
  'medicamentos',
  'narcoticos',
  'pornografia',
  'redes_sociales',
  'sexo',
  'tabaco',
  'tecnologia',
  'trabajo',
  'vaporizadores',
  'videojuegos',
  'otros',
] as const;

interface RehabilitationTypeDialogProps {
  onComplete: () => void;
}

export function RehabilitationTypeDialog({ onComplete }: RehabilitationTypeDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedType) {
      toast({
        title: t("onboarding.error"),
        description: t("onboarding.selectError"),
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { error } = await supabase
        .from('profiles')
        .update({ rehabilitation_type: selectedType })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: t("onboarding.saved"),
        description: t("onboarding.savedSuccess"),
      });
      
      onComplete();
    } catch (error: any) {
      toast({
        title: t("onboarding.error"),
        description: error.message || t("onboarding.saveError"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('profiles')
        .update({ rehabilitation_type: 'otros' })
        .eq('user_id', user.id);
      
      onComplete();
    } catch (error) {
      console.error('Error skipping rehabilitation type:', error);
      onComplete();
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px]" style={{ zIndex: 9999 }}>
        <DialogHeader>
          <DialogTitle className="text-left text-xl pl-[17px]">
            {t("onboarding.rehabTitle")}
          </DialogTitle>
          <DialogDescription className="text-left text-sm pl-[17px]">
            {t("onboarding.rehabDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground pl-[17px]">
              {t("onboarding.liberationFrom")}
            </p>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full pl-[17px]">
                <SelectValue placeholder={t("onboarding.selectOption")} />
              </SelectTrigger>
              <SelectContent className="z-[99999] bg-popover max-h-[300px] overflow-y-auto">
                {REHABILITATION_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`addictions.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !selectedType}
            className="w-full"
          >
            {isSaving ? t("onboarding.saving") : t("onboarding.save")}
          </Button>
          <Button 
            onClick={handleSkip} 
            variant="outline"
            className="w-full"
          >
            {t("onboarding.preferNotToSay")}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            {t("onboarding.canChangeLater")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
