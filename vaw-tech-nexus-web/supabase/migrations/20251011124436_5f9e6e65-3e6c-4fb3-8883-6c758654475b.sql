-- Add due_date and due_time to subtasks table
ALTER TABLE staff_subtasks 
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS due_time TIME;

-- Make points optional with a default
ALTER TABLE staff_subtasks 
ALTER COLUMN points SET DEFAULT 0;

-- Add RLS policy for deleting subtasks
CREATE POLICY "Team heads can delete subtasks"
ON staff_subtasks FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE staff_profiles.user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub')
    AND (staff_profiles.role = 'hr' OR staff_profiles.is_department_head = true)
  )
);

-- Add comments
COMMENT ON COLUMN staff_subtasks.due_date IS 'Optional due date for the subtask';
COMMENT ON COLUMN staff_subtasks.due_time IS 'Optional due time for the subtask';
COMMENT ON COLUMN staff_subtasks.points IS 'Points awarded for completing subtask, defaults to 0 if not specified';