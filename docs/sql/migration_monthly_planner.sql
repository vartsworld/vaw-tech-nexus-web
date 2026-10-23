-- Create monthly_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS monthly_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  department_id UUID REFERENCES departments(id),
  assigned_staff JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE monthly_plans ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'monthly_plans' AND policyname = 'Users can view plans in their department or where they are assigned'
    ) THEN
        CREATE POLICY "Users can view plans in their department or where they are assigned" ON monthly_plans
          FOR SELECT USING (
            department_id IN (SELECT department_id FROM staff_profiles WHERE user_id = auth.uid())
            OR assigned_staff @> jsonb_build_array(auth.uid()::text)
          );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'monthly_plans' AND policyname = 'Users can insert plans'
    ) THEN
        CREATE POLICY "Users can insert plans" ON monthly_plans
          FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'monthly_plans' AND policyname = 'Users can update their own plans or plans in their department'
    ) THEN
        CREATE POLICY "Users can update their own plans or plans in their department" ON monthly_plans
          FOR UPDATE USING (
            created_by = auth.uid()
            OR department_id IN (SELECT department_id FROM staff_profiles WHERE user_id = auth.uid() AND (role = 'manager' OR role = 'lead' OR is_department_head = true))
          );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'monthly_plans' AND policyname = 'Users can delete their own plans'
    ) THEN
        CREATE POLICY "Users can delete their own plans" ON monthly_plans
          FOR DELETE USING (created_by = auth.uid());
    END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_monthly_plans_date ON monthly_plans(date);
CREATE INDEX IF NOT EXISTS idx_monthly_plans_department ON monthly_plans(department_id);
CREATE INDEX IF NOT EXISTS idx_monthly_plans_created_by ON monthly_plans(created_by);
