
-- Create announcement banners table
CREATE TABLE public.announcement_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  banner_type TEXT NOT NULL DEFAULT 'info' CHECK (banner_type IN ('info', 'warning', 'success', 'urgent', 'event')),
  target_audience TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'department', 'selected_staff')),
  target_department_ids UUID[] DEFAULT '{}',
  target_staff_ids UUID[] DEFAULT '{}',
  image_url TEXT,
  link_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_by_role TEXT NOT NULL DEFAULT 'hr' CHECK (created_by_role IN ('hr', 'admin', 'super_admin')),
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcement_banners ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read active banners
CREATE POLICY "Anyone can read active banners"
ON public.announcement_banners
FOR SELECT
USING (true);

-- HR/Admin can manage banners (using service role or direct insert)
CREATE POLICY "HR and Admin can manage banners"
ON public.announcement_banners
FOR ALL
USING (true)
WITH CHECK (true);

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE announcement_banners;
