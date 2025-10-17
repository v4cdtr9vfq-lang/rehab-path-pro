-- Add new columns for the three-level emotion hierarchy
ALTER TABLE public.emotion_journal 
ADD COLUMN IF NOT EXISTS primary_emotion text,
ADD COLUMN IF NOT EXISTS secondary_emotions text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tertiary_emotions text[] DEFAULT '{}';

-- Migrate existing data: main_emotion becomes secondary_emotions, sub_emotions becomes tertiary_emotions
UPDATE public.emotion_journal
SET secondary_emotions = string_to_array(main_emotion, ', '),
    tertiary_emotions = sub_emotions
WHERE primary_emotion IS NULL;

-- We'll keep the old columns for backward compatibility but they won't be used going forward