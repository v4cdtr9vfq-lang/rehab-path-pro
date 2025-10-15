-- Drop the trigger first
DROP TRIGGER IF EXISTS on_profile_created_create_goals ON public.profiles;

-- Drop the function
DROP FUNCTION IF EXISTS public.create_default_goals();

-- Recreate the function with the monthly gratitude letter included
CREATE OR REPLACE FUNCTION public.create_default_goals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Insert default goals for the new user
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

-- Recreate the trigger
CREATE TRIGGER on_profile_created_create_goals
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_goals();