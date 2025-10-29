import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TextOnboarding } from "./TextOnboarding";
import { RehabilitationTypeDialog } from "./RehabilitationTypeDialog";
import { TourGuide } from "./TourGuide";

/**
 * OnboardingManager - Coordina el flujo completo del onboarding
 * 
 * Flujo:
 * 1. TextOnboarding (6 pasos descriptivos)
 * 2. RehabilitationTypeDialog (selección de adicción)
 * 3. TourGuide (tour del menú)
 */
export function OnboardingManager() {
  const [userId, setUserId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'text' | 'rehab' | 'tour' | 'complete' | 'loading'>('loading');
  const [retryCount, setRetryCount] = useState(0);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Solo verificar si no hemos verificado aún o si estamos reintentando
    if (!hasChecked || retryCount > 0) {
      checkOnboardingStatus();
    }
  }, [retryCount]);

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
        .select('text_onboarding_completed, onboarding_completed, rehabilitation_type, tour_completed')
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
      } else if (!profile.tour_completed) {
        setCurrentStep('tour');
      } else {
        setCurrentStep('complete');
      }
      
      setHasChecked(true);
    } catch (error) {
      console.error('[OnboardingManager] Error:', error);
      setCurrentStep('complete');
      setHasChecked(true);
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
    setCurrentStep('tour');
  };

  const handleTourComplete = () => {
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
      {currentStep === 'tour' && (
        <TourGuide onComplete={handleTourComplete} />
      )}
    </>
  );
}
