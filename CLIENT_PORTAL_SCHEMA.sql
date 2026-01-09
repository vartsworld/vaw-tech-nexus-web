-- ================================================================
-- VAW TECHNOLOGIES - CLIENT PORTAL SCHEMA
-- ================================================================
-- Includes: Client Profiles, Projects, Files, Feedback, Documents
-- Version: 1.0
-- ================================================================

-- Client Profiles linked to Auth
CREATE TABLE IF NOT EXISTS client_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Projects linked to Clients
CREATE TABLE IF NOT EXISTS client_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES client_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    project_type TEXT NOT NULL, -- 'website', 'marketing', 'design', 'ai', 'vr-ar', etc.
    status TEXT NOT NULL DEFAULT 'planning', -- 'planning', 'development', 'progress', 'active', 'functional', 'error', 'paused', 'cancel'
    progress INTEGER DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    amount_paid DECIMAL(12,2) DEFAULT 0,
    next_payment_date DATE,
    renewal_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Project Files
CREATE TABLE IF NOT EXISTS client_project_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES client_projects(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL, -- 'design', 'preview', 'data', 'img', 'video', 'doc', 'zip', 'apk', etc.
    file_category TEXT DEFAULT 'deliverable', -- 'deliverable', 'client_upload', 'reference'
    file_size_bytes BIGINT,
    uploaded_by_client BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Feedback / Communication
CREATE TABLE IF NOT EXISTS client_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES client_profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES client_projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'suggestion', 'update_request', 'feedback', 'bug_report', 'support'
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'in_progress', 'resolved'
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Documents (Invoices, Agreements)
CREATE TABLE IF NOT EXISTS client_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES client_profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES client_projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    doc_type TEXT NOT NULL, -- 'invoice', 'agreement', 'contract'
    amount DECIMAL(12,2),
    status TEXT DEFAULT 'issued', -- 'issued', 'paid', 'signed'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies (Basic)
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;

-- Clients can only see their own profile
CREATE POLICY "Clients can view own profile" ON client_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Clients can only see their own projects
CREATE POLICY "Clients can view own projects" ON client_projects
    FOR SELECT USING (
        client_id IN (SELECT id FROM client_profiles WHERE user_id = auth.uid())
    );

-- Clients can only see files for their projects
CREATE POLICY "Clients can view project files" ON client_project_files
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM client_projects WHERE client_id IN (
                SELECT id FROM client_profiles WHERE user_id = auth.uid()
            )
        )
    );

-- Clients can upload files to their projects
CREATE POLICY "Clients can upload project files" ON client_project_files
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM client_projects WHERE client_id IN (
                SELECT id FROM client_profiles WHERE user_id = auth.uid()
            )
        )
    );

-- Feedback policies
CREATE POLICY "Clients can view own feedback" ON client_feedback
    FOR SELECT USING (
        client_id IN (SELECT id FROM client_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Clients can create feedback" ON client_feedback
    FOR INSERT WITH CHECK (
        client_id IN (SELECT id FROM client_profiles WHERE user_id = auth.uid())
    );

-- Document policies
CREATE POLICY "Clients can view own documents" ON client_documents
    FOR SELECT USING (
        client_id IN (SELECT id FROM client_profiles WHERE user_id = auth.uid())
    );
