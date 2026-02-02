-- Fix user_role enum to include lead and manager
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'lead';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'manager';

-- Storage policies for staff-documents bucket (CV uploads)
CREATE POLICY "Anyone can upload to staff-documents"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'staff-documents');

CREATE POLICY "Anyone can view staff-documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'staff-documents');

CREATE POLICY "Staff can update their own documents"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'staff-documents');

-- Storage policies for staff-photos bucket (Profile photos)
CREATE POLICY "Anyone can upload to staff-photos"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'staff-photos');

CREATE POLICY "Anyone can view staff-photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'staff-photos');

CREATE POLICY "Staff can update their own photos"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'staff-photos');