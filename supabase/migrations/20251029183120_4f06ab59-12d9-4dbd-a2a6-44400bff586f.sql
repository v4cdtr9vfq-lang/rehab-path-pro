-- Comprehensive update to ensure ALL default goals use translation keys
-- Update all variations of meditation goals
UPDATE goals 
SET text = 'defaultGoals.emotional1'
WHERE text ILIKE '%medit%' 
   OR text ILIKE '%mindfulness%'
   OR text = 'Meditación'
   OR text = 'Meditación + Visualización 🧘';

-- Update all diary/journal goals
UPDATE goals 
SET text = 'defaultGoals.emotional2'
WHERE text ILIKE '%diario%' 
   OR text ILIKE '%journal%'
   OR text ILIKE '%inventario%'
   OR text ILIKE '%emociones%'
   OR text = 'Diario'
   OR text = 'Diario de emociones'
   OR text = 'Diario de emociones 🌞'
   OR text = 'Inventario de hoy 🤔  ';

-- Update gratitude goals
UPDATE goals 
SET text = 'defaultGoals.emotional3'
WHERE text ILIKE '%gratitud%'
   OR text ILIKE '%agradec%'
   OR text = 'Diario de gratitud'
   OR text = 'Carta de agradecimiento';

-- Update bed making/cleaning goals  
UPDATE goals 
SET text = 'defaultGoals.practical1'
WHERE text ILIKE '%cama%'
   OR text ILIKE '%limpio%'
   OR text ILIKE '%ordenar%'
   OR text = '🛌 Hacer la cama';

-- Update celebration goals
UPDATE goals 
SET text = 'defaultGoals.relationships3'
WHERE text ILIKE '%celebrar%'
   OR text ILIKE '%victoria%'
   OR text = '🥳 Celebrar mis victorias 💃🕺'
   OR text = 'Celebrar mis victorias';