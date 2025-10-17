-- Create FAQs table
CREATE TABLE public.faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Anyone can view FAQs
CREATE POLICY "Anyone can view FAQs"
ON public.faqs
FOR SELECT
USING (true);

-- Create user questions table
CREATE TABLE public.user_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_questions ENABLE ROW LEVEL SECURITY;

-- Users can view their own questions
CREATE POLICY "Users can view their own questions"
ON public.user_questions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own questions
CREATE POLICY "Users can create their own questions"
ON public.user_questions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Insert some initial FAQs
INSERT INTO public.faqs (question, answer, category, view_count) VALUES
('¿Cómo puedo resetear mi contador de días?', 'Puedes actualizar tu fecha de inicio de abstinencia en la sección de Configuración. Ve a Configuración > Fecha de inicio y selecciona la nueva fecha.', 'general', 150),
('¿Qué son las medallas y cómo las consigo?', 'Las medallas son logros que desbloqueas al alcanzar ciertos hitos en tu recuperación: Valor (inicio), Constancia (40 días), Recuperación (90 días) y Servicio (180 días).', 'medallas', 200),
('¿Cómo funcionan las metas diarias?', 'Las metas diarias te permiten establecer objetivos específicos para cada día. Puedes marcarlas como completadas y ver tu progreso en el dashboard principal.', 'metas', 180),
('¿Puedo usar la app sin conexión a internet?', 'Algunas funciones están disponibles sin conexión, pero necesitarás internet para sincronizar tus datos y acceder al chat comunitario.', 'tecnico', 90),
('¿Cómo puedo contactar a mi red de apoyo?', 'Ve a la sección "Mi red de apoyo" donde puedes añadir contactos de emergencia con sus números de teléfono y correos electrónicos.', 'apoyo', 120);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_faqs_updated_at
BEFORE UPDATE ON public.faqs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();