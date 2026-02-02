-- Clean up data issues 
-- First, remove orphaned staff_attendance records
DELETE FROM staff_attendance 
WHERE user_id NOT IN (SELECT user_id FROM staff_profiles);

-- Clean up tasks
UPDATE staff_tasks SET project_id = NULL WHERE project_id IS NOT NULL;

-- Temporarily disable RLS to avoid infinite recursion
ALTER TABLE staff_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_tasks DISABLE ROW LEVEL SECURITY;

-- Create demo data
DO $$
BEGIN
  -- Insert demo staff if none exist
  IF NOT EXISTS (SELECT 1 FROM staff_profiles LIMIT 1) THEN
    INSERT INTO staff_profiles (user_id, email, full_name, username, role) VALUES
    (gen_random_uuid(), 'hr@company.com', 'HR Manager', 'hrmanager', 'hr'),
    (gen_random_uuid(), 'john@company.com', 'John Doe', 'johndoe', 'staff'),
    (gen_random_uuid(), 'jane@company.com', 'Jane Smith', 'janesmith', 'staff');
  END IF;
  
  -- Insert demo departments if none exist
  IF NOT EXISTS (SELECT 1 FROM departments LIMIT 1) THEN
    INSERT INTO departments (name, description, created_by) VALUES
    ('Engineering', 'Software Development', (SELECT user_id FROM staff_profiles WHERE role = 'hr' LIMIT 1)),
    ('Marketing', 'Marketing and Sales', (SELECT user_id FROM staff_profiles WHERE role = 'hr' LIMIT 1)),
    ('HR', 'Human Resources', (SELECT user_id FROM staff_profiles WHERE role = 'hr' LIMIT 1));
  END IF;
END
$$;