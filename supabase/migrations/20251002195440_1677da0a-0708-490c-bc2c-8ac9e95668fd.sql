-- Generate passcodes for existing approved staff who don't have one
UPDATE staff_profiles 
SET first_time_passcode = substring(md5(random()::text || id::text), 1, 8),
    passcode_used = false
WHERE application_status = 'approved' 
  AND first_time_passcode IS NULL;