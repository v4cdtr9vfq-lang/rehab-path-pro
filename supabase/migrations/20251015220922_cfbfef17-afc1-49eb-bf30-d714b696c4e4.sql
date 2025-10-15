-- Create values table
CREATE TABLE public.values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.values ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own values" 
ON public.values 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own values" 
ON public.values 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own values" 
ON public.values 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own values" 
ON public.values 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create value_selections table to track when values are active
CREATE TABLE public.value_selections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  value_id UUID NOT NULL REFERENCES public.values(id) ON DELETE CASCADE,
  selected_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.value_selections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own value selections" 
ON public.value_selections 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own value selections" 
ON public.value_selections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own value selections" 
ON public.value_selections 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_values_updated_at
BEFORE UPDATE ON public.values
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create index for better query performance
CREATE INDEX idx_value_selections_user_date ON public.value_selections(user_id, selected_date);
CREATE INDEX idx_value_selections_value ON public.value_selections(value_id);