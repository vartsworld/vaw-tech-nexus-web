-- EMERGENCY RLS DISABLE SCRIPT
-- This script disables Row Level Security on all major tables to resolve 403 Forbidden and RLS violation errors.
-- Use this cautiously in production environments.

-- Disable RLS for Core Profile & Org Tables
ALTER TABLE IF EXISTS staff_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_presence_status DISABLE ROW LEVEL SECURITY;

-- Disable RLS for Coin Economy & Rewards
ALTER TABLE IF EXISTS reward_catalog DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rewards_catalog DISABLE ROW LEVEL SECURITY; -- Target legacy table name if exists
ALTER TABLE IF EXISTS reward_redemptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS points_redemptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_coin_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS company_coin_bank DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS head_coin_budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS head_budget_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS project_coin_allocations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS finance_approvals DISABLE ROW LEVEL SECURITY;

-- Disable RLS for Tasks & Projects
ALTER TABLE IF EXISTS staff_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staff_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS project_documents DISABLE ROW LEVEL SECURITY;

-- Disable RLS for Communication & Logs
ALTER TABLE IF EXISTS chat_channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staff_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_activity_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staff_notes DISABLE ROW LEVEL SECURITY;

-- Disable RLS for Games & Break Room
ALTER TABLE IF EXISTS chess_games DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chess_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chess_game_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS break_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS word_game_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS code_puzzles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS code_puzzle_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quiz_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quiz_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS hall_of_fame_entries DISABLE ROW LEVEL SECURITY;

-- Disable RLS for Quests
ALTER TABLE IF EXISTS quests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_quest_progress DISABLE ROW LEVEL SECURITY;

-- Disable RLS for Shared Data
ALTER TABLE IF EXISTS app_settings DISABLE ROW LEVEL SECURITY;

-- Create "Allow All" policies for Authenticated users as a fallback if RLS remains enabled for some reason
-- (Optional: but useful if you want to keep RLS ON but permit everything)
/*
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Allow All" ON %I', t);
        EXECUTE format('CREATE POLICY "Allow All" ON %I FOR ALL USING (true) WITH CHECK (true)', t);
    END LOOP;
END $$;
*/
