import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TextOnboarding } from "./TextOnboarding";
import { RehabilitationTypeDialog } from "./RehabilitationTypeDialog";

/**
 * OnboardingManager - Coordina el flujo completo del onboarding
 * 
 * Flujo:
 * 1. TextOnboarding (6 pasos descriptivos)
 * 2. RehabilitationTypeDialog (selección de adicción)
 */
export function OnboardingManager() {
  const [userId, setUserId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'text' | 'rehab' | 'complete' | 'loading'>('loading');
  const [retryCount, setRetryCount] = useState(0);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    if (!initialCheckDone) {
      checkOnboardingStatus();
    }
  }, [retryCount, initialCheckDone]);

  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCurrentStep('complete');
        return;
      }

      setUserId(user.id);

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('text_onboarding_completed, onboarding_completed, rehabilitation_type')
        .eq('user_id', user.id)
        .single();

      // Si el perfil no existe y no hemos reintentado mucho, reintentar
      if (!profile && retryCount < 3) {
        setTimeout(() => setRetryCount(prev => prev + 1), 1000);
        return;
      }

      if (!profile) {
        console.error('[OnboardingManager] Profile not found after retries');
        setCurrentStep('complete');
        return;
      }

      // Determinar qué paso mostrar
      if (!profile.text_onboarding_completed) {
        setCurrentStep('text');
      } else if (!profile.rehabilitation_type) {
        setCurrentStep('rehab');
      } else {
        setCurrentStep('complete');
      }
      
      setInitialCheckDone(true);
    } catch (error) {
      console.error('[OnboardingManager] Error:', error);
      setCurrentStep('complete');
      setInitialCheckDone(true);
    }
  };

  const handleTextComplete = async () => {
    if (!userId) return;
    
    try {
      await supabase
        .from('profiles')
        .update({ 
          text_onboarding_completed: true,
          onboarding_completed: true 
        })
        .eq('user_id', userId);
      
      setCurrentStep('rehab');
    } catch (error) {
      console.error('[OnboardingManager] Error completing text:', error);
    }
  };

  const handleRehabComplete = () => {
    setCurrentStep('complete');
  };

  if (currentStep === 'complete' || currentStep === 'loading') return null;

  return (
    <>
      {currentStep === 'text' && (
        <TextOnboarding onComplete={handleTextComplete} />
      )}
      {currentStep === 'rehab' && (
        <RehabilitationTypeDialog onComplete={handleRehabComplete} />
      )}
    </>
  );
}
