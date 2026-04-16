
-- Table for storing WebAuthn biometric credentials
CREATE TABLE public.staff_biometric_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  device_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  UNIQUE(credential_id)
);

-- Enable RLS
ALTER TABLE public.staff_biometric_credentials ENABLE ROW LEVEL SECURITY;

-- Staff can read their own credentials
CREATE POLICY "Users can view own biometric credentials"
  ON public.staff_biometric_credentials
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Staff can insert their own credentials
CREATE POLICY "Users can register biometric credentials"
  ON public.staff_biometric_credentials
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Staff can delete their own credentials
CREATE POLICY "Users can remove biometric credentials"
  ON public.staff_biometric_credentials
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RPC to lookup credentials by credential_id (for login - anon access needed)
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
