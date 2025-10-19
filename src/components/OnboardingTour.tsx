import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, ArrowRight, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  position: "top" | "bottom" | "left" | "right" | "center";
}

const steps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "¡Bienvenido a rehabp.org! 🎉",
    description: "Esta es tu herramienta personal de apoyo en tu proceso de rehabilitación. Te mostraré rápidamente cómo funciona.",
    position: "center"
  },
  {
    id: "abstinence-counter",
    title: "Tu contador de libertad",
    description: "Aquí verás cuánto tiempo llevas en tu proceso. Este contador es tu motivación diaria y celebra cada logro.",
    targetSelector: ".abstinence-counter",
    position: "bottom"
  },
  {
    id: "daily-progress",
    title: "Progreso diario",
    description: "Aquí puedes ver tu avance del día: check-in completado, metas logradas y tu recordatorio personal.",
    targetSelector: "[data-tour='daily-progress']",
    position: "top"
  },
  {
    id: "goals",
    title: "Metas de hoy",
    description: "Estas son tus metas diarias. Márcalas como completadas y construye tu rutina de recuperación paso a paso.",
    targetSelector: "[data-tour='goals-section']",
    position: "top"
  },
  {
    id: "tools",
    title: "Accesos directos",
    description: "Aquí encontrarás herramientas rápidas: tu diario, registro de emociones, agradecimientos y plan de emergencia.",
    targetSelector: "[data-tour='quick-tools']",
    position: "top"
  },
  {
    id: "sidebar",
    title: "Menú de navegación",
    description: "Usa este menú para explorar todas las secciones: chat de apoyo, herramientas, progreso, comunidad y más.",
    targetSelector: ".sidebar-nav",
    position: "right"
  },
  {
    id: "complete",
    title: "¡Listo para empezar! 🚀",
    description: "Ya conoces lo básico. Recuerda: cada día cuenta, cada paso importa. ¡Estamos aquí para apoyarte!",
    position: "center"
  }
];

export function OnboardingTour() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  useEffect(() => {
    if (isVisible && steps[currentStep].targetSelector) {
      const element = document.querySelector(steps[currentStep].targetSelector!) as HTMLElement;
      if (element) {
        setHighlightedElement(element);
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else {
      setHighlightedElement(null);
    }
  }, [currentStep, isVisible]);

  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .single();

      if (profile && !profile.onboarding_completed) {
        // Delay to let the page render first
        setTimeout(() => setIsVisible(true), 1000);
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
    }
  };

  const completeOnboarding = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("user_id", user.id);

      setIsVisible(false);
      toast({
        title: "¡Tutorial completado!",
        description: "Ya puedes empezar a usar la aplicación."
      });
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  };

  const skipTour = async () => {
    await completeOnboarding();
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getCardPosition = () => {
    const step = steps[currentStep];
    
    if (step.position === "center" || !highlightedElement) {
      return {
        position: "fixed" as const,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 10001
      };
    }

    const rect = highlightedElement.getBoundingClientRect();
    const cardWidth = 400;
    const cardHeight = 200;
    const spacing = 20;

    let style: React.CSSProperties = {
      position: "fixed" as const,
      zIndex: 10001
    };

    switch (step.position) {
      case "top":
        style.bottom = `${window.innerHeight - rect.top + spacing}px`;
        style.left = `${Math.min(Math.max(rect.left + rect.width / 2 - cardWidth / 2, 20), window.innerWidth - cardWidth - 20)}px`;
        break;
      case "bottom":
        style.top = `${rect.bottom + spacing}px`;
        style.left = `${Math.min(Math.max(rect.left + rect.width / 2 - cardWidth / 2, 20), window.innerWidth - cardWidth - 20)}px`;
        break;
      case "left":
        style.right = `${window.innerWidth - rect.left + spacing}px`;
        style.top = `${Math.min(Math.max(rect.top + rect.height / 2 - cardHeight / 2, 20), window.innerHeight - cardHeight - 20)}px`;
        break;
      case "right":
        style.left = `${rect.right + spacing}px`;
        style.top = `${Math.min(Math.max(rect.top + rect.height / 2 - cardHeight / 2, 20), window.innerHeight - cardHeight - 20)}px`;
        break;
    }

    return style;
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-[10000] animate-fade-in" />
      
      {/* Highlight spotlight */}
      {highlightedElement && (
        <div
          className="fixed z-[10000] pointer-events-none animate-fade-in"
          style={{
            top: highlightedElement.offsetTop - 8,
            left: highlightedElement.offsetLeft - 8,
            width: highlightedElement.offsetWidth + 16,
            height: highlightedElement.offsetHeight + 16,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 30px rgba(255, 255, 255, 0.3)",
            borderRadius: "16px",
            transition: "all 0.3s ease"
          }}
        />
      )}

      {/* Tour Card */}
      <Card 
        className="w-[90vw] max-w-md animate-scale-in"
        style={getCardPosition()}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{steps[currentStep].title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Paso {currentStep + 1} de {steps.length}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={skipTour}
              className="h-8 w-8 -mt-2 -mr-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground leading-relaxed">
            {steps[currentStep].description}
          </p>

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Anterior
            </Button>

            <div className="flex gap-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full transition-all ${
                    index === currentStep
                      ? "bg-primary w-4"
                      : "bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={nextStep}
              className="gap-2"
            >
              {currentStep === steps.length - 1 ? "Finalizar" : "Siguiente"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {currentStep === 0 && (
            <Button
              variant="outline"
              onClick={skipTour}
              className="w-full"
            >
              Saltar tutorial
            </Button>
          )}
        </CardContent>
      </Card>
    </>
  );
}
