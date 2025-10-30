-- Update handle_new_user with current user's goals as defaults
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
    (NEW.id, '🛌 Hacer la cama', 'always', NULL, 1, false, 0, NULL, 'Hacer la cama por la mañana es el primer paso de tu plan. Crea una inercia positiva para seguir el plan que has definido para tu transformación.', NULL, NULL, 'es'),
    (NEW.id, 'Meditación 🧘', 'always', 'daily', 1, false, 1, NULL, NULL, NULL, NULL, 'es'),
    (NEW.id, 'Diario emocional 🌞', 'always', NULL, 1, false, 2, NULL, NULL, NULL, 'https://rehabp.org/emotion-journal', 'es'),
    (NEW.id, 'Inventario diario 🤔', 'always', NULL, 1, false, 3, NULL, NULL, NULL, NULL, 'es'),
    (NEW.id, ' Carta de agradecimiento 💌', 'periodic', 'final_mes', 1, false, 4, NULL, NULL, NULL, 'https://rehabp.org/journal?title=Carta de agradecimiento', 'es'),
    (NEW.id, 'Contactar a un amigo 📞', 'periodic', 'mitad_mes', 1, false, 5, NULL, NULL, NULL, NULL, 'es');
  
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

-- Update reset_goals_and_abstinence with same defaults
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
    (p_user_id, '🛌 Hacer la cama', 'always', NULL, 1, false, 0, NULL, 'Hacer la cama por la mañana es el primer paso de tu plan. Crea una inercia positiva para seguir el plan que has definido para tu transformación.', NULL, NULL, 'es'),
    (p_user_id, 'Meditación 🧘', 'always', 'daily', 1, false, 1, NULL, NULL, NULL, NULL, 'es'),
    (p_user_id, 'Diario emocional 🌞', 'always', NULL, 1, false, 2, NULL, NULL, NULL, 'https://rehabp.org/emotion-journal', 'es'),
    (p_user_id, 'Inventario diario 🤔', 'always', NULL, 1, false, 3, NULL, NULL, NULL, NULL, 'es'),
    (p_user_id, ' Carta de agradecimiento 💌', 'periodic', 'final_mes', 1, false, 4, NULL, NULL, NULL, 'https://rehabp.org/journal?title=Carta de agradecimiento', 'es'),
    (p_user_id, 'Contactar a un amigo 📞', 'periodic', 'mitad_mes', 1, false, 5, NULL, NULL, NULL, NULL, 'es');
  
  -- Insert default goals in ENGLISH
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