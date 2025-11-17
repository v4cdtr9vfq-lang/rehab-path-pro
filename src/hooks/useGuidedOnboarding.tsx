import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type GuidedStep = 'not_started' | 'emotion_journal' | 'check_in' | 'daily_inventory' | 'values' | 'completed';

export function useGuidedOnboarding() {
  const [currentStep, setCurrentStep] = useState<GuidedStep | null>(null);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkGuidedOnboardingStatus();
  }, []);

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
        setCurrentStep(profile.guided_onboarding_step as GuidedStep);
        setIsDisabled(profile.guided_onboarding_disabled || false);
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

  const shouldShowDialog = (step: GuidedStep) => {
    return !isDisabled && currentStep === step;
  };

  return {
    currentStep,
    isDisabled,
    isLoading,
    updateStep,
    shouldShowDialog,
    refresh: checkGuidedOnboardingStatus
  };
}
