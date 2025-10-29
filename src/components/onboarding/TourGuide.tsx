import { useState, useEffect } from "react";
import Joyride, { Step, CallBackProps, STATUS } from "react-joyride";
import { supabase } from "@/integrations/supabase/client";

interface TourGuideProps {
  onComplete: () => void;
}

export function TourGuide({ onComplete }: TourGuideProps) {
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Esperar a que el DOM esté listo y verificar que el primer elemento existe
    const checkAndStart = () => {
      const firstElement = document.querySelector('#dashboard-link');
      if (firstElement) {
        setRun(true);
      } else {
        // Si no existe, reintentar después de un tiempo
        setTimeout(checkAndStart, 300);
      }
    };
    
    const timer = setTimeout(checkAndStart, 800);
    
    return () => clearTimeout(timer);
  }, []);

  const steps: Step[] = [
    {
      target: '#dashboard-link',
      content: '🫀 Mi centro - Aquí verás tu contador de abstinencia, metas diarias y progreso.',
      disableBeacon: true,
      placement: 'right',
    },
    {
      target: '#plan-link',
      content: '🎯 Mi Plan - Gestiona tus metas y objetivos de recuperación.',
      placement: 'right',
    },
    {
      target: '#progress-link',
      content: '📈 Progreso - Visualiza tu avance con gráficas y reportes detallados.',
      placement: 'right',
    },
    {
      target: '#emotion-journal-link',
      content: '😊 Diario de emociones - Registra y analiza tus emociones diarias.',
      placement: 'right',
    },
    {
      target: '#journal-link',
      content: '📔 Diario - Escribe reflexiones y pensamientos sobre tu proceso.',
      placement: 'right',
    },
    {
      target: '#gratitude-link',
      content: '🙏 Agradecimiento - Practica la gratitud registrando aquello por lo que estás agradecido.',
      placement: 'right',
    },
    {
      target: '#values-link',
      content: '❤️ Valores - Define y trabaja en tus valores personales.',
      placement: 'right',
    },
    {
      target: '#chat-link',
      content: '💬 Chat - Conecta con otros miembros de la comunidad en tiempo real.',
      placement: 'right',
    },
    {
      target: '#community-link',
      content: '🫶 Comunidad - Encuentra mentores o conviértete en mentor de otros.',
      placement: 'right',
    },
    {
      target: '#tools-link',
      content: '🛠️ Herramientas - Accede a recursos adicionales para tu recuperación.',
      placement: 'right',
    },
    {
      target: '#help-link',
      content: '🆘 Ayuda - Encuentra preguntas frecuentes y soporte.',
      placement: 'right',
    },
    {
      target: '#settings-link',
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
      disableOverlayClose
      spotlightClicks
      scrollToFirstStep
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
