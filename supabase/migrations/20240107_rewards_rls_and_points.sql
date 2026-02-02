-- Enable RLS on rewards_catalog
ALTER TABLE public.rewards_catalog ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view rewards (so staff can redeem them)
CREATE POLICY "Everyone can view rewards" 
ON public.rewards_catalog FOR SELECT 
USING (true);

-- Allow HR and Admins to Manage rewards (Insert, Update, Delete)
CREATE POLICY "HR can manage rewards" 
ON public.rewards_catalog FOR ALL 
USING (public.is_hr(auth.uid()) OR EXISTS (SELECT 1 FROM public.staff_profiles WHERE user_id = auth.uid() AND role::text = 'admin'));

-- Seed default point settings
INSERT INTO public.app_settings (key, value)
VALUES 
    ('points_config', '{"attendance_points": 10, "mood_points": 5, "late_penalty": 2}'::jsonb)
ON CONFLICT (key) DO NOTHING;
