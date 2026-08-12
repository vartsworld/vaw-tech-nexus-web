-- Migration to add kyc_gps_location and missing personal/emergency fields to tables
ALTER TABLE public.team_applications_staff ADD COLUMN IF NOT EXISTS kyc_gps_location text;

ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS kyc_gps_location text;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS emergency_contact_name text;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS emergency_contact_phone text;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS has_health_issues boolean DEFAULT false;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS sibling_names text[];

ALTER TABLE public.team_applications ADD COLUMN IF NOT EXISTS kyc_gps_location text;

ALTER TABLE public.internship_applications ADD COLUMN IF NOT EXISTS kyc_gps_location text;
