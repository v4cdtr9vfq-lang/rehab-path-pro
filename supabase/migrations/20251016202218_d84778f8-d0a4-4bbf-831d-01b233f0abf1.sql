-- Create table for goal completions to sync across devices
CREATE TABLE IF NOT EXISTS public.goal_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL,
  instance_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, goal_id, completion_date, instance_index)
);

-- Enable RLS
ALTER TABLE public.goal_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own goal completions"
  ON public.goal_completions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goal completions"
  ON public.goal_completions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goal completions"
  ON public.goal_completions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_goal_completions_user_date 
  ON public.goal_completions(user_id, completion_date);

CREATE INDEX idx_goal_completions_goal 
  ON public.goal_completions(goal_id, completion_date);