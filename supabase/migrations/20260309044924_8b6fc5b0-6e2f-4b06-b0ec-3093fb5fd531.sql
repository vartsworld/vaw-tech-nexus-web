-- First, remove duplicate rows keeping only the most recent one per user
DELETE FROM workspace_layouts
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id) id
    FROM workspace_layouts
    ORDER BY user_id, updated_at DESC NULLS LAST, id
);

-- Now add the unique constraint on user_id
ALTER TABLE public.workspace_layouts ADD CONSTRAINT workspace_layouts_user_id_key UNIQUE (user_id);