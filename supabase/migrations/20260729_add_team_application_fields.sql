-- Migration to add extra fields to team_applications_staff & staff_profiles
ALTER TABLE public.team_applications_staff ADD COLUMN IF NOT EXISTS physical_address text;
ALTER TABLE public.team_applications_staff ADD COLUMN IF NOT EXISTS govt_id_type text;
ALTER TABLE public.team_applications_staff ADD COLUMN IF NOT EXISTS govt_id_number text;
ALTER TABLE public.team_applications_staff ADD COLUMN IF NOT EXISTS blood_group text;
ALTER TABLE public.team_applications_staff ADD COLUMN IF NOT EXISTS has_health_issues boolean DEFAULT false;
ALTER TABLE public.team_applications_staff ADD COLUMN IF NOT EXISTS health_issues text[];
ALTER TABLE public.team_applications_staff ADD COLUMN IF NOT EXISTS sibling_names text[];
ALTER TABLE public.team_applications_staff ADD COLUMN IF NOT EXISTS kyc_selfie_url text;
ALTER TABLE public.team_applications_staff ADD COLUMN IF NOT EXISTS legal_accepted boolean DEFAULT false;
ALTER TABLE public.team_applications_staff ADD COLUMN IF NOT EXISTS emergency_contact_name text;
ALTER TABLE public.team_applications_staff ADD COLUMN IF NOT EXISTS emergency_contact_phone text;

-- Also add corresponding columns to staff_profiles
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS physical_address text;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS govt_id_type text;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS govt_id_number text;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS blood_group text;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS health_issues text[];
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS kyc_selfie_url text;

-- Make storage buckets public or allow anon inserts for application documents/photos if needed
CREATE POLICY "Anon can upload staff documents for application" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'staff-documents');

CREATE POLICY "Anon can upload staff photos for application" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'staff-photos');
