-- Add stage support for templates and staff subtasks

ALTER TABLE public.subtask_templates
ADD COLUMN IF NOT EXISTS stage INTEGER NOT NULL DEFAULT 1;

ALTER TABLE public.staff_subtasks
ADD COLUMN IF NOT EXISTS stage INTEGER NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.subtask_templates.stage IS 'Execution stage number (1-based) for template grouping. All subtasks in stage N can run in parallel; stage N+1 waits until N is completed.';

COMMENT ON COLUMN public.staff_subtasks.stage IS 'Execution stage number (1-based) copied from template; used to lock later stages until previous stages are completed.';

