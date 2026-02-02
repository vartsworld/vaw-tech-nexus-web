-- Create subtasks table
CREATE TABLE IF NOT EXISTS staff_subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES staff_tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID NOT NULL,
  status task_status DEFAULT 'pending',
  priority task_priority DEFAULT 'medium',
  points INTEGER DEFAULT 5,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Add RLS policies for subtasks
ALTER TABLE staff_subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their assigned subtasks"
ON staff_subtasks FOR SELECT
TO authenticated
USING (
  assigned_to::text = (current_setting('request.jwt.claims', true)::json->>'sub')
  OR created_by::text = (current_setting('request.jwt.claims', true)::json->>'sub')
  OR EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE staff_profiles.user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub')
    AND (staff_profiles.role = 'hr' OR staff_profiles.is_department_head = true)
  )
);

CREATE POLICY "Team heads can create subtasks"
ON staff_subtasks FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE staff_profiles.user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub')
    AND (staff_profiles.role = 'hr' OR staff_profiles.is_department_head = true)
  )
);

CREATE POLICY "Users can update their subtasks"
ON staff_subtasks FOR UPDATE
TO authenticated
USING (
  assigned_to::text = (current_setting('request.jwt.claims', true)::json->>'sub')
  OR EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE staff_profiles.user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub')
    AND (staff_profiles.role = 'hr' OR staff_profiles.is_department_head = true)
  )
);

-- Create trigger for subtask updated_at
CREATE TRIGGER update_staff_subtasks_updated_at
BEFORE UPDATE ON staff_subtasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add comment for clarity
COMMENT ON TABLE staff_subtasks IS 'Subtasks that belong to main staff tasks';
COMMENT ON COLUMN staff_subtasks.task_id IS 'Reference to parent task in staff_tasks';
COMMENT ON COLUMN staff_tasks.attachments IS 'Array of attachment objects with name, url, size, type, and title';