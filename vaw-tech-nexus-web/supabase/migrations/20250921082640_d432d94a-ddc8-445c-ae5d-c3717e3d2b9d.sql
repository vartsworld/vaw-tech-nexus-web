-- Add emoji login fields to staff_profiles
ALTER TABLE public.staff_profiles 
ADD COLUMN first_time_passcode TEXT,
ADD COLUMN emoji_password TEXT,
ADD COLUMN is_emoji_password BOOLEAN DEFAULT false,
ADD COLUMN passcode_used BOOLEAN DEFAULT false,
ADD COLUMN login_attempts INTEGER DEFAULT 0,
ADD COLUMN last_login_attempt TIMESTAMP WITH TIME ZONE;

-- Create function to generate random passcode
CREATE OR REPLACE FUNCTION generate_first_time_passcode()
RETURNS TEXT AS $$
BEGIN
  RETURN substring(md5(random()::text), 1, 8);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to generate passcode when staff is approved
CREATE OR REPLACE FUNCTION handle_staff_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- If application status changed to approved and no passcode exists
  IF OLD.application_status != 'approved' AND NEW.application_status = 'approved' AND NEW.first_time_passcode IS NULL THEN
    NEW.first_time_passcode = generate_first_time_passcode();
    NEW.passcode_used = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for staff approval
CREATE TRIGGER staff_approval_trigger
  BEFORE UPDATE ON public.staff_profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_staff_approval();