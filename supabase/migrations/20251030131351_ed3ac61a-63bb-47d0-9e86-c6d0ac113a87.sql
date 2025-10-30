-- Add language columns to faqs table for multilingual support
ALTER TABLE public.faqs 
ADD COLUMN IF NOT EXISTS question_en TEXT,
ADD COLUMN IF NOT EXISTS answer_en TEXT,
ADD COLUMN IF NOT EXISTS question_es TEXT,
ADD COLUMN IF NOT EXISTS answer_es TEXT;

-- Copy existing question and answer to Spanish columns
UPDATE public.faqs 
SET question_es = question,
    answer_es = answer
WHERE question_es IS NULL OR answer_es IS NULL;