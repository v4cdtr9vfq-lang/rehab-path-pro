-- Fix chat message validation by adding length constraint
ALTER TABLE public.chat_messages 
ADD CONSTRAINT chat_message_length_check 
CHECK (char_length(message) > 0 AND char_length(message) <= 2000);

-- Fix function search path for handle_updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix function search path for handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$function$;

-- Fix function search path for create_default_goals
CREATE OR REPLACE FUNCTION public.create_default_goals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.goals (user_id, text, goal_type, periodic_type, remaining, completed)
  VALUES
    (NEW.user_id, 'Meditación', 'always', 'daily', 1, false),
    (NEW.user_id, 'Diario de emociones', 'today', NULL, 1, false),
    (NEW.user_id, 'Diario de gratitud', 'always', 'daily', 1, false),
    (NEW.user_id, 'Diario', 'always', 'daily', 1, false),
    (NEW.user_id, 'Carta de agradecimiento', 'always', 'monthly', 1, false);
  RETURN NEW;
END;
$function$;

-- Fix function search path for update_chat_message_timestamp
CREATE OR REPLACE FUNCTION public.update_chat_message_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;