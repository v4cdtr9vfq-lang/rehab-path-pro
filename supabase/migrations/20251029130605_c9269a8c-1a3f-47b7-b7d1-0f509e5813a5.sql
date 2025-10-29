-- Add rehabilitation_type column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS rehabilitation_type TEXT DEFAULT NULL;