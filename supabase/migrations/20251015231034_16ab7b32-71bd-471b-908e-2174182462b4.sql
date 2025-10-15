-- Add target_date and periodic_type columns to goals table
ALTER TABLE public.goals 
ADD COLUMN target_date DATE,
ADD COLUMN periodic_type TEXT;