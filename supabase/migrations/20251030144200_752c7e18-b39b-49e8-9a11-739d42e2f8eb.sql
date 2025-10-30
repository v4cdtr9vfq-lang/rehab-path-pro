-- Update handle_new_user to use translation keys for default goals
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
  
  -- Insert default goals for new users using translation keys
  INSERT INTO public.goals (user_id, text, goal_type, periodic_type, remaining, completed, order_index, description, instructions, notes, link) VALUES
    (NEW.id, 'defaultGoals.practical1', 'always', NULL, 1, false, 0, NULL, NULL, NULL, NULL),
    (NEW.id, 'defaultGoals.emotional1', 'always', 'daily', 1, false, 1, NULL, NULL, NULL, NULL),
    (NEW.id, 'defaultGoals.emotional2', 'today', NULL, 1, false, 2, NULL, NULL, NULL, 'https://rehabp.org/emotion-journal'),
    (NEW.id, 'defaultGoals.inventory', 'always', 'daily', 1, false, 3, NULL, NULL, NULL, 'https://rehabp.org/journal?title=Inventario de hoy'),
    (NEW.id, 'defaultGoals.relationships3', 'periodic', 'mitad_mes', 1, false, 4, NULL, NULL, NULL, NULL),
    (NEW.id, 'defaultGoals.emotional3', 'periodic', 'final_mes', 1, false, 5, NULL, NULL, NULL, 'https://rehabp.org/journal?title=Carta de agradecimiento');
  
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

-- Update reset_goals_and_abstinence to use translation keys
CREATE OR REPLACE FUNCTION public.reset_goals_and_abstinence(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete goal completions
  DELETE FROM public.goal_completions WHERE user_id = p_user_id;
  
  -- Delete current goals
  DELETE FROM public.goals WHERE user_id = p_user_id;
  
  -- Insert default goals using translation keys matching handle_new_user
  INSERT INTO public.goals (user_id, text, goal_type, periodic_type, remaining, completed, order_index, description, instructions, notes, link) VALUES
    (p_user_id, 'defaultGoals.practical1', 'always', NULL, 1, false, 0, NULL, NULL, NULL, NULL),
    (p_user_id, 'defaultGoals.emotional1', 'always', 'daily', 1, false, 1, NULL, NULL, NULL, NULL),
    (p_user_id, 'defaultGoals.emotional2', 'today', NULL, 1, false, 2, NULL, NULL, NULL, 'https://rehabp.org/emotion-journal'),
    (p_user_id, 'defaultGoals.inventory', 'always', 'daily', 1, false, 3, NULL, NULL, NULL, 'https://rehabp.org/journal?title=Inventario de hoy'),
    (p_user_id, 'defaultGoals.relationships3', 'periodic', 'mitad_mes', 1, false, 4, NULL, NULL, NULL, NULL),
    (p_user_id, 'defaultGoals.emotional3', 'periodic', 'final_mes', 1, false, 5, NULL, NULL, NULL, 'https://rehabp.org/journal?title=Carta de agradecimiento');
  
  -- Reset abstinence start date
  UPDATE public.profiles 
  SET abstinence_start_date = now()
  WHERE user_id = p_user_id;
END;
$function$;