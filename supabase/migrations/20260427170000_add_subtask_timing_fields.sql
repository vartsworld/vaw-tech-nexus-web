
-- Add timing and penalty fields to staff_subtasks
ALTER TABLE public.staff_subtasks 
ADD COLUMN IF NOT EXISTS time_limit_hr INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS penalty_coins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ;

-- Comment for documentation
COMMENT ON COLUMN public.staff_subtasks.time_limit_hr IS 'Hours allowed for subtask completion after acceptance';
COMMENT ON COLUMN public.staff_subtasks.penalty_coins IS 'Coins deducted if completion exceeds time_limit_hr';
COMMENT ON COLUMN public.staff_subtasks.accepted_at IS 'When the assigned staff accepted the subtask';
COMMENT ON COLUMN public.staff_subtasks.ready_at IS 'When the subtask became available for acceptance (previous subtask completed)';

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
