-- Migration to add sync and live preview options to client projects
-- Date: 2026-04-12

-- Add columns to client_projects
ALTER TABLE public.client_projects
ADD COLUMN IF NOT EXISTS sync_to_portal BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS live_preview_url TEXT;

-- Update RLS if necessary (it's disabled, but good to have prepared)
-- Actually, RLS is disabled on client_projects, but it's used in views.

-- The client_task_timeline view might need update?
-- No, it doesn't use these columns yet.
