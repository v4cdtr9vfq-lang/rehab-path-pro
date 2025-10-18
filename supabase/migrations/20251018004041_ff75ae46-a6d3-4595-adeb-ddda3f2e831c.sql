-- Función para resetear datos de usuario manteniendo solo las metas
CREATE OR REPLACE FUNCTION public.reset_user_data_keep_goals(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Eliminar completaciones de metas
  DELETE FROM public.goal_completions WHERE user_id = p_user_id;
  
  -- Eliminar entradas de check-in
  DELETE FROM public.check_ins WHERE user_id = p_user_id;
  
  -- Eliminar entradas del diario de emociones
  DELETE FROM public.emotion_journal WHERE user_id = p_user_id;
  
  -- Eliminar entradas de gratitud
  DELETE FROM public.gratitude_entries WHERE user_id = p_user_id;
  
  -- Eliminar entradas del diario
  DELETE FROM public.journal_entries WHERE user_id = p_user_id;
  
  -- Eliminar citas guardadas
  DELETE FROM public.saved_quotes WHERE user_id = p_user_id;
  
  -- Eliminar citas propuestas
  DELETE FROM public.proposed_quotes WHERE user_id = p_user_id;
  
  -- Eliminar contactos de apoyo
  DELETE FROM public.support_contacts WHERE user_id = p_user_id;
  
  -- Eliminar selecciones de valores
  DELETE FROM public.value_selections WHERE user_id = p_user_id;
  
  -- Eliminar valores
  DELETE FROM public.values WHERE user_id = p_user_id;
  
  -- Eliminar mensajes de chat
  DELETE FROM public.chat_messages WHERE user_id = p_user_id;
  
  -- Eliminar medallas
  DELETE FROM public.medals WHERE user_id = p_user_id;
  
  -- Eliminar reportes de mensajes
  DELETE FROM public.message_reports WHERE reported_by = p_user_id;
  
  -- Eliminar preguntas del usuario
  DELETE FROM public.user_questions WHERE user_id = p_user_id;
  
  -- Resetear fecha de inicio de abstinencia en el perfil (opcional)
  UPDATE public.profiles 
  SET abstinence_start_date = NULL 
  WHERE user_id = p_user_id;
  
  -- Las metas (goals) NO se eliminan - se mantienen
END;
$$;

-- Otorgar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.reset_user_data_keep_goals(UUID) TO authenticated;