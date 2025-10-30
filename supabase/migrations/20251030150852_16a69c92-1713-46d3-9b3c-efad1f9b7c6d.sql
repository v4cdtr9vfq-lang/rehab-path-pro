-- Actualizar la función reset_goals_and_abstinence para incluir la información completa
DROP FUNCTION IF EXISTS public.reset_goals_and_abstinence(uuid);

CREATE OR REPLACE FUNCTION public.reset_goals_and_abstinence(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Delete goal completions
  DELETE FROM public.goal_completions WHERE user_id = p_user_id;
  
  -- Delete current goals
  DELETE FROM public.goals WHERE user_id = p_user_id;
  
  -- Insert default goals with complete information including descriptions, instructions, notes, and links
  INSERT INTO public.goals (user_id, text, goal_type, periodic_type, remaining, completed, order_index, description, instructions, notes, link) VALUES
    (p_user_id, 'defaultGoals.practical1', 'always', NULL, 1, false, 0, 'defaultGoals.practical1Description', 'defaultGoals.practical1Instructions', 'defaultGoals.practical1Notes', NULL),
    (p_user_id, 'defaultGoals.emotional1', 'always', 'daily', 1, false, 1, 'defaultGoals.emotional1Description', 'defaultGoals.emotional1Instructions', 'defaultGoals.emotional1Notes', NULL),
    (p_user_id, 'defaultGoals.emotional2', 'today', NULL, 1, false, 2, 'defaultGoals.emotional2Description', 'defaultGoals.emotional2Instructions', 'defaultGoals.emotional2Notes', 'https://rehabp.org/emotion-journal'),
    (p_user_id, 'defaultGoals.inventory', 'always', 'daily', 1, false, 3, 'defaultGoals.inventoryDescription', 'defaultGoals.inventoryInstructions', 'defaultGoals.inventoryNotes', 'https://rehabp.org/journal?title=Inventario de hoy'),
    (p_user_id, 'defaultGoals.relationships3', 'periodic', 'mitad_mes', 1, false, 4, 'defaultGoals.relationships3Description', 'defaultGoals.relationships3Instructions', 'defaultGoals.relationships3Notes', NULL),
    (p_user_id, 'defaultGoals.emotional3', 'periodic', 'final_mes', 1, false, 5, 'defaultGoals.emotional3Description', 'defaultGoals.emotional3Instructions', 'defaultGoals.emotional3Notes', 'https://rehabp.org/journal?title=Carta de agradecimiento');
  
  -- Reset abstinence start date
  UPDATE public.profiles 
  SET abstinence_start_date = now()
  WHERE user_id = p_user_id;
END;
$$;