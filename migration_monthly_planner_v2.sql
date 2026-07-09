-- Add client_id and color to monthly_plans
ALTER TABLE monthly_plans ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);
ALTER TABLE monthly_plans ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3b82f6';

-- Update RLS policies if necessary (they should already cover basic access)
