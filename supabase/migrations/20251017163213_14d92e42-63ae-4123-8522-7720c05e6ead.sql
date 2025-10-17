-- Add order_index column to goals table for drag and drop ordering
ALTER TABLE public.goals 
ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;

-- Update existing goals to have sequential order_index values
WITH ordered_goals AS (
  SELECT id, user_id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) - 1 as row_num
  FROM public.goals
)
UPDATE public.goals
SET order_index = ordered_goals.row_num
FROM ordered_goals
WHERE goals.id = ordered_goals.id;