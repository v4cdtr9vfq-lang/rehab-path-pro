import { useEffect, useState } from "react";
import Joyride, { Step, CallBackProps, STATUS } from "react-joyride";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const getTourSteps = (isMobile: boolean): Step[] => {
  const placement = isMobile ? 'bottom' : 'right';
  
  return [
    {
      target: '#dashboard-link',
      content: '🫀 Tu Centro: Aquí encontrarás tu resumen diario, check-ins y estadísticas principales.',
      disableBeacon: true,
      placement,
      offset: 10,
    },
    {
      target: '#plan-link',
      content: '🎯 Mi Plan: Crea y gestiona tu plan de recuperación personalizado.',
      disableBeacon: true,
      placement,
      offset: 10,
    },
    {
      target: '#progress-link',
      content: '📈 Progreso: Visualiza tu evolución y logros a lo largo del tiempo.',
      disableBeacon: true,
      placement,
      offset: 10,
    },
    {
      target: '[href="/emotion-journal"]',
      content: '😊 Diario de Emociones: Registra cómo te sientes cada día.',
      disableBeacon: true,
      placement,
      offset: 10,
    },
    {
      target: '[href="/journal"]',
      content: '📔 Diario: Escribe libremente tus pensamientos y reflexiones.',
      disableBeacon: true,
      placement,
      offset: 10,
    },
    {
      target: '[href="/gratitude"]',
      content: '🙏 Agradecimiento: Practica la gratitud diariamente.',
      disableBeacon: true,
      placement,
      offset: 10,
    },
    {
      target: '[href="/values"]',
      content: '❤️ Valores: Define y conecta con tus valores fundamentales.',
      disableBeacon: true,
      placement,
      offset: 10,
    },
    {
      target: '[href="/chat"]',
      content: '💬 Chat: Habla con tu asistente de IA y la comunidad.',
      disableBeacon: true,
      placement,
      offset: 10,
    },
    {
      target: '#community-link',
      content: '🫶 Comunidad: Conecta con otros en recuperación, comparte y encuentra apoyo.',
      disableBeacon: true,
      placement,
      offset: 10,
    },
    {
      target: '[href="/tools"]',
      content: '🛠️ Herramientas: Accede a recursos útiles para tu recuperación.',
      disableBeacon: true,
      placement,
      offset: 10,
    },
    {
      target: '[href="/help"]',
      content: '🆘 Ayuda: Encuentra ayuda inmediata cuando la necesites.',
      disableBeacon: true,
      placement,
      offset: 10,
    },
    {
      target: '[href="/settings"]',
      content: '⚙️ Configuración: Personaliza tu experiencia y preferencias.',
      disableBeacon: true,
      placement,
      offset: 10,
    },
  ];
};

interface TourGuideProps {
  onComplete: () => void;
}

export function TourGuide({ onComplete }: TourGuideProps) {
  const [run, setRun] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const tourSteps = getTourSteps(isMobile);

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
    const { status, action, index, type } = data;
    
    console.log('Tour callback:', { status, action, index, type });
    
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
      steps={tourSteps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      scrollToFirstStep
      disableOverlayClose={false}
      spotlightPadding={0}
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
          backgroundColor: '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          arrowColor: '#ffffff',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '12px',
          padding: '16px',
          fontSize: '14px',
          backgroundColor: '#ffffff',
          color: '#1a1a1a',
          textAlign: 'left',
        },
        tooltipContent: {
          padding: '8px 0',
          color: '#1a1a1a',
          textAlign: 'left',
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--primary))',
          color: '#ffffff',
          borderRadius: '8px',
          padding: '6px 12px',
          border: '2px solid hsl(var(--primary))',
          fontSize: '12px',
          height: '32px',
          lineHeight: '1',
        },
        buttonBack: {
          color: '#666666',
          marginRight: '8px',
          border: '2px solid #666666',
          borderRadius: '8px',
          padding: '6px 12px',
          backgroundColor: 'transparent',
          fontSize: '12px',
          height: '32px',
          lineHeight: '1',
        },
        buttonSkip: {
          color: '#666666',
          border: '2px solid #666666',
          borderRadius: '8px',
          padding: '6px 12px',
          backgroundColor: 'transparent',
          fontSize: '12px',
          height: '32px',
          lineHeight: '1',
        },
        spotlight: {
          borderRadius: '8px',
        },
      }}
    />
  );
}
