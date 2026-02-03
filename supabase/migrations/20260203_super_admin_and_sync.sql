-- ================================================================
-- 1. SUPER ADMIN INJECTION
-- ================================================================

-- This script creates a super admin user in Supabase Auth
-- and adds them to the public.super_admins table.
-- Replace 'your-secure-password' with your desired password.
-- The email MUST match what you use in AdminLogin.tsx.

DO $$
DECLARE
    v_user_id UUID := gen_random_uuid();
    v_email TEXT := 'supervaw@vaw.tech';
    v_password TEXT := 'v@wsuper123*'; -- Replace with your password
BEGIN
    -- Check if user already exists in auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            role,
            aud,
            created_at,
            updated_at
        )
        VALUES (
            v_user_id,
            '00000000-0000-0000-0000-000000000000',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Super Admin"}',
            false,
            'authenticated',
            'authenticated',
            now(),
            now()
        );
        
        -- Insert into identities to avoid auth errors
        INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            v_user_id,
            format('{"sub":"%s","email":"%s"}', v_user_id::text, v_email)::jsonb,
            'email',
            v_email,
            now(),
            now()
        );
    ELSE
        SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
        
    END IF;

    -- Ensure record exists in public.super_admins
    INSERT INTO public.super_admins (user_id, granted_by)
    VALUES (v_user_id, v_user_id)
    ON CONFLICT (user_id) DO NOTHING;

    RAISE NOTICE 'Super admin created with ID: %', v_user_id;
END $$;

-- ================================================================
-- 2. DATABASE SCHEMA SYNC (REFIXING TABLES)
-- ================================================================

-- Update status check for payment_reminders to include confirmation
ALTER TABLE public.payment_reminders 
DROP CONSTRAINT IF EXISTS payment_reminders_status_check;

ALTER TABLE public.payment_reminders 
ADD CONSTRAINT payment_reminders_status_check 
CHECK (status IN ('pending', 'sent', 'partially_sent', 'paid', 'overdue', 'cancelled', 'confirmation_submitted'));

-- Add missing columns to client_feedback to support UI features
ALTER TABLE public.client_feedback ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.client_feedback ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical'));

-- Ensure client_feature_requests has correct columns
ALTER TABLE public.client_feature_requests ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
