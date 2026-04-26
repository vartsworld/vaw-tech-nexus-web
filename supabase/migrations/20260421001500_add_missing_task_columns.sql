
-- Add stage_config to staff_tasks for per-stage sequential locking settings
ALTER TABLE public.staff_tasks ADD COLUMN IF NOT EXISTS stage_config JSONB DEFAULT '{}'::jsonb;

-- Add rank to staff_subtasks for manual ordering within stages
ALTER TABLE public.staff_subtasks ADD COLUMN IF NOT EXISTS rank INTEGER DEFAULT 0;

-- Comment for documentation
COMMENT ON COLUMN public.staff_tasks.stage_config IS 'Stores per-stage settings like { "1": { "sequential": true } }';
COMMENT ON COLUMN public.staff_subtasks.rank IS 'Numerical order of the subtask within its stage';

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

