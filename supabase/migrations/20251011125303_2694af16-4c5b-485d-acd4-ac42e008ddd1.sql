-- Drop the old INSERT policy for subtasks
DROP POLICY IF EXISTS "Team heads can create subtasks" ON staff_subtasks;

-- Create updated INSERT policy that allows HR, department heads, and managers
CREATE POLICY "Team heads can create subtasks"
ON staff_subtasks FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE staff_profiles.user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub')
    AND (
      staff_profiles.role IN ('hr', 'manager') 
      OR staff_profiles.is_department_head = true
    )
  )
);

COMMENT ON POLICY "Team heads can create subtasks" ON staff_subtasks IS 'Allows HR, managers, and department heads to create subtasks';