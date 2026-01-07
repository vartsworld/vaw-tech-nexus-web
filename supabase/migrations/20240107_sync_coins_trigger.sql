-- SYNC COIN TRANSACTIONS TO PROFILE POINTS
-- This ensures that staff_profiles.total_points is always updated when a transaction occurs in user_coin_transactions.

CREATE OR REPLACE FUNCTION sync_user_total_points()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE staff_profiles 
        SET total_points = COALESCE(total_points, 0) + NEW.coins
        WHERE user_id = NEW.user_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE staff_profiles 
        SET total_points = COALESCE(total_points, 0) - OLD.coins
        WHERE user_id = OLD.user_id;
    ELSIF (TG_OP = 'UPDATE') THEN
        UPDATE staff_profiles 
        SET total_points = COALESCE(total_points, 0) - OLD.coins + NEW.coins
        WHERE user_id = NEW.user_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_user_total_points_trigger ON user_coin_transactions;
CREATE TRIGGER sync_user_total_points_trigger
    AFTER INSERT OR UPDATE OR DELETE ON user_coin_transactions
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_total_points();

-- Recalculate all points once to ensure consistency
UPDATE staff_profiles sp
SET total_points = (
    SELECT COALESCE(SUM(coins), 0)
    FROM user_coin_transactions
    WHERE user_id = sp.user_id
);
