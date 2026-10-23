-- ================================================================
-- VAW TECHNOLOGIES - SUPER ADMIN & SYSTEM MANAGEMENT SCHEMA
-- ================================================================

-- Extension for Audit Logging
CREATE TABLE IF NOT EXISTS super_admin_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id),
    action_type TEXT NOT NULL, -- 'CLIENT_PW_RESET', 'STAFF_ROLE_CHANGE', 'CLIENT_DATA_SHARE', etc.
    target_id UUID, -- ID of the client or staff affected
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Client Login Management (HR/Admin usage)
-- This table stores temporary passwords or reset tokens if needed, 
-- though Supabase Auth is preferred. 
-- For this requirement, we'll track who set/reset client credentials.
CREATE TABLE IF NOT EXISTS client_credential_management (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES client_profiles(id) ON DELETE CASCADE,
    managed_by UUID REFERENCES auth.users(id), -- HR or Super Admin
    action TEXT NOT NULL, -- 'PASSWORD_SET', 'PASSWORD_RESET'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Client Data Sharing (Respective departments, heads)
CREATE TABLE IF NOT EXISTS client_data_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES client_profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES client_projects(id) ON DELETE CASCADE,
    shared_with_dept_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    shared_with_staff_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    permission_level TEXT DEFAULT 'view' CHECK (permission_level IN ('view', 'edit', 'admin')),
    shared_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- System Settings (Super Admin Only)
CREATE TABLE IF NOT EXISTS system_global_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- RLS Policies for Super Admin (Example)
-- In a real app, you'd use a custom claim or a role check function.
-- Here we'll assume a 'super_admin' metadata or a record in a super_admins table.

CREATE TABLE IF NOT EXISTS super_admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) UNIQUE,
    granted_at TIMESTAMPTZ DEFAULT now(),
    granted_by UUID REFERENCES auth.users(id)
);

-- Populate initial Super Admin (to be done by the user or a migration)
-- INSERT INTO super_admins (user_id) VALUES ('YOUR_USER_ID');

-- Enable RLS
ALTER TABLE super_admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_credential_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_data_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_global_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- Super Admin Policies (Full Access)
CREATE POLICY "Super admins have full access to audit logs"
ON super_admin_audit_logs FOR ALL
USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

CREATE POLICY "Super admins have full access to credentials"
ON client_credential_management FOR ALL
USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

CREATE POLICY "Super admins and managers can see shares"
ON client_data_shares FOR ALL
USING (
    EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()) OR
    shared_with_staff_id = auth.uid()
);

-- HR can manage client credentials if they have HR role
-- (Assuming role is stored in staff_profiles or auth.users metadata)
CREATE POLICY "HR can manage client credentials"
ON client_credential_management FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM staff_profiles 
        WHERE user_id = auth.uid() AND role IN ('hr', 'manager')
    )
);
