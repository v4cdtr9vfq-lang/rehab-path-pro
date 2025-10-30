-- Add preferred sleep schedule columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN preferred_bedtime TEXT DEFAULT '21:00',
ADD COLUMN preferred_wake_up_time TEXT DEFAULT '07:00';