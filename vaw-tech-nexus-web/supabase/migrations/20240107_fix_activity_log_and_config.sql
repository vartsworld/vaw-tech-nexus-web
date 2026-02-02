-- FIXED ACTIVITY LOG AND POINT CONFIGURATION
-- 1. Add missing column if it really doesn't exist (safety)
ALTER TABLE IF EXISTS user_activity_log ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;

-- 2. Create app_settings for point configuration if not exists
CREATE TABLE IF NOT EXISTS app_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure description column exists if table was already created without it
ALTER TABLE IF EXISTS app_settings ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. Seed default coin rewards
INSERT INTO app_settings (key, value, description)
VALUES 
('chess_win_reward', '10', 'Number of coins awarded for winning a chess game'),
('word_challenge_reward_rate', '0.1', 'Coins per game point for Word Challenge'),
('quick_quiz_reward_rate', '2', 'Coins per correct answer in Quick Quiz'),
('code_puzzle_reward', '5', 'Coins per puzzle solved in Code Puzzle'),
('chat_reward', '0', 'Coins per message sent (default 0)')
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    description = EXCLUDED.description;

-- 4. Update Chat Trigger to remove points_earned insert if it's causing issues, 
-- or just ensure it's set to 0 and the column exists.
-- The user said: "It is not necessary to get point for msging."
CREATE OR REPLACE FUNCTION log_chat_activity_no_points()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_activity_log (user_id, activity_type, points_earned, metadata)
    VALUES (
        NEW.sender_id, 'message_sent', 0,
        jsonb_build_object('message_id', NEW.id, 'channel_id', NEW.channel_id)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Add a function to get setting value conveniently
CREATE OR REPLACE FUNCTION get_app_setting(p_key TEXT, p_default JSONB DEFAULT 'null'::jsonb)
RETURNS JSONB AS $$
DECLARE
    v_value JSONB;
BEGIN
    SELECT value INTO v_value FROM app_settings WHERE key = p_key;
    RETURN COALESCE(v_value, p_default);
END;
$$ LANGUAGE plpgsql;
