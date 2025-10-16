-- Drop the existing policy
DROP POLICY IF EXISTS "HR, Managers, and Sales heads can create clients" ON public.clients;

-- Create new policy that includes lead role
CREATE POLICY "HR, Managers, Leads, and Sales heads can create clients"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM staff_profiles
    WHERE staff_profiles.user_id = auth.uid()
      AND (
        staff_profiles.role = 'hr'::user_role 
        OR staff_profiles.role = 'manager'::user_role
        OR staff_profiles.role = 'lead'::user_role
        OR (staff_profiles.is_department_head = true AND is_sales_department_head(auth.uid()))
      )
  )
);

-- Also update the update policy to include lead role
DROP POLICY IF EXISTS "HR, Managers, and Sales heads can update clients" ON public.clients;

CREATE POLICY "HR, Managers, Leads, and Sales heads can update clients"
ON public.clients
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM staff_profiles
    WHERE staff_profiles.user_id = auth.uid()
      AND (
        staff_profiles.role = 'hr'::user_role 
        OR staff_profiles.role = 'manager'::user_role
        OR staff_profiles.role = 'lead'::user_role
        OR (staff_profiles.is_department_head = true AND is_sales_department_head(auth.uid()))
      )
  )
);