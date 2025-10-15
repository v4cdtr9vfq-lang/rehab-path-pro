-- Create function to insert default goals for new users
CREATE OR REPLACE FUNCTION public.create_default_goals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert default goals for the new user
  INSERT INTO public.goals (user_id, text, goal_type, remaining, completed)
  VALUES
    (NEW.user_id, 'Meditación', 'always', 1, false),
    (NEW.user_id, 'Diario de emociones', 'today', 1, false),
    (NEW.user_id, 'Diario de gratitud', 'always', 1, false),
    (NEW.user_id, 'Diario', 'always', 1, false);
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create default goals when a new profile is created
DROP TRIGGER IF EXISTS on_profile_created_create_goals ON public.profiles;

CREATE TRIGGER on_profile_created_create_goals
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_goals();