-- Allow clients to SELECT staff_tasks linked to their projects
CREATE POLICY "Clients can view tasks linked to their projects"
ON public.staff_tasks
FOR SELECT
TO authenticated
USING (
  client_project_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.client_projects cp
    JOIN public.clients c ON c.id = cp.client_id AND c.user_id = auth.uid()
    WHERE cp.id = staff_tasks.client_project_id
  )
  OR
  client_project_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.client_projects cp
    JOIN public.client_profiles cpf ON cpf.id = cp.client_id AND cpf.user_id = auth.uid()
    WHERE cp.id = staff_tasks.client_project_id
  )
);

GRANT SELECT ON public.client_task_timeline TO authenticated;