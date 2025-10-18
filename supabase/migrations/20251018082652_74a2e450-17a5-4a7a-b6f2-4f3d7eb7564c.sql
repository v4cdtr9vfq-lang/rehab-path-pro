-- Actualizar la fecha de inicio de abstinencia para testing (190 días atrás desde 2025-10-18)
UPDATE public.profiles 
SET abstinence_start_date = '2024-04-11 00:00:00+00'::timestamptz
WHERE user_id = '7c63314b-2f69-4e6c-8b4d-84683f24bd2a';