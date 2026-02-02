-- Add foreign key constraints
ALTER TABLE staff_profiles ADD CONSTRAINT fk_department 
  FOREIGN KEY (department_id) REFERENCES departments(id);

ALTER TABLE departments ADD CONSTRAINT fk_department_head 
  FOREIGN KEY (head_id) REFERENCES staff_profiles(id);

ALTER TABLE departments ADD CONSTRAINT fk_department_created_by 
  FOREIGN KEY (created_by) REFERENCES staff_profiles(id);

-- Create RLS policies
-- Staff profiles
CREATE POLICY "Users can view all staff profiles" ON staff_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON staff_profiles FOR UPDATE 
  USING (user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub'));
CREATE POLICY "HR can manage all profiles" ON staff_profiles FOR ALL 
  USING (EXISTS (SELECT 1 FROM staff_profiles WHERE user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub') AND role = 'hr'));

-- Departments
CREATE POLICY "All can view departments" ON departments FOR SELECT USING (true);
CREATE POLICY "HR can manage departments" ON departments FOR ALL 
  USING (EXISTS (SELECT 1 FROM staff_profiles WHERE user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub') AND role = 'hr'));

-- Attendance
CREATE POLICY "Users can view their own attendance" ON staff_attendance FOR SELECT 
  USING (user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub'));
CREATE POLICY "Users can mark their own attendance" ON staff_attendance FOR INSERT 
  WITH CHECK (user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub'));
CREATE POLICY "HR can view all attendance" ON staff_attendance FOR SELECT 
  USING (EXISTS (SELECT 1 FROM staff_profiles WHERE user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub') AND role = 'hr'));

-- Daily quotes
CREATE POLICY "All can view daily quotes" ON daily_quotes_staff FOR SELECT USING (true);
CREATE POLICY "HR can manage quotes" ON daily_quotes_staff FOR ALL 
  USING (EXISTS (SELECT 1 FROM staff_profiles WHERE user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub') AND role = 'hr'));

-- Mood entries
CREATE POLICY "Users can manage their own mood entries" ON user_mood_entries FOR ALL 
  USING (user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub'));
CREATE POLICY "HR can view all mood entries" ON user_mood_entries FOR SELECT 
  USING (EXISTS (SELECT 1 FROM staff_profiles WHERE user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub') AND role = 'hr'));

-- Chat channels
CREATE POLICY "All can view chat channels" ON chat_channels FOR SELECT USING (true);
CREATE POLICY "Department heads can create department channels" ON chat_channels FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM staff_profiles WHERE user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub') AND (role = 'hr' OR is_department_head = true)));

-- Chat messages
CREATE POLICY "Users can view messages in their channels" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Users can send messages" ON chat_messages FOR INSERT 
  WITH CHECK (sender_id::text = (current_setting('request.jwt.claims', true)::json->>'sub'));

-- Tasks
CREATE POLICY "Users can view their assigned tasks" ON staff_tasks FOR SELECT 
  USING (assigned_to::text = (current_setting('request.jwt.claims', true)::json->>'sub') OR 
         assigned_by::text = (current_setting('request.jwt.claims', true)::json->>'sub') OR
         EXISTS (SELECT 1 FROM staff_profiles WHERE user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub') AND (role = 'hr' OR is_department_head = true)));

CREATE POLICY "Department heads can create tasks" ON staff_tasks FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM staff_profiles WHERE user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub') AND (role = 'hr' OR is_department_head = true)));

CREATE POLICY "Users can update their own tasks" ON staff_tasks FOR UPDATE 
  USING (assigned_to::text = (current_setting('request.jwt.claims', true)::json->>'sub') OR
         EXISTS (SELECT 1 FROM staff_profiles WHERE user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub') AND (role = 'hr' OR is_department_head = true)));

-- Projects
CREATE POLICY "All can view projects" ON staff_projects FOR SELECT USING (true);
CREATE POLICY "Department heads can manage projects" ON staff_projects FOR ALL 
  USING (EXISTS (SELECT 1 FROM staff_profiles WHERE user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub') AND (role = 'hr' OR is_department_head = true)));

-- Points log
CREATE POLICY "Users can view their own points" ON user_points_log FOR SELECT 
  USING (user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub'));
CREATE POLICY "HR can view all points" ON user_points_log FOR SELECT 
  USING (EXISTS (SELECT 1 FROM staff_profiles WHERE user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub') AND role = 'hr'));
CREATE POLICY "System can add points" ON user_points_log FOR INSERT WITH CHECK (true);

-- Chess games
CREATE POLICY "Users can view their chess games" ON chess_games FOR SELECT 
  USING (player1_id::text = (current_setting('request.jwt.claims', true)::json->>'sub') OR 
         player2_id::text = (current_setting('request.jwt.claims', true)::json->>'sub'));
CREATE POLICY "Users can create chess games" ON chess_games FOR INSERT WITH CHECK (true);
CREATE POLICY "Players can update their games" ON chess_games FOR UPDATE 
  USING (player1_id::text = (current_setting('request.jwt.claims', true)::json->>'sub') OR 
         player2_id::text = (current_setting('request.jwt.claims', true)::json->>'sub'));

-- Notifications
CREATE POLICY "Users can view their notifications" ON staff_notifications FOR SELECT USING (
  target_users IS NULL OR 
  (current_setting('request.jwt.claims', true)::json->>'sub')::uuid = ANY(target_users) OR
  EXISTS (SELECT 1 FROM staff_profiles sp WHERE sp.user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub') AND sp.department_id = staff_notifications.department_id)
);

CREATE POLICY "HR can manage notifications" ON staff_notifications FOR ALL 
  USING (EXISTS (SELECT 1 FROM staff_profiles WHERE user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub') AND role = 'hr'));

-- Spotify sessions
CREATE POLICY "Users can manage their own spotify sessions" ON user_spotify_sessions FOR ALL 
  USING (user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub'));

-- Create update functions for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_staff_profiles_updated_at BEFORE UPDATE ON staff_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_projects_updated_at BEFORE UPDATE ON staff_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_tasks_updated_at BEFORE UPDATE ON staff_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_spotify_sessions_updated_at BEFORE UPDATE ON user_spotify_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();