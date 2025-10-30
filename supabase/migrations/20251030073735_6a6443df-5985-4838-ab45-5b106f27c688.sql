-- Add bedtime and wake_up_time columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bedtime TEXT DEFAULT '21:00',
ADD COLUMN IF NOT EXISTS wake_up_time TEXT DEFAULT '07:00';