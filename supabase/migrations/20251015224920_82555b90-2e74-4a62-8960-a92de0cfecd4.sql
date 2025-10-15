-- Create emotion_journal table
CREATE TABLE public.emotion_journal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  main_emotion TEXT NOT NULL,
  sub_emotions TEXT[] NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.emotion_journal ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own emotion entries" 
ON public.emotion_journal 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own emotion entries" 
ON public.emotion_journal 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emotion entries" 
ON public.emotion_journal 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emotion entries" 
ON public.emotion_journal 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_emotion_journal_updated_at
BEFORE UPDATE ON public.emotion_journal
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();