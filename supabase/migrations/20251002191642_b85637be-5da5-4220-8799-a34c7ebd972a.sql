-- Drop existing restrictive policies
DROP POLICY IF EXISTS "HR can view all team applications" ON team_applications_staff;
DROP POLICY IF EXISTS "HR can update team applications" ON team_applications_staff;

-- Create more inclusive policies for managers and HR
CREATE POLICY "HR and managers can view team applications"
ON team_applications_staff
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE staff_profiles.user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub')
    AND staff_profiles.role IN ('hr', 'manager', 'lead', 'department_head')
  )
);

CREATE POLICY "HR and managers can update team applications"
ON team_applications_staff
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE staff_profiles.user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub')
    AND staff_profiles.role IN ('hr', 'manager', 'lead', 'department_head')
  )
);