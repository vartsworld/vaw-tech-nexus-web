-- Create storage bucket for project assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-assets', 'project-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for project-assets bucket
CREATE POLICY "Public Access to project assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-assets');

CREATE POLICY "Admin can upload project assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-assets');

CREATE POLICY "Admin can update project assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'project-assets');

CREATE POLICY "Admin can delete project assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'project-assets');