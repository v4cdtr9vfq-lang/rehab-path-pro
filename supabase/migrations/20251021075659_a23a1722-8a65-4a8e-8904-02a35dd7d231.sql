-- Create sleep_quality table
CREATE TABLE public.sleep_quality (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quality_score INTEGER NOT NULL CHECK (quality_score >= 1 AND quality_score <= 10),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sleep_quality ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own sleep quality entries" 
ON public.sleep_quality 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sleep quality entries" 
ON public.sleep_quality 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sleep quality entries" 
ON public.sleep_quality 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sleep quality entries" 
ON public.sleep_quality 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_sleep_quality_updated_at
BEFORE UPDATE ON public.sleep_quality
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create unique constraint to prevent multiple entries per day
CREATE UNIQUE INDEX sleep_quality_user_date_idx ON public.sleep_quality(user_id, entry_date);