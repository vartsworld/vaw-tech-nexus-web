-- Fix foreign key relationships and constraints

-- First, add proper foreign key constraint between staff_attendance and staff_profiles
ALTER TABLE staff_attendance 
ADD CONSTRAINT fk_staff_attendance_user 
FOREIGN KEY (user_id) REFERENCES staff_profiles(user_id) ON DELETE CASCADE;

-- Add proper foreign key constraint between staff_profiles and departments
ALTER TABLE staff_profiles 
ADD CONSTRAINT fk_staff_profiles_department 
FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- Add proper foreign key constraint between departments and staff_profiles for head_id
ALTER TABLE departments 
ADD CONSTRAINT fk_departments_head 
FOREIGN KEY (head_id) REFERENCES staff_profiles(user_id) ON DELETE SET NULL;

-- Add proper foreign key constraint between departments and staff_profiles for created_by
ALTER TABLE departments 
ADD CONSTRAINT fk_departments_created_by 
FOREIGN KEY (created_by) REFERENCES staff_profiles(user_id) ON DELETE SET NULL;

-- Add proper foreign key constraint between staff_tasks and staff_profiles
ALTER TABLE staff_tasks 
ADD CONSTRAINT fk_staff_tasks_assigned_to 
FOREIGN KEY (assigned_to) REFERENCES staff_profiles(user_id) ON DELETE CASCADE;

ALTER TABLE staff_tasks 
ADD CONSTRAINT fk_staff_tasks_assigned_by 
FOREIGN KEY (assigned_by) REFERENCES staff_profiles(user_id) ON DELETE CASCADE;

-- Add proper foreign key constraint between staff_tasks and departments
ALTER TABLE staff_tasks 
ADD CONSTRAINT fk_staff_tasks_department 
FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- Add proper foreign key constraint between staff_tasks and staff_projects
ALTER TABLE staff_tasks 
ADD CONSTRAINT fk_staff_tasks_project 
FOREIGN KEY (project_id) REFERENCES staff_projects(id) ON DELETE SET NULL;

-- Add proper foreign key constraint between staff_notifications and staff_profiles
ALTER TABLE staff_notifications 
ADD CONSTRAINT fk_staff_notifications_created_by 
FOREIGN KEY (created_by) REFERENCES staff_profiles(user_id) ON DELETE CASCADE;

-- Add proper foreign key constraint between staff_notifications and departments
ALTER TABLE staff_notifications 
ADD CONSTRAINT fk_staff_notifications_department 
FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- Add proper foreign key constraint between chat_channels and departments
ALTER TABLE chat_channels 
ADD CONSTRAINT fk_chat_channels_department 
FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- Add proper foreign key constraint between chat_channels and staff_profiles
ALTER TABLE chat_channels 
ADD CONSTRAINT fk_chat_channels_created_by 
FOREIGN KEY (created_by) REFERENCES staff_profiles(user_id) ON DELETE SET NULL;

-- Add proper foreign key constraint between chat_messages and staff_profiles
ALTER TABLE chat_messages 
ADD CONSTRAINT fk_chat_messages_sender 
FOREIGN KEY (sender_id) REFERENCES staff_profiles(user_id) ON DELETE CASCADE;

ALTER TABLE chat_messages 
ADD CONSTRAINT fk_chat_messages_recipient 
FOREIGN KEY (recipient_id) REFERENCES staff_profiles(user_id) ON DELETE CASCADE;

-- Add proper foreign key constraint between chat_messages and chat_channels
ALTER TABLE chat_messages 
ADD CONSTRAINT fk_chat_messages_channel 
FOREIGN KEY (channel_id) REFERENCES chat_channels(id) ON DELETE CASCADE;

-- Add proper foreign key constraint between user_mood_entries and staff_profiles
ALTER TABLE user_mood_entries 
ADD CONSTRAINT fk_user_mood_entries_user 
FOREIGN KEY (user_id) REFERENCES staff_profiles(user_id) ON DELETE CASCADE;

-- Add proper foreign key constraint between user_points_log and staff_profiles
ALTER TABLE user_points_log 
ADD CONSTRAINT fk_user_points_log_user 
FOREIGN KEY (user_id) REFERENCES staff_profiles(user_id) ON DELETE CASCADE;

-- Add proper foreign key constraint between user_spotify_sessions and staff_profiles
ALTER TABLE user_spotify_sessions 
ADD CONSTRAINT fk_user_spotify_sessions_user 
FOREIGN KEY (user_id) REFERENCES staff_profiles(user_id) ON DELETE CASCADE;

-- Add proper foreign key constraint between chess_games and staff_profiles
ALTER TABLE chess_games 
ADD CONSTRAINT fk_chess_games_player1 
FOREIGN KEY (player1_id) REFERENCES staff_profiles(user_id) ON DELETE CASCADE;

ALTER TABLE chess_games 
ADD CONSTRAINT fk_chess_games_player2 
FOREIGN KEY (player2_id) REFERENCES staff_profiles(user_id) ON DELETE CASCADE;

ALTER TABLE chess_games 
ADD CONSTRAINT fk_chess_games_winner 
FOREIGN KEY (winner_id) REFERENCES staff_profiles(user_id) ON DELETE SET NULL;