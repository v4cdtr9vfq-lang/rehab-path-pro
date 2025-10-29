-- Update existing default goals to use translation keys
-- This will only update goals that match the exact text of known default goals

UPDATE goals 
SET text = 'defaultGoals.emotional1'
WHERE text IN ('Meditación', 'Meditación + Visualización 🧘', 'Practicar meditación o mindfulness durante 10 minutos');

UPDATE goals 
SET text = 'defaultGoals.emotional2'
WHERE text IN ('Diario', 'Escribir en mi diario o reflexionar sobre mis emociones');

UPDATE goals 
SET text = 'defaultGoals.emotional3'
WHERE text IN ('Diario de gratitud', 'Practicar gratitud: anotar 3 cosas por las que estoy agradecido');

UPDATE goals 
SET text = 'defaultGoals.physical1'
WHERE text IN ('Hacer ejercicio o actividad física durante al menos 30 minutos');

UPDATE goals 
SET text = 'defaultGoals.physical2'
WHERE text IN ('Dormir de 7 a 9 horas de sueño reparador');

UPDATE goals 
SET text = 'defaultGoals.physical3'
WHERE text IN ('Comer 3 comidas saludables y equilibradas');

UPDATE goals 
SET text = 'defaultGoals.relationships1'
WHERE text IN ('Conectar con alguien de mi red de apoyo (llamada, mensaje o encuentro)');

UPDATE goals 
SET text = 'defaultGoals.relationships2'
WHERE text IN ('Asistir a una reunión de apoyo (NA, AA o similar)');

UPDATE goals 
SET text = 'defaultGoals.relationships3'
WHERE text IN ('Realizar un acto de servicio o ayudar a alguien sin esperar nada a cambio');

UPDATE goals 
SET text = 'defaultGoals.practical1'
WHERE text IN ('Mantener mi espacio personal limpio y organizado (hacer la cama, ordenar)', '🛌 Hacer la cama');

UPDATE goals 
SET text = 'defaultGoals.practical2'
WHERE text IN ('Cumplir con mis responsabilidades del día (trabajo, estudio, hogar)');

UPDATE goals 
SET text = 'defaultGoals.practical3'
WHERE text IN ('Gestionar mis finanzas responsablemente (revisar gastos, presupuesto)');

UPDATE goals 
SET text = 'defaultGoals.spiritual1'
WHERE text IN ('Leer material inspirador, espiritual o de crecimiento personal');

UPDATE goals 
SET text = 'defaultGoals.spiritual2'
WHERE text IN ('Practicar oración, meditación espiritual o conexión con un poder superior');

UPDATE goals 
SET text = 'defaultGoals.spiritual3'
WHERE text IN ('Reflexionar sobre mis valores y actuar en coherencia con ellos');

UPDATE goals 
SET text = 'defaultGoals.recovery1'
WHERE text IN ('Leer literatura de recuperación o trabajar en mis pasos');

UPDATE goals 
SET text = 'defaultGoals.recovery2'
WHERE text IN ('Revisar mi plan de recuperación y ajustar según sea necesario');

UPDATE goals 
SET text = 'defaultGoals.recovery3'
WHERE text IN ('Identificar mis desencadenantes del día y cómo los manejé');

UPDATE goals 
SET text = 'defaultGoals.emotional2'
WHERE text IN ('Diario de emociones 🌞', 'Inventario de hoy 🤔  ');

UPDATE goals 
SET text = 'defaultGoals.relationships3'
WHERE text IN ('🥳 Celebrar mis victorias 💃🕺', 'Celebrar mis victorias');

UPDATE goals 
SET text = 'defaultGoals.emotional3'
WHERE text IN ('Carta de agradecimiento');