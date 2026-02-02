-- ================================================================
-- VAW TECHNOLOGIES - CLIENT DASHBOARD REDESIGN MIGRATION
-- ================================================================
-- Date: 2026-02-02
-- Purpose: Comprehensive client dashboard system with payment reminders,
--          error logging, feedback, and super admin integration
-- ================================================================

-- ================================================================
-- 1. PAYMENT REMINDERS SYSTEM
-- ================================================================

CREATE TABLE IF NOT EXISTS payment_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES client_profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES client_projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    due_date DATE NOT NULL,
    reminder_schedule JSONB DEFAULT '{"dates": [], "sent": []}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'partially_sent', 'paid', 'overdue', 'cancelled')),
    created_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient querying
CREATE INDEX idx_payment_reminders_client ON payment_reminders(client_id);
CREATE INDEX idx_payment_reminders_due_date ON payment_reminders(due_date);
CREATE INDEX idx_payment_reminders_status ON payment_reminders(status);

-- RLS Policies
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;

-- Clients can view their own payment reminders
CREATE POLICY "Clients can view own payment reminders" ON payment_reminders
    FOR SELECT USING (
        client_id IN (SELECT id FROM client_profiles WHERE user_id = auth.uid())
    );

-- Super admins and HR can manage all payment reminders
CREATE POLICY "Super admins can manage payment reminders" ON payment_reminders
    FOR ALL USING (
        EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM staff_profiles WHERE user_id = auth.uid() AND role IN ('hr', 'manager'))
    );

-- ================================================================
-- 2. CLIENT ERROR LOGS SYSTEM
-- ================================================================

CREATE TABLE IF NOT EXISTS client_error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES client_profiles(id) ON DELETE CASCADE,
    error_type TEXT NOT NULL CHECK (error_type IN ('technical', 'access', 'feature', 'ui_ux', 'performance', 'other')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    screenshot_url TEXT,
    page_url TEXT,
    browser_info JSONB,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'wont_fix')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    assigned_to UUID REFERENCES auth.users(id),
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_client_error_logs_client ON client_error_logs(client_id);
CREATE INDEX idx_client_error_logs_status ON client_error_logs(status);
CREATE INDEX idx_client_error_logs_created ON client_error_logs(created_at DESC);

-- RLS Policies
ALTER TABLE client_error_logs ENABLE ROW LEVEL SECURITY;

-- Clients can view and create their own error logs
CREATE POLICY "Clients can view own error logs" ON client_error_logs
    FOR SELECT USING (
        client_id IN (SELECT id FROM client_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Clients can create error logs" ON client_error_logs
    FOR INSERT WITH CHECK (
        client_id IN (SELECT id FROM client_profiles WHERE user_id = auth.uid())
    );

-- Super admins and staff can view and manage all error logs
CREATE POLICY "Staff can manage error logs" ON client_error_logs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM staff_profiles WHERE user_id = auth.uid())
    );

-- ================================================================
-- 3. CLIENT FEATURE REQUESTS SYSTEM
-- ================================================================

CREATE TABLE IF NOT EXISTS client_feature_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES client_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'ui_ux', 'functionality', 'integration', 'performance', 'mobile', 'other')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'planned', 'in_progress', 'completed', 'rejected')),
    votes INT DEFAULT 0,
    upvoted_by UUID[] DEFAULT '{}',
    assigned_to UUID REFERENCES auth.users(id),
    estimated_effort TEXT,
    target_date DATE,
    completion_date DATE,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_feature_requests_client ON client_feature_requests(client_id);
CREATE INDEX idx_feature_requests_status ON client_feature_requests(status);
CREATE INDEX idx_feature_requests_votes ON client_feature_requests(votes DESC);

-- RLS Policies
ALTER TABLE client_feature_requests ENABLE ROW LEVEL SECURITY;

-- Clients can view all feature requests (community voting)
CREATE POLICY "Clients can view feature requests" ON client_feature_requests
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM client_profiles WHERE user_id = auth.uid())
    );

-- Clients can create their own feature requests
CREATE POLICY "Clients can create feature requests" ON client_feature_requests
    FOR INSERT WITH CHECK (
        client_id IN (SELECT id FROM client_profiles WHERE user_id = auth.uid())
    );

-- Clients can update their own feature requests (for voting)
CREATE POLICY "Clients can update feature requests" ON client_feature_requests
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM client_profiles WHERE user_id = auth.uid())
    );

-- Staff can manage all feature requests
CREATE POLICY "Staff can manage feature requests" ON client_feature_requests
    FOR ALL USING (
        EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM staff_profiles WHERE user_id = auth.uid())
    );

-- ================================================================
-- 4. ENHANCE CLIENT FEEDBACK TABLE
-- ================================================================

-- Check if client_feedback exists, if not create it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'client_feedback') THEN
        CREATE TABLE client_feedback (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            client_id UUID REFERENCES client_profiles(id) ON DELETE CASCADE,
            project_id UUID REFERENCES client_projects(id) ON DELETE SET NULL,
            type TEXT NOT NULL CHECK (type IN ('suggestion', 'update_request', 'feedback', 'bug_report', 'support', 'compliment', 'complaint')),
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            rating INT CHECK (rating >= 1 AND rating <= 5),
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'in_progress', 'resolved', 'closed')),
            assigned_to UUID REFERENCES auth.users(id),
            response TEXT,
            responded_at TIMESTAMPTZ,
            responded_by UUID REFERENCES auth.users(id),
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        );
        
        -- Indexes
        CREATE INDEX idx_client_feedback_client ON client_feedback(client_id);
        CREATE INDEX idx_client_feedback_status ON client_feedback(status);
        CREATE INDEX idx_client_feedback_created ON client_feedback(created_at DESC);
        
        -- RLS
        ALTER TABLE client_feedback ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Add missing columns if table exists but columns don't
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_feedback' AND column_name = 'rating') THEN
        ALTER TABLE client_feedback ADD COLUMN rating INT CHECK (rating >= 1 AND rating <= 5);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_feedback' AND column_name = 'assigned_to') THEN
        ALTER TABLE client_feedback ADD COLUMN assigned_to UUID REFERENCES auth.users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_feedback' AND column_name = 'response') THEN
        ALTER TABLE client_feedback ADD COLUMN response TEXT;
        ALTER TABLE client_feedback ADD COLUMN responded_at TIMESTAMPTZ;
        ALTER TABLE client_feedback ADD COLUMN responded_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Update RLS policies for client_feedback if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_feedback' AND policyname = 'Clients can view own feedback enhanced') THEN
        DROP POLICY IF EXISTS "Clients can view own feedback" ON client_feedback;
        CREATE POLICY "Clients can view own feedback enhanced" ON client_feedback
            FOR SELECT USING (
                client_id IN (SELECT id FROM client_profiles WHERE user_id = auth.uid())
            );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_feedback' AND policyname = 'Clients can create feedback enhanced') THEN
        DROP POLICY IF EXISTS "Clients can create feedback" ON client_feedback;
        CREATE POLICY "Clients can create feedback enhanced" ON client_feedback
            FOR INSERT WITH CHECK (
                client_id IN (SELECT id FROM client_profiles WHERE user_id = auth.uid())
            );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_feedback' AND policyname = 'Staff can manage feedback') THEN
        CREATE POLICY "Staff can manage feedback" ON client_feedback
            FOR ALL USING (
                EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
                OR EXISTS (SELECT 1 FROM staff_profiles WHERE user_id = auth.uid())
            );
    END IF;
END $$;

-- ================================================================
-- 5. CLIENT WEBPAGES SYSTEM
-- ================================================================

CREATE TABLE IF NOT EXISTS client_webpages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID UNIQUE REFERENCES client_profiles(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL, -- URL friendly identifier
    template TEXT DEFAULT 'default',
    branding JSONB DEFAULT '{}'::jsonb, -- {logo_url, primary_color, secondary_color}
    content JSONB DEFAULT '{}'::jsonb, -- {hero, about, services, projects, contact}
    is_published BOOLEAN DEFAULT false,
    custom_domain TEXT,
    meta_tags JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    published_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_client_webpages_slug ON client_webpages(slug);
CREATE INDEX idx_client_webpages_published ON client_webpages(is_published);

-- RLS Policies
ALTER TABLE client_webpages ENABLE ROW LEVEL SECURITY;

-- Published webpages are publicly viewable
CREATE POLICY "Public can view published webpages" ON client_webpages
    FOR SELECT USING (is_published = true);

-- Clients can view their own webpage
CREATE POLICY "Clients can view own webpage" ON client_webpages
    FOR SELECT USING (
        client_id IN (SELECT id FROM client_profiles WHERE user_id = auth.uid())
    );

-- Staff can manage all webpages
CREATE POLICY "Staff can manage webpages" ON client_webpages
    FOR ALL USING (
        EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM staff_profiles WHERE user_id = auth.uid() AND role IN ('hr', 'manager'))
    );

-- ================================================================
-- 6. CREATE SUPER ADMIN ACCOUNT
-- ================================================================

-- First, create the auth user (This needs to be done via Supabase Auth API)
-- We'll create a placeholder record and the actual auth user will be created via edge function

-- Insert super admin record if email doesn't exist
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Check if super admin already exists
    IF NOT EXISTS (
        SELECT 1 FROM auth.users WHERE email = 'superwow@vaw.tech'
    ) THEN
        -- Note: Actual user creation must be done via Supabase Auth Admin API
        -- This is a placeholder. The edge function will handle user creation.
        RAISE NOTICE 'Super admin user needs to be created via Auth API with email: superwow@vaw.tech';
    ELSE
        -- Get existing user ID
        SELECT id INTO v_user_id FROM auth.users WHERE email = 'superwow@vaw.tech';
        
        -- Add to super_admins table if not already there
        INSERT INTO super_admins (user_id, granted_by)
        VALUES (v_user_id, v_user_id)
        ON CONFLICT (user_id) DO NOTHING;
        
        RAISE NOTICE 'Super admin record added for existing user: %', v_user_id;
    END IF;
END $$;

-- ================================================================
-- 7. NOTIFICATION ENHANCEMENTS
-- ================================================================

-- Enhance client_notifications if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'client_notifications') THEN
        -- Add priority column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_notifications' AND column_name = 'priority') THEN
            ALTER TABLE client_notifications ADD COLUMN priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
        END IF;
        
        -- Add action_url column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_notifications' AND column_name = 'action_url') THEN
            ALTER TABLE client_notifications ADD COLUMN action_url TEXT;
        END IF;
        
        -- Add category column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_notifications' AND column_name = 'category') THEN
            ALTER TABLE client_notifications ADD COLUMN category TEXT DEFAULT 'general' CHECK (category IN ('payment', 'project', 'system', 'feedback', 'general'));
        END IF;
    END IF;
END $$;

-- ================================================================
-- 8. UPDATE TRIGGERS
-- ================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all relevant tables
DROP TRIGGER IF EXISTS update_payment_reminders_updated_at ON payment_reminders;
CREATE TRIGGER update_payment_reminders_updated_at
    BEFORE UPDATE ON payment_reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_error_logs_updated_at ON client_error_logs;
CREATE TRIGGER update_client_error_logs_updated_at
    BEFORE UPDATE ON client_error_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_feature_requests_updated_at ON client_feature_requests;
CREATE TRIGGER update_client_feature_requests_updated_at
    BEFORE UPDATE ON client_feature_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_webpages_updated_at ON client_webpages;
CREATE TRIGGER update_client_webpages_updated_at
    BEFORE UPDATE ON client_webpages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- 9. HELPER FUNCTIONS
-- ================================================================

-- Function to get client dashboard stats
CREATE OR REPLACE FUNCTION get_client_dashboard_stats(p_client_id UUID)
RETURNS JSON AS $$
DECLARE
    v_stats JSON;
BEGIN
    SELECT json_build_object(
        'pending_payments', (
            SELECT COUNT(*) FROM payment_reminders 
            WHERE client_id = p_client_id AND status IN ('pending', 'overdue')
        ),
        'active_projects', (
            SELECT COUNT(*) FROM client_projects 
            WHERE client_id = p_client_id AND status NOT IN ('cancel', 'completed')
        ),
        'open_errors', (
            SELECT COUNT(*) FROM client_error_logs 
            WHERE client_id = p_client_id AND status = 'open'
        ),
        'pending_feedback', (
            SELECT COUNT(*) FROM client_feedback 
            WHERE client_id = p_client_id AND status = 'pending'
        ),
        'unread_notifications', (
            SELECT COUNT(*) FROM client_notifications 
            WHERE client_id = p_client_id AND read = false
        )
    ) INTO v_stats;
    
    RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 10. GRANT PERMISSIONS
-- ================================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON payment_reminders TO authenticated;
GRANT SELECT, INSERT, UPDATE ON client_error_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON client_feature_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON client_feedback TO authenticated;
GRANT SELECT ON client_webpages TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON client_webpages TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ================================================================
-- MIGRATION COMPLETE
-- ================================================================
-- Next Steps:
-- 1. Create super admin user via Supabase Auth Admin API or edge function
-- 2. Run edge function deployments
-- 3. Test RLS policies
-- 4. Populate initial data
-- ================================================================
