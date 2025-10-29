import { useState, useEffect } from "react";
import Joyride, { Step, CallBackProps, STATUS } from "react-joyride";
import { supabase } from "@/integrations/supabase/client";

interface TourGuideProps {
  onComplete: () => void;
}

export function TourGuide({ onComplete }: TourGuideProps) {
  const [run, setRun] = useState(true);

  const steps: Step[] = [
    {
      target: 'a[href="/dashboard"]',
      content: '🫀 Mi centro - Aquí verás tu contador de abstinencia, metas diarias y progreso.',
      disableBeacon: true,
      placement: 'right',
    },
    {
      target: 'a[href="/plan"]',
      content: '🎯 Mi Plan - Gestiona tus metas y objetivos de recuperación.',
      placement: 'right',
    },
    {
      target: 'a[href="/progress"]',
      content: '📈 Progreso - Visualiza tu avance con gráficas y reportes detallados.',
      placement: 'right',
    },
    {
      target: 'a[href="/emotion-journal"]',
      content: '😊 Diario de emociones - Registra y analiza tus emociones diarias.',
      placement: 'right',
    },
    {
      target: 'a[href="/journal"]',
      content: '📔 Diario - Escribe reflexiones y pensamientos sobre tu proceso.',
      placement: 'right',
    },
    {
      target: 'a[href="/gratitude"]',
      content: '🙏 Agradecimiento - Practica la gratitud registrando aquello por lo que estás agradecido.',
      placement: 'right',
    },
    {
      target: 'a[href="/values"]',
      content: '❤️ Valores - Define y trabaja en tus valores personales.',
      placement: 'right',
    },
    {
      target: 'a[href="/chat"]',
      content: '💬 Chat - Conecta con otros miembros de la comunidad en tiempo real.',
      placement: 'right',
    },
    {
      target: 'a[href="/community"]',
      content: '🫶 Comunidad - Encuentra mentores o conviértete en mentor de otros.',
      placement: 'right',
    },
    {
      target: 'a[href="/tools"]',
      content: '🛠️ Herramientas - Accede a recursos adicionales para tu recuperación.',
      placement: 'right',
    },
    {
      target: 'a[href="/help"]',
      content: '🆘 Ayuda - Encuentra preguntas frecuentes y soporte.',
      placement: 'right',
    },
    {
      target: 'a[href="/settings"]',
      content: '⚙️ Configuración - Personaliza tu experiencia y gestiona tu cuenta.',
      placement: 'right',
    },
  ];

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      
      // Marcar el tour como completado
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .update({ tour_completed: true })
            .eq('user_id', user.id);
        }
      } catch (error) {
        console.error('Error marking tour as completed:', error);
      }
      
      onComplete();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: 'hsl(var(--primary))',
          zIndex: 10000,
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          borderRadius: '0.5rem',
          padding: '0.5rem 1rem',
        },
        buttonBack: {
          color: 'hsl(var(--foreground))',
          marginRight: '0.5rem',
        },
        buttonSkip: {
          color: 'hsl(var(--muted-foreground))',
        },
      }}
      locale={{
        back: 'Atrás',
        close: 'Cerrar',
        last: 'Finalizar',
        next: 'Siguiente',
        skip: 'Saltar tour',
      }}
    />
  );
}
