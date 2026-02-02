-- Add comments column to staff_tasks and staff_subtasks
ALTER TABLE staff_tasks 
ADD COLUMN IF NOT EXISTS comments jsonb DEFAULT '[]'::jsonb;

ALTER TABLE staff_subtasks 
ADD COLUMN IF NOT EXISTS comments jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN staff_tasks.comments IS 'Array of comment objects with user_id, message, timestamp, and optional attachments';
COMMENT ON COLUMN staff_subtasks.comments IS 'Array of comment objects with user_id, message, timestamp, and optional attachments';