-- Explicitly disable RLS on all relevant client tables
-- This ensures the HR dashboard can see all data and login flow works

-- 1. Clients Table (Correct Name)
ALTER TABLE IF EXISTS clients DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON clients;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON clients;
DROP POLICY IF EXISTS "Users can update own profile" ON clients;
DROP POLICY IF EXISTS "Enable all access for HR and Admins" ON clients;
DROP POLICY IF EXISTS "Allow all operations for everyone" ON clients;

CREATE POLICY "Allow all operations for everyone" ON clients
  FOR ALL USING (true) WITH CHECK (true);

-- 2. Client Projects
ALTER TABLE IF EXISTS client_projects DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON client_projects;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON client_projects;

-- 3. Client Credential Management (used in edge function)
ALTER TABLE IF EXISTS client_credential_management DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON client_credential_management;

-- 4. Ensure any other client-related tables are open if they exist
ALTER TABLE IF EXISTS public.client_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.project_documents DISABLE ROW LEVEL SECURITY;

-- 5. Force open generic policies
-- (Optional: Add a "True" policy just in case RLS gets re-enabled accidentally)
CREATE POLICY "Allow all operations for everyone" ON client_profiles
  FOR ALL USING (true) WITH CHECK (true);
  
CREATE POLICY "Allow all operations for everyone" ON client_projects
  FOR ALL USING (true) WITH CHECK (true);
