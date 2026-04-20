
-- Add rank to subtask_templates for template-level ranking
ALTER TABLE public.subtask_templates ADD COLUMN IF NOT EXISTS rank INTEGER DEFAULT 0;

-- Comment for documentation
COMMENT ON COLUMN public.subtask_templates.rank IS 'Numerical order of the subtask template within its stage';

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
