-- ================================================================
-- FIX: CLIENT DATA VISIBILITY (RLS POLICIES) - V2
-- ================================================================
-- This script fixes the issue where client data exists in the table
-- but is not visible in the dashboard due to Row Level Security.
-- ================================================================

-- 1. Enable RLS on client_profiles to be safe
ALTER TABLE IF EXISTS client_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON client_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON client_profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON client_profiles;
DROP POLICY IF EXISTS "HR can manage clients" ON client_profiles;
DROP POLICY IF EXISTS "Staff can view clients" ON client_profiles;
DROP POLICY IF EXISTS "client_profiles_select_policy" ON client_profiles;
DROP POLICY IF EXISTS "client_profiles_all_policy" ON client_profiles;
DROP POLICY IF EXISTS "Allow Authenticated Read Access" ON client_profiles;
DROP POLICY IF EXISTS "Allow HR and Admin Write Access" ON client_profiles;

-- 3. Create a simple Read policy for ALL authenticated staff
-- This allows any logged-in user to SEE the client list.
-- We can refine this later if needed, but for now visibility is priority.
CREATE POLICY "Allow Authenticated Read Access"
ON client_profiles
FOR SELECT
TO authenticated
USING (true);

-- 4. Create a specific Write policy for HR and Admins
-- This allows HR and Managers to Insert, Update, Delete.
-- NOTE: Removed invalid roles 'creative_director' and 'ceo' to prevent enum errors.
-- We are casting role to text to avoid enum mismatch errors entirely.
CREATE POLICY "Allow HR and Admin Write Access"
ON client_profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE user_id = auth.uid()
    AND (
      role::text IN ('hr', 'admin', 'manager') 
      OR department_id IN (SELECT id FROM departments WHERE name IN ('HR', 'Management', 'Administration'))
    )
  )
);

-- 5. Fix potential issue with client_projects relation visibility
-- If client_projects table exists, ensure it is also visible
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'client_projects') THEN
        ALTER TABLE client_projects ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "project_read_policy" ON client_projects;
        DROP POLICY IF EXISTS "Allow Project Read Access" ON client_projects;
        
        CREATE POLICY "Allow Project Read Access"
        ON client_projects FOR SELECT
        TO authenticated
        USING (true);
    END IF;
END
$$;

-- 6. Grant basic permissions (just in case)
GRANT SELECT ON client_profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON client_profiles TO authenticated;
GRANT ALL ON client_profiles TO service_role;
