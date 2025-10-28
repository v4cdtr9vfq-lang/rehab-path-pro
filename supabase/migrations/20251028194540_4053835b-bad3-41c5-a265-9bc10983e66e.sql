-- Add new columns to emotion_journal table for situation and person descriptions
ALTER TABLE emotion_journal 
ADD COLUMN situation_trigger BOOLEAN DEFAULT false,
ADD COLUMN situation_description TEXT,
ADD COLUMN person_trigger BOOLEAN DEFAULT false,
ADD COLUMN person_description TEXT;