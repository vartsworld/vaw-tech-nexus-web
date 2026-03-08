
CREATE OR REPLACE FUNCTION public.route_support_ticket()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dev_dept_id uuid;
  v_hr_dept_id uuid;
  v_dept_head_id text;
  v_client_name text;
  v_task_id uuid;
  v_target_dept_id uuid;
  v_priority_map text;
BEGIN
  SELECT id INTO v_dev_dept_id FROM departments WHERE name ILIKE '%web development%' LIMIT 1;
  SELECT id INTO v_hr_dept_id FROM departments WHERE name ILIKE '%hr%' LIMIT 1;

  SELECT COALESCE(company_name, contact_person, email) INTO v_client_name 
  FROM client_profiles WHERE id = NEW.client_id LIMIT 1;

  v_priority_map := CASE NEW.priority
    WHEN 'high' THEN 'high'
    WHEN 'medium' THEN 'medium'
    WHEN 'low' THEN 'low'
    ELSE 'medium'
  END;

  IF NEW.type = 'bug_report' THEN
    v_target_dept_id := v_dev_dept_id;
    
    SELECT user_id::text INTO v_dept_head_id 
    FROM staff_profiles 
    WHERE department_id = v_dev_dept_id AND is_department_head = true 
    LIMIT 1;

    IF v_dept_head_id IS NOT NULL THEN
      INSERT INTO staff_tasks (
        title, description, assigned_to, assigned_by, department_id, priority, status, comments
      ) VALUES (
        '[Support Ticket] ' || NEW.subject,
        E'**Client:** ' || COALESCE(v_client_name, 'Unknown') || E'\n' ||
        E'**Type:** Technical Issue / Bug Report\n' ||
        E'**Priority:** ' || COALESCE(NEW.priority, 'medium') || E'\n' ||
        E'**Details:**\n' || NEW.message ||
        CASE WHEN NEW.metadata->>'attachment_url' IS NOT NULL 
          THEN E'\n**Attachment:** ' || (NEW.metadata->>'attachment_url') ELSE '' END,
        v_dept_head_id,
        v_dept_head_id,
        v_dev_dept_id,
        v_priority_map::task_priority,
        'pending'::task_status,
        jsonb_build_array(jsonb_build_object(
          'type', 'system',
          'text', 'Auto-created from client support ticket',
          'timestamp', now()::text
        ))
      ) RETURNING id INTO v_task_id;
    END IF;

  ELSE
    v_target_dept_id := v_hr_dept_id;

    -- Try department head first, then fall back to any HR role user
    SELECT user_id::text INTO v_dept_head_id 
    FROM staff_profiles 
    WHERE department_id = v_hr_dept_id AND is_department_head = true 
    LIMIT 1;

    IF v_dept_head_id IS NULL THEN
      SELECT user_id::text INTO v_dept_head_id 
      FROM staff_profiles 
      WHERE department_id = v_hr_dept_id AND role = 'hr'
      LIMIT 1;
    END IF;

    IF v_dept_head_id IS NOT NULL THEN
      INSERT INTO staff_tasks (
        title, description, assigned_to, assigned_by, department_id, priority, status, comments
      ) VALUES (
        '[Client ' || CASE NEW.type
          WHEN 'support' THEN 'Billing'
          WHEN 'update_request' THEN 'Project Update'
          WHEN 'suggestion' THEN 'Suggestion'
          ELSE 'Support'
        END || '] ' || NEW.subject,
        E'**Client:** ' || COALESCE(v_client_name, 'Unknown') || E'\n' ||
        E'**Type:** ' || CASE NEW.type
          WHEN 'support' THEN 'Billing Inquiry'
          WHEN 'update_request' THEN 'Project Update Request'
          WHEN 'suggestion' THEN 'Suggestion / Other'
          ELSE NEW.type
        END || E'\n' ||
        E'**Priority:** ' || COALESCE(NEW.priority, 'medium') || E'\n' ||
        E'**Details:**\n' || NEW.message ||
        CASE WHEN NEW.metadata->>'attachment_url' IS NOT NULL 
          THEN E'\n**Attachment:** ' || (NEW.metadata->>'attachment_url') ELSE '' END,
        v_dept_head_id,
        v_dept_head_id,
        v_hr_dept_id,
        v_priority_map::task_priority,
        'pending'::task_status,
        jsonb_build_array(jsonb_build_object(
          'type', 'system',
          'text', 'Auto-created from client support ticket',
          'timestamp', now()::text
        ))
      ) RETURNING id INTO v_task_id;
    END IF;
  END IF;

  NEW.routed_to_department_id := v_target_dept_id;
  NEW.routed_task_id := v_task_id;
  NEW.routing_status := CASE WHEN v_task_id IS NOT NULL THEN 'routed' ELSE 'pending' END;

  RETURN NEW;
END;
$$;
