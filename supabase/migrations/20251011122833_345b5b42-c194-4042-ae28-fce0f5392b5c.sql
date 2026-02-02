-- Create storage bucket for task attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Add attachments column to staff_tasks
ALTER TABLE staff_tasks 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Create RLS policies for task attachments bucket
CREATE POLICY "Team heads can upload task attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'task-attachments' AND
  (EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE staff_profiles.user_id::text = auth.uid()::text
    AND (staff_profiles.role = 'hr' OR 
         staff_profiles.role = 'manager' OR 
         staff_profiles.is_department_head = true)
  ))
);

CREATE POLICY "Staff can view their task attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'task-attachments' AND
  (EXISTS (
    SELECT 1 FROM staff_tasks
    WHERE (staff_tasks.assigned_to::text = auth.uid()::text OR 
           staff_tasks.assigned_by::text = auth.uid()::text)
    AND (storage.foldername(name))[1] = staff_tasks.id::text
  ))
);

CREATE POLICY "Task creators can delete attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'task-attachments' AND
  (EXISTS (
    SELECT 1 FROM staff_tasks
    WHERE staff_tasks.assigned_by::text = auth.uid()::text
    AND (storage.foldername(name))[1] = staff_tasks.id::text
  ))
);

-- Add comment for clarity
COMMENT ON COLUMN staff_tasks.attachments IS 'Array of attachment objects with name, url, size, and type';