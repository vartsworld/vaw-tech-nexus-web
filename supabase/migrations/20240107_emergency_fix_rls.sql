-- EMERGENCY FIX: Bypass is_hr() function temporarily for write policies to verify functionality
-- This replaces the complex checks with a simpler check or role check if possible.

-- 1. REWARDS CATALOG RLS
ALTER TABLE public.rewards_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view rewards" ON public.rewards_catalog;
CREATE POLICY "Everyone can view rewards" 
ON public.rewards_catalog FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "HR can manage rewards" ON public.rewards_catalog;
CREATE POLICY "HR can manage rewards" 
ON public.rewards_catalog FOR ALL 
USING (
  -- Direct check on staff_profiles to avoid is_hr() function recursion or failure
  auth.uid() IN (SELECT user_id FROM public.staff_profiles WHERE role IN ('hr', 'admin'))
);

-- 2. APP SETTINGS RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can read settings" ON public.app_settings;
CREATE POLICY "Everyone can read settings" 
ON public.app_settings FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "HR and Admins can update settings" ON public.app_settings;
CREATE POLICY "HR and Admins can update settings" 
ON public.app_settings FOR ALL 
USING (
   -- Direct check
   auth.uid() IN (SELECT user_id FROM public.staff_profiles WHERE role IN ('hr', 'admin'))
);

-- 3. ENSURE COLUMNS EXIST (Just in case)
ALTER TABLE public.staff_notifications ADD COLUMN IF NOT EXISTS target_type text DEFAULT 'all';
ALTER TABLE public.staff_notifications ADD COLUMN IF NOT EXISTS target_users uuid[] DEFAULT '{}';
ALTER TABLE public.staff_notifications ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id);
ALTER TABLE public.staff_notifications ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- 4. NOTIFICATIONS RLS
ALTER TABLE public.staff_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view relevant notifications" ON public.staff_notifications;
CREATE POLICY "Users can view relevant notifications" 
ON public.staff_notifications FOR SELECT 
USING (true); -- Temporarily open for read to ensure no read-blocking issues

DROP POLICY IF EXISTS "HR can manage notifications" ON public.staff_notifications;
CREATE POLICY "HR can manage notifications" 
ON public.staff_notifications FOR ALL 
USING (
   -- Direct check
   auth.uid() IN (SELECT user_id FROM public.staff_profiles WHERE role IN ('hr', 'admin'))
);
