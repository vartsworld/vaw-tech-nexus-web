-- Reset all existing current coins of all the staffs
UPDATE staff_profiles SET total_points = 0;

-- Clear coin transaction and points log history so that new points calculation starts from scratch
DELETE FROM user_coin_transactions;
DELETE FROM user_points_log;
