
-- Fixes for Biometric Login and Chess Integration

-- Correcting get_biometric_user to return consistent data type and granting access
CREATE OR REPLACE FUNCTION public.get_biometric_user(p_credential_id TEXT)
RETURNS TABLE(user_id UUID, email TEXT, staff_role TEXT, is_department_head BOOLEAN)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sp.user_id, sp.email, sp.role, sp.is_department_head
  FROM staff_biometric_credentials bc
  JOIN staff_profiles sp ON sp.user_id = bc.user_id
  WHERE bc.credential_id = p_credential_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_biometric_user(TEXT) TO anon, authenticated;

-- Ensure get_staff_biometric_ids is accessible
CREATE OR REPLACE FUNCTION public.get_staff_biometric_ids(p_user_id uuid)
RETURNS text[]
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(credential_id), ARRAY[]::text[]) 
  FROM staff_biometric_credentials 
  WHERE user_id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_staff_biometric_ids(uuid) TO anon, authenticated;

-- Add coins field to staff_profiles if not exists (redundancy check)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_profiles' AND column_name = 'coins') THEN
    ALTER TABLE staff_profiles ADD COLUMN coins INTEGER DEFAULT 0;
  END IF;
END $$;
