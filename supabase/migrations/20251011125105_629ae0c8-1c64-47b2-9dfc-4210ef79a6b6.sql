-- Add foreign key constraint for staff_subtasks.assigned_to
ALTER TABLE staff_subtasks 
ADD CONSTRAINT staff_subtasks_assigned_to_fkey 
FOREIGN KEY (assigned_to) 
REFERENCES staff_profiles(user_id) 
ON DELETE CASCADE;

-- Add foreign key constraint for staff_subtasks.created_by
ALTER TABLE staff_subtasks 
ADD CONSTRAINT staff_subtasks_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES staff_profiles(user_id) 
ON DELETE CASCADE;

COMMENT ON CONSTRAINT staff_subtasks_assigned_to_fkey ON staff_subtasks IS 'Links subtask to the assigned staff member';
COMMENT ON CONSTRAINT staff_subtasks_created_by_fkey ON staff_subtasks IS 'Links subtask to the creator';