-- Add pending_approval status to task_status enum
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'pending_approval';

-- Add approved_by and approved_at columns to track approval
ALTER TABLE staff_tasks 
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;

ALTER TABLE staff_subtasks 
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;