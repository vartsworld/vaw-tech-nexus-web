-- Disable RLS for client_profiles and client_projects to allow full access in HR dashboard
ALTER TABLE client_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_projects DISABLE ROW LEVEL SECURITY;
