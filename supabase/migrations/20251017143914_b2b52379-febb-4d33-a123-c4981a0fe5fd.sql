-- Make old columns nullable since we're using the new three-level hierarchy
ALTER TABLE public.emotion_journal 
ALTER COLUMN main_emotion DROP NOT NULL,
ALTER COLUMN sub_emotions DROP NOT NULL;

-- Set default values for the old columns if they're null
UPDATE public.emotion_journal
SET main_emotion = COALESCE(main_emotion, ''),
    sub_emotions = COALESCE(sub_emotions, '{}')
WHERE main_emotion IS NULL OR sub_emotions IS NULL;