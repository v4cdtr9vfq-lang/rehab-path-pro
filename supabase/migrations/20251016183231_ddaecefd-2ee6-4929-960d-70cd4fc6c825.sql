-- Add room column to chat_messages table
ALTER TABLE public.chat_messages
ADD COLUMN room text NOT NULL DEFAULT 'narcoticos';

-- Add check constraint for valid room values
ALTER TABLE public.chat_messages
ADD CONSTRAINT chat_messages_room_check 
CHECK (room IN ('narcoticos', 'dependencia_emocional', 'pornografia', 'redes_sociales'));

-- Create index for faster room queries
CREATE INDEX idx_chat_messages_room ON public.chat_messages(room);