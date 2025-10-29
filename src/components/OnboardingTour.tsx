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
}

const steps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "¡Bienvenido a rehabp.org! 🎉",
    description: "Esta es tu herramienta personal de apoyo en tu proceso de rehabilitación. Te mostraré rápidamente cómo funciona."
  },
  {
    id: "abstinence-counter",
    title: "Tu contador de libertad",
    description: "Aquí verás cuánto tiempo llevas en tu proceso. Este contador es tu motivación diaria y celebra cada logro.",
    targetSelector: ".abstinence-counter"
  },
  {
    id: "daily-progress",
    title: "Progreso diario",
    description: "Aquí puedes ver tu avance del día: check-in completado, metas logradas y tu recordatorio personal.",
    targetSelector: "[data-tour='daily-progress']"
  },
  {
    id: "goals",
    title: "Metas de hoy",
    description: "Estas son tus metas diarias. Márcalas como completadas y construye tu rutina de recuperación paso a paso.",
    targetSelector: "[data-tour='goals-section']"
  },
  {
    id: "tools",
    title: "Accesos directos",
    description: "Aquí encontrarás herramientas rápidas: tu diario, registro de emociones, agradecimientos y plan de emergencia.",
    targetSelector: "[data-tour='quick-tools']"
  },
  {
    id: "complete",
    title: "¡Listo para empezar! 🚀",
    description: "Ya conoces lo básico. Recuerda: cada día cuenta, cada paso importa. ¡Estamos aquí para apoyarte!"
  }
];

export function OnboardingTour() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    checkOnboardingStatus();
    
    // Listen for text onboarding completion
    const handleTextOnboardingComplete = () => {
      setTimeout(() => checkOnboardingStatus(), 500);
    };
    
    window.addEventListener('text-onboarding-complete', handleTextOnboardingComplete);
    
    return () => {
      window.removeEventListener('text-onboarding-complete', handleTextOnboardingComplete);
    };
  }, []);

  useEffect(() => {
    if (isVisible) {
      const updateHighlight = () => {
        const selector = steps[currentStep].targetSelector;
        if (selector) {
          const element = document.querySelector(selector) as HTMLElement;
          if (element) {
            const rect = element.getBoundingClientRect();
            setHighlightRect(rect);
            // Scroll smoothly to element
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          } else {
            setHighlightRect(null);
          }
        } else {
          setHighlightRect(null);
        }
      };

      // Initial update
      setTimeout(updateHighlight, 100);

      // Update on scroll/resize
      window.addEventListener("scroll", updateHighlight, true);
      window.addEventListener("resize", updateHighlight);

      return () => {
        window.removeEventListener("scroll", updateHighlight, true);
        window.removeEventListener("resize", updateHighlight);
      };
    }
  }, [currentStep, isVisible]);

  const checkOnboardingStatus = async () => {
    try {
      console.log("🎯 [OnboardingTour] Verificando estado...");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("❌ No user found");
        return;
      }
      console.log("✅ User found:", user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("text_onboarding_completed, onboarding_completed, rehabilitation_type")
        .eq("user_id", user.id)
        .single();

      console.log("📊 [OnboardingTour] Estado del perfil:", {
        textOnboarding: (profile as any)?.text_onboarding_completed,
        rehabType: (profile as any)?.rehabilitation_type,
        tourCompleted: profile?.onboarding_completed
      });

      // SOLO mostrar si el texto está completo PERO el tour no
      const shouldShow = profile && 
                        (profile as any).text_onboarding_completed && 
                        !profile.onboarding_completed &&
                        !(profile as any).rehabilitation_type;

      console.log("🎯 [OnboardingTour] ¿Debe mostrarse?:", shouldShow);

      if (shouldShow) {
        console.log("🚀 Starting onboarding tour in 1 second...");
        // Delay para asegurar que TextOnboarding se cierre
        setTimeout(() => {
          console.log("✨ Setting tour visible NOW");
          setIsVisible(true);
        }, 1000);
      }
    } catch (error) {
      console.error("💥 Error checking onboarding status:", error);
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
      
      // Trigger check for next onboarding step (RehabilitationTypeDialog)
      window.dispatchEvent(new Event('onboarding-tour-complete'));
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

  const getCardStyle = (): React.CSSProperties => {
    const isMobile = window.innerWidth < 768;
    const padding = 20;
    
    // En móvil, SIEMPRE abajo y centrado
    if (isMobile) {
      return {
        position: "fixed",
        bottom: `${padding}px`,
        left: "50%",
        transform: "translateX(-50%)",
        width: `calc(100vw - ${padding * 2}px)`,
        maxWidth: "400px"
      };
    }

    // En desktop, SIEMPRE centrado si no hay target o es primer/último paso
    if (!highlightRect || currentStep === 0 || currentStep === steps.length - 1) {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "440px",
        maxWidth: `calc(100vw - ${padding * 2}px)`
      };
    }

    // En desktop con target, calcular posición pero GARANTIZAR que esté visible
    const cardWidth = 440;
    const cardHeight = 300; // altura estimada
    const spacing = 20;

    // Calcular posición preferida (abajo del elemento)
    let top = highlightRect.bottom + spacing;
    let left = highlightRect.left + highlightRect.width / 2 - cardWidth / 2;

    // Si no cabe abajo, ponerlo arriba
    if (top + cardHeight > window.innerHeight - padding) {
      top = highlightRect.top - cardHeight - spacing;
    }

    // Si TODAVÍA no cabe arriba, centrarlo verticalmente
    if (top < padding) {
      top = (window.innerHeight - cardHeight) / 2;
    }

    // Asegurar que left esté dentro del viewport
    left = Math.max(padding, Math.min(left, window.innerWidth - cardWidth - padding));

    // Limitar top para que SIEMPRE esté visible
    top = Math.max(padding, Math.min(top, window.innerHeight - cardHeight - padding));

    return {
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
      width: `${cardWidth}px`,
      maxWidth: `calc(100vw - ${padding * 2}px)`
    };
  };

  if (!isVisible) {
    console.log("👻 Tour not visible - isVisible is false");
    return null;
  }

  console.log("🎨 Rendering tour - step:", currentStep, "highlightRect:", highlightRect);

  return (
    <>
      {/* Overlay with cutout for highlighted element */}
      <div className="fixed inset-0 z-[10000] pointer-events-none">
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              {highlightRect && (
                <rect
                  x={highlightRect.left - 8}
                  y={highlightRect.top - 8}
                  width={highlightRect.width + 16}
                  height={highlightRect.height + 16}
                  rx="12"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.7)"
            mask="url(#spotlight-mask)"
          />
        </svg>
        
        {/* Highlight border */}
        {highlightRect && (
          <div
            className="absolute border-4 border-white rounded-xl shadow-2xl transition-all duration-300 pointer-events-none"
            style={{
              top: highlightRect.top - 8,
              left: highlightRect.left - 8,
              width: highlightRect.width + 16,
              height: highlightRect.height + 16
            }}
          />
        )}
      </div>

      {/* Tour Card */}
      <Card 
        className="animate-scale-in z-[10001]"
        style={getCardStyle()}
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
