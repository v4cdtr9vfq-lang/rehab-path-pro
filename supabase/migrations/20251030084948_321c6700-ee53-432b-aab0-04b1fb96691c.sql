-- Update "Inventario del día 🤔" goal to use translation key
UPDATE goals 
SET text = 'defaultGoals.inventory' 
WHERE text = 'Inventario del día 🤔';