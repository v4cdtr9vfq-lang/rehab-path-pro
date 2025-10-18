-- Add order_index column to values table
ALTER TABLE public.values 
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;