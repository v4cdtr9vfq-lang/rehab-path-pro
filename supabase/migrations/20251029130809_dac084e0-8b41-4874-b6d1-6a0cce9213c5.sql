-- Update handle_new_user to explicitly set onboarding flags to false
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile with explicit onboarding flags
  INSERT INTO public.profiles (
    user_id, 
    text_onboarding_completed, 
    onboarding_completed,
    rehabilitation_type
  )
  VALUES (
    NEW.id, 
    false, 
    false,
    NULL
  );
  
  -- Insert default goals for new users with all details
  INSERT INTO public.goals (user_id, text, goal_type, periodic_type, remaining, completed, order_index, description, instructions, notes, link) VALUES
    (NEW.id, '🛌 Hacer la cama', 'always', NULL, 1, false, 0, NULL, NULL, NULL, NULL),
    (NEW.id, 'Meditación + Visualización 🧘', 'always', 'daily', 1, false, 1, NULL, 'visualización tiene que funcionar de esta y esta manera', NULL, NULL),
    (NEW.id, 'Diario de emociones 🌞', 'today', NULL, 1, false, 2, NULL, NULL, NULL, 'https://rehabp.org/emotion-journal'),
    (NEW.id, 'Inventario de hoy 🤔  ', 'always', 'daily', 1, false, 3, NULL, NULL, NULL, 'https://rehabp.org/journal?title=Inventario de hoy'),
    (NEW.id, '🥳 Celebrar mis victorias 💃🕺', 'periodic', 'mitad_mes', 1, false, 4, NULL, NULL, NULL, NULL),
    (NEW.id, 'Carta de agradecimiento', 'periodic', 'final_mes', 1, false, 5, NULL, NULL, NULL, 'https://rehabp.org/journal?title=Carta de agradecimiento');
  
  RETURN NEW;
END;
$function$;