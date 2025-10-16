-- Create fictional chat messages for testing
-- Room: narcoticos
INSERT INTO public.chat_messages (user_id, user_name, message, room, created_at) VALUES
('00000000-0000-0000-0000-000000000001', 'Ana López', 'Hola a todos, hoy es mi día 15 sin consumir', 'narcoticos', NOW() - INTERVAL '2 hours'),
('00000000-0000-0000-0000-000000000002', 'Carlos Ruiz', 'Felicidades Ana! Sigue así', 'narcoticos', NOW() - INTERVAL '1 hour 50 minutes'),
('00000000-0000-0000-0000-000000000003', 'María Santos', 'Necesito apoyo, tuve un mal día', 'narcoticos', NOW() - INTERVAL '1 hour 30 minutes'),
('00000000-0000-0000-0000-000000000004', 'Pedro Gómez', 'Estamos contigo María, qué pasó?', 'narcoticos', NOW() - INTERVAL '1 hour 20 minutes'),
('00000000-0000-0000-0000-000000000005', 'Laura Díaz', 'Alguien sabe de grupos presenciales en Madrid?', 'narcoticos', NOW() - INTERVAL '1 hour'),
('00000000-0000-0000-0000-000000000006', 'David Torres', 'Yo voy a uno en Chamberí, te paso info', 'narcoticos', NOW() - INTERVAL '50 minutes'),
('00000000-0000-0000-0000-000000000007', 'Elena Martín', 'Llevo 3 meses limpia, se puede!', 'narcoticos', NOW() - INTERVAL '40 minutes'),
('00000000-0000-0000-0000-000000000008', 'Miguel Ángel', 'Gracias por compartir Elena, me das esperanza', 'narcoticos', NOW() - INTERVAL '30 minutes'),
('00000000-0000-0000-0000-000000000009', 'Sofía Ramírez', 'Buenos días a todos desde Barcelona', 'narcoticos', NOW() - INTERVAL '20 minutes');

-- Room: dependencia_emocional
INSERT INTO public.chat_messages (user_id, user_name, message, room, created_at) VALUES
('00000000-0000-0000-0000-000000000001', 'Julia Fernández', 'He terminado mi relación tóxica después de 5 años', 'dependencia_emocional', NOW() - INTERVAL '2 hours'),
('00000000-0000-0000-0000-000000000002', 'Roberto Silva', 'Eso es muy valiente Julia, cómo te sientes?', 'dependencia_emocional', NOW() - INTERVAL '1 hour 45 minutes'),
('00000000-0000-0000-0000-000000000003', 'Carmen Blanco', 'Estoy luchando con la necesidad de volver con mi ex', 'dependencia_emocional', NOW() - INTERVAL '1 hour 30 minutes'),
('00000000-0000-0000-0000-000000000004', 'Alberto Castro', 'Carmen, es normal sentir eso. Un día a la vez', 'dependencia_emocional', NOW() - INTERVAL '1 hour 15 minutes'),
('00000000-0000-0000-0000-000000000005', 'Patricia Vega', 'Alguien tiene consejos para trabajar en la autoestima?', 'dependencia_emocional', NOW() - INTERVAL '1 hour'),
('00000000-0000-0000-0000-000000000006', 'Francisco Mora', 'Yo empecé con terapia y ha sido un cambio increíble', 'dependencia_emocional', NOW() - INTERVAL '45 minutes'),
('00000000-0000-0000-0000-000000000007', 'Isabel Navarro', 'Llevo 2 meses trabajando en mi misma y me siento mejor', 'dependencia_emocional', NOW() - INTERVAL '35 minutes'),
('00000000-0000-0000-0000-000000000008', 'Andrés Medina', 'Es difícil pero vale la pena el esfuerzo', 'dependencia_emocional', NOW() - INTERVAL '25 minutes'),
('00000000-0000-0000-0000-000000000009', 'Lucía Herrera', 'Gracias por este espacio, me ayuda mucho leerles', 'dependencia_emocional', NOW() - INTERVAL '15 minutes');

