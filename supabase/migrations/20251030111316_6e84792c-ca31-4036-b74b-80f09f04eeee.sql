-- Update existing Spanish values to use translation keys
UPDATE public.values 
SET name = 'values.defaultSelfCare' 
WHERE name = 'Autocuidado';

UPDATE public.values 
SET name = 'values.defaultGratitude' 
WHERE name = 'Gratitud';

UPDATE public.values 
SET name = 'values.defaultHumor' 
WHERE name = 'Humor';

UPDATE public.values 
SET name = 'values.defaultRespect' 
WHERE name = 'Respeto';

UPDATE public.values 
SET name = 'values.defaultHealth' 
WHERE name = 'Salud';

UPDATE public.values 
SET name = 'values.defaultConsideration' 
WHERE name = 'Consideración';

UPDATE public.values 
SET name = 'values.defaultCommitment' 
WHERE name = 'Compromiso';