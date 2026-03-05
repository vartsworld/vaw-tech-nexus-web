-- ================================================================
-- VAW TECHNOLOGIES - API INTEGRATION SCHEMA
-- ================================================================

-- 1. API Keys Table
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    key_prefix TEXT NOT NULL, -- First 8 chars
    key_hash TEXT NOT NULL, -- For verification
    permissions TEXT[] DEFAULT '{"read"}', -- e.g. ['read', 'write', 'delete', 'billing']
    last_used_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active', -- 'active', 'revoked'
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- 2. Webhooks Table
CREATE TABLE IF NOT EXISTS public.api_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    events TEXT[] DEFAULT '{"payment.created"}', -- e.g. ['payment.created', 'invoice.created']
    secret TEXT, -- For signature verification on the receiver side
    status TEXT DEFAULT 'active', -- 'active', 'disabled'
    failure_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- 3. API Logs Table
CREATE TABLE IF NOT EXISTS public.api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    method TEXT NOT NULL,
    path TEXT NOT NULL,
    status INTEGER NOT NULL,
    ip_address TEXT,
    payload JSONB,
    response JSONB,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. RLS for Security
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;

-- Only admins/HR should manage these (staff with high privilege)
-- For now, allow all authenticated during development, or check metadata
CREATE POLICY "Super Admins can manage API Keys" ON public.api_keys
    FOR ALL USING (true);

CREATE POLICY "Super Admins can manage Webhooks" ON public.api_webhooks
    FOR ALL USING (true);

CREATE POLICY "Super Admins can view API Logs" ON public.api_logs
    FOR SELECT USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE api_keys;
ALTER PUBLICATION supabase_realtime ADD TABLE api_webhooks;
ALTER PUBLICATION supabase_realtime ADD TABLE api_logs;
