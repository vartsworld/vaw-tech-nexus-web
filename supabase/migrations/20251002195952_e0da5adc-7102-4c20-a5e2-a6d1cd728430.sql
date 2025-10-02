-- Update existing staff profiles to approved status and generate passcodes
-- This is for staff that were created directly (like Kaj and Sumesh)
UPDATE staff_profiles 
SET 
  application_status = 'approved',
  first_time_passcode = substring(md5(random()::text || id::text), 1, 8),
  passcode_used = false
WHERE application_status = 'pending' 
  AND first_time_passcode IS NULL
  AND username IS NOT NULL
  AND email IS NOT NULL;