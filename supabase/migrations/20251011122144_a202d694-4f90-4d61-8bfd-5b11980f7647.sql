-- Add trial_period and due_time columns to staff_tasks
ALTER TABLE staff_tasks 
ADD COLUMN IF NOT EXISTS trial_period BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS due_time TIME DEFAULT NULL;

-- Update existing rows to have trial_period false
UPDATE staff_tasks SET trial_period = false WHERE trial_period IS NULL;

-- Add comment for clarity
COMMENT ON COLUMN staff_tasks.trial_period IS 'If true, completing this task will not award points to the staff member';
COMMENT ON COLUMN staff_tasks.due_time IS 'Time component of the due date for better scheduling';