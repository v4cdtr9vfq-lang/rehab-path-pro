-- Modify the handle_new_user function to include default goals
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  
  -- Insert default goals for new users
  INSERT INTO public.goals (user_id, text, goal_type, periodic_type, remaining, completed) VALUES
    (NEW.id, 'Meditación', 'always', 'daily', 1, false),
    (NEW.id, 'Diario', 'always', 'daily', 1, false),
    (NEW.id, 'Diario de gratitud', 'always', 'daily', 1, false),
    (NEW.id, 'Carta de agradecimiento', 'periodic', 'final_mes', 1, false),
    (NEW.id, 'Celebrar mis victorias', 'periodic', 'mitad_mes', 1, false);
  
  RETURN NEW;
END;
$function$;