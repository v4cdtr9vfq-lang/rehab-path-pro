import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface GuidedOnboardingDialogProps {
  step: 'emotion_journal' | 'gratitude' | 'check_in' | 'daily_inventory' | 'values';
  onClose: () => void;
}

const STEP_CONFIG = {
  emotion_journal: {
    message: "Vamos a empezar tu rutina diaria conectando con tus emociones. Selecciona cómo te sientes aquí y ahora",
    route: "/emotion-journal"
  },
  gratitude: {
    message: "¡Genial! Ya has conectado con lo que está vivo dentro de ti en este momento. Te invito a que ahora agradezcas los regalos del día.",
    route: "/gratitude"
  },
  check_in: {
    message: "Ahora que has conectado con la gratitud, es momento de hacer tu Check In diario que evalúa tu proceso de recuperación.",
    route: "/check-in"
  },
  daily_inventory: {
    message: "¡Enhorabuena por tu compromiso con tu recuperación! Ahora es momento de rellenar tu inventario del día",
    route: "/journal?title=Inventario del día"
  },
  values: {
    message: "No hay nada como el trabajo bien hecho. Por último, si lo deseas, te invitamos a revisar tus valores para saber si has conectado hoy con alguno de ellos en especial.",
    route: "/values"
  }
};

export function GuidedOnboardingDialog({ step, onClose }: GuidedOnboardingDialogProps) {
  const navigate = useNavigate();
  const config = STEP_CONFIG[step];

  const handleContinue = () => {
    navigate(config.route);
    onClose();
  };

  const handleDisableAssistance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ 
            guided_onboarding_disabled: true,
            guided_onboarding_step: 'completed'
          })
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error disabling guided onboarding:', error);
    }
    onClose();
  };

  return (
    <AlertDialog open={true}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogDescription className="text-base pt-4">
            {config.message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row gap-2 justify-between">
          <Button 
            variant="ghost" 
            onClick={handleDisableAssistance}
            className="text-foreground/90 hover:text-foreground/60"
          >
            Desactivar asistencia
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleContinue}
              variant="default"
            >
              Continuar
            </Button>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
