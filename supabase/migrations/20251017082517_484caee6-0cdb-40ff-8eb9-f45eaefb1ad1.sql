-- Add email column to support_contacts table
ALTER TABLE public.support_contacts
ADD COLUMN email TEXT;