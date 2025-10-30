-- Remove the check constraint on room column that's preventing messages
ALTER TABLE public.chat_messages 
DROP CONSTRAINT IF EXISTS chat_messages_room_check;