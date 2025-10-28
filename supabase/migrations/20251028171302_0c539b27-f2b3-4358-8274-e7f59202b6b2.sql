-- Add addiction_id column to medals table to track medals per addiction
ALTER TABLE public.medals 
ADD COLUMN addiction_id text;

-- Create index for better query performance
CREATE INDEX idx_medals_addiction_id ON public.medals(addiction_id);

-- For existing medals, set addiction_id to 'original' to represent the original abstinence from profiles
UPDATE public.medals 
SET addiction_id = 'original' 
WHERE addiction_id IS NULL;