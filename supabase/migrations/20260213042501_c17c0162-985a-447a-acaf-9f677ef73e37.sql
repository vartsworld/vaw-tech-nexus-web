-- Add recurring task columns to staff_tasks
ALTER TABLE public.staff_tasks 
ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_type text DEFAULT null,
ADD COLUMN IF NOT EXISTS recurrence_interval integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS recurrence_end_date date DEFAULT null,
ADD COLUMN IF NOT EXISTS parent_task_id uuid DEFAULT null REFERENCES public.staff_tasks(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS next_recurrence_date date DEFAULT null;

-- Add constraint for recurrence_type values
ALTER TABLE public.staff_tasks 
ADD CONSTRAINT chk_recurrence_type CHECK (recurrence_type IS NULL OR recurrence_type IN ('daily', 'weekly', 'monthly'));
