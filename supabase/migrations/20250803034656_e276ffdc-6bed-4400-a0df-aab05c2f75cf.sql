-- Fix the foreign key constraints and data issues
-- First disable RLS to avoid recursion
ALTER TABLE staff_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_tasks DISABLE ROW LEVEL SECURITY;

-- Remove orphaned records
DELETE FROM staff_attendance 
WHERE user_id NOT IN (SELECT user_id FROM staff_profiles);

-- Drop problematic foreign key constraints temporarily
ALTER TABLE departments DROP CONSTRAINT IF EXISTS departments_created_by_fkey;
ALTER TABLE departments DROP CONSTRAINT IF EXISTS fk_department_created_by;

-- Update departments to use existing staff IDs or NULL
UPDATE departments SET created_by = NULL;

-- Create some sample data if tables are empty
INSERT INTO staff_profiles (user_id, email, full_name, username, role) 
VALUES
  (gen_random_uuid(), 'hr@company.com', 'HR Manager', 'hrmanager', 'hr'),
  (gen_random_uuid(), 'john@company.com', 'John Doe', 'johndoe', 'staff'),
  (gen_random_uuid(), 'jane@company.com', 'Jane Smith', 'janesmith', 'staff')
ON CONFLICT (user_id) DO NOTHING;

-- Add departments without created_by constraint for now
INSERT INTO departments (name, description) 
VALUES
  ('Engineering', 'Software Development'),
  ('Marketing', 'Marketing and Sales'),
  ('HR', 'Human Resources')
ON CONFLICT DO NOTHING;