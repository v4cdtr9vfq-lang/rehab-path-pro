import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const steps = [
  {
    title: "¡Bienvenido!",
    content: "Esta aplicación te apoya en tu proceso de rehabilitación de dependencias. Podrás encontrar varias herramientas que te ayudan a entender en qué punto te encuentras, a registrar tus emociones y a comprender qué situaciones o qué personas pueden estar dificultando tus propósitos. Podrás activar hasta 3 procesos de rehabilitación, ya que muchos hábitos y sustancias están conectados entre ellos."
  },
  {
    title: "Anonimato",
    content: "El anonimato es especialmente importante para nosotros. Si no deseas seleccionar una dependencia concreta en el registro, tienes la opción de incluir \"Adicción 1\", \"Adicción 2\" y \"Adicción 3\". En las zonas de chat, podrás escribir en modo anónimo. Toda tu información está encriptada bajo estrictos protocolos de seguridad."
  },
  {
    title: "Herramientas probadas por la ciencia",
    content: "Hemos incluido herramientas como los Check-in diarios, el uso del diario, el diario de emociones, los listados de valores, los chats o las mentorías con otros miembros de la comunidad, todas con resultados probados en tu proceso."
  },
  {
    title: "Plan y metas predefinidas",
    content: "La aplicación por defecto carga una serie de metas diarias para tu \"Plan de acción\". Puedes borrar o editar la periodicidad de las tareas si lo deseas, aunque recomendamos encarecidamente que pruebes al menos 40 días ceñirte únicamente a estas tareas."
  },
  {
    title: "Plan de emergencia y recaídas",
    content: "Nuestra funcionalidad contempla la posibilidad de las recaídas. Si en tu Check-in diario respondes \"No\" a la pregunta \"¿Me mantuve limpio de consumo hoy?\", se activará la opción de escribir un \"Inventario de la recaída\" para que describas qué situación o emociones te han llevado a esta situación. Recuerda que el objetivo es aprender de cada proceso para ganar mayor capacidad de acción."
  },
  {
    title: "Informes de evolución",
    content: "En el área \"Progreso\" podrás generar informes psicoterapéuticos asistidos por inteligencia artificial que pueden servirte para entender tu progreso o la necesidad de hacer cambios para seguir avanzando. Estos informes también pueden ser de utilidad para tu terapeuta."
  }
];

export function TextOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("text_onboarding_completed")
        .eq("user_id", user.id)
        .single();

      if (profile && !profile.text_onboarding_completed) {
        setIsVisible(true);
      }
    } catch (error) {
      console.error("Error checking text onboarding status:", error);
    }
  };

  const completeOnboarding = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("profiles")
        .update({ text_onboarding_completed: true })
        .eq("user_id", user.id);

      setIsVisible(false);
    } catch (error) {
      console.error("Error completing text onboarding:", error);
    }
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

  if (!isVisible) return null;

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <Card className="w-full max-w-2xl mx-4 p-8 shadow-xl">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Paso {currentStep + 1} de {steps.length}</span>
            </div>
            <Progress value={progress} className="h-2" />
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
              Anterior
            </Button>
            <Button onClick={nextStep}>
              {currentStep === steps.length - 1 ? "Finalizar" : "Siguiente"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
