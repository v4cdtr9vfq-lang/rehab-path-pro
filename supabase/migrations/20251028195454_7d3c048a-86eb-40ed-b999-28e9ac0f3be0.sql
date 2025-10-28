-- Create tables for sensitive situations and activating persons

-- Table for sensitive situations
CREATE TABLE public.sensitive_situations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  description TEXT NOT NULL,
  emotion_reference TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for sensitive_situations
ALTER TABLE public.sensitive_situations ENABLE ROW LEVEL SECURITY;

-- RLS policies for sensitive_situations
CREATE POLICY "Users can view their own situations"
  ON public.sensitive_situations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own situations"
  ON public.sensitive_situations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own situations"
  ON public.sensitive_situations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own situations"
  ON public.sensitive_situations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Table for activating persons
CREATE TABLE public.activating_persons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  description TEXT NOT NULL,
  emotion_reference TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for activating_persons
ALTER TABLE public.activating_persons ENABLE ROW LEVEL SECURITY;

-- RLS policies for activating_persons
CREATE POLICY "Users can view their own persons"
  ON public.activating_persons
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own persons"
  ON public.activating_persons
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own persons"
  ON public.activating_persons
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own persons"
  ON public.activating_persons
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_sensitive_situations_updated_at
  BEFORE UPDATE ON public.sensitive_situations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_activating_persons_updated_at
  BEFORE UPDATE ON public.activating_persons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();