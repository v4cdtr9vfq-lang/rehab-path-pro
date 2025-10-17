-- Primero eliminamos el trigger anterior si existe
DROP TRIGGER IF EXISTS create_default_goals_trigger ON public.profiles;

-- Crear el trigger que se ejecuta cuando se crea un nuevo perfil
CREATE TRIGGER create_default_goals_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_goals();

-- Verificar que la función create_default_goals tenga las metas correctas
-- (La función ya existe, este es solo para documentación)
-- Las metas por defecto son:
-- 1. Meditación (diaria, siempre)
-- 2. Diario de emociones (hoy)
-- 3. Diario de gratitud (diaria, siempre)
-- 4. Diario (diario, siempre)
-- 5. Carta de agradecimiento (mensual, siempre)