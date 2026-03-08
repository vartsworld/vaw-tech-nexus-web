-- Allow department heads to update tasks in their department
CREATE POLICY "Department heads can update department tasks"
ON public.staff_tasks
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE staff_profiles.user_id = auth.uid()
    AND staff_profiles.is_department_head = true
    AND staff_profiles.department_id = staff_tasks.department_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE staff_profiles.user_id = auth.uid()
    AND staff_profiles.is_department_head = true
    AND staff_profiles.department_id = staff_tasks.department_id
  )
);

-- Also allow department heads to view all tasks in their department
CREATE POLICY "Department heads can view department tasks"
ON public.staff_tasks
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE staff_profiles.user_id = auth.uid()
    AND staff_profiles.is_department_head = true
    AND staff_profiles.department_id = staff_tasks.department_id
  )
);