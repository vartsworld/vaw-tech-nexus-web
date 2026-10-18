-- ==============================================================================
-- MIGRATION: Allow all staff to view tasks created by team heads in the calendar
-- apart from / across departments, plus their own assigned & department tasks.
-- ==============================================================================

-- 1. DROP EXISTING RESTRICTIVE SELECT POLICIES ON staff_tasks
DROP POLICY IF EXISTS "Users can view their assigned tasks" ON public.staff_tasks;
DROP POLICY IF EXISTS "Department heads can view department tasks" ON public.staff_tasks;
DROP POLICY IF EXISTS "Staff can view team head tasks and assigned tasks" ON public.staff_tasks;

-- 2. CREATE COMPREHENSIVE SELECT POLICY ON staff_tasks
CREATE POLICY "Staff can view team head tasks and assigned tasks"
ON public.staff_tasks
FOR SELECT
TO authenticated
USING (
  -- 1. Directly assigned to user (supports UUID string or JSON array text)
  auth.uid()::text = assigned_to
  OR assigned_to LIKE '%' || auth.uid()::text || '%'
  
  -- 2. Created by user
  OR auth.uid()::text = assigned_by::text
  
  -- 3. Created by ANY Team Head / Dept Head / Manager / Lead / HR (company-wide / apart from department)
  OR EXISTS (
    SELECT 1 FROM public.staff_profiles sp
    WHERE sp.user_id = staff_tasks.assigned_by
    AND (
      sp.is_department_head = true
      OR sp.role IN ('department_head', 'team_head', 'manager', 'lead', 'hr', 'admin')
    )
  )
  
  -- 4. Tasks within the viewer's own department
  OR EXISTS (
    SELECT 1 FROM public.staff_profiles viewer
    WHERE viewer.user_id = auth.uid()
    AND viewer.department_id IS NOT NULL
    AND viewer.department_id = staff_tasks.department_id
  )
  
  -- 5. Viewer is HR, Admin, Manager, Lead, or Department Head
  OR EXISTS (
    SELECT 1 FROM public.staff_profiles viewer
    WHERE viewer.user_id = auth.uid()
    AND (
      viewer.is_department_head = true
      OR viewer.role IN ('department_head', 'team_head', 'manager', 'lead', 'hr', 'admin')
    )
  )
);

-- 3. DROP AND RECREATE SELECT POLICY ON staff_subtasks
DROP POLICY IF EXISTS "Users can view their assigned subtasks" ON public.staff_subtasks;
DROP POLICY IF EXISTS "Staff can view subtasks of team head tasks or assigned subtasks" ON public.staff_subtasks;

CREATE POLICY "Staff can view subtasks of team head tasks or assigned subtasks"
ON public.staff_subtasks
FOR SELECT
TO authenticated
USING (
  -- 1. Directly assigned to user or created by user
  (assigned_to)::text = auth.uid()::text
  OR (created_by)::text = auth.uid()::text
  
  -- 2. Subtask of a task created by a Team Head / Dept Head (company-wide)
  OR EXISTS (
    SELECT 1 FROM public.staff_tasks st
    JOIN public.staff_profiles sp ON sp.user_id = st.assigned_by
    WHERE st.id = staff_subtasks.task_id
    AND (
      sp.is_department_head = true
      OR sp.role IN ('department_head', 'team_head', 'manager', 'lead', 'hr', 'admin')
    )
  )
  
  -- 3. Subtask created by a Team Head / Dept Head
  OR EXISTS (
    SELECT 1 FROM public.staff_profiles sp
    WHERE sp.user_id = staff_subtasks.created_by
    AND (
      sp.is_department_head = true
      OR sp.role IN ('department_head', 'team_head', 'manager', 'lead', 'hr', 'admin')
    )
  )
  
  -- 4. Subtask belonging to viewer's department
  OR EXISTS (
    SELECT 1 FROM public.staff_tasks st
    JOIN public.staff_profiles viewer ON viewer.user_id = auth.uid()
    WHERE st.id = staff_subtasks.task_id
    AND (
      (viewer.department_id IS NOT NULL AND viewer.department_id = st.department_id)
      OR viewer.is_department_head = true
      OR viewer.role IN ('department_head', 'team_head', 'manager', 'lead', 'hr', 'admin')
    )
  )
);

-- 4. CREATE A SECURITY DEFINER HELPER FUNCTION FOR CALENDAR TASKS
CREATE OR REPLACE FUNCTION public.get_calendar_tasks_for_staff()
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  assigned_to TEXT,
  assigned_by UUID,
  department_id UUID,
  status task_status,
  priority task_priority,
  due_date DATE,
  due_time TEXT,
  points INTEGER,
  client_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_team_head_task BOOLEAN,
  creator_name TEXT,
  creator_role TEXT,
  department_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    st.id,
    st.title,
    st.description,
    st.assigned_to,
    st.assigned_by,
    st.department_id,
    st.status,
    st.priority,
    st.due_date,
    st.due_time,
    st.points,
    st.client_id,
    st.created_at,
    st.updated_at,
    (
      COALESCE(sp.is_department_head, false) = true
      OR sp.role IN ('department_head', 'team_head', 'manager', 'lead', 'hr', 'admin')
    ) AS is_team_head_task,
    COALESCE(sp.full_name, 'Team Head') AS creator_name,
    COALESCE(sp.role::text, 'lead') AS creator_role,
    COALESCE(d.name, 'General') AS department_name
  FROM public.staff_tasks st
  LEFT JOIN public.staff_profiles sp ON sp.user_id = st.assigned_by
  LEFT JOIN public.departments d ON d.id = st.department_id
  WHERE 
    -- 1. Tasks created by any team head / manager / lead / hr (across all departments)
    (
      sp.is_department_head = true
      OR sp.role IN ('department_head', 'team_head', 'manager', 'lead', 'hr', 'admin')
    )
    -- 2. Tasks assigned to current user
    OR (auth.uid() IS NOT NULL AND (
      st.assigned_to = auth.uid()::text
      OR st.assigned_to LIKE '%' || auth.uid()::text || '%'
      OR st.assigned_by = auth.uid()
    ))
  ORDER BY COALESCE(st.due_date, st.created_at::date) ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.get_calendar_tasks_for_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_calendar_tasks_for_staff() TO anon;
