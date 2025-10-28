-- Create addictions table for managing multiple addictions per user
CREATE TABLE public.addictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  addiction_type TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.addictions ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own addictions" 
ON public.addictions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own addictions" 
ON public.addictions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addictions" 
ON public.addictions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addictions" 
ON public.addictions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_addictions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_addictions_updated_at
BEFORE UPDATE ON public.addictions
FOR EACH ROW
EXECUTE FUNCTION public.update_addictions_updated_at();

-- Add index for better performance
CREATE INDEX idx_addictions_user_id ON public.addictions(user_id);
CREATE INDEX idx_addictions_is_active ON public.addictions(user_id, is_active);