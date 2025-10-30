-- Add language field to values table
ALTER TABLE public.values ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'es';

-- Delete existing default values (they will be recreated with language)
DELETE FROM public.values WHERE name LIKE 'values.%';

-- Update handle_new_user to create default values for both languages
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile
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
  
  -- Insert default goals in ENGLISH
  INSERT INTO public.goals (user_id, text, goal_type, periodic_type, remaining, completed, order_index, description, instructions, notes, link, language) VALUES
    (NEW.id, '🛌 Make your bed', 'always', NULL, 1, false, 6, 'A made bed is a visual reminder of your commitment to an orderly and productive life.', 'As soon as you get up, make your bed before doing anything else.', 'This simple act can set the tone for the rest of your day, giving you a sense of accomplishment from the start.', NULL, 'en'),
    (NEW.id, 'Meditation 🧘', 'always', 'daily', 1, false, 7, 'Dedicate time each day to meditate and visualize your goals.', 'Find a quiet place, close your eyes and breathe deeply. Visualize your life free from addictions.', 'Regular practice of meditation and visualization strengthens your mind and helps you stay focused on your recovery.', NULL, 'en'),
    (NEW.id, 'Emotional Journal 🌞', 'today', NULL, 1, false, 8, 'Write about your emotions to understand them better.', 'Take a few minutes to reflect on how you feel today and write down your thoughts.', 'Writing about your emotions helps you process them and find patterns in your emotional behavior.', 'https://rehabp.org/emotion-journal', 'en'),
    (NEW.id, 'Daily inventory 🤔', 'always', 'daily', 1, false, 9, 'Do a daily personal inventory to assess your progress.', 'At the end of the day, reflect on your actions, decisions and emotions.', 'The daily inventory allows you to identify areas for improvement and celebrate your achievements.', 'https://rehabp.org/journal?title=Daily inventory', 'en'),
    (NEW.id, 'Contact a friend 📞', 'periodic', 'mitad_mes', 1, false, 10, 'Keep in touch with your friends and loved ones.', 'Call or send a message to a friend to catch up.', 'Social connections are fundamental to your emotional well-being and your recovery process.', NULL, 'en'),
    (NEW.id, 'Gratitude letter 💌', 'periodic', 'final_mes', 1, false, 11, 'Write a thank you letter to someone who has supported you.', 'Think of someone who has been important in your life and write a letter expressing your gratitude.', 'Expressing gratitude strengthens your relationships and helps you recognize the positive things in your life.', 'https://rehabp.org/journal?title=Gratitude letter', 'en');
  
  -- Insert default values in SPANISH
  INSERT INTO public.values (user_id, name, value_type, order_index, language) VALUES
    (NEW.id, 'Autocuidado', 'primary', 0, 'es'),
    (NEW.id, 'Gratitud', 'primary', 1, 'es'),
    (NEW.id, 'Humor', 'primary', 2, 'es'),
    (NEW.id, 'Respeto', 'secondary', 3, 'es'),
    (NEW.id, 'Salud', 'secondary', 4, 'es'),
    (NEW.id, 'Consideración', 'secondary', 5, 'es'),
    (NEW.id, 'Compromiso', 'secondary', 6, 'es');
  
  -- Insert default values in ENGLISH
  INSERT INTO public.values (user_id, name, value_type, order_index, language) VALUES
    (NEW.id, 'Self-care', 'primary', 7, 'en'),
    (NEW.id, 'Gratitude', 'primary', 8, 'en'),
    (NEW.id, 'Humor', 'primary', 9, 'en'),
    (NEW.id, 'Respect', 'secondary', 10, 'en'),
    (NEW.id, 'Health', 'secondary', 11, 'en'),
    (NEW.id, 'Consideration', 'secondary', 12, 'en'),
    (NEW.id, 'Commitment', 'secondary', 13, 'en');
  
  RETURN NEW;
END;
$function$;