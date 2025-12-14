
-- Create project_monitors table for tracking client websites and renewals
CREATE TABLE public.project_monitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  domain_renewal_date DATE,
  server_renewal_date DATE,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_monitors ENABLE ROW LEVEL SECURITY;

-- Policy for viewing - all authenticated users can view
CREATE POLICY "Authenticated users can view project monitors"
ON public.project_monitors
FOR SELECT
USING (true);

-- Policy for insert - staff can create
CREATE POLICY "Staff can create project monitors"
ON public.project_monitors
FOR INSERT
WITH CHECK (true);

-- Policy for update - staff can update
CREATE POLICY "Staff can update project monitors"
ON public.project_monitors
FOR UPDATE
USING (true);

-- Policy for delete - HR and managers can delete
CREATE POLICY "HR and managers can delete project monitors"
ON public.project_monitors
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM staff_profiles
  WHERE staff_profiles.user_id = auth.uid()
  AND staff_profiles.role IN ('hr', 'manager')
));

-- Create trigger for updated_at
CREATE TRIGGER update_project_monitors_updated_at
BEFORE UPDATE ON public.project_monitors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
