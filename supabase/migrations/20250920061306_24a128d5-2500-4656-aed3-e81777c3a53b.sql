-- Add new columns to staff_profiles table
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS cv_url text;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS about_me text;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS profile_photo_url text;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS father_name text;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS mother_name text;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS siblings text;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS relationship_status text;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS marriage_preference text;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS work_confidence_level text;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS reference_person_name text;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS reference_person_number text;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS application_status text DEFAULT 'pending';
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS applied_via_link boolean DEFAULT false;

-- Create storage bucket for CVs and profile photos if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('staff-documents', 'staff-documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('staff-photos', 'staff-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for staff documents
CREATE POLICY "Staff can upload their own documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'staff-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "HR can view all staff documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'staff-documents' AND EXISTS (
  SELECT 1 FROM staff_profiles 
  WHERE user_id::text = (current_setting('request.jwt.claims', true)::json ->> 'sub') 
  AND role = 'hr'
));

CREATE POLICY "Staff can view their own documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'staff-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for staff photos
CREATE POLICY "Anyone can view staff photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'staff-photos');

CREATE POLICY "Staff can upload their own photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'staff-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "HR can upload any staff photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'staff-photos' AND EXISTS (
  SELECT 1 FROM staff_profiles 
  WHERE user_id::text = (current_setting('request.jwt.claims', true)::json ->> 'sub') 
  AND role = 'hr'
));

-- Create team applications table for public applications
CREATE TABLE IF NOT EXISTS public.team_applications_staff (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  username text,
  gender text,
  date_of_birth date,
  cv_url text,
  about_me text,
  profile_photo_url text,
  father_name text,
  mother_name text,
  siblings text,
  relationship_status text,
  marriage_preference text,
  work_confidence_level text,
  reference_person_name text,
  reference_person_number text,
  preferred_department_id uuid,
  preferred_role user_role DEFAULT 'staff',
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  reviewed_by uuid,
  reviewed_at timestamp with time zone
);

-- Enable RLS on team_applications_staff
ALTER TABLE public.team_applications_staff ENABLE ROW LEVEL SECURITY;

-- Create policies for team_applications_staff
CREATE POLICY "Anyone can submit team applications" 
ON public.team_applications_staff 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "HR can view all team applications" 
ON public.team_applications_staff 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM staff_profiles 
  WHERE user_id::text = (current_setting('request.jwt.claims', true)::json ->> 'sub') 
  AND role = 'hr'
));

CREATE POLICY "HR can update team applications" 
ON public.team_applications_staff 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM staff_profiles 
  WHERE user_id::text = (current_setting('request.jwt.claims', true)::json ->> 'sub') 
  AND role = 'hr'
));

-- Create trigger for updated_at
CREATE TRIGGER update_team_applications_staff_updated_at
BEFORE UPDATE ON public.team_applications_staff
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();