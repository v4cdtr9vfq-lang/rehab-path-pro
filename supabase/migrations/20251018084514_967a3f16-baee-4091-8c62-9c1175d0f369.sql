-- Eliminar todas las medallas del usuario
DELETE FROM public.medals 
WHERE user_id = '7c63314b-2f69-4e6c-8b4d-84683f24bd2a';

-- Insertar solo la medalla de Valor (requiere 0 días)
INSERT INTO public.medals (user_id, medal_type, popup_shown)
VALUES ('7c63314b-2f69-4e6c-8b4d-84683f24bd2a', 'valor', true);