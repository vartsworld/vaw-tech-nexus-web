-- Clean up data issues and create proper relationships
-- First, remove orphaned staff_attendance records that don't have matching staff_profiles
DELETE FROM staff_attendance 
WHERE user_id NOT IN (SELECT user_id FROM staff_profiles);

-- Update existing tasks to avoid foreign key issues with projects
UPDATE staff_tasks SET project_id = NULL WHERE project_id IS NOT NULL;

-- Create some sample staff_profiles for testing if table is empty
INSERT INTO staff_profiles (user_id, email, full_name, username, role) 
SELECT 
  gen_random_uuid(),
  'demo' || generate_series(1,3) || '@company.com',
  'Demo Employee ' || generate_series(1,3),
  'demo' || generate_series(1,3),
  CASE WHEN generate_series(1,3) = 1 THEN 'hr'::user_role ELSE 'staff'::user_role END
ON CONFLICT DO NOTHING;

-- Add some sample departments
INSERT INTO departments (name, description, created_by)
SELECT 
  unnest(ARRAY['Engineering', 'Marketing', 'HR']),
  unnest(ARRAY['Software Development', 'Marketing and Sales', 'Human Resources']),
  (SELECT user_id FROM staff_profiles WHERE role = 'hr' LIMIT 1)
ON CONFLICT DO NOTHING;