-- Insert admin user if not exists
-- SECURITY WARNING: Storing plain text passwords is highly insecure
-- This should only be used for development/testing

INSERT INTO public.admin_users (email, password_hash, full_name, role)
VALUES ('kaj@gmail.com', 'Kajkaj', 'Admin User', 'admin')
ON CONFLICT (email) DO UPDATE 
SET password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name;