-- Add text_onboarding_completed field to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS text_onboarding_completed BOOLEAN DEFAULT FALSE;