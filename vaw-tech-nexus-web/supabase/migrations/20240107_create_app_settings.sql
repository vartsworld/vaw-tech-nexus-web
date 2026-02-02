-- Create a simple key-value store for app configuration if it doesn't exist
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by UUID REFERENCES auth.users(id)
);

-- Turn on RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read settings (e.g. currency conversion)
DROP POLICY IF EXISTS "Everyone can read settings" ON public.app_settings;
CREATE POLICY "Everyone can read settings" 
ON public.app_settings FOR SELECT 
USING (true);

-- Ensure 'admin' role exists in the enum
-- Note: 'ALTER TYPE ... ADD VALUE' cannot be used in a transaction block relative to its usage usually, 
-- but casting to text below helps avoid parse-time errors for the new value.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';

-- Allow only HR and Admins to update settings
-- WICHTIG: We cast role to text (role::text) to avoid "unsafe use of new enum value" error.
DROP POLICY IF EXISTS "HR and Admins can update settings" ON public.app_settings;
CREATE POLICY "HR and Admins can update settings" 
ON public.app_settings FOR ALL 
USING (
  public.is_hr(auth.uid()) OR 
  EXISTS (SELECT 1 FROM public.staff_profiles WHERE user_id = auth.uid() AND role::text = 'admin')
);

-- Insert default value for VAW Coin to INR (if not exists)
INSERT INTO public.app_settings (key, value)
VALUES ('vaw_coin_rate', '{"inr_value": 10}'::jsonb)
ON CONFLICT (key) DO NOTHING;
