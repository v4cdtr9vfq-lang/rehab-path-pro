-- Agregar campo para guardar preferencia de disponibilidad
ALTER TABLE public.profiles 
ADD COLUMN available_for_help boolean NOT NULL DEFAULT false;