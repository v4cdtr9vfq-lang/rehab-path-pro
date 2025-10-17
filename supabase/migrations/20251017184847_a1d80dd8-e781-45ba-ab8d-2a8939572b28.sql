-- Create medals table to track user achievements
CREATE TABLE public.medals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  medal_type text NOT NULL CHECK (medal_type IN ('valor', 'constancia', 'recuperacion', 'servicio')),
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  popup_shown boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own medals"
  ON public.medals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medals"
  ON public.medals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medals"
  ON public.medals
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create unique constraint to prevent duplicate medals
CREATE UNIQUE INDEX medals_user_medal_unique ON public.medals(user_id, medal_type);