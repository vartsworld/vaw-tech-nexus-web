-- Fix missing foreign key relationships and RLS policy issues

-- Add missing foreign key constraint for staff_attendance
ALTER TABLE staff_attendance 
ADD CONSTRAINT staff_attendance_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES staff_profiles(user_id) ON DELETE CASCADE;

-- Add missing foreign key constraint for departments
ALTER TABLE departments 
ADD CONSTRAINT departments_head_id_fkey 
FOREIGN KEY (head_id) REFERENCES staff_profiles(id) ON DELETE SET NULL;

ALTER TABLE departments 
ADD CONSTRAINT departments_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES staff_profiles(user_id) ON DELETE SET NULL;

-- Add missing foreign key constraint for staff_notifications
ALTER TABLE staff_notifications 
ADD CONSTRAINT staff_notifications_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES staff_profiles(user_id) ON DELETE CASCADE;

-- Create security definer function to avoid infinite recursion in RLS
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
DECLARE
    user_role_result user_role;
BEGIN
    SELECT role INTO user_role_result
    FROM staff_profiles 
    WHERE user_id::text = (current_setting('request.jwt.claims', true)::json ->> 'sub');
    
    RETURN COALESCE(user_role_result, 'staff'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create function to check if user is HR
CREATE OR REPLACE FUNCTION is_hr_user()
RETURNS boolean AS $$
BEGIN
    RETURN get_current_user_role() = 'hr';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create function to check if user is department head
CREATE OR REPLACE FUNCTION is_department_head()
RETURNS boolean AS $$
DECLARE
    is_head boolean;
BEGIN
    SELECT is_department_head INTO is_head
    FROM staff_profiles 
    WHERE user_id::text = (current_setting('request.jwt.claims', true)::json ->> 'sub');
    
    RETURN COALESCE(is_head, false) OR is_hr_user();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "HR can manage all profiles" ON staff_profiles;
DROP POLICY IF EXISTS "HR can view all attendance" ON staff_attendance;
DROP POLICY IF EXISTS "HR can manage departments" ON departments;
DROP POLICY IF EXISTS "HR can manage notifications" ON staff_notifications;

-- Recreate RLS policies using security definer functions
CREATE POLICY "HR can manage all profiles" ON staff_profiles
FOR ALL USING (is_hr_user());

CREATE POLICY "HR can view all attendance" ON staff_attendance
FOR SELECT USING (is_hr_user());

CREATE POLICY "HR can manage departments" ON departments
FOR ALL USING (is_hr_user());

CREATE POLICY "Department heads can create tasks" ON staff_tasks
FOR INSERT WITH CHECK (is_department_head());

CREATE POLICY "HR can manage notifications" ON staff_notifications
FOR ALL USING (is_hr_user());

-- Update task policies
DROP POLICY IF EXISTS "Users can update their own tasks" ON staff_tasks;
CREATE POLICY "Users can update their own tasks" ON staff_tasks
FOR UPDATE USING (
    (assigned_to::text = (current_setting('request.jwt.claims', true)::json ->> 'sub')) 
    OR is_department_head()
);