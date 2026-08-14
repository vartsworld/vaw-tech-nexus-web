-- Function to allow updating staff emoji password and syncing user_id safely (bypassing RLS)
CREATE OR REPLACE FUNCTION set_staff_emoji_password(
  p_username text,
  p_user_id uuid,
  p_emoji_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE staff_profiles
  SET 
    user_id = p_user_id,
    emoji_password = p_emoji_password,
    is_emoji_password = true,
    passcode_used = true
  WHERE LOWER(username) = LOWER(p_username) OR user_id = p_user_id;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION set_staff_emoji_password(text, uuid, text) TO anon, authenticated;
