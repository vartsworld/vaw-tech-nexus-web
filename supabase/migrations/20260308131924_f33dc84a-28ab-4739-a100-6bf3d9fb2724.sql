
-- Create storage bucket for support ticket attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('support-attachments', 'support-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload support attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'support-attachments');

-- Allow public read access
CREATE POLICY "Public read support attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'support-attachments');
