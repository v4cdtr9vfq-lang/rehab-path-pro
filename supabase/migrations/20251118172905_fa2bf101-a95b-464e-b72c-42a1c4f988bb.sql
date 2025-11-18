-- Fix handle_new_user function with CORRECT default goals and values
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

  -- Insert default goals based on language with CORRECT goals and emojis
  IF user_language = 'en' THEN
    -- English goals (7 goals)
    INSERT INTO public.goals (user_id, text, goal_type, periodic_type, remaining, completed, order_index, description, instructions, notes, link, language)
    VALUES
      (NEW.id, '🛌 Make your bed', 'always', NULL, 1, false, 0, 'A made bed is a visual reminder of your commitment to an orderly and productive life.', 'As soon as you get up, make your bed before doing anything else.', 'This simple act can set the tone for the rest of your day, giving you a sense of accomplishment from the start.', NULL, 'en'),
      (NEW.id, 'Meditation 🧘', 'always', 'daily', 1, false, 1, 'Dedicate time each day to meditate and visualize your goals.', 'Find a quiet place, close your eyes and breathe deeply. Visualize your life free from addictions.', 'Regular practice of meditation and visualization strengthens your mind and helps you stay focused on your recovery.', NULL, 'en'),
      (NEW.id, 'Emotional Journal 🌞', 'always', NULL, 1, false, 2, 'Write about your emotions to understand them better.', 'Take a few minutes to reflect on how you feel today and write down your thoughts.', 'Writing about your emotions helps you process them and find patterns in your emotional behavior.', 'https://rehabp.org/emotion-journal', 'en'),
      (NEW.id, 'Daily inventory 🤔', 'always', 'daily', 1, false, 3, 'Do a daily personal inventory to assess your progress.', 'At the end of the day, reflect on your actions, decisions and emotions.', 'The daily inventory allows you to identify areas for improvement and celebrate your achievements.', 'https://rehabp.org/journal?title=Daily inventory', 'en'),
      (NEW.id, 'Gratitude letter 💌', 'periodic', 'final_mes', 1, false, 4, 'Write a thank you letter to someone who has supported you.', 'Think of someone who has been important in your life and write a letter expressing your gratitude.', 'Expressing gratitude strengthens your relationships and helps you recognize the positive things in your life.', 'https://rehabp.org/journal?title=Gratitude letter', 'en'),
      (NEW.id, 'Contact a friend 📞', 'periodic', 'mitad_mes', 1, false, 5, 'Keep in touch with your friends and loved ones.', 'Call or send a message to a friend to catch up.', 'Social connections are fundamental to your emotional well-being and your recovery process.', NULL, 'en'),
      (NEW.id, 'Review progress 📊', 'periodic', 'semanal', 1, false, 6, 'Review your weekly progress and adjust your goals.', 'Each week, take a moment to review what you have achieved and what you can improve.', 'Regular reflection helps you stay on track and adjust your strategy when necessary.', NULL, 'en');
  ELSE
    -- Spanish goals (7 goals) - DEFAULT
    INSERT INTO public.goals (user_id, text, goal_type, periodic_type, remaining, completed, order_index, description, instructions, notes, link, language)
    VALUES
      (NEW.id, '🛌 Hacer la cama', 'always', NULL, 1, false, 0, 'Una cama hecha es un recordatorio visual de tu compromiso con una vida ordenada y productiva.', 'Hacer la cama por la mañana es el primer paso de tu plan. Crea una inercia positiva para seguir el plan que has definido para tu transformación.', 'Este simple acto puede marcar el tono para el resto de tu día, dándote una sensación de logro desde el principio.', NULL, 'es'),
      (NEW.id, 'Meditación 🧘', 'always', 'daily', 1, false, 1, 'Dedica tiempo cada día a meditar y visualizar tus metas.', 'Encuentra un lugar tranquilo, cierra los ojos y respira profundamente. Visualiza tu vida libre de adicciones.', 'La práctica regular de meditación y visualización fortalece tu mente y te ayuda a mantenerte enfocado en tu recuperación.', NULL, 'es'),
      (NEW.id, 'Diario emocional 🌞', 'always', NULL, 1, false, 2, 'Escribe sobre tus emociones para comprenderlas mejor.', 'Toma unos minutos para reflexionar sobre cómo te sientes hoy y escribe tus pensamientos.', 'Escribir sobre tus emociones te ayuda a procesarlas y encontrar patrones en tu comportamiento emocional.', 'https://rehabp.org/emotion-journal', 'es'),
      (NEW.id, 'Inventario diario 🤔', 'always', 'daily', 1, false, 3, 'Haz un inventario personal diario para evaluar tu progreso.', 'Al final del día, reflexiona sobre tus acciones, decisiones y emociones.', 'El inventario diario te permite identificar áreas de mejora y celebrar tus logros.', 'https://rehabp.org/journal?title=Inventario diario', 'es'),
      (NEW.id, 'Carta de agradecimiento 💌', 'periodic', 'final_mes', 1, false, 4, 'Escribe una carta de agradecimiento a alguien que te ha apoyado.', 'Piensa en alguien que ha sido importante en tu vida y escribe una carta expresando tu gratitud.', 'Expresar gratitud fortalece tus relaciones y te ayuda a reconocer las cosas positivas en tu vida.', 'https://rehabp.org/journal?title=Carta de agradecimiento', 'es'),
      (NEW.id, 'Contactar a un amigo 📞', 'periodic', 'mitad_mes', 1, false, 5, 'Mantén el contacto con tus amigos y seres queridos.', 'Llama o envía un mensaje a un amigo para ponerte al día.', 'Las conexiones sociales son fundamentales para tu bienestar emocional y tu proceso de recuperación.', NULL, 'es'),
      (NEW.id, 'Revisar progreso 📊', 'periodic', 'semanal', 1, false, 6, 'Revisa tu progreso semanal y ajusta tus objetivos.', 'Cada semana, toma un momento para revisar qué has logrado y qué puedes mejorar.', 'La reflexión regular te ayuda a mantenerte en el camino y ajustar tu estrategia cuando sea necesario.', NULL, 'es');
  END IF;

  -- Insert default values based on language with CORRECT values
  IF user_language = 'en' THEN
    -- English values (3 primary + 6 secondary)
    INSERT INTO public.values (user_id, name, value_type, order_index, language)
    VALUES
      (NEW.id, 'Self-care', 'primary', 0, 'en'),
      (NEW.id, 'Gratitude', 'primary', 1, 'en'),
      (NEW.id, 'Humor', 'primary', 2, 'en'),
      (NEW.id, 'Respect', 'secondary', 3, 'en'),
      (NEW.id, 'Health', 'secondary', 4, 'en'),
      (NEW.id, 'Consideration', 'secondary', 5, 'en'),
      (NEW.id, 'Commitment', 'secondary', 6, 'en'),
      (NEW.id, 'Honesty', 'secondary', 7, 'en'),
      (NEW.id, 'Responsibility', 'secondary', 8, 'en');
  ELSE
    -- Spanish values (3 primary + 6 secondary) - DEFAULT
    INSERT INTO public.values (user_id, name, value_type, order_index, language)
    VALUES
      (NEW.id, 'Autocuidado', 'primary', 0, 'es'),
      (NEW.id, 'Gratitud', 'primary', 1, 'es'),
      (NEW.id, 'Humor', 'primary', 2, 'es'),
      (NEW.id, 'Respeto', 'secondary', 3, 'es'),
      (NEW.id, 'Salud', 'secondary', 4, 'es'),
      (NEW.id, 'Consideración', 'secondary', 5, 'es'),
      (NEW.id, 'Compromiso', 'secondary', 6, 'es'),
      (NEW.id, 'Honestidad', 'secondary', 7, 'es'),
      (NEW.id, 'Responsabilidad', 'secondary', 8, 'es');
  END IF;

  RETURN NEW;
END;
$function$;