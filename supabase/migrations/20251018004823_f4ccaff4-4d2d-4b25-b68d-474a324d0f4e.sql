-- Add type column to values table to differentiate primary and secondary values
ALTER TABLE public.values 
ADD COLUMN value_type TEXT NOT NULL DEFAULT 'secondary' CHECK (value_type IN ('primary', 'secondary'));