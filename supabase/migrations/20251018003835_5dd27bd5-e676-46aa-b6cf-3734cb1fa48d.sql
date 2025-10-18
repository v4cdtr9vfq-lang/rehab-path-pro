-- Eliminar el trigger que crea metas por defecto para nuevos usuarios
DROP TRIGGER IF EXISTS create_default_goals_trigger ON public.profiles;
DROP TRIGGER IF EXISTS on_profile_created_create_goals ON public.profiles;

-- Eliminar la función que crea metas por defecto
DROP FUNCTION IF EXISTS public.create_default_goals();