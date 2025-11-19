import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type GuidedStep = 'not_started' | 'emotion_journal' | 'gratitude' | 'check_in' | 'daily_inventory' | 'values' | 'completed';

export function useGuidedOnboarding() {
  const [currentStep, setCurrentStep] = useState<GuidedStep | null>(null);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldShow, setShouldShow] = useState(true); // Control temporal del popup

  useEffect(() => {
    checkGuidedOnboardingStatus();
    
    // Listen for auth changes to reset the flow on login
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Reset to emotion_journal when user logs in (if not disabled)
        resetOnLogin(session.user.id);
        setShouldShow(true); // Mostrar popups en nuevo login
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Reset shouldShow when currentStep changes
  useEffect(() => {
    if (currentStep) {
      setShouldShow(true);
    }
  }, [currentStep]);

  const resetOnLogin = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('guided_onboarding_disabled')
        .eq('user_id', userId)
        .single();

      // Only reset if assistance is not disabled
      if (profile && !profile.guided_onboarding_disabled) {
        await supabase
          .from('profiles')
          .update({ guided_onboarding_step: 'emotion_journal' })
          .eq('user_id', userId);
        
        setCurrentStep('emotion_journal');
      }
    } catch (error) {
      console.error('Error resetting guided onboarding on login:', error);
    }
  };

  const checkGuidedOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('guided_onboarding_step, guided_onboarding_disabled')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        // Si el step es 'not_started' y la asistencia está habilitada, iniciar automáticamente
        if (profile.guided_onboarding_step === 'not_started' && !profile.guided_onboarding_disabled) {
          await supabase
            .from('profiles')
            .update({ guided_onboarding_step: 'emotion_journal' })
            .eq('user_id', user.id);
          
          setCurrentStep('emotion_journal');
          setIsDisabled(false);
        } else {
          setCurrentStep(profile.guided_onboarding_step as GuidedStep);
          setIsDisabled(profile.guided_onboarding_disabled || false);
        }
      }
    } catch (error) {
      console.error('Error checking guided onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStep = async (nextStep: GuidedStep) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('profiles')
        .update({ guided_onboarding_step: nextStep })
        .eq('user_id', user.id);

      setCurrentStep(nextStep);
    } catch (error) {
      console.error('Error updating guided onboarding step:', error);
    }
  };

  const toggleAssistance = async (enabled: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('profiles')
        .update({ 
          guided_onboarding_disabled: !enabled,
          guided_onboarding_step: enabled ? 'emotion_journal' : 'completed'
        })
        .eq('user_id', user.id);

      setIsDisabled(!enabled);
      setCurrentStep(enabled ? 'emotion_journal' : 'completed');
    } catch (error) {
      console.error('Error toggling guided assistance:', error);
    }
  };

  const shouldShowDialog = (step: GuidedStep) => {
    return !isDisabled && currentStep === step && shouldShow;
  };

  const hideTemporarily = () => {
    setShouldShow(false);
  };

  return {
    currentStep,
    isDisabled,
    isLoading,
    updateStep,
    toggleAssistance,
    shouldShowDialog,
    hideTemporarily,
    refresh: checkGuidedOnboardingStatus
  };
}
