-- Create user_activity_log table
CREATE TABLE user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_minutes INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_user_activity_log_user FOREIGN KEY (user_id) REFERENCES staff_profiles(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX idx_user_activity_log_timestamp ON user_activity_log(timestamp DESC);

-- Create user_presence_status table
CREATE TABLE user_presence_status (
  user_id UUID PRIMARY KEY,
  current_status TEXT NOT NULL DEFAULT 'online',
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_start_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reactivation_code INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_user_presence_status_user FOREIGN KEY (user_id) REFERENCES staff_profiles(user_id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_activity_log
CREATE POLICY "Users can view their own activity log"
  ON user_activity_log FOR SELECT
  USING (user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users can insert their own activity log"
  ON user_activity_log FOR INSERT
  WITH CHECK (user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "HR can view all activity logs"
  ON user_activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE staff_profiles.user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub')
      AND staff_profiles.role = 'hr'
    )
  );

-- RLS Policies for user_presence_status
CREATE POLICY "Users can view their own presence status"
  ON user_presence_status FOR SELECT
  USING (user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users can update their own presence status"
  ON user_presence_status FOR UPDATE
  USING (user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users can insert their own presence status"
  ON user_presence_status FOR INSERT
  WITH CHECK (user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "All authenticated users can view others' presence status"
  ON user_presence_status FOR SELECT
  USING (true);