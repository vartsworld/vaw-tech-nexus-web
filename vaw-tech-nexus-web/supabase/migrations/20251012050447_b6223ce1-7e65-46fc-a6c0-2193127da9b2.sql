-- Add timer tracking fields to staff_tasks table
ALTER TABLE staff_tasks 
ADD COLUMN IF NOT EXISTS timer_started_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS breaks_taken integer DEFAULT 0;