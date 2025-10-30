-- Update handle_new_user function with corrected English goals
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  
  -- Insert default goals in SPANISH
  INSERT INTO public.goals (user_id, text, goal_type, periodic_type, remaining, completed, order_index, description, instructions, notes, link, language) VALUES
    (NEW.id, '🛌 Hacer la cama', 'always', NULL, 1, false, 0, 'Una cama hecha es un recordatorio visual de tu compromiso con una vida ordenada y productiva.', 'Tan pronto te levantes, haz la cama antes de hacer cualquier otra cosa.', 'Este simple acto puede establecer el tono para el resto de tu día, dándote un sentido de logro desde el principio.', NULL, 'es'),
    (NEW.id, 'Meditación + Visualización 🧘', 'always', 'daily', 1, false, 1, 'Dedica tiempo cada día a meditar y visualizar tus metas.', 'Encuentra un lugar tranquilo, cierra los ojos y respira profundamente. Visualiza tu vida libre de adicciones.', 'La práctica regular de meditación y visualización fortalece tu mente y te ayuda a mantenerte enfocado en tu recuperación.', NULL, 'es'),
    (NEW.id, '📔 Escribir mis emociones', 'today', NULL, 1, false, 2, 'Escribe sobre tus emociones para entenderlas mejor.', 'Toma unos minutos para reflexionar sobre cómo te sientes hoy y escribe tus pensamientos.', 'Escribir sobre tus emociones te ayuda a procesarlas y encontrar patrones en tu comportamiento emocional.', 'https://rehabp.org/emotion-journal', 'es'),
    (NEW.id, '📝 Inventario diario', 'always', 'daily', 1, false, 3, 'Haz un inventario personal diario para evaluar tu progreso.', 'Al final del día, reflexiona sobre tus acciones, decisiones y emociones.', 'El inventario diario te permite identificar áreas de mejora y celebrar tus logros.', 'https://rehabp.org/journal?title=Inventario de hoy', 'es'),
    (NEW.id, 'Contactar a un amigo 📞', 'periodic', 'mitad_mes', 1, false, 4, 'Mantén el contacto con tus amigos y seres queridos.', 'Llama o envía un mensaje a un amigo para ponerte al día.', 'Las conexiones sociales son fundamentales para tu bienestar emocional y tu proceso de recuperación.', NULL, 'es'),
    (NEW.id, '💌 Carta de agradecimiento', 'periodic', 'final_mes', 1, false, 5, 'Escribe una carta de agradecimiento a alguien que te ha apoyado.', 'Piensa en alguien que ha sido importante en tu vida y escribe una carta expresando tu gratitud.', 'Expresar gratitud fortalece tus relaciones y te ayuda a reconocer las cosas positivas en tu vida.', 'https://rehabp.org/journal?title=Carta de agradecimiento', 'es');
  
  -- Insert default goals in ENGLISH (corrected version)
  INSERT INTO public.goals (user_id, text, goal_type, periodic_type, remaining, completed, order_index, description, instructions, notes, link, language) VALUES
    (NEW.id, '🛌 Make your bed', 'always', NULL, 1, false, 6, 'A made bed is a visual reminder of your commitment to an orderly and productive life.', 'As soon as you get up, make your bed before doing anything else.', 'This simple act can set the tone for the rest of your day, giving you a sense of accomplishment from the start.', NULL, 'en'),
    (NEW.id, 'Meditation 🧘', 'always', 'daily', 1, false, 7, 'Dedicate time each day to meditate and visualize your goals.', 'Find a quiet place, close your eyes and breathe deeply. Visualize your life free from addictions.', 'Regular practice of meditation and visualization strengthens your mind and helps you stay focused on your recovery.', NULL, 'en'),
    (NEW.id, 'Emotional Journal 🌞', 'today', NULL, 1, false, 8, 'Write about your emotions to understand them better.', 'Take a few minutes to reflect on how you feel today and write down your thoughts.', 'Writing about your emotions helps you process them and find patterns in your emotional behavior.', 'https://rehabp.org/emotion-journal', 'en'),
    (NEW.id, 'Daily inventory 🤔', 'always', 'daily', 1, false, 9, 'Do a daily personal inventory to assess your progress.', 'At the end of the day, reflect on your actions, decisions and emotions.', 'The daily inventory allows you to identify areas for improvement and celebrate your achievements.', 'https://rehabp.org/journal?title=Daily inventory', 'en'),
    (NEW.id, 'Contact a friend 📞', 'periodic', 'mitad_mes', 1, false, 10, 'Keep in touch with your friends and loved ones.', 'Call or send a message to a friend to catch up.', 'Social connections are fundamental to your emotional well-being and your recovery process.', NULL, 'en'),
    (NEW.id, 'Gratitude letter 💌', 'periodic', 'final_mes', 1, false, 11, 'Write a thank you letter to someone who has supported you.', 'Think of someone who has been important in your life and write a letter expressing your gratitude.', 'Expressing gratitude strengthens your relationships and helps you recognize the positive things in your life.', 'https://rehabp.org/journal?title=Gratitude letter', 'en');
  
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
$function$;

