-- Fix storage bucket RLS issues by enabling RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;