-- Actualizar la función handle_new_user para incluir información completa en las metas predeterminadas
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Create profile with explicit onboarding flags, full_name, and default sleep schedule
  INSERT INTO public.profiles (
    user_id, 
    text_onboarding_completed, 
    onboarding_completed,
    rehabilitation_type,
    full_name,
    bedtime,
    wake_up_time,
    preferred_bedtime,
    preferred_wake_up_time
  )
  VALUES (
    NEW.id, 
    false, 
    false,
    NULL,
    NEW.raw_user_meta_data->>'full_name',
    '21:00',
    '07:00',
    '21:00',
    '07:00'
  );
  
  -- Insert default goals with complete information including descriptions, instructions, notes, and links
  INSERT INTO public.goals (user_id, text, goal_type, periodic_type, remaining, completed, order_index, description, instructions, notes, link) VALUES
    (NEW.id, 'defaultGoals.practical1', 'always', NULL, 1, false, 0, 'defaultGoals.practical1Description', 'defaultGoals.practical1Instructions', 'defaultGoals.practical1Notes', NULL),
    (NEW.id, 'defaultGoals.emotional1', 'always', 'daily', 1, false, 1, 'defaultGoals.emotional1Description', 'defaultGoals.emotional1Instructions', 'defaultGoals.emotional1Notes', NULL),
    (NEW.id, 'defaultGoals.emotional2', 'today', NULL, 1, false, 2, 'defaultGoals.emotional2Description', 'defaultGoals.emotional2Instructions', 'defaultGoals.emotional2Notes', 'https://rehabp.org/emotion-journal'),
    (NEW.id, 'defaultGoals.inventory', 'always', 'daily', 1, false, 3, 'defaultGoals.inventoryDescription', 'defaultGoals.inventoryInstructions', 'defaultGoals.inventoryNotes', 'https://rehabp.org/journal?title=Inventario de hoy'),
    (NEW.id, 'defaultGoals.relationships3', 'periodic', 'mitad_mes', 1, false, 4, 'defaultGoals.relationships3Description', 'defaultGoals.relationships3Instructions', 'defaultGoals.relationships3Notes', NULL),
    (NEW.id, 'defaultGoals.emotional3', 'periodic', 'final_mes', 1, false, 5, 'defaultGoals.emotional3Description', 'defaultGoals.emotional3Instructions', 'defaultGoals.emotional3Notes', 'https://rehabp.org/journal?title=Carta de agradecimiento');
  
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
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();