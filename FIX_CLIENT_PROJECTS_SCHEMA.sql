-- ================================================================
-- VAW TECHNOLOGIES - PROJECT RELATIONSHIP & SCHEMA FIX
-- ================================================================
-- This script fixes the foreign key constraint for client_projects 
-- to point to the main clients table (CRM) and adds missing columns.
-- ================================================================

-- 1. Ensure columns exist to avoid schema cache issues
ALTER TABLE public.client_projects 
ADD COLUMN IF NOT EXISTS package_type TEXT,
ADD COLUMN IF NOT EXISTS addons TEXT,
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;

-- 2. Fix the Foreign Key Relationship
-- First, identify the constraint name. It's usually 'client_projects_client_id_fkey'
-- We'll drop it if it exists and recreate it pointing to the CRM table 'clients'
DO $$
BEGIN
    -- Drop old constraint if pointing to client_profiles or just to be sure
    ALTER TABLE public.client_projects DROP CONSTRAINT IF EXISTS client_projects_client_id_fkey;
    
    -- Add the correct constraint pointing to the CRM clients table
    ALTER TABLE public.client_projects 
    ADD CONSTRAINT client_projects_client_id_fkey 
    FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
END $$;

-- 3. Ensure all clients in client_projects actually exist in the clients table
-- (Cleanup orphaned projects if any, though unlikely)
-- DELETE FROM public.client_projects WHERE client_id NOT IN (SELECT id FROM public.clients);

-- 4. Refresh schema cache hint for PostgREST
NOTIFY pgrst, 'reload schema';

-- 5. Final check on types alignment
COMMENT ON TABLE public.client_projects IS 'Managed client project entities linked to the main CRM table.';
