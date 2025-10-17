-- Create table for saved quotes
CREATE TABLE public.saved_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quote_text TEXT NOT NULL,
  quote_author TEXT NOT NULL,
  saved_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.saved_quotes ENABLE ROW LEVEL SECURITY;

-- Create policies for saved quotes
CREATE POLICY "Users can view their own saved quotes" 
ON public.saved_quotes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved quotes" 
ON public.saved_quotes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved quotes" 
ON public.saved_quotes 
FOR DELETE 
USING (auth.uid() = user_id);