import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";

interface TextOnboardingProps {
  onComplete: () => void;
}

export function TextOnboarding({ onComplete }: TextOnboardingProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: t('tour.welcomeTitle'),
      content: t('tour.welcomeContent')
    },
    {
      title: t('tour.anonymityTitle'),
      content: t('tour.anonymityContent')
    },
    {
      title: t('tour.scienceTitle'),
      content: t('tour.scienceContent')
    },
    {
      title: t('tour.planTitle'),
      content: t('tour.planContent')
    },
    {
      title: t('tour.emergencyTitle'),
      content: t('tour.emergencyContent')
    },
    {
      title: t('tour.reportsTitle'),
      content: t('tour.reportsContent')
    }
  ];

  const nextStep = () => {
    console.log('nextStep clicked', { currentStep, stepsLength: steps.length });
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      console.log('Moving to next step:', currentStep + 1);
    } else {
      console.log('Calling onComplete');
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-background/95 backdrop-blur-sm pointer-events-auto">
      <Card className="w-full max-w-2xl mx-4 p-8 shadow-xl relative z-[10002] pointer-events-auto">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{t('tour.step')} {currentStep + 1} {t('tour.of')} {steps.length}</span>
            </div>
            <Progress value={progress} className="h-2 [&>div]:bg-green-500" />
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">
              {steps[currentStep].title}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {steps[currentStep].content}
            </p>
          </div>

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              {t('tour.previous')}
            </Button>
            <Button onClick={nextStep}>
              {currentStep === steps.length - 1 ? t('tour.finish') : t('tour.next')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
