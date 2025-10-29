import { useState, useEffect } from "react";
import Joyride, { Step, CallBackProps, STATUS, ACTIONS, EVENTS } from "react-joyride";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface TourGuideProps {
  onComplete: () => void;
}

export function TourGuide({ onComplete }: TourGuideProps) {
  const [run, setRun] = useState(false);
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  // Rutas de navegación para cada paso del tour
  const stepRoutes = [
    '/dashboard',
    '/plan',
    '/progress',
    '/emotion-journal',
    '/journal',
    '/gratitude',
    '/values',
    '/chat',
    '/community',
    '/tools',
    '/help',
    '/settings',
  ];

  // Detectar si estamos en mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Esperar a que el DOM esté listo y verificar que el primer elemento existe
    const checkAndStart = () => {
      // Navegar a la primera ruta primero
      navigate(stepRoutes[0]);
      
      // En mobile, abrir el sheet primero
      if (isMobile) {
        const menuButton = document.querySelector('button[aria-label="Open sidebar"]') as HTMLButtonElement;
        if (menuButton) {
          menuButton.click();
          // Esperar a que el sheet se abra y el elemento esté visible
          setTimeout(() => {
            const firstElement = document.querySelector('#dashboard-link');
            if (firstElement) {
              // Asegurar que el elemento es visible y tiene dimensiones
              const rect = firstElement.getBoundingClientRect();
              if (rect.height > 0 && rect.width > 0) {
                setTimeout(() => setRun(true), 200);
              } else {
                setTimeout(checkAndStart, 200);
              }
            } else {
              setTimeout(checkAndStart, 200);
            }
          }, 500);
          return;
        }
      }
      
      const firstElement = document.querySelector('#dashboard-link');
      if (firstElement) {
        // Asegurar que el elemento es visible y tiene dimensiones
        const rect = firstElement.getBoundingClientRect();
        if (rect.height > 0 && rect.width > 0) {
          setTimeout(() => setRun(true), 200);
        } else {
          setTimeout(checkAndStart, 200);
        }
      } else {
        // Si no existe, reintentar después de un tiempo
        setTimeout(checkAndStart, 300);
      }
    };
    
    const timer = setTimeout(checkAndStart, 800);
    
    return () => clearTimeout(timer);
  }, [isMobile, navigate, stepRoutes]);

  const steps: Step[] = [
    {
      target: '#dashboard-link',
      content: '🫀 Mi centro - Aquí verás tu contador de abstinencia, metas diarias y progreso.',
      disableBeacon: true,
      placement: isMobile ? 'bottom' : 'right',
      offset: 10,
    },
    {
      target: '#plan-link',
      content: '🎯 Mi Plan - Gestiona tus metas y objetivos de recuperación.',
      placement: isMobile ? 'bottom' : 'right',
      offset: 10,
    },
    {
      target: '#progress-link',
      content: '📈 Progreso - Visualiza tu avance con gráficas y reportes detallados.',
      placement: isMobile ? 'bottom' : 'right',
      offset: 10,
    },
    {
      target: '#emotion-journal-link',
      content: '😊 Diario de emociones - Registra y analiza tus emociones diarias.',
      placement: isMobile ? 'bottom' : 'right',
      offset: 10,
    },
    {
      target: '#journal-link',
      content: '📔 Diario - Escribe reflexiones y pensamientos sobre tu proceso.',
      placement: isMobile ? 'bottom' : 'right',
      offset: 10,
    },
    {
      target: '#gratitude-link',
      content: '🙏 Agradecimiento - Practica la gratitud registrando aquello por lo que estás agradecido.',
      placement: isMobile ? 'bottom' : 'right',
      offset: 10,
    },
    {
      target: '#values-link',
      content: '❤️ Valores - Define y trabaja en tus valores personales.',
      placement: isMobile ? 'bottom' : 'right',
      offset: 10,
    },
    {
      target: '#chat-link',
      content: '💬 Chat - Conecta con otros miembros de la comunidad en tiempo real.',
      placement: isMobile ? 'bottom' : 'right',
      offset: 10,
    },
    {
      target: '#community-link',
      content: '🫶 Comunidad - Encuentra mentores o conviértete en mentor de otros.',
      placement: isMobile ? 'bottom' : 'right',
      offset: 10,
    },
    {
      target: '#tools-link',
      content: '🛠️ Herramientas - Accede a recursos adicionales para tu recuperación.',
      placement: isMobile ? 'bottom' : 'right',
      offset: 10,
    },
    {
      target: '#help-link',
      content: '🆘 Ayuda - Encuentra preguntas frecuentes y soporte.',
      placement: isMobile ? 'bottom' : 'right',
      offset: 10,
    },
    {
      target: '#settings-link',
      content: '⚙️ Configuración - Personaliza tu experiencia y gestiona tu cuenta.',
      placement: isMobile ? 'bottom' : 'right',
      offset: 10,
    },
  ];

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status, action, index, type } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    // Navegar cuando el paso está a punto de mostrarse
    if (type === EVENTS.STEP_BEFORE || type === EVENTS.TARGET_NOT_FOUND) {
      if (index >= 0 && index < stepRoutes.length) {
        navigate(stepRoutes[index]);
        
        // En mobile, asegurar que el menú permanece abierto
        if (isMobile) {
          setTimeout(() => {
            const sheetOverlay = document.querySelector('[data-state="open"]');
            if (!sheetOverlay) {
              const menuButton = document.querySelector('button[aria-label="Open sidebar"]') as HTMLButtonElement;
              if (menuButton) {
                menuButton.click();
              }
            }
          }, 100);
        }
      }
    }

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
      stepIndex={0}
      disableOverlayClose
      spotlightClicks={false}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: 'hsl(var(--primary))',
          zIndex: 10001,
          overlayColor: 'rgba(0, 0, 0, 0.5)',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltip: {
          maxWidth: isMobile ? '280px' : '400px',
          position: 'relative',
        },
        spotlight: {
          borderRadius: '8px',
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
