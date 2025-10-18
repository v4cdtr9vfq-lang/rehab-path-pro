-- Drop the old function
DROP FUNCTION IF EXISTS public.reset_user_data_keep_goals(uuid);

-- Create new function to reset only goals and abstinence date
CREATE OR REPLACE FUNCTION public.reset_goals_and_abstinence(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Eliminar completaciones de metas
  DELETE FROM public.goal_completions WHERE user_id = p_user_id;
  
  -- Eliminar metas actuales
  DELETE FROM public.goals WHERE user_id = p_user_id;
  
  -- Insertar metas por defecto
  INSERT INTO public.goals (user_id, text, goal_type, periodic_type, remaining, completed, order_index) VALUES
    (p_user_id, 'Meditación', 'always', 'daily', 1, false, 0),
    (p_user_id, 'Diario', 'always', 'daily', 1, false, 1),
    (p_user_id, 'Diario de gratitud', 'always', 'daily', 1, false, 2),
    (p_user_id, 'Carta de agradecimiento', 'periodic', 'final_mes', 1, false, 3),
    (p_user_id, 'Celebrar mis victorias', 'periodic', 'mitad_mes', 1, false, 4);
  
  -- Resetear fecha de inicio de abstinencia
  UPDATE public.profiles 
  SET abstinence_start_date = now()
  WHERE user_id = p_user_id;
END;
$function$;