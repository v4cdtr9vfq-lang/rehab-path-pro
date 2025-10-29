import { useEffect, useState } from "react";
import Joyride, { Step, CallBackProps, STATUS } from "react-joyride";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const getTourSteps = (isMobile: boolean): Step[] => {
  if (isMobile) {
    // Tour para mobile: enfocado en elementos visibles sin necesidad de abrir el sidebar
    return [
      {
        target: 'body',
        content: '¡Bienvenido! 👋 Te mostraré las funciones principales de la app. Puedes acceder al menú desde el botón ☰ en la esquina superior izquierda.',
        disableBeacon: true,
        placement: 'center',
      },
      {
        target: '.abstinence-counter',
        content: '🫀 Aquí verás tu tiempo limpio y podrás gestionar tus adicciones.',
        disableBeacon: true,
        placement: 'bottom',
        offset: 10,
      },
      {
        target: '[data-tour="daily-progress"]',
        content: '📊 Tu Progreso Diario: check-ins, metas completadas y recordatorios.',
        disableBeacon: true,
        placement: 'bottom',
        offset: 10,
      },
      {
        target: '[data-tour="goals-section"]',
        content: '🎯 Metas de Hoy: marca tus objetivos diarios como completados.',
        disableBeacon: true,
        placement: 'bottom',
        offset: 10,
      },
      {
        target: '[data-tour="quick-tools"]',
        content: '🛠️ Accesos Directos: accede rápidamente a tus herramientas favoritas.',
        disableBeacon: true,
        placement: 'bottom',
        offset: 10,
      },
      {
        target: 'body',
        content: '💡 Usa el menú ☰ para explorar todas las secciones: Diario, Chat, Comunidad, Herramientas y más.',
        disableBeacon: true,
        placement: 'center',
      },
    ];
  }
  
  // Tour para desktop: mantener el original
  const placement = 'right';
  
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
      // En desktop, navegar al dashboard y abrir sidebar
      if (!isMobile) {
        navigate('/dashboard');
      }
      
      // Verificar que los elementos existan antes de iniciar
      const checkElements = setInterval(() => {
        const firstElement = isMobile 
          ? document.querySelector('.abstinence-counter')  // Para mobile, verificar elemento visible
          : document.querySelector('#dashboard-link');      // Para desktop, verificar link del sidebar
        
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
