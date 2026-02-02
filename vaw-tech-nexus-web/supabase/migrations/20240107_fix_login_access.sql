-- Function to bypass RLS for login purposes (fetching profile by username)
CREATE OR REPLACE FUNCTION get_staff_login_details(p_username text)
RETURNS SETOF staff_profiles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM staff_profiles WHERE username = p_username;
$$;

-- Grant access to anon and authenticated users
GRANT EXECUTE ON FUNCTION get_staff_login_details(text) TO anon, authenticated;

-- Ensure authenticated users can read their own profile
-- Attempt to drop policy if it exists to ensure a clean state, or create if missing
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own profile" ON staff_profiles;
    CREATE POLICY "Users can view own profile" ON staff_profiles
        FOR SELECT
        USING (auth.uid() = user_id);
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- Allow authenticated users to update their own profile (necessary for emoji password setup)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can update own profile" ON staff_profiles;
    CREATE POLICY "Users can update own profile" ON staff_profiles
        FOR UPDATE
        USING (auth.uid() = user_id);
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;