-- Update reset_goals_and_abstinence function with corrected English goals
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
  
  -- Insert default goals in SPANISH
  INSERT INTO public.goals (user_id, text, goal_type, periodic_type, remaining, completed, order_index, description, instructions, notes, link, language) VALUES
    (p_user_id, '🛌 Hacer la cama', 'always', NULL, 1, false, 0, 'Una cama hecha es un recordatorio visual de tu compromiso con una vida ordenada y productiva.', 'Tan pronto te levantes, haz la cama antes de hacer cualquier otra cosa.', 'Este simple acto puede establecer el tono para el resto de tu día, dándote un sentido de logro desde el principio.', NULL, 'es'),
    (p_user_id, 'Meditación + Visualización 🧘', 'always', 'daily', 1, false, 1, 'Dedica tiempo cada día a meditar y visualizar tus metas.', 'Encuentra un lugar tranquilo, cierra los ojos y respira profundamente. Visualiza tu vida libre de adicciones.', 'La práctica regular de meditación y visualización fortalece tu mente y te ayuda a mantenerte enfocado en tu recuperación.', NULL, 'es'),
    (p_user_id, '📔 Escribir mis emociones', 'today', NULL, 1, false, 2, 'Escribe sobre tus emociones para entenderlas mejor.', 'Toma unos minutos para reflexionar sobre cómo te sientes hoy y escribe tus pensamientos.', 'Escribir sobre tus emociones te ayuda a procesarlas y encontrar patrones en tu comportamiento emocional.', 'https://rehabp.org/emotion-journal', 'es'),
    (p_user_id, '📝 Inventario diario', 'always', 'daily', 1, false, 3, 'Haz un inventario personal diario para evaluar tu progreso.', 'Al final del día, reflexiona sobre tus acciones, decisiones y emociones.', 'El inventario diario te permite identificar áreas de mejora y celebrar tus logros.', 'https://rehabp.org/journal?title=Inventario de hoy', 'es'),
    (p_user_id, 'Contactar a un amigo 📞', 'periodic', 'mitad_mes', 1, false, 4, 'Mantén el contacto con tus amigos y seres queridos.', 'Llama o envía un mensaje a un amigo para ponerte al día.', 'Las conexiones sociales son fundamentales para tu bienestar emocional y tu proceso de recuperación.', NULL, 'es'),
    (p_user_id, '💌 Carta de agradecimiento', 'periodic', 'final_mes', 1, false, 5, 'Escribe una carta de agradecimiento a alguien que te ha apoyado.', 'Piensa en alguien que ha sido importante en tu vida y escribe una carta expresando tu gratitud.', 'Expresar gratitud fortalece tus relaciones y te ayuda a reconocer las cosas positivas en tu vida.', 'https://rehabp.org/journal?title=Carta de agradecimiento', 'es');
  
  -- Insert default goals in ENGLISH (corrected version)
  INSERT INTO public.goals (user_id, text, goal_type, periodic_type, remaining, completed, order_index, description, instructions, notes, link, language) VALUES
    (p_user_id, '🛌 Make your bed', 'always', NULL, 1, false, 6, 'A made bed is a visual reminder of your commitment to an orderly and productive life.', 'As soon as you get up, make your bed before doing anything else.', 'This simple act can set the tone for the rest of your day, giving you a sense of accomplishment from the start.', NULL, 'en'),
    (p_user_id, 'Meditation 🧘', 'always', 'daily', 1, false, 7, 'Dedicate time each day to meditate and visualize your goals.', 'Find a quiet place, close your eyes and breathe deeply. Visualize your life free from addictions.', 'Regular practice of meditation and visualization strengthens your mind and helps you stay focused on your recovery.', NULL, 'en'),
    (p_user_id, 'Emotional Journal 🌞', 'today', NULL, 1, false, 8, 'Write about your emotions to understand them better.', 'Take a few minutes to reflect on how you feel today and write down your thoughts.', 'Writing about your emotions helps you process them and find patterns in your emotional behavior.', 'https://rehabp.org/emotion-journal', 'en'),
    (p_user_id, 'Daily inventory 🤔', 'always', 'daily', 1, false, 9, 'Do a daily personal inventory to assess your progress.', 'At the end of the day, reflect on your actions, decisions and emotions.', 'The daily inventory allows you to identify areas for improvement and celebrate your achievements.', 'https://rehabp.org/journal?title=Daily inventory', 'en'),
    (p_user_id, 'Contact a friend 📞', 'periodic', 'mitad_mes', 1, false, 10, 'Keep in touch with your friends and loved ones.', 'Call or send a message to a friend to catch up.', 'Social connections are fundamental to your emotional well-being and your recovery process.', NULL, 'en'),
    (p_user_id, 'Gratitude letter 💌', 'periodic', 'final_mes', 1, false, 11, 'Write a thank you letter to someone who has supported you.', 'Think of someone who has been important in your life and write a letter expressing your gratitude.', 'Expressing gratitude strengthens your relationships and helps you recognize the positive things in your life.', 'https://rehabp.org/journal?title=Gratitude letter', 'en');
  
  -- Reset abstinence start date
  UPDATE public.profiles 
  SET abstinence_start_date = now()
  WHERE user_id = p_user_id;
END;
$function$;