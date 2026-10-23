-- ============================================================
-- COMPLETE MIGRATION: Drop all dependent policies, alter column,
-- recreate policies. Run this entire block in Supabase SQL Editor.
-- ============================================================

-- STEP 1: Drop ALL storage policies that reference staff_tasks (task-related ones)
DROP POLICY IF EXISTS "Anyone can view task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Staff can view their task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Task creators can delete attachments" ON storage.objects;
DROP POLICY IF EXISTS "Team heads can upload task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view task attachments" ON storage.objects;

-- STEP 2: Drop ALL policies on staff_tasks (dynamic - catches all names)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'staff_tasks'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON staff_tasks', pol.policyname);
    RAISE NOTICE 'Dropped policy: %', pol.policyname;
  END LOOP;
END $$;

-- STEP 3: Drop FK constraints if any
ALTER TABLE staff_tasks DROP CONSTRAINT IF EXISTS staff_tasks_assigned_to_fkey;
ALTER TABLE staff_tasks DROP CONSTRAINT IF EXISTS fk_staff_tasks_assigned_to;

-- STEP 4: Change column type uuid → text (no data loss)
ALTER TABLE staff_tasks ALTER COLUMN assigned_to TYPE text USING assigned_to::text;

-- ============================================================
-- STEP 5: Recreate staff_tasks RLS policies
-- ============================================================
CREATE POLICY "Users can view their assigned tasks"
ON staff_tasks FOR SELECT
USING (
  auth.uid()::text = assigned_to
  OR assigned_to LIKE '%' || auth.uid()::text || '%'
  OR auth.uid()::text = assigned_by::text
);

CREATE POLICY "Users can update their own tasks"
ON staff_tasks FOR UPDATE
USING (
  auth.uid()::text = assigned_to
  OR assigned_to LIKE '%' || auth.uid()::text || '%'
  OR auth.uid()::text = assigned_by::text
);

CREATE POLICY "Users can insert tasks"
ON staff_tasks FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own tasks"
ON staff_tasks FOR DELETE
USING (
  auth.uid()::text = assigned_by::text
  OR auth.uid()::text = assigned_to
  OR assigned_to LIKE '%' || auth.uid()::text || '%'
);

-- ============================================================
-- STEP 6: Recreate storage policies for task attachments
-- ============================================================
CREATE POLICY "Anyone can view task attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'task-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can upload task attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'task-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update their task attachments"
ON storage.objects FOR UPDATE
USING (bucket_id = 'task-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete task attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'task-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Staff can view their task attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'task-attachments'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM staff_tasks st
    WHERE st.assigned_to = auth.uid()::text
       OR st.assigned_to LIKE '%' || auth.uid()::text || '%'
       OR st.assigned_by::text = auth.uid()::text
  )
);

CREATE POLICY "Task creators can delete attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'task-attachments'
  AND EXISTS (
    SELECT 1 FROM staff_tasks st
    WHERE st.assigned_by::text = auth.uid()::text
  )
);

CREATE POLICY "Team heads can upload task attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'task-attachments'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete own task attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'task-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can upload task attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'task-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view task attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'task-attachments' AND auth.uid() IS NOT NULL);

-- ============================================================
-- VERIFY: Check column type changed successfully
-- ============================================================
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'staff_tasks' AND column_name = 'assigned_to';
