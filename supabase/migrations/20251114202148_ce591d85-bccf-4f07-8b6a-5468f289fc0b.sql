-- Update RLS policy to allow all department heads to create clients
DROP POLICY IF EXISTS "HR, Managers, Leads, and Sales heads can create clients" ON public.clients;

CREATE POLICY "HR, Managers, Leads, and Department heads can create clients" 
ON public.clients 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM staff_profiles
    WHERE staff_profiles.user_id = auth.uid() 
    AND (
      staff_profiles.role IN ('hr', 'manager', 'lead') 
      OR staff_profiles.is_department_head = true
    )
  )
);

-- Update RLS policy to allow all department heads to update clients
DROP POLICY IF EXISTS "HR, Managers, Leads, and Sales heads can update clients" ON public.clients;

CREATE POLICY "HR, Managers, Leads, and Department heads can update clients" 
ON public.clients 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1
    FROM staff_profiles
    WHERE staff_profiles.user_id = auth.uid() 
    AND (
      staff_profiles.role IN ('hr', 'manager', 'lead') 
      OR staff_profiles.is_department_head = true
    )
  )
);