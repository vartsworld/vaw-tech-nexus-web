-- Add client_project_id to staff_tasks to link tasks to client projects
ALTER TABLE public.staff_tasks 
ADD COLUMN IF NOT EXISTS client_project_id UUID REFERENCES public.client_projects(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_staff_tasks_client_project_id ON public.staff_tasks(client_project_id);

-- Create a function to auto-update client project progress based on task completion
CREATE OR REPLACE FUNCTION public.update_client_project_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_tasks INT;
  completed_tasks INT;
  new_progress INT;
BEGIN
  -- Only proceed if client_project_id is set
  IF COALESCE(NEW.client_project_id, OLD.client_project_id) IS NULL THEN
    RETURN NEW;
  END IF;

  -- Count total and completed tasks for this project
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed')
  INTO total_tasks, completed_tasks
  FROM public.staff_tasks
  WHERE client_project_id = COALESCE(NEW.client_project_id, OLD.client_project_id);

  -- Calculate progress percentage
  IF total_tasks > 0 THEN
    new_progress := ROUND((completed_tasks::NUMERIC / total_tasks::NUMERIC) * 100);
  ELSE
    new_progress := 0;
  END IF;

  -- Update the client project progress
  UPDATE public.client_projects
  SET progress = new_progress, updated_at = now()
  WHERE id = COALESCE(NEW.client_project_id, OLD.client_project_id);

  RETURN NEW;
END;
$$;

-- Create trigger on staff_tasks for progress updates
DROP TRIGGER IF EXISTS trg_update_client_project_progress ON public.staff_tasks;
CREATE TRIGGER trg_update_client_project_progress
AFTER INSERT OR UPDATE OF status, client_project_id OR DELETE
ON public.staff_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_client_project_progress();

-- RLS: Allow clients to view tasks linked to their projects (read-only, limited fields via a view)
CREATE OR REPLACE VIEW public.client_task_timeline
WITH (security_invoker = on)
AS
SELECT 
  st.id,
  st.title,
  st.status,
  st.priority,
  st.created_at,
  st.completed_at,
  st.due_date,
  st.client_project_id,
  cp.client_id
FROM public.staff_tasks st
JOIN public.client_projects cp ON st.client_project_id = cp.id
WHERE st.client_project_id IS NOT NULL;