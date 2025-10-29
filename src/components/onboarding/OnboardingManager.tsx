import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TextOnboarding } from "./TextOnboarding";
import { OnboardingTour } from "./OnboardingTour";
import { RehabilitationTypeDialog } from "./RehabilitationTypeDialog";

/**
 * OnboardingManager - Coordina el flujo completo del onboarding
 * 
 * Flujo:
 * 1. TextOnboarding (6 pasos descriptivos)
 * 2. OnboardingTour (tour interactivo)
 * 3. RehabilitationTypeDialog (selección de adicción)
 */
export function OnboardingManager() {
  const [userId, setUserId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'text' | 'tour' | 'rehab' | 'complete'>('complete');

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('text_onboarding_completed, onboarding_completed, rehabilitation_type')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      // Determinar qué paso mostrar
      if (!profile.text_onboarding_completed) {
        setCurrentStep('text');
      } else if (!profile.onboarding_completed) {
        setCurrentStep('tour');
      } else if (!(profile as any).rehabilitation_type) {
        setCurrentStep('rehab');
      } else {
        setCurrentStep('complete');
      }
    } catch (error) {
      console.error('[OnboardingManager] Error:', error);
    }
  };

  const handleTextComplete = async () => {
    if (!userId) return;
    
    try {
      await supabase
        .from('profiles')
        .update({ text_onboarding_completed: true })
        .eq('user_id', userId);
      
      setCurrentStep('tour');
    } catch (error) {
      console.error('[OnboardingManager] Error completing text:', error);
    }
  };

  const handleTourComplete = async () => {
    if (!userId) return;
    
    try {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('user_id', userId);
      
      setCurrentStep('rehab');
    } catch (error) {
      console.error('[OnboardingManager] Error completing tour:', error);
    }
  };

  const handleRehabComplete = () => {
    setCurrentStep('complete');
  };

  if (currentStep === 'complete') return null;

  return (
    <>
      {currentStep === 'text' && (
        <TextOnboarding onComplete={handleTextComplete} />
      )}
      {currentStep === 'tour' && (
        <OnboardingTour onComplete={handleTourComplete} />
      )}
      {currentStep === 'rehab' && (
        <RehabilitationTypeDialog onComplete={handleRehabComplete} />
      )}
    </>
  );
}
