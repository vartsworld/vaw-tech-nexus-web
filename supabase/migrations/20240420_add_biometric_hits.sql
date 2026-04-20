-- Create helper to fetch biometric IDs for login hinting without exposing full credentials
CREATE OR REPLACE FUNCTION get_staff_biometric_ids(p_user_id uuid)
RETURNS text[]
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(credential_id), ARRAY[]::text[]) 
  FROM staff_biometric_credentials 
  WHERE user_id = p_user_id;
$$;

-- Grant access to anon
GRANT EXECUTE ON FUNCTION get_staff_biometric_ids(uuid) TO anon, authenticated;
