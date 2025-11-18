-- Fix handle_new_user function to use correct goal_type values
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  user_language TEXT;
  rehab_type TEXT;
  start_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get language from metadata (default to 'es')
  user_language := COALESCE(NEW.raw_user_meta_data->>'language', 'es');
  
  -- Get rehabilitation type from metadata
  rehab_type := NEW.raw_user_meta_data->>'rehabilitation_type';
  
  -- Calculate start date
  start_date := COALESCE(
    (NEW.raw_user_meta_data->>'start_date')::timestamp with time zone,
    NOW()
  );

  -- Create profile with rehabilitation type
  INSERT INTO public.profiles (
    user_id,
    abstinence_start_date,
    onboarding_completed,
    text_onboarding_completed,
    tour_completed,
    guided_onboarding_step,
    rehabilitation_type,
    available_for_help
  ) VALUES (
    NEW.id,
    start_date,
    false,
    false,
    false,
    'not_started',
    COALESCE(rehab_type, 'otros'),
    false
  );

  -- DO NOT create addiction entry in addictions table
  -- The rehabilitation_type in profiles is the main addiction
  -- Additional addictions will be created manually by the user

  -- Insert default goals based on language with CORRECT goal_type values
  IF user_language = 'en' THEN
    -- English goals
    INSERT INTO public.goals (user_id, text, goal_type, periodic_type, remaining, completed, order_index, language)
    VALUES
      (NEW.id, 'Check-in 🧘', 'today', NULL, 1, false, 1, 'en'),
      (NEW.id, 'Emotion Journal 🎭', 'today', NULL, 1, false, 2, 'en'),
      (NEW.id, 'Gratitude Journal 🙏', 'today', NULL, 1, false, 3, 'en'),
      (NEW.id, 'Personal Journal 📔', 'week', 'weekly', 1, false, 4, 'en');
  ELSE
    -- Spanish goals (default)
    INSERT INTO public.goals (user_id, text, goal_type, periodic_type, remaining, completed, order_index, language)
    VALUES
      (NEW.id, 'Check-in 🧘', 'today', NULL, 1, false, 1, 'es'),
      (NEW.id, 'Diario de emociones 🎭', 'today', NULL, 1, false, 2, 'es'),
      (NEW.id, 'Diario de gratitud 🙏', 'today', NULL, 1, false, 3, 'es'),
      (NEW.id, 'Diario personal 📔', 'week', 'weekly', 1, false, 4, 'es');
  END IF;

  -- Insert default values based on language
  IF user_language = 'en' THEN
    -- English values
    -- Primary values (3)
    INSERT INTO public.values (user_id, name, value_type, order_index, language)
    VALUES
      (NEW.id, 'Integrity', 'primary', 1, 'en'),
      (NEW.id, 'Honesty', 'primary', 2, 'en'),
      (NEW.id, 'Service', 'primary', 3, 'en');
    
    -- Secondary values (4)
    INSERT INTO public.values (user_id, name, value_type, order_index, language)
    VALUES
      (NEW.id, 'Serenity', 'secondary', 4, 'en'),
      (NEW.id, 'Humility', 'secondary', 5, 'en'),
      (NEW.id, 'Compassion', 'secondary', 6, 'en'),
      (NEW.id, 'Discipline', 'secondary', 7, 'en');
  ELSE
    -- Spanish values (default)
    -- Primary values (3)
    INSERT INTO public.values (user_id, name, value_type, order_index, language)
    VALUES
      (NEW.id, 'Integridad', 'primary', 1, 'es'),
      (NEW.id, 'Honestidad', 'primary', 2, 'es'),
      (NEW.id, 'Servicio', 'primary', 3, 'es');
    
    -- Secondary values (6)
    INSERT INTO public.values (user_id, name, value_type, order_index, language)
    VALUES
      (NEW.id, 'Serenidad', 'secondary', 4, 'es'),
      (NEW.id, 'Humildad', 'secondary', 5, 'es'),
      (NEW.id, 'Compasión', 'secondary', 6, 'es'),
      (NEW.id, 'Disciplina', 'secondary', 7, 'es'),
      (NEW.id, 'Gratitud', 'secondary', 8, 'es'),
      (NEW.id, 'Valentía', 'secondary', 9, 'es');
  END IF;

  RETURN NEW;
END;
$function$;