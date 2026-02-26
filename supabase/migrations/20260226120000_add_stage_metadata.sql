-- Add stage name and color support for templates and staff subtasks

ALTER TABLE public.subtask_templates
ADD COLUMN IF NOT EXISTS stage_name VARCHAR(255) DEFAULT 'Stage',
ADD COLUMN IF NOT EXISTS stage_color VARCHAR(50) DEFAULT '#3b82f6';

ALTER TABLE public.staff_subtasks
ADD COLUMN IF NOT EXISTS stage_name VARCHAR(255) DEFAULT 'Stage',
ADD COLUMN IF NOT EXISTS stage_color VARCHAR(50) DEFAULT '#3b82f6';

COMMENT ON COLUMN public.subtask_templates.stage_name IS 'Custom name for the stage block';
COMMENT ON COLUMN public.subtask_templates.stage_color IS 'Hex color for the stage block';
