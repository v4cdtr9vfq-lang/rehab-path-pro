import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface GuidedOnboardingDialogProps {
  step: 'emotion_journal' | 'gratitude' | 'check_in' | 'daily_inventory' | 'values';
  onClose: () => void;
  onDisable?: () => void;
}

const STEP_CONFIG = {
  emotion_journal: {
    messageKey: "guidedStepEmotionJournal",
    route: "/emotion-journal"
  },
  gratitude: {
    messageKey: "guidedStepGratitude",
    route: "/gratitude"
  },
  check_in: {
    messageKey: "guidedStepCheckIn",
    route: "/checkin"
  },
  daily_inventory: {
    messageKey: "guidedStepDailyInventory",
    route: "/journal?title=Inventario del día"
  },
  values: {
    messageKey: "guidedStepValues",
    route: "/values"
  }
};

export function GuidedOnboardingDialog({ step, onClose, onDisable }: GuidedOnboardingDialogProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const config = STEP_CONFIG[step];

  const handleContinue = () => {
    navigate(config.route);
    onClose();
  };

  const handleDisableAssistance = async () => {
    if (onDisable) {
      onDisable();
    }
    onClose();
  };

  return (
    <AlertDialog open={true}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogDescription className="text-base pt-4 mx-auto max-w-md text-left">
            {t(`settings.${config.messageKey}`)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="destructive" 
            onClick={handleDisableAssistance}
            className="bg-destructive/30 hover:bg-destructive text-destructive-foreground sm:mr-auto"
          >
            {t('settings.disableAssistance')}
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onClose}
            >
              {t('settings.cancel')}
            </Button>
            <Button 
              onClick={handleContinue}
              variant="default"
            >
              {t('settings.continueButton')}
            </Button>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
