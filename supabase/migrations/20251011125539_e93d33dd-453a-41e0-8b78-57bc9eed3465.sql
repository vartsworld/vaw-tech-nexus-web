-- Add attachments field to staff_subtasks
ALTER TABLE staff_subtasks 
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;

-- Update SELECT policy for staff_subtasks to include assigned staff
DROP POLICY IF EXISTS "Users can view their assigned subtasks" ON staff_subtasks;
CREATE POLICY "Users can view their assigned subtasks"
ON staff_subtasks FOR SELECT
TO authenticated
USING (
  (assigned_to)::text = (current_setting('request.jwt.claims', true)::json->>'sub')
  OR (created_by)::text = (current_setting('request.jwt.claims', true)::json->>'sub')
  OR EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE (staff_profiles.user_id)::text = (current_setting('request.jwt.claims', true)::json->>'sub')
    AND (staff_profiles.role IN ('hr', 'manager') OR staff_profiles.is_department_head = true)
  )
);

-- Update UPDATE policy for staff_subtasks to allow assigned staff to update (add attachments)
DROP POLICY IF EXISTS "Users can update their subtasks" ON staff_subtasks;
CREATE POLICY "Users can update their subtasks"
ON staff_subtasks FOR UPDATE
TO authenticated
USING (
  (assigned_to)::text = (current_setting('request.jwt.claims', true)::json->>'sub')
  OR EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE (staff_profiles.user_id)::text = (current_setting('request.jwt.claims', true)::json->>'sub')
    AND (staff_profiles.role IN ('hr', 'manager') OR staff_profiles.is_department_head = true)
  )
);

-- Update SELECT policy for staff_tasks to include assigned staff
DROP POLICY IF EXISTS "Users can view their assigned tasks" ON staff_tasks;
CREATE POLICY "Users can view their assigned tasks"
ON staff_tasks FOR SELECT
TO authenticated
USING (
  (assigned_to)::text = (current_setting('request.jwt.claims', true)::json->>'sub')
  OR (assigned_by)::text = (current_setting('request.jwt.claims', true)::json->>'sub')
  OR EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE (staff_profiles.user_id)::text = (current_setting('request.jwt.claims', true)::json->>'sub')
    AND (staff_profiles.role IN ('hr', 'manager') OR staff_profiles.is_department_head = true)
  )
);

-- Update UPDATE policy for staff_tasks to allow assigned staff to update (add attachments)
DROP POLICY IF EXISTS "Users can update their own tasks" ON staff_tasks;
CREATE POLICY "Users can update their own tasks"
ON staff_tasks FOR UPDATE
TO authenticated
USING (
  (assigned_to)::text = (current_setting('request.jwt.claims', true)::json->>'sub')
  OR EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE (staff_profiles.user_id)::text = (current_setting('request.jwt.claims', true)::json->>'sub')
    AND (staff_profiles.role IN ('hr', 'manager') OR staff_profiles.is_department_head = true)
  )
);

COMMENT ON COLUMN staff_subtasks.attachments IS 'JSON array of attachment metadata (file name, URL, size, type)';