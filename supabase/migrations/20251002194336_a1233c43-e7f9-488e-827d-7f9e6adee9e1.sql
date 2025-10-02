
-- Create staff profile for kaj@gmail.com user so they can access HR dashboard
INSERT INTO staff_profiles (
  user_id, 
  username, 
  full_name, 
  email, 
  role,
  hire_date
) VALUES (
  '829e7bd6-d5ec-4376-ad91-bef78c0ead3b',
  'kaj',
  'Kaj (HR Admin)',
  'kaj@gmail.com',
  'hr',
  CURRENT_DATE
)
ON CONFLICT (user_id) DO UPDATE 
SET role = 'hr', 
    email = 'kaj@gmail.com',
    updated_at = now();
