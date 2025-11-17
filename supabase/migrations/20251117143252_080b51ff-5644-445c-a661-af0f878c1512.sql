-- Add guided onboarding tracking fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS guided_onboarding_step TEXT DEFAULT 'not_started',
ADD COLUMN IF NOT EXISTS guided_onboarding_disabled BOOLEAN DEFAULT false;

-- Possible values for guided_onboarding_step:
-- 'not_started', 'emotion_journal', 'check_in', 'daily_inventory', 'values', 'completed'