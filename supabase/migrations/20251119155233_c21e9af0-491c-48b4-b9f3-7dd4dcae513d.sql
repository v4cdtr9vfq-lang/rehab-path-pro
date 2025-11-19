-- Create table for AI Coach conversation history
CREATE TABLE public.ai_coach_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ai_coach_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own AI Coach messages" 
ON public.ai_coach_messages 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own AI Coach messages" 
ON public.ai_coach_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI Coach messages" 
ON public.ai_coach_messages 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_ai_coach_messages_user_id_created_at 
ON public.ai_coach_messages(user_id, created_at);