-- ================================================================
-- VAW TECHNOLOGIES - COMPLETE TEAM HEAD DASHBOARD SCHEMA
-- ================================================================
-- Includes: Chat, Chess, Notes, Activity Log, VAW Coin Economy
-- Version: 2.0 (with Coin Economy)
-- Company operates 24/7 (literal days, not business days)
-- 1 VAW Coin = 1 INR (tied to company value)
-- ================================================================

-- ================================================================
-- PART 1: CHAT SYSTEM
-- ================================================================

-- Chat Channels Table
CREATE TABLE IF NOT EXISTS chat_channels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_general BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT chat_message_target CHECK (
        (channel_id IS NOT NULL AND recipient_id IS NULL) OR 
        (channel_id IS NULL AND recipient_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON chat_messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient ON chat_messages(recipient_id, created_at DESC);

-- ================================================================
-- PART 2: CHESS SYSTEM
-- ================================================================

-- Chess Games Table
CREATE TABLE IF NOT EXISTS chess_games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    player2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'waiting', 'active', 'completed', 'declined', 'abandoned')),
    winner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    game_state JSONB DEFAULT '{"fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "history": [], "turn": "w"}'::jsonb,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT different_players CHECK (player1_id != player2_id)
);

-- Chess Stats Table - ELO ratings and statistics
CREATE TABLE IF NOT EXISTS chess_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    elo_rating INTEGER DEFAULT 1200,
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    games_lost INTEGER DEFAULT 0,
    games_drawn INTEGER DEFAULT 0,
    longest_win_streak INTEGER DEFAULT 0,
    current_win_streak INTEGER DEFAULT 0,
    total_points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chess Game History
CREATE TABLE IF NOT EXISTS chess_game_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id UUID NOT NULL REFERENCES chess_games(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    opponent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    result TEXT NOT NULL CHECK (result IN ('win', 'loss', 'draw')),
    elo_change INTEGER NOT NULL DEFAULT 0,
    elo_before INTEGER NOT NULL,
    elo_after INTEGER NOT NULL,
    points_earned INTEGER DEFAULT 0,
    game_duration_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chess_games_players ON chess_games(player1_id, player2_id);
CREATE INDEX IF NOT EXISTS idx_chess_games_status ON chess_games(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chess_stats_user ON chess_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_chess_stats_rating ON chess_stats(elo_rating DESC);
CREATE INDEX IF NOT EXISTS idx_chess_history_player ON chess_game_history(player_id, created_at DESC);

-- ================================================================
-- PART 3: NOTES SYSTEM
-- ================================================================

CREATE TABLE IF NOT EXISTS staff_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_notes_user ON staff_notes(user_id, created_at DESC);

-- ================================================================
-- PART 4: ACTIVITY LOG SYSTEM
-- ================================================================

CREATE TABLE IF NOT EXISTS user_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'login', 'logout', 'task_completed', 'task_created', 
        'task_assigned', 'message_sent', 'chess_game_played',
        'attendance_marked', 'mood_submitted', 'note_created',
        'break_started', 'break_ended', 'status_changed',
        'coin_earned', 'coin_spent', 'quest_completed'
    )),
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user ON user_activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_type ON user_activity_log(activity_type, created_at DESC);

-- ================================================================
-- PART 5: VAW COIN ECONOMY SYSTEM
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- 5.1: Company Coin Bank
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS company_coin_bank (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    financial_year TEXT NOT NULL UNIQUE,
    total_budget INTEGER NOT NULL DEFAULT 10000,
    allocated_to_heads INTEGER DEFAULT 0,
    allocated_to_quests INTEGER DEFAULT 0,
    granted_by_hr INTEGER DEFAULT 0,
    available_balance INTEGER GENERATED ALWAYS AS (
        total_budget - allocated_to_heads - allocated_to_quests - granted_by_hr
    ) STORED,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS finance_approvals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_type TEXT CHECK (request_type IN ('hr_grant', 'head_budget_increase', 'quest_allocation')),
    requested_by UUID NOT NULL REFERENCES auth.users(id),
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────────
-- 5.2: Team Head Coin Budgets
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS head_coin_budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    head_user_id UUID NOT NULL REFERENCES auth.users(id),
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year >= 2024),
    base_allocation INTEGER DEFAULT 250,
    additional_approved INTEGER DEFAULT 0,
    total_allocation INTEGER GENERATED ALWAYS AS (base_allocation + additional_approved) STORED,
    allocated_coins INTEGER DEFAULT 0,
    spent_coins INTEGER DEFAULT 0,
    available_coins INTEGER GENERATED ALWAYS AS (base_allocation + additional_approved - allocated_coins) STORED,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_head_month UNIQUE(head_user_id, month, year)
);

CREATE TABLE IF NOT EXISTS head_budget_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    head_user_id UUID NOT NULL REFERENCES auth.users(id),
    budget_id UUID NOT NULL REFERENCES head_coin_budgets(id),
    requested_amount INTEGER NOT NULL CHECK (requested_amount > 0),
    justification TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    approval_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────────
-- 5.3: Project Coin Allocations
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS project_coin_allocations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES staff_tasks(id) ON DELETE CASCADE,
    allocated_by UUID NOT NULL REFERENCES auth.users(id),
    allocated_to UUID NOT NULL REFERENCES auth.users(id),
    budget_id UUID NOT NULL REFERENCES head_coin_budgets(id),
    
    base_coin_amount INTEGER NOT NULL CHECK (base_coin_amount > 0),
    half_time_bonus INTEGER DEFAULT 5,
    bonus_earned INTEGER DEFAULT 0,
    penalty_amount INTEGER DEFAULT 0,
    final_coins_awarded INTEGER DEFAULT 0,
    
    original_deadline TIMESTAMPTZ NOT NULL,
    head_deadline TIMESTAMPTZ NOT NULL,
    employee_deadline TIMESTAMPTZ NOT NULL,
    submission_date TIMESTAMPTZ,
    approval_date TIMESTAMPTZ,
    
    status TEXT DEFAULT 'allocated' CHECK (status IN (
        'allocated', 'in_progress', 'submitted', 'approved',
        'late_submitted', 'late_pending_hr', 'hr_approved', 'rejected', 'cancelled'
    )),
    
    completed_in_half_time BOOLEAN DEFAULT false,
    days_late INTEGER DEFAULT 0,
    
    hr_approval_requested BOOLEAN DEFAULT false,
    hr_approved_by UUID REFERENCES auth.users(id),
    hr_approval_date TIMESTAMPTZ,
    hr_approval_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_task_allocation UNIQUE(task_id)
);

CREATE INDEX IF NOT EXISTS idx_project_allocations_employee ON project_coin_allocations(allocated_to, status);
CREATE INDEX IF NOT EXISTS idx_project_allocations_head ON project_coin_allocations(allocated_by, status);

-- ────────────────────────────────────────────────────────────────
-- 5.4: Quest System
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS quests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    category TEXT CHECK (category IN ('speed', 'consistency', 'creativity', 'quality', 'collaboration', 'other')),
    scope TEXT DEFAULT 'universal' CHECK (scope IN ('universal', 'department')),
    department_id UUID REFERENCES departments(id),
    coin_reward INTEGER NOT NULL CHECK (coin_reward > 0),
    max_winners INTEGER,
    current_winners INTEGER DEFAULT 0,
    criteria JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    coins_allocated BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_quest_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    quest_id UUID NOT NULL REFERENCES quests(id),
    progress JSONB DEFAULT '{}',
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    coins_awarded BOOLEAN DEFAULT false,
    awarded_by UUID REFERENCES auth.users(id),
    awarded_at TIMESTAMPTZ,
    CONSTRAINT unique_user_quest UNIQUE(user_id, quest_id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quest_progress_user ON user_quest_progress(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_quest_active ON quests(is_active, period_end);

-- ────────────────────────────────────────────────────────────────
-- 5.5: Reward Catalog
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reward_catalog (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN (
        'salary_bonus', 'loan_fast_approval', 'merchandise',
        'time_off', 'training', 'certificate', 'other'
    )),
    coin_cost INTEGER NOT NULL CHECK (coin_cost > 0),
    is_available BOOLEAN DEFAULT true,
    stock_quantity INTEGER,
    requires_hr_approval BOOLEAN DEFAULT true,
    requires_finance_approval BOOLEAN DEFAULT false,
    image_url TEXT,
    terms_conditions TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reward_redemptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    reward_id UUID NOT NULL REFERENCES reward_catalog(id),
    coins_spent INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'approved', 'fulfilled', 'rejected', 'cancelled'
    )),
    requested_at TIMESTAMPTZ DEFAULT now(),
    hr_reviewed_by UUID REFERENCES auth.users(id),
    hr_reviewed_at TIMESTAMPTZ,
    hr_review_notes TEXT,
    finance_reviewed_by UUID REFERENCES auth.users(id),
    finance_reviewed_at TIMESTAMPTZ,
    finance_review_notes TEXT,
    fulfilled_at TIMESTAMPTZ,
    fulfillment_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_redemptions_user ON reward_redemptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON reward_redemptions(status);

-- ────────────────────────────────────────────────────────────────
-- 5.6: Coin Transaction Log
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_coin_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    coins INTEGER NOT NULL,
    reason TEXT NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN (
        'task_earned', 'half_time_bonus', 'quest_reward', 'hr_grant',
        'late_penalty', 'reward_spent', 'refund', 'adjustment', 'chess_reward'
    )),
    category TEXT CHECK (category IN (
        'task_completion', 'bonus', 'quest_achievement',
        'reward_redemption', 'penalty', 'hr_grant', 'chess', 'other'
    )),
    related_task_id UUID REFERENCES staff_tasks(id),
    related_allocation_id UUID REFERENCES project_coin_allocations(id),
    related_quest_id UUID REFERENCES quests(id),
    related_redemption_id UUID REFERENCES reward_redemptions(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coin_transactions_user ON user_coin_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_type ON user_coin_transactions(transaction_type);

-- ================================================================
-- PART 6: HELPER FUNCTIONS
-- ================================================================

-- Get current financial year
CREATE OR REPLACE FUNCTION get_current_financial_year()
RETURNS TEXT AS $$
DECLARE
    current_month INTEGER;
    current_year INTEGER;
    fy_start_year INTEGER;
    fy_end_year INTEGER;
BEGIN
    current_month := EXTRACT(MONTH FROM CURRENT_DATE);
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    IF current_month >= 4 THEN
        fy_start_year := current_year;
        fy_end_year := current_year + 1;
    ELSE
        fy_start_year := current_year - 1;
        fy_end_year := current_year;
    END IF;
    
    RETURN 'FY' || fy_start_year || '-' || SUBSTRING(fy_end_year::TEXT, 3, 2);
END;
$$ LANGUAGE plpgsql;

-- Calculate project deadlines
CREATE OR REPLACE FUNCTION calculate_project_deadlines(
    p_original_deadline TIMESTAMPTZ
) RETURNS TABLE (
    head_deadline TIMESTAMPTZ,
    employee_deadline TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p_original_deadline - INTERVAL '1 day' as head_deadline,
        p_original_deadline - INTERVAL '2 day' as employee_deadline;
END;
$$ LANGUAGE plpgsql;

-- Calculate late penalty
CREATE OR REPLACE FUNCTION calculate_late_penalty(
    p_base_coins INTEGER,
    p_days_late INTEGER
) RETURNS INTEGER AS $$
DECLARE
    v_penalty INTEGER;
    v_max_penalty INTEGER;
BEGIN
    v_penalty := p_days_late;
    v_max_penalty := FLOOR(p_base_coins * 0.5);
    RETURN LEAST(v_penalty, v_max_penalty);
END;
$$ LANGUAGE plpgsql;

-- Get user's coin balance
CREATE OR REPLACE FUNCTION get_user_coin_balance(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_balance INTEGER;
BEGIN
    SELECT COALESCE(SUM(coins), 0)
    INTO v_balance
    FROM user_coin_transactions
    WHERE user_id = p_user_id;
    
    RETURN v_balance;
END;
$$ LANGUAGE plpgsql;

-- Check Head budget availability
CREATE OR REPLACE FUNCTION check_head_budget_available(
    p_head_id UUID,
    p_coins_needed INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_available INTEGER;
    v_current_month INTEGER;
    v_current_year INTEGER;
BEGIN
    v_current_month := EXTRACT(MONTH FROM CURRENT_DATE);
    v_current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    SELECT available_coins INTO v_available
    FROM head_coin_budgets
    WHERE head_user_id = p_head_id
        AND month = v_current_month
        AND year = v_current_year;
    
    IF NOT FOUND THEN
        INSERT INTO head_coin_budgets (head_user_id, month, year)
        VALUES (p_head_id, v_current_month, v_current_year);
        v_available := 250;
    END IF;
    
    RETURN v_available >= p_coins_needed;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- PART 7: CORE BUSINESS FUNCTIONS
-- ================================================================

-- Allocate coins to project
CREATE OR REPLACE FUNCTION allocate_coins_to_project(
    p_task_id UUID,
    p_head_id UUID,
    p_employee_id UUID,
    p_coin_amount INTEGER,
    p_original_deadline TIMESTAMPTZ,
    p_half_time_bonus INTEGER DEFAULT 5
) RETURNS UUID AS $$
DECLARE
    v_allocation_id UUID;
    v_deadlines RECORD;
    v_budget_id UUID;
    v_current_month INTEGER;
    v_current_year INTEGER;
BEGIN
    IF NOT check_head_budget_available(p_head_id, p_coin_amount) THEN
        RAISE EXCEPTION 'Insufficient coin budget. Request additional allocation from HR.';
    END IF;
    
    v_current_month := EXTRACT(MONTH FROM CURRENT_DATE);
    v_current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    SELECT id INTO v_budget_id
    FROM head_coin_budgets
    WHERE head_user_id = p_head_id
        AND month = v_current_month
        AND year = v_current_year;
    
    SELECT * INTO v_deadlines FROM calculate_project_deadlines(p_original_deadline);
    
    INSERT INTO project_coin_allocations (
        task_id, allocated_by, allocated_to, budget_id,
        base_coin_amount, half_time_bonus,
        original_deadline, head_deadline, employee_deadline,
        status
    ) VALUES (
        p_task_id, p_head_id, p_employee_id, v_budget_id,
        p_coin_amount, p_half_time_bonus,
        p_original_deadline, v_deadlines.head_deadline, v_deadlines.employee_deadline,
        'allocated'
    ) RETURNING id INTO v_allocation_id;
    
    UPDATE head_coin_budgets
    SET allocated_coins = allocated_coins + p_coin_amount, updated_at = now()
    WHERE id = v_budget_id;
    
    UPDATE company_coin_bank
    SET allocated_to_heads = allocated_to_heads + p_coin_amount, updated_at = now()
    WHERE financial_year = get_current_financial_year();
    
    RETURN v_allocation_id;
END;
$$ LANGUAGE plpgsql;

-- Process project submission
CREATE OR REPLACE FUNCTION process_project_submission(
    p_allocation_id UUID,
    p_submission_date TIMESTAMPTZ DEFAULT now()
) RETURNS void AS $$
DECLARE
    v_allocation RECORD;
    v_half_time_threshold TIMESTAMPTZ;
    v_is_half_time BOOLEAN := false;
    v_is_late BOOLEAN := false;
    v_days_late INTEGER := 0;
    v_coins_to_award INTEGER;
BEGIN
    SELECT * INTO v_allocation FROM project_coin_allocations WHERE id = p_allocation_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Allocation not found';
    END IF;
    
    v_is_late := p_submission_date > v_allocation.employee_deadline;
    
    IF v_is_late THEN
        v_days_late := EXTRACT(DAY FROM (p_submission_date - v_allocation.employee_deadline));
        
        UPDATE project_coin_allocations
        SET submission_date = p_submission_date, days_late = v_days_late,
            status = 'late_submitted', hr_approval_requested = true, updated_at = now()
        WHERE id = p_allocation_id;
        RETURN;
    END IF;
    
    v_half_time_threshold := v_allocation.created_at + 
        (v_allocation.employee_deadline - v_allocation.created_at) * 0.5;
    
    v_is_half_time := p_submission_date <= v_half_time_threshold;
    v_coins_to_award := v_allocation.base_coin_amount;
    
    IF v_is_half_time THEN
        v_coins_to_award := v_coins_to_award + v_allocation.half_time_bonus;
    END IF;
    
    UPDATE project_coin_allocations
    SET submission_date = p_submission_date, approval_date = now(),
        completed_in_half_time = v_is_half_time,
        bonus_earned = CASE WHEN v_is_half_time THEN v_allocation.half_time_bonus ELSE 0 END,
        final_coins_awarded = v_coins_to_award, status = 'approved', updated_at = now()
    WHERE id = p_allocation_id;
    
    INSERT INTO user_coin_transactions (
        user_id, coins, reason, transaction_type, category,
        related_task_id, related_allocation_id, metadata
    ) VALUES (
        v_allocation.allocated_to, v_allocation.base_coin_amount,
        'Project completion', 'task_earned', 'task_completion',
        v_allocation.task_id, p_allocation_id,
        jsonb_build_object('allocation_id', p_allocation_id, 'on_time', true)
    );
    
    IF v_is_half_time THEN
        INSERT INTO user_coin_transactions (
            user_id, coins, reason, transaction_type, category,
            related_task_id, related_allocation_id, metadata
        ) VALUES (
            v_allocation.allocated_to, v_allocation.half_time_bonus,
            'Half-time completion bonus', 'half_time_bonus', 'bonus',
            v_allocation.task_id, p_allocation_id,
            jsonb_build_object('allocation_id', p_allocation_id, 'bonus_type', 'half_time')
        );
    END IF;
    
    UPDATE head_coin_budgets
    SET spent_coins = spent_coins + v_coins_to_award, updated_at = now()
    WHERE id = v_allocation.budget_id;
END;
$$ LANGUAGE plpgsql;

-- HR approve late submission
CREATE OR REPLACE FUNCTION hr_approve_late_submission(
    p_allocation_id UUID,
    p_hr_user_id UUID,
    p_approval_notes TEXT DEFAULT NULL,
    p_waive_penalty BOOLEAN DEFAULT false
) RETURNS void AS $$
DECLARE
    v_allocation RECORD;
    v_penalty INTEGER := 0;
    v_final_coins INTEGER;
BEGIN
    SELECT * INTO v_allocation FROM project_coin_allocations WHERE id = p_allocation_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Allocation not found';
    END IF;
    
    IF NOT p_waive_penalty THEN
        v_penalty := calculate_late_penalty(v_allocation.base_coin_amount, v_allocation.days_late);
    END IF;
    
    v_final_coins := GREATEST(v_allocation.base_coin_amount - v_penalty, 0);
    
    UPDATE project_coin_allocations
    SET status = 'hr_approved', hr_approved_by = p_hr_user_id,
        hr_approval_date = now(), hr_approval_notes = p_approval_notes,
        penalty_amount = v_penalty, final_coins_awarded = v_final_coins,
        approval_date = now(), updated_at = now()
    WHERE id = p_allocation_id;
    
    IF v_final_coins > 0 THEN
        INSERT INTO user_coin_transactions (
            user_id, coins, reason, transaction_type, category,
            related_task_id, related_allocation_id, metadata
        ) VALUES (
            v_allocation.allocated_to, v_final_coins,
            'Late project completion (HR approved)', 'task_earned', 'task_completion',
            v_allocation.task_id, p_allocation_id,
            jsonb_build_object('allocation_id', p_allocation_id, 'late_submission', true, 'days_late', v_allocation.days_late, 'penalty_waived', p_waive_penalty)
        );
    END IF;
    
    IF v_penalty > 0 THEN
        INSERT INTO user_coin_transactions (
            user_id, coins, reason, transaction_type, category,
            related_task_id, related_allocation_id, metadata
        ) VALUES (
            v_allocation.allocated_to, -v_penalty,
            format('Late submission penalty (%s days late)', v_allocation.days_late),
            'late_penalty', 'penalty', v_allocation.task_id, p_allocation_id,
            jsonb_build_object('allocation_id', p_allocation_id, 'days_late', v_allocation.days_late, 'penalty_per_day', 1)
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Award quest completion
CREATE OR REPLACE FUNCTION award_quest_completion(
    p_quest_id UUID,
    p_user_id UUID,
    p_awarded_by UUID
) RETURNS void AS $$
DECLARE
    v_quest RECORD;
    v_progress RECORD;
BEGIN
    SELECT * INTO v_quest FROM quests WHERE id = p_quest_id;
    SELECT * INTO v_progress FROM user_quest_progress 
    WHERE quest_id = p_quest_id AND user_id = p_user_id;
    
    IF NOT FOUND OR NOT v_progress.completed THEN
        RAISE EXCEPTION 'Quest not completed by user';
    END IF;
    
    IF v_progress.coins_awarded THEN
        RAISE EXCEPTION 'Coins already awarded for this quest';
    END IF;
    
    IF v_quest.max_winners IS NOT NULL AND v_quest.current_winners >= v_quest.max_winners THEN
        RAISE EXCEPTION 'Quest has reached maximum winners';
    END IF;
    
    INSERT INTO user_coin_transactions (
        user_id, coins, reason, transaction_type, category, related_quest_id, metadata
    ) VALUES (
        p_user_id, v_quest.coin_reward,
        format('Quest completed: %s', v_quest.name),
        'quest_reward', 'quest_achievement', p_quest_id,
        jsonb_build_object('quest_name', v_quest.name, 'period', v_quest.period_start)
    );
    
    UPDATE user_quest_progress
    SET coins_awarded = true, awarded_by = p_awarded_by, awarded_at = now()
    WHERE id = v_progress.id;
    
    UPDATE quests
    SET current_winners = current_winners + 1, updated_at = now()
    WHERE id = p_quest_id;
    
    UPDATE company_coin_bank
    SET allocated_to_quests = allocated_to_quests + v_quest.coin_reward, updated_at = now()
    WHERE financial_year = get_current_financial_year();
END;
$$ LANGUAGE plpgsql;

-- HR grant coins
CREATE OR REPLACE FUNCTION hr_grant_coins(
    p_user_id UUID,
    p_amount INTEGER,
    p_reason TEXT,
    p_hr_user_id UUID,
    p_finance_approval_id UUID DEFAULT NULL
) RETURNS void AS $$
BEGIN
    IF p_amount > 50 AND p_finance_approval_id IS NULL THEN
        RAISE EXCEPTION 'Finance approval required for grants over 50 coins';
    END IF;
    
    IF p_finance_approval_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM finance_approvals 
            WHERE id = p_finance_approval_id AND status = 'approved' AND amount = p_amount
        ) THEN
            RAISE EXCEPTION 'Valid finance approval not found';
        END IF;
    END IF;
    
    INSERT INTO user_coin_transactions (
        user_id, coins, reason, transaction_type, category, metadata
    ) VALUES (
        p_user_id, p_amount, p_reason, 'hr_grant', 'hr_grant',
        jsonb_build_object('granted_by', p_hr_user_id, 'finance_approval_id', p_finance_approval_id)
    );
    
    UPDATE company_coin_bank
    SET granted_by_hr = granted_by_hr + p_amount, updated_at = now()
    WHERE financial_year = get_current_financial_year();
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- PART 8: CHESS ELO SYSTEM
-- ================================================================

CREATE OR REPLACE FUNCTION update_chess_elo(
    p_winner_id UUID,
    p_loser_id UUID,
    p_game_id UUID,
    p_is_draw BOOLEAN DEFAULT false
) RETURNS void AS $$
DECLARE
    v_winner_elo INTEGER;
    v_loser_elo INTEGER;
    v_winner_elo_change INTEGER;
    v_loser_elo_change INTEGER;
    v_k_factor INTEGER := 32;
    v_expected_winner NUMERIC;
    v_expected_loser NUMERIC;
    v_actual_winner NUMERIC;
    v_actual_loser NUMERIC;
BEGIN
    INSERT INTO chess_stats (user_id, elo_rating)
    VALUES (p_winner_id, 1200), (p_loser_id, 1200)
    ON CONFLICT (user_id) DO NOTHING;
    
    SELECT elo_rating INTO v_winner_elo FROM chess_stats WHERE user_id = p_winner_id;
    SELECT elo_rating INTO v_loser_elo FROM chess_stats WHERE user_id = p_loser_id;
    
    v_expected_winner := 1.0 / (1.0 + POWER(10, (v_loser_elo - v_winner_elo) / 400.0));
    v_expected_loser := 1.0 / (1.0 + POWER(10, (v_winner_elo - v_loser_elo) / 400.0));
    
    IF p_is_draw THEN
        v_actual_winner := 0.5;
        v_actual_loser := 0.5;
    ELSE
        v_actual_winner := 1.0;
        v_actual_loser := 0.0;
    END IF;
    
    v_winner_elo_change := ROUND(v_k_factor * (v_actual_winner - v_expected_winner));
    v_loser_elo_change := ROUND(v_k_factor * (v_actual_loser - v_expected_loser));
    
    UPDATE chess_stats 
    SET elo_rating = elo_rating + v_winner_elo_change,
        games_played = games_played + 1,
        games_won = CASE WHEN p_is_draw THEN games_won ELSE games_won + 1 END,
        games_drawn = CASE WHEN p_is_draw THEN games_drawn + 1 ELSE games_drawn END,
        current_win_streak = CASE WHEN p_is_draw THEN 0 ELSE current_win_streak + 1 END,
        longest_win_streak = CASE WHEN NOT p_is_draw AND (current_win_streak + 1) > longest_win_streak 
            THEN current_win_streak + 1 ELSE longest_win_streak END,
        updated_at = now()
    WHERE user_id = p_winner_id;
    
    UPDATE chess_stats 
    SET elo_rating = elo_rating + v_loser_elo_change,
        games_played = games_played + 1,
        games_lost = CASE WHEN p_is_draw THEN games_lost ELSE games_lost + 1 END,
        games_drawn = CASE WHEN p_is_draw THEN games_drawn + 1 ELSE games_drawn END,
        current_win_streak = 0,
        updated_at = now()
    WHERE user_id = p_loser_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_chess_game_completion() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.ended_at := now();
        
        IF NEW.winner_id IS NOT NULL THEN
            DECLARE
                v_loser_id UUID;
            BEGIN
                IF NEW.winner_id = NEW.player1_id THEN
                    v_loser_id := NEW.player2_id;
                ELSE
                    v_loser_id := NEW.player1_id;
                END IF;
                PERFORM update_chess_elo(NEW.winner_id, v_loser_id, NEW.id, false);
            END;
        ELSE
            PERFORM update_chess_elo(NEW.player1_id, NEW.player2_id, NEW.id, true);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS chess_game_completion_trigger ON chess_games;
CREATE TRIGGER chess_game_completion_trigger
    BEFORE UPDATE ON chess_games
    FOR EACH ROW
    EXECUTE FUNCTION handle_chess_game_completion();

-- ================================================================
-- PART 9: ACTIVITY LOG TRIGGERS
-- ================================================================

-- Chat activity (NO POINTS)
CREATE OR REPLACE FUNCTION log_chat_activity_no_points()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_activity_log (user_id, activity_type, description, points_earned, metadata)
    VALUES (
        NEW.sender_id, 'message_sent', 'Sent a message', 0,
        jsonb_build_object('message_id', NEW.id, 'channel_id', NEW.channel_id)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS chat_activity_trigger ON chat_messages;
CREATE TRIGGER chat_activity_no_points_trigger
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION log_chat_activity_no_points();

-- Note activity
CREATE OR REPLACE FUNCTION log_note_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_activity_log (user_id, activity_type, description, metadata)
    VALUES (
        NEW.user_id, 'note_created', 'Created a new note',
        jsonb_build_object('note_id', NEW.id)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS note_activity_trigger ON staff_notes;
CREATE TRIGGER note_activity_trigger
    AFTER INSERT ON staff_notes
    FOR EACH ROW
    EXECUTE FUNCTION log_note_activity();

-- ================================================================
-- PART 10: ROW LEVEL SECURITY (RLS)
-- ================================================================

ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chess_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE chess_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chess_game_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_coin_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE head_coin_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE head_budget_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_coin_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quest_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_coin_transactions ENABLE ROW LEVEL SECURITY;

-- Basic policies (can be refined)
DROP POLICY IF EXISTS "Users can view all channels" ON chat_channels;
CREATE POLICY "Users can view all channels" ON chat_channels FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can view messages in their channels" ON chat_messages;
CREATE POLICY "Users can view messages in their channels" ON chat_messages FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;
CREATE POLICY "Users can send messages" ON chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can view their games" ON chess_games;
CREATE POLICY "Users can view their games" ON chess_games FOR SELECT TO authenticated 
    USING (auth.uid() = player1_id OR auth.uid() = player2_id);

DROP POLICY IF EXISTS "Users can view all chess stats" ON chess_stats;
CREATE POLICY "Users can view all chess stats" ON chess_stats FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can manage their notes" ON staff_notes;
CREATE POLICY "Users can manage their notes" ON staff_notes FOR ALL TO authenticated 
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their activity" ON user_activity_log;
CREATE POLICY "Users can view their activity" ON user_activity_log FOR SELECT TO authenticated 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their coin balance" ON user_coin_transactions;
CREATE POLICY "Users can view their coin balance" ON user_coin_transactions FOR SELECT TO authenticated 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their allocations" ON project_coin_allocations;
CREATE POLICY "Users can view their allocations" ON project_coin_allocations FOR SELECT TO authenticated 
    USING (auth.uid() = allocated_to OR auth.uid() = allocated_by);

DROP POLICY IF EXISTS "Users can view active quests" ON quests;
CREATE POLICY "Users can view active quests" ON quests FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Users can view reward catalog" ON reward_catalog;
CREATE POLICY "Users can view reward catalog" ON reward_catalog FOR SELECT TO authenticated USING (is_available = true);

-- ================================================================
-- PART 11: INITIAL DATA SETUP
-- ================================================================

-- Create general chat channel
INSERT INTO chat_channels (name, description, is_general)
VALUES ('general', 'General team discussion', true)
ON CONFLICT DO NOTHING;

-- Create current FY coin bank
INSERT INTO company_coin_bank (financial_year, total_budget)
VALUES (get_current_financial_year(), 10000)
ON CONFLICT (financial_year) DO NOTHING;

-- ================================================================
-- PART 12: ANALYTICS VIEWS
-- ================================================================

CREATE OR REPLACE VIEW chess_leaderboard AS
SELECT 
    cs.user_id,
    sp.full_name,
    cs.elo_rating,
    cs.games_played,
    cs.games_won,
    cs.games_lost,
    cs.games_drawn,
    CASE WHEN cs.games_played > 0 
        THEN ROUND((cs.games_won::NUMERIC / cs.games_played::NUMERIC) * 100, 2)
        ELSE 0 END as win_percentage,
    cs.current_win_streak,
    cs.longest_win_streak
FROM chess_stats cs
LEFT JOIN staff_profiles sp ON cs.user_id = sp.user_id
ORDER BY cs.elo_rating DESC;

CREATE OR REPLACE VIEW top_coin_earners AS
SELECT 
    sp.user_id,
    sp.full_name,
    SUM(uct.coins) as total_coins,
    COUNT(*) FILTER (WHERE uct.coins > 0) as total_transactions,
    MAX(uct.created_at) as last_activity
FROM user_coin_transactions uct
JOIN staff_profiles sp ON uct.user_id = sp.user_id
GROUP BY sp.user_id, sp.full_name
ORDER BY total_coins DESC;

-- ================================================================
-- COMPLETION MESSAGE
-- ================================================================

SELECT 
    'VAW Technologies - Complete Schema Setup Successful!' as status,
    'Created: Chat, Chess, Notes, Activity Log, VAW Coin Economy' as systems,
    'Total Tables: 20 | Total Functions: 12 | Total Views: 2' as counts,
    'Next: Update frontend to integrate coin allocation' as next_step;
