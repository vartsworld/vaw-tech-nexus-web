-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user is Sales department head
CREATE OR REPLACE FUNCTION public.is_sales_department_head(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM staff_profiles sp
    JOIN departments d ON sp.department_id = d.id
    WHERE sp.user_id = _user_id
      AND sp.is_department_head = true
      AND LOWER(d.name) LIKE '%sales%'
  )
$$;

-- RLS Policies for clients
-- HR, Managers, and Sales department heads can create clients
CREATE POLICY "HR, Managers, and Sales heads can create clients"
ON public.clients
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE user_id = auth.uid()::text::uuid
      AND (
        role = 'hr'
        OR role = 'manager'
        OR (is_department_head = true AND public.is_sales_department_head(auth.uid()::text::uuid))
      )
  )
);

-- Everyone can view clients
CREATE POLICY "Everyone can view clients"
ON public.clients
FOR SELECT
USING (true);

-- HR, Managers, and Sales heads can update clients
CREATE POLICY "HR, Managers, and Sales heads can update clients"
ON public.clients
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE user_id = auth.uid()::text::uuid
      AND (
        role = 'hr'
        OR role = 'manager'
        OR (is_department_head = true AND public.is_sales_department_head(auth.uid()::text::uuid))
      )
  )
);

-- HR and Managers can delete clients
CREATE POLICY "HR and Managers can delete clients"
ON public.clients
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE user_id = auth.uid()::text::uuid
      AND (role = 'hr' OR role = 'manager')
  )
);

-- Add client_id to staff_tasks
ALTER TABLE public.staff_tasks ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

-- Update trigger for clients updated_at
CREATE OR REPLACE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();