-- Update the handle_new_user function to use translation keys for default values
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile with explicit onboarding flags and full_name from metadata
  INSERT INTO public.profiles (
    user_id, 
    text_onboarding_completed, 
    onboarding_completed,
    rehabilitation_type,
    full_name
  )
  VALUES (
    NEW.id, 
    false, 
    false,
    NULL,
    NEW.raw_user_meta_data->>'full_name'
  );
  
  -- Insert default goals for new users with all details
  INSERT INTO public.goals (user_id, text, goal_type, periodic_type, remaining, completed, order_index, description, instructions, notes, link) VALUES
    (NEW.id, '🛌 Hacer la cama', 'always', NULL, 1, false, 0, NULL, NULL, NULL, NULL),
    (NEW.id, 'Meditación + Visualización 🧘', 'always', 'daily', 1, false, 1, NULL, 'visualización tiene que funcionar de esta y esta manera', NULL, NULL),
    (NEW.id, 'Diario de emociones 🌞', 'today', NULL, 1, false, 2, NULL, NULL, NULL, 'https://rehabp.org/emotion-journal'),
    (NEW.id, 'Inventario de hoy 🤔  ', 'always', 'daily', 1, false, 3, NULL, NULL, NULL, 'https://rehabp.org/journal?title=Inventario de hoy'),
    (NEW.id, '🥳 Celebrar mis victorias 💃🕺', 'periodic', 'mitad_mes', 1, false, 4, NULL, NULL, NULL, NULL),
    (NEW.id, 'Carta de agradecimiento', 'periodic', 'final_mes', 1, false, 5, NULL, NULL, NULL, 'https://rehabp.org/journal?title=Carta de agradecimiento');
  
  -- Insert default values using translation keys (3 primary, 4 secondary)
  INSERT INTO public.values (user_id, name, value_type, order_index) VALUES
    (NEW.id, 'values.defaultSelfCare', 'primary', 0),
    (NEW.id, 'values.defaultGratitude', 'primary', 1),
    (NEW.id, 'values.defaultHumor', 'primary', 2),
    (NEW.id, 'values.defaultRespect', 'secondary', 3),
    (NEW.id, 'values.defaultHealth', 'secondary', 4),
    (NEW.id, 'values.defaultConsideration', 'secondary', 5),
    (NEW.id, 'values.defaultCommitment', 'secondary', 6);
  
  RETURN NEW;
END;
$function$;