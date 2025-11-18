import { useEffect, useState } from "react";
import Joyride, { Step, CallBackProps, STATUS, ACTIONS } from "react-joyride";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "react-i18next";

const getTourSteps = (isMobile: boolean, t: any): Step[] => {
  if (isMobile) {
    // Tour para mobile: enfocado en elementos visibles sin necesidad de abrir el sidebar
    return [
      {
        target: 'body',
        content: t('tour.welcome'),
        disableBeacon: true,
        placement: 'center',
      },
      {
        target: '.abstinence-counter',
        content: t('tour.cleanTime'),
        disableBeacon: true,
        placement: 'bottom',
        offset: 10,
      },
      {
        target: '[data-tour="daily-progress"]',
        content: t('tour.dailyProgress'),
        disableBeacon: true,
        placement: 'bottom',
        offset: 10,
      },
      {
        target: '[data-tour="goals-section"]',
        content: t('tour.goals'),
        disableBeacon: true,
        placement: 'bottom',
        offset: 10,
      },
      {
        target: '[data-tour="quick-tools"]',
        content: t('tour.quickTools'),
        disableBeacon: true,
        placement: 'bottom',
        offset: 10,
      },
      {
        target: 'body',
        content: t('tour.menu'),
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
      content: t('tour.center'),
      disableBeacon: true,
      placement,
      offset: 10,
    },
    {
      target: '#plan-link',
      content: t('tour.planDesc'),
      disableBeacon: true,
      placement,
      offset: 10,
    },
    {
      target: '#progress-link',
      content: t('tour.progressDesc'),
      disableBeacon: true,
      placement,
      offset: 10,
    },
    {
      target: '[href="/emotion-journal"]',
      content: t('tour.emotionJournalDesc'),
      disableBeacon: true,
      placement,
      offset: 10,
    },
    {
      target: '[href="/journal"]',
      content: t('tour.journalDesc'),
      disableBeacon: true,
      placement,
      offset: 10,
    },
    {
      target: '[href="/gratitude"]',
      content: t('tour.gratitudeDesc'),
      disableBeacon: true,
      placement,
      offset: 10,
    },
    {
      target: '[href="/values"]',
      content: t('tour.valuesDesc'),
      disableBeacon: true,
      placement,
      offset: 10,
    },
    {
      target: '[href="/chat"]',
      content: t('tour.chatDesc'),
      disableBeacon: true,
      placement,
      offset: 10,
    },
    {
      target: '#community-link',
      content: t('tour.communityDesc'),
      disableBeacon: true,
      placement,
      offset: 10,
    },
    {
      target: '[href="/tools"]',
      content: t('tour.toolsDesc'),
      disableBeacon: true,
      placement,
      offset: 10,
    },
    {
      target: '[href="/help"]',
      content: t('tour.helpDesc'),
      disableBeacon: true,
      placement,
      offset: 10,
    },
    {
      target: '[href="/settings"]',
      content: t('tour.settingsDesc'),
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
  const { t } = useTranslation();
  const [run, setRun] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const tourSteps = getTourSteps(isMobile, t);

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
    const { status, action, type } = data;
    
    console.log('Tour callback:', { status, action, type });
    
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    const shouldClose = finishedStatuses.includes(status) || action === ACTIONS.SKIP || action === ACTIONS.CLOSE;

    if (shouldClose) {
      console.log('Closing tour, marking as completed');
      setRun(false);
      
      // Marcar el tour como completado
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase
            .from('profiles')
            .update({ tour_completed: true })
            .eq('user_id', user.id);
          
          if (error) {
            console.error('Error updating tour_completed:', error);
          } else {
            console.log('Tour marked as completed successfully');
          }
        }
      } catch (error) {
        console.error('Error marking tour as completed:', error);
      }
      
      // Llamar a onComplete después de asegurar que se guardó
      setTimeout(() => onComplete(), 100);
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
        back: t('common.back'),
        close: t('common.close'),
        last: t('common.finish'),
        next: t('common.next'),
        skip: t('tour.skipTour'),
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
