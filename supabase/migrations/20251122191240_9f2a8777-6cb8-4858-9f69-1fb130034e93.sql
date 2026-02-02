-- Create rewards catalog table
CREATE TABLE IF NOT EXISTS rewards_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('salary_perk', 'bonus', 'merchandise', 'benefits', 'other')),
  points_cost INTEGER NOT NULL CHECK (points_cost > 0),
  monetary_value DECIMAL(10,2),
  image_url TEXT,
  stock_quantity INTEGER,
  is_active BOOLEAN DEFAULT true,
  redemption_limit INTEGER,
  terms_conditions TEXT,
  created_by UUID REFERENCES staff_profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create points redemptions table
CREATE TABLE IF NOT EXISTS points_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES staff_profiles(user_id),
  reward_id UUID NOT NULL REFERENCES rewards_catalog(id),
  points_spent INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  redemption_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_by UUID REFERENCES staff_profiles(user_id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  delivery_address TEXT,
  completion_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE rewards_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rewards_catalog
CREATE POLICY "Staff can view active rewards"
  ON rewards_catalog FOR SELECT
  USING (is_active = true);

CREATE POLICY "HR can manage rewards catalog"
  ON rewards_catalog FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub')
      AND role = 'hr'
    )
  );

-- RLS Policies for points_redemptions
CREATE POLICY "Users can view their own redemptions"
  ON points_redemptions FOR SELECT
  USING (user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users can create redemptions"
  ON points_redemptions FOR INSERT
  WITH CHECK (user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "HR can view all redemptions"
  ON points_redemptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub')
      AND role IN ('hr', 'manager')
    )
  );

CREATE POLICY "HR can update redemptions"
  ON points_redemptions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub')
      AND role IN ('hr', 'manager')
    )
  );

-- Create indexes
CREATE INDEX idx_rewards_catalog_category ON rewards_catalog(category);
CREATE INDEX idx_rewards_catalog_active ON rewards_catalog(is_active);
CREATE INDEX idx_redemptions_user_id ON points_redemptions(user_id);
CREATE INDEX idx_redemptions_status ON points_redemptions(status);
CREATE INDEX idx_redemptions_reward_id ON points_redemptions(reward_id);

-- Trigger for updated_at
CREATE TRIGGER update_rewards_catalog_updated_at
  BEFORE UPDATE ON rewards_catalog
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_points_redemptions_updated_at
  BEFORE UPDATE ON points_redemptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();