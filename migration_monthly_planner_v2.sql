-- Add client_id, color and is_completed to monthly_plans
ALTER TABLE monthly_plans ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);
ALTER TABLE monthly_plans ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3b82f6';
ALTER TABLE monthly_plans ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false;

-- To make monthly planner universal (company-wide) for all staff members:
-- Drop existing restricted select/update/delete policies and create universal ones!
DROP POLICY IF EXISTS "Users can view plans in their department or where they are assigned" ON monthly_plans;
DROP POLICY IF EXISTS "Users can update their own plans or plans in their department" ON monthly_plans;
DROP POLICY IF EXISTS "Users can delete their own plans" ON monthly_plans;
DROP POLICY IF EXISTS "Universal select policy for monthly_plans" ON monthly_plans;
DROP POLICY IF EXISTS "Universal insert policy for monthly_plans" ON monthly_plans;
DROP POLICY IF EXISTS "Universal update policy for monthly_plans" ON monthly_plans;
DROP POLICY IF EXISTS "Universal delete policy for monthly_plans" ON monthly_plans;

CREATE POLICY "Universal select policy for monthly_plans" ON monthly_plans
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Universal insert policy for monthly_plans" ON monthly_plans
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Universal update policy for monthly_plans" ON monthly_plans
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Universal delete policy for monthly_plans" ON monthly_plans
  FOR DELETE USING (auth.uid() IS NOT NULL);
