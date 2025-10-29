import { useEffect, useState } from "react";
import Joyride, { Step, CallBackProps, STATUS } from "react-joyride";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const TOUR_STEPS: Step[] = [
  {
    target: '#dashboard-link',
    content: '🫀 Tu Centro: Aquí encontrarás tu resumen diario, check-ins y estadísticas principales.',
    disableBeacon: true,
  },
  {
    target: '#plan-link',
    content: '🎯 Mi Plan: Crea y gestiona tu plan de recuperación personalizado.',
  },
  {
    target: '#progress-link',
    content: '📈 Progreso: Visualiza tu evolución y logros a lo largo del tiempo.',
  },
  {
    target: '[href="/emotion-journal"]',
    content: '😊 Diario de Emociones: Registra cómo te sientes cada día.',
  },
  {
    target: '[href="/journal"]',
    content: '📔 Diario: Escribe libremente tus pensamientos y reflexiones.',
  },
  {
    target: '[href="/gratitude"]',
    content: '🙏 Agradecimiento: Practica la gratitud diariamente.',
  },
  {
    target: '[href="/values"]',
    content: '❤️ Valores: Define y conecta con tus valores fundamentales.',
  },
  {
    target: '[href="/chat"]',
    content: '💬 Chat: Habla con tu asistente de IA y la comunidad.',
  },
  {
    target: '#community-link',
    content: '🫶 Comunidad: Conecta con otros en recuperación, comparte y encuentra apoyo.',
  },
  {
    target: '[href="/tools"]',
    content: '🛠️ Herramientas: Accede a recursos útiles para tu recuperación.',
  },
  {
    target: '[href="/help"]',
    content: '🆘 Ayuda: Encuentra ayuda inmediata cuando la necesites.',
  },
  {
    target: '[href="/settings"]',
    content: '⚙️ Configuración: Personaliza tu experiencia y preferencias.',
  },
];

interface TourGuideProps {
  onComplete: () => void;
}

export function TourGuide({ onComplete }: TourGuideProps) {
  const [run, setRun] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Esperar un momento para que el DOM esté listo
    const timer = setTimeout(() => {
      // Navegar al dashboard si no estamos allí
      navigate('/dashboard');
      
      // En móvil, intentar abrir el sidebar
      if (isMobile) {
        const menuButton = document.querySelector('[aria-label="Open sidebar"]') as HTMLElement;
        if (menuButton) {
          menuButton.click();
        }
      }
      
      // Verificar que los elementos existan antes de iniciar
      const checkElements = setInterval(() => {
        const firstElement = document.querySelector('#dashboard-link');
        if (firstElement) {
          clearInterval(checkElements);
          setRun(true);
        }
      }, 100);
      
      // Timeout de seguridad
      setTimeout(() => clearInterval(checkElements), 5000);
    }, 500);

    return () => clearTimeout(timer);
  }, [navigate, isMobile]);

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
      steps={TOUR_STEPS}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      scrollToFirstStep
      disableOverlayClose
      spotlightClicks
      locale={{
        back: 'Atrás',
        close: 'Cerrar',
        last: 'Finalizar',
        next: 'Siguiente',
        skip: 'Saltar tour',
      }}
      styles={{
        options: {
          primaryColor: 'hsl(var(--primary))',
          textColor: 'hsl(var(--foreground))',
          backgroundColor: 'hsl(var(--background))',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          arrowColor: 'hsl(var(--background))',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '12px',
          padding: '16px',
          fontSize: '14px',
        },
        tooltipContent: {
          padding: '8px 0',
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          borderRadius: '8px',
          padding: '8px 16px',
        },
        buttonBack: {
          color: 'hsl(var(--muted-foreground))',
          marginRight: '8px',
        },
        buttonSkip: {
          color: 'hsl(var(--muted-foreground))',
        },
        spotlight: {
          borderRadius: '8px',
        },
      }}
    />
  );
}
