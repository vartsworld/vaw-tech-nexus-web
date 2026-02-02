-- FIX: Drop policies if they exist before creating them to avoid "policy already exists" errors.

-- 1. REWARDS CATALOG RLS
ALTER TABLE public.rewards_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view rewards" ON public.rewards_catalog;
CREATE POLICY "Everyone can view rewards" 
ON public.rewards_catalog FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "HR can manage rewards" ON public.rewards_catalog;
CREATE POLICY "HR can manage rewards" 
ON public.rewards_catalog FOR ALL 
USING (public.is_hr(auth.uid()) OR EXISTS (SELECT 1 FROM public.staff_profiles WHERE user_id = auth.uid() AND role::text = 'admin'));

-- 2. APP SETTINGS RLS (Fixing "Forbidden" on Points Config update)
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can read settings" ON public.app_settings;
CREATE POLICY "Everyone can read settings" 
ON public.app_settings FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "HR and Admins can update settings" ON public.app_settings;
CREATE POLICY "HR and Admins can update settings" 
ON public.app_settings FOR ALL 
USING (public.is_hr(auth.uid())); -- Simplified for reliability, can add admin check back if needed

-- 3. ENSURE COLUMNS EXIST IN staff_notifications
-- The error "column target_type does not exist" means the table schema is outdated.
-- We must explicitly add these columns if they are missing.
ALTER TABLE public.staff_notifications ADD COLUMN IF NOT EXISTS target_type text DEFAULT 'all';
ALTER TABLE public.staff_notifications ADD COLUMN IF NOT EXISTS target_users uuid[] DEFAULT '{}';
ALTER TABLE public.staff_notifications ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id);
ALTER TABLE public.staff_notifications ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;
ALTER TABLE public.staff_notifications ADD COLUMN IF NOT EXISTS is_urgent boolean DEFAULT false;

-- 4. NOTIFICATIONS RLS (Fixing "Forbidden" on Notification Create)
ALTER TABLE public.staff_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view relevant notifications" ON public.staff_notifications;
CREATE POLICY "Users can view relevant notifications" 
ON public.staff_notifications FOR SELECT 
USING (
  target_type = 'all' OR
  (target_type = 'department' AND department_id IN (SELECT department_id FROM public.staff_profiles WHERE user_id = auth.uid())) OR
  (target_type = 'specific' AND auth.uid() = ANY(target_users)) OR
  created_by = auth.uid()
);

DROP POLICY IF EXISTS "HR can manage notifications" ON public.staff_notifications;
CREATE POLICY "HR can manage notifications" 
ON public.staff_notifications FOR ALL 
USING (public.is_hr(auth.uid()));

-- 5. SEED DEFAULT DATA
INSERT INTO public.app_settings (key, value)
VALUES 
    ('points_config', '{"attendance_points": 10, "mood_points": 5, "late_penalty": 2}'::jsonb)
ON CONFLICT (key) DO NOTHING;
