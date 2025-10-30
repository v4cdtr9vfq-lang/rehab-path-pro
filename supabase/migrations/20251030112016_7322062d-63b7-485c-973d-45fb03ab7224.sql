-- Add language column to chat_messages table
ALTER TABLE public.chat_messages
ADD COLUMN language text NOT NULL DEFAULT 'es';

-- Create index for faster language-based queries
CREATE INDEX idx_chat_messages_language_room ON public.chat_messages(language, room);

-- Add language column to direct_messages table
ALTER TABLE public.direct_messages
ADD COLUMN language text NOT NULL DEFAULT 'es';