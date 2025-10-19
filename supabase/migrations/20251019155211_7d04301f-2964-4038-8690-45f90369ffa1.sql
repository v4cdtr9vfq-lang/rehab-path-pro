-- Add link column to goals table
ALTER TABLE public.goals 
ADD COLUMN IF NOT EXISTS link text;