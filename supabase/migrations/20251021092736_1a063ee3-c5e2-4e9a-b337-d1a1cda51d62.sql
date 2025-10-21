-- Add sender_name column to direct_messages table
ALTER TABLE public.direct_messages
ADD COLUMN sender_name TEXT;