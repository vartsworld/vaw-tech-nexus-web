-- Fix critical security issues by enabling RLS on tables without it
ALTER TABLE public.geography_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geometry_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

-- Fix function search paths for security
CREATE OR REPLACE FUNCTION generate_first_time_passcode()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN substring(md5(random()::text), 1, 8);
END;
$$;

CREATE OR REPLACE FUNCTION handle_staff_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If application status changed to approved and no passcode exists
  IF OLD.application_status != 'approved' AND NEW.application_status = 'approved' AND NEW.first_time_passcode IS NULL THEN
    NEW.first_time_passcode = generate_first_time_passcode();
    NEW.passcode_used = false;
  END IF;
  RETURN NEW;
END;
$$;