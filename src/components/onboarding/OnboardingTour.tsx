import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const tourSteps = [
  {
    title: "Panel de Control",
    description: "Aquí verás tu progreso general y estadísticas",
    target: "#dashboard-link"
  },
  {
    title: "Plan de Acción",
    description: "Gestiona tus metas diarias y objetivos",
    target: "#plan-link"
  },
  {
    title: "Check-In Diario",
    description: "Registra tu estado cada día",
    target: "#checkin-link"
  },
  {
    title: "Progreso",
    description: "Visualiza tu evolución y logros",
    target: "#progress-link"
  },
  {
    title: "Comunidad",
    description: "Conecta con otros en recuperación",
    target: "#community-link"
  }
];

interface OnboardingTourProps {
  onComplete: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    updateHighlight();
  }, [currentStep]);

  const updateHighlight = () => {
    const target = document.querySelector(tourSteps[currentStep].target);
    if (target) {
      setHighlightRect(target.getBoundingClientRect());
    }
  };

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] pointer-events-none">
      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black/60" />
      
      {/* Highlight area */}
      {highlightRect && (
        <div
          className="absolute border-4 border-primary rounded-lg pointer-events-none"
          style={{
            top: highlightRect.top - 4,
            left: highlightRect.left - 4,
            width: highlightRect.width + 8,
            height: highlightRect.height + 8,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)'
          }}
        />
      )}

      {/* Tour card */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-auto">
        <Card className="w-full max-w-md p-6 shadow-2xl">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Paso {currentStep + 1} de {tourSteps.length}
              </p>
              <h3 className="text-xl font-bold">
                {tourSteps[currentStep].title}
              </h3>
              <p className="text-muted-foreground">
                {tourSteps[currentStep].description}
              </p>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                Anterior
              </Button>
              <Button onClick={nextStep}>
                {currentStep === tourSteps.length - 1 ? "Finalizar" : "Siguiente"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