-- Room: pornografia
INSERT INTO public.chat_messages (user_id, user_name, message, room, created_at) VALUES
('00000000-0000-0000-0000-000000000001', 'Marcos Ortiz', 'Hoy cumplo 30 días sin ver contenido', 'pornografia', NOW() - INTERVAL '2 hours'),
('00000000-0000-0000-0000-000000000002', 'Natalia Cruz', 'Felicidades Marcos! Gran logro', 'pornografia', NOW() - INTERVAL '1 hour 50 minutes'),
('00000000-0000-0000-0000-000000000003', 'Diego Romero', 'Tuve una recaída ayer, me siento mal', 'pornografia', NOW() - INTERVAL '1 hour 30 minutes'),
('00000000-0000-0000-0000-000000000004', 'Beatriz León', 'Diego, no te rindas. Cada día es una nueva oportunidad', 'pornografia', NOW() - INTERVAL '1 hour 20 minutes'),
('00000000-0000-0000-0000-000000000005', 'Raúl Jiménez', 'Qué hacen cuando sienten el impulso?', 'pornografia', NOW() - INTERVAL '1 hour'),
('00000000-0000-0000-0000-000000000006', 'Sandra Prieto', 'Yo salgo a caminar o llamo a un amigo', 'pornografia', NOW() - INTERVAL '50 minutes'),
('00000000-0000-0000-0000-000000000007', 'Tomás Gil', 'Los ejercicios de respiración me han ayudado mucho', 'pornografia', NOW() - INTERVAL '40 minutes'),
('00000000-0000-0000-0000-000000000008', 'Cristina Sanz', 'Gracias por los consejos, los voy a probar', 'pornografia', NOW() - INTERVAL '30 minutes'),
('00000000-0000-0000-0000-000000000009', 'Hugo Delgado', 'Ánimo a todos, juntos podemos lograrlo', 'pornografia', NOW() - INTERVAL '20 minutes');

-- Room: redes_sociales
INSERT INTO public.chat_messages (user_id, user_name, message, room, created_at) VALUES
('00000000-0000-0000-0000-000000000001', 'Valentina Pérez', 'Desinstalé Instagram hace una semana', 'redes_sociales', NOW() - INTERVAL '2 hours'),
('00000000-0000-0000-0000-000000000002', 'Óscar Muñoz', 'Cómo te sientes sin las redes?', 'redes_sociales', NOW() - INTERVAL '1 hour 45 minutes'),
('00000000-0000-0000-0000-000000000003', 'Irene Flores', 'Tengo más tiempo pero me siento sola a veces', 'redes_sociales', NOW() - INTERVAL '1 hour 30 minutes'),
('00000000-0000-0000-0000-000000000004', 'Gabriel Ramos', 'Es normal, yo también pasé por eso al principio', 'redes_sociales', NOW() - INTERVAL '1 hour 15 minutes'),
('00000000-0000-0000-0000-000000000005', 'Claudia Vargas', 'He reducido mi uso a 30 minutos diarios', 'redes_sociales', NOW() - INTERVAL '1 hour'),
('00000000-0000-0000-0000-000000000006', 'Sergio Molina', 'Buen método Claudia, yo uso un temporizador', 'redes_sociales', NOW() - INTERVAL '50 minutes'),
('00000000-0000-0000-0000-000000000007', 'Andrea Rubio', 'Mi ansiedad ha bajado mucho desde que dejé TikTok', 'redes_sociales', NOW() - INTERVAL '40 minutes'),
('00000000-0000-0000-0000-000000000008', 'Pablo Iglesias', 'Estoy pensando en dar el paso también', 'redes_sociales', NOW() - INTERVAL '30 minutes'),
('00000000-0000-0000-0000-000000000009', 'Marta Cortés', 'Ánimo Pablo, vale la pena intentarlo', 'redes_sociales', NOW() - INTERVAL '20 minutes');