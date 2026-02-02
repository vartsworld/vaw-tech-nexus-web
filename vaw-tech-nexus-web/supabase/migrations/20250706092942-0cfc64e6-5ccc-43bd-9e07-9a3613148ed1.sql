-- Create enum types for various features
CREATE TYPE user_role AS ENUM ('hr', 'department_head', 'staff');
CREATE TYPE mood_type AS ENUM ('happy', 'neutral', 'sad', 'stressed', 'excited');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'overdue');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE notification_type AS ENUM ('announcement', 'task_assigned', 'mood_alert', 'achievement');

-- Staff profiles table (extends basic user info)
CREATE TABLE staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  role user_role DEFAULT 'staff',
  department_id UUID,
  is_department_head BOOLEAN DEFAULT false,
  hire_date DATE,
  total_points INTEGER DEFAULT 0,
  attendance_streak INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Departments table
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  head_id UUID,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Staff attendance table
CREATE TABLE staff_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_late BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Daily quotes and mood tracking
CREATE TABLE daily_quotes_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  author TEXT DEFAULT 'Anonymous',
  is_system BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE user_mood_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood mood_type NOT NULL,
  personal_quote TEXT,
  share_anonymously BOOLEAN DEFAULT false,
  sentiment_score DECIMAL(3,2), -- -1.0 to 1.0
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Team chat channels
CREATE TABLE chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_general BOOLEAN DEFAULT false,
  department_id UUID,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Chat messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID,
  sender_id UUID NOT NULL,
  recipient_id UUID, -- for DMs
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- text, file, system
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Projects and tasks system
CREATE TABLE staff_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  department_id UUID,
  created_by UUID NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE staff_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  project_id UUID,
  assigned_to UUID NOT NULL,
  assigned_by UUID NOT NULL,
  department_id UUID,
  status task_status DEFAULT 'pending',
  priority task_priority DEFAULT 'medium',
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  points INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Points and achievements system
CREATE TABLE user_points_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  category TEXT, -- attendance, task_completion, chat_engagement, chess_win
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Chess games
CREATE TABLE chess_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID NOT NULL,
  player2_id UUID NOT NULL,
  winner_id UUID,
  game_state JSONB, -- store chess board state
  status TEXT DEFAULT 'active', -- active, completed, abandoned
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Notifications and announcements
CREATE TABLE staff_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type notification_type DEFAULT 'announcement',
  created_by UUID NOT NULL,
  target_users UUID[], -- specific users, null for all
  department_id UUID, -- department-specific
  is_urgent BOOLEAN DEFAULT false,
  read_by UUID[] DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Spotify integration
CREATE TABLE user_spotify_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  current_track JSONB,
  is_playing BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE staff_profiles ADD CONSTRAINT fk_department 
  FOREIGN KEY (department_id) REFERENCES departments(id);

ALTER TABLE departments ADD CONSTRAINT fk_department_head 
  FOREIGN KEY (head_id) REFERENCES staff_profiles(id);

ALTER TABLE departments ADD CONSTRAINT fk_department_created_by 
  FOREIGN KEY (created_by) REFERENCES staff_profiles(id);

-- Enable RLS on all tables
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_quotes_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE chess_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_spotify_sessions ENABLE ROW LEVEL SECURITY;

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

-- Notifications
CREATE POLICY "Users can view their notifications" ON staff_notifications FOR SELECT USING (
  target_users IS NULL OR 
  (current_setting('request.jwt.claims', true)::json->>'sub')::uuid = ANY(target_users) OR
  EXISTS (SELECT 1 FROM staff_profiles sp WHERE sp.user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub') AND sp.department_id = staff_notifications.department_id)
);

CREATE POLICY "HR can manage notifications" ON staff_notifications FOR ALL 
  USING (EXISTS (SELECT 1 FROM staff_profiles WHERE user_id::text = (current_setting('request.jwt.claims', true)::json->>'sub') AND role = 'hr'));

-- Add indexes for performance
CREATE INDEX idx_staff_profiles_user_id ON staff_profiles(user_id);
CREATE INDEX idx_staff_profiles_department ON staff_profiles(department_id);
CREATE INDEX idx_staff_attendance_user_date ON staff_attendance(user_id, date);
CREATE INDEX idx_user_mood_entries_user_date ON user_mood_entries(user_id, date);
CREATE INDEX idx_chat_messages_channel ON chat_messages(channel_id);
CREATE INDEX idx_staff_tasks_assigned_to ON staff_tasks(assigned_to);
CREATE INDEX idx_staff_tasks_department ON staff_tasks(department_id);

-- Insert some sample data
INSERT INTO daily_quotes_staff (content, author, is_system) VALUES
('Success is not final, failure is not fatal: it is the courage to continue that counts.', 'Winston Churchill', true),
('The only way to do great work is to love what you do.', 'Steve Jobs', true),
('Innovation distinguishes between a leader and a follower.', 'Steve Jobs', true),
('Your limitation—it''s only your imagination.', 'Unknown', true),
('Push yourself, because no one else is going to do it for you.', 'Unknown', true);

-- Create general chat channel
INSERT INTO chat_channels (name, description, is_general, created_by) VALUES
('general', 'General discussion for all team members', true, (SELECT id FROM staff_profiles LIMIT 1));

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