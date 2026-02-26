-- Add optional label and color metadata for subtask stages

ALTER TABLE public.subtask_templates
ADD COLUMN IF NOT EXISTS stage_label TEXT,
ADD COLUMN IF NOT EXISTS stage_color TEXT;

COMMENT ON COLUMN public.subtask_templates.stage_label IS 'Human-friendly label for this stage (e.g. Discovery, Design).';
COMMENT ON COLUMN public.subtask_templates.stage_color IS 'Hex color used to visually highlight the stage block in templates UI.';

