-- Add safe, idempotent foreign keys to resolve relationship ambiguity
-- NOTE: We reference staff_profiles.user_id for user-owned tables to support PostgREST embedding used in code

-- staff_profiles.department_id -> departments.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_staff_profiles_department'
  ) THEN
    ALTER TABLE public.staff_profiles
      ADD CONSTRAINT fk_staff_profiles_department
      FOREIGN KEY (department_id)
      REFERENCES public.departments(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- staff_attendance.user_id -> staff_profiles.user_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_staff_attendance_user'
  ) THEN
    ALTER TABLE public.staff_attendance
      ADD CONSTRAINT fk_staff_attendance_user
      FOREIGN KEY (user_id)
      REFERENCES public.staff_profiles(user_id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- staff_tasks.assigned_to -> staff_profiles.user_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_staff_tasks_assigned_to'
  ) THEN
    ALTER TABLE public.staff_tasks
      ADD CONSTRAINT fk_staff_tasks_assigned_to
      FOREIGN KEY (assigned_to)
      REFERENCES public.staff_profiles(user_id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Optional but helpful: staff_tasks.assigned_by -> staff_profiles.user_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_staff_tasks_assigned_by'
  ) THEN
    ALTER TABLE public.staff_tasks
      ADD CONSTRAINT fk_staff_tasks_assigned_by
      FOREIGN KEY (assigned_by)
      REFERENCES public.staff_profiles(user_id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- user_points_log.user_id -> staff_profiles.user_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_points_log_user'
  ) THEN
    ALTER TABLE public.user_points_log
      ADD CONSTRAINT fk_user_points_log_user
      FOREIGN KEY (user_id)
      REFERENCES public.staff_profiles(user_id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- staff_notifications.created_by -> staff_profiles.user_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_staff_notifications_created_by'
  ) THEN
    ALTER TABLE public.staff_notifications
      ADD CONSTRAINT fk_staff_notifications_created_by
      FOREIGN KEY (created_by)
      REFERENCES public.staff_profiles(user_id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- staff_notifications.department_id -> departments.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_staff_notifications_department'
  ) THEN
    ALTER TABLE public.staff_notifications
      ADD CONSTRAINT fk_staff_notifications_department
      FOREIGN KEY (department_id)
      REFERENCES public.departments(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- chat_channels.department_id -> departments.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_chat_channels_department'
  ) THEN
    ALTER TABLE public.chat_channels
      ADD CONSTRAINT fk_chat_channels_department
      FOREIGN KEY (department_id)
      REFERENCES public.departments(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- chat_channels.created_by -> staff_profiles.user_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_chat_channels_created_by'
  ) THEN
    ALTER TABLE public.chat_channels
      ADD CONSTRAINT fk_chat_channels_created_by
      FOREIGN KEY (created_by)
      REFERENCES public.staff_profiles(user_id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- chat_messages.channel_id -> chat_channels.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_chat_messages_channel'
  ) THEN
    ALTER TABLE public.chat_messages
      ADD CONSTRAINT fk_chat_messages_channel
      FOREIGN KEY (channel_id)
      REFERENCES public.chat_channels(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- chat_messages.sender_id -> staff_profiles.user_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_chat_messages_sender'
  ) THEN
    ALTER TABLE public.chat_messages
      ADD CONSTRAINT fk_chat_messages_sender
      FOREIGN KEY (sender_id)
      REFERENCES public.staff_profiles(user_id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- chat_messages.recipient_id -> staff_profiles.user_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_chat_messages_recipient'
  ) THEN
    ALTER TABLE public.chat_messages
      ADD CONSTRAINT fk_chat_messages_recipient
      FOREIGN KEY (recipient_id)
      REFERENCES public.staff_profiles(user_id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- user_mood_entries.user_id -> staff_profiles.user_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_mood_entries_user'
  ) THEN
    ALTER TABLE public.user_mood_entries
      ADD CONSTRAINT fk_user_mood_entries_user
      FOREIGN KEY (user_id)
      REFERENCES public.staff_profiles(user_id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- user_spotify_sessions.user_id -> staff_profiles.user_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_spotify_sessions_user'
  ) THEN
    ALTER TABLE public.user_spotify_sessions
      ADD CONSTRAINT fk_user_spotify_sessions_user
      FOREIGN KEY (user_id)
      REFERENCES public.staff_profiles(user_id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- chess_games players -> staff_profiles.user_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_chess_games_player1'
  ) THEN
    ALTER TABLE public.chess_games
      ADD CONSTRAINT fk_chess_games_player1
      FOREIGN KEY (player1_id)
      REFERENCES public.staff_profiles(user_id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_chess_games_player2'
  ) THEN
    ALTER TABLE public.chess_games
      ADD CONSTRAINT fk_chess_games_player2
      FOREIGN KEY (player2_id)
      REFERENCES public.staff_profiles(user_id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_chess_games_winner'
  ) THEN
    ALTER TABLE public.chess_games
      ADD CONSTRAINT fk_chess_games_winner
      FOREIGN KEY (winner_id)
      REFERENCES public.staff_profiles(user_id)
      ON DELETE SET NULL;
  END IF;
END $$;
