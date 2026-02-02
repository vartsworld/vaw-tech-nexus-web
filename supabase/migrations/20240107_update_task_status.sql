-- Add the new status values to the existing enum type
-- This is necessary because the column uses a specific ENUM type, not just a text check constraint
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'review_pending';
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'handover';

-- If you are using check constraints on top of enums (rare but possible), you might want to run this too, 
-- but usually the enum modification above is sufficient for the error "invalid input value for enum".
-- ALTER TABLE staff_tasks DROP CONSTRAINT IF EXISTS staff_tasks_status_check;
