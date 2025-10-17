-- Add description and notes columns to goals table
ALTER TABLE public.goals 
ADD COLUMN description TEXT,
ADD COLUMN notes TEXT;