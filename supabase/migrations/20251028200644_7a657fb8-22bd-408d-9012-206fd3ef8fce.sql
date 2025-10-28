-- Create table for automatic thoughts
CREATE TABLE public.automatic_thoughts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  description TEXT NOT NULL,
  emotion_reference TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automatic_thoughts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own automatic thoughts"
ON public.automatic_thoughts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own automatic thoughts"
ON public.automatic_thoughts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own automatic thoughts"
ON public.automatic_thoughts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own automatic thoughts"
ON public.automatic_thoughts
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_automatic_thoughts_updated_at
BEFORE UPDATE ON public.automatic_thoughts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for false beliefs
CREATE TABLE public.false_beliefs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  description TEXT NOT NULL,
  emotion_reference TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.false_beliefs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own false beliefs"
ON public.false_beliefs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own false beliefs"
ON public.false_beliefs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own false beliefs"
ON public.false_beliefs
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own false beliefs"
ON public.false_beliefs
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_false_beliefs_updated_at
BEFORE UPDATE ON public.false_beliefs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();