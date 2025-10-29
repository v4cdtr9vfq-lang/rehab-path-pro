-- Agregar columna tour_completed a la tabla profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tour_completed BOOLEAN DEFAULT FALSE;