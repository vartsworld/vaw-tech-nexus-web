-- Fix the UPDATE policy for staff_tasks to include WITH CHECK
DROP POLICY IF EXISTS "Users can update their own tasks" ON staff_tasks;

CREATE POLICY "Users can update their own tasks"
ON staff_tasks
FOR UPDATE
USING (
  (assigned_to)::text = ((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text)
  OR 
  EXISTS (
    SELECT 1
    FROM staff_profiles
    WHERE 
      (staff_profiles.user_id)::text = ((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text)
      AND (
        staff_profiles.role = ANY (ARRAY['hr'::user_role, 'manager'::user_role])
        OR staff_profiles.is_department_head = true
      )
  )
)
WITH CHECK (
  (assigned_to)::text = ((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text)
  OR 
  EXISTS (
    SELECT 1
    FROM staff_profiles
    WHERE 
      (staff_profiles.user_id)::text = ((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text)
      AND (
        staff_profiles.role = ANY (ARRAY['hr'::user_role, 'manager'::user_role])
        OR staff_profiles.is_department_head = true
      )
  )
);