-- Add super_admin to user_role enum if it doesn't exist
-- Note: This might require being run outside of a transaction depending on the Postgres version
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'user_role' AND e.enumlabel = 'super_admin') THEN
        ALTER TYPE user_role ADD VALUE 'super_admin';
    END IF;
END $$;

CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TABLE IF NOT EXISTS client_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES client_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'announcement', -- 'announcement', 'update', 'billing', 'alert'
    priority notification_priority DEFAULT 'medium',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    link_url TEXT, -- Optional link to a specific dashboard section
    created_by UUID REFERENCES auth.users(id), -- HR or Admin who sent it
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

-- RLS Policies
ALTER TABLE client_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own notifications" ON client_notifications
    FOR SELECT USING (
        client_id IN (SELECT id FROM client_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Clients can update own read status" ON client_notifications
    FOR UPDATE USING (
        client_id IN (SELECT id FROM client_profiles WHERE user_id = auth.uid())
    ) WITH CHECK (
        is_read IS NOT NULL
    );

CREATE POLICY "HR and Admins can manage client notifications" ON client_notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM staff_profiles
            WHERE user_id = auth.uid() 
            AND role IN ('hr', 'admin', 'manager', 'super_admin')
        )
    );

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_client_notifications_client ON client_notifications(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_notifications_unread ON client_notifications(client_id) WHERE is_read = false;
