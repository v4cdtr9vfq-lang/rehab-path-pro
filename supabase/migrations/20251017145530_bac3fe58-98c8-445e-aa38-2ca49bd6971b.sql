-- Create proposed_quotes table for users to submit quote suggestions
CREATE TABLE IF NOT EXISTS public.proposed_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quote_text TEXT NOT NULL,
  quote_author TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.proposed_quotes ENABLE ROW LEVEL SECURITY;

-- Users can view their own proposed quotes
CREATE POLICY "Users can view their own proposed quotes"
ON public.proposed_quotes
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own proposed quotes
CREATE POLICY "Users can create their own proposed quotes"
ON public.proposed_quotes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own proposed quotes
CREATE POLICY "Users can delete their own proposed quotes"
ON public.proposed_quotes
FOR DELETE
USING (auth.uid() = user_id);