-- Add 'always' as a valid goal type
ALTER TABLE public.goals 
DROP CONSTRAINT IF EXISTS goals_goal_type_check;

ALTER TABLE public.goals
ADD CONSTRAINT goals_goal_type_check 
CHECK (goal_type IN ('today', 'week', 'month', 'onetime', 'always'));