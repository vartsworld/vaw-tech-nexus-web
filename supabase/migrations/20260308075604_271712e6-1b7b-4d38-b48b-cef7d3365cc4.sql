-- Add staff_tasks and staff_subtasks to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_subtasks;