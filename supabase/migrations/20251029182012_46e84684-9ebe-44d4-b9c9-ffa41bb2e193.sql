-- Update the reset_goals_and_abstinence function to use translation keys
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
  
  -- Insert default goals using translation keys
  INSERT INTO public.goals (user_id, text, goal_type, periodic_type, remaining, completed, order_index) VALUES
    (p_user_id, 'defaultGoals.emotional1', 'today', NULL, 1, false, 0),
    (p_user_id, 'defaultGoals.emotional2', 'today', NULL, 1, false, 1),
    (p_user_id, 'defaultGoals.emotional3', 'today', NULL, 1, false, 2),
    (p_user_id, 'defaultGoals.physical1', 'today', NULL, 1, false, 3),
    (p_user_id, 'defaultGoals.physical2', 'today', NULL, 1, false, 4),
    (p_user_id, 'defaultGoals.physical3', 'today', NULL, 1, false, 5),
    (p_user_id, 'defaultGoals.relationships1', 'week', NULL, 1, false, 6),
    (p_user_id, 'defaultGoals.relationships2', 'week', NULL, 1, false, 7),
    (p_user_id, 'defaultGoals.practical1', 'week', NULL, 1, false, 8),
    (p_user_id, 'defaultGoals.practical2', 'week', NULL, 1, false, 9),
    (p_user_id, 'defaultGoals.spiritual1', 'month', NULL, 1, false, 10),
    (p_user_id, 'defaultGoals.spiritual2', 'month', NULL, 1, false, 11),
    (p_user_id, 'defaultGoals.recovery1', 'month', NULL, 1, false, 12);
  
  -- Reset abstinence start date
  UPDATE public.profiles 
  SET abstinence_start_date = now()
  WHERE user_id = p_user_id;
END;
$function$;