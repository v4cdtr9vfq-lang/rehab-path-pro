-- Drop existing check constraint
ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS goals_goal_type_check;

-- Add new check constraint with 'periodic' included
ALTER TABLE public.goals ADD CONSTRAINT goals_goal_type_check 
CHECK (goal_type IN ('today', 'week', 'month', 'onetime', 'always', 'periodic'));