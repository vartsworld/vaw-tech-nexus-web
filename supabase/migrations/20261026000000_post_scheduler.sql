-- ==============================================================================
-- VAW POST SCHEDULER (/postit): social accounts and scheduled posts, per client
-- ------------------------------------------------------------------------------
-- Creates ONLY `postit_*` objects (plus the `postit-media` storage bucket and its
-- policies). Existing tables are referenced (clients, staff_profiles) but never
-- altered. Safe to run more than once.
--
-- Access model
--   * Any current staff member (staff_profiles row that is not dismissed) can read, create and
--     edit posts and accounts, so teammates can cover for each other.
--   * Deleting a post: its creator, or a manager (hr, manager, lead, admin, super_admin,
--     department_head or is_department_head).  Deleting an account: managers only.
--   * Nothing is exposed to `anon`. The publishing edge function uses the service role.
-- ==============================================================================

-- 1. Helpers ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.postit_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- SECURITY DEFINER so the check works whatever RLS staff_profiles has (no recursion).
CREATE OR REPLACE FUNCTION public.postit_is_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_profiles sp
    WHERE sp.user_id = auth.uid()
      AND COALESCE(sp.application_status, 'approved') NOT IN ('dismissed', 'rejected', 'pending')
  );
$$;

CREATE OR REPLACE FUNCTION public.postit_is_manager()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_profiles sp
    WHERE sp.user_id = auth.uid()
      AND COALESCE(sp.application_status, 'approved') NOT IN ('dismissed', 'rejected', 'pending')
      AND (sp.role::text IN ('hr', 'manager', 'lead', 'admin', 'super_admin', 'department_head')
           OR COALESCE(sp.is_department_head, false))
  );
$$;

REVOKE ALL ON FUNCTION public.postit_is_staff() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.postit_is_manager() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.postit_is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.postit_is_manager() TO authenticated;

-- 2. Accounts: the social profiles we post to, per client ---------------------------
-- client_id NULL = VAW Technologies' own pages.
CREATE TABLE IF NOT EXISTS public.postit_accounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_id           UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  platform            TEXT NOT NULL CHECK (platform IN ('youtube','tiktok','instagram','x_twitter','facebook','linkedin','threads','pinterest')),
  account_name        TEXT NOT NULL CHECK (char_length(account_name) BETWEEN 1 AND 120),
  handle              TEXT CHECK (handle IS NULL OR char_length(handle) <= 120),
  profile_url         TEXT CHECK (profile_url IS NULL OR char_length(profile_url) <= 500),
  -- Id of this profile at the publishing provider (MuAPI). Only needed for auto-publish.
  external_account_id TEXT CHECK (external_account_id IS NULL OR char_length(external_account_id) <= 120),
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','disconnected')),
  created_by          UUID DEFAULT auth.uid()
);
CREATE INDEX IF NOT EXISTS idx_postit_accounts_client ON public.postit_accounts (client_id);

-- 3. Posts: one row per platform; rows created together share group_id --------------
CREATE TABLE IF NOT EXISTS public.postit_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  group_id      UUID NOT NULL DEFAULT gen_random_uuid(),
  client_id     UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  account_id    UUID REFERENCES public.postit_accounts(id) ON DELETE SET NULL,
  platform      TEXT NOT NULL CHECK (platform IN ('youtube','tiktok','instagram','x_twitter','facebook','linkedin','threads','pinterest')),
  title         TEXT NOT NULL DEFAULT '' CHECK (char_length(title) <= 300),
  caption       TEXT NOT NULL DEFAULT '' CHECK (char_length(caption) <= 70000),
  hashtags      TEXT[] NOT NULL DEFAULT '{}',
  media_urls    JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(media_urls) = 'array'),
  link_url      TEXT CHECK (link_url IS NULL OR char_length(link_url) <= 1000),
  scheduled_at  TIMESTAMPTZ,
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','publishing','published','failed')),
  publish_mode  TEXT NOT NULL DEFAULT 'manual' CHECK (publish_mode IN ('manual','auto')),
  published_at  TIMESTAMPTZ,
  published_url TEXT CHECK (published_url IS NULL OR char_length(published_url) <= 1000),
  request_id    TEXT,
  error         TEXT,
  notes         TEXT CHECK (notes IS NULL OR char_length(notes) <= 4000),
  created_by    UUID DEFAULT auth.uid(),
  CONSTRAINT postit_scheduled_needs_date CHECK (status <> 'scheduled' OR scheduled_at IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_postit_posts_schedule ON public.postit_posts (scheduled_at);
CREATE INDEX IF NOT EXISTS idx_postit_posts_client   ON public.postit_posts (client_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_postit_posts_due      ON public.postit_posts (scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_postit_posts_group    ON public.postit_posts (group_id);

DROP TRIGGER IF EXISTS trg_postit_accounts_updated_at ON public.postit_accounts;
CREATE TRIGGER trg_postit_accounts_updated_at BEFORE UPDATE ON public.postit_accounts
  FOR EACH ROW EXECUTE FUNCTION public.postit_set_updated_at();
DROP TRIGGER IF EXISTS trg_postit_posts_updated_at ON public.postit_posts;
CREATE TRIGGER trg_postit_posts_updated_at BEFORE UPDATE ON public.postit_posts
  FOR EACH ROW EXECUTE FUNCTION public.postit_set_updated_at();

COMMENT ON TABLE public.postit_accounts IS 'Post Scheduler (/postit): social profiles we post to, per client (client_id NULL = VAW itself).';
COMMENT ON TABLE public.postit_posts    IS 'Post Scheduler (/postit): scheduled social posts, one row per platform; group_id ties a multi-platform post together.';

-- 4. Row level security ----------------------------------------------------------------
ALTER TABLE public.postit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postit_posts    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS postit_accounts_select ON public.postit_accounts;
DROP POLICY IF EXISTS postit_accounts_insert ON public.postit_accounts;
DROP POLICY IF EXISTS postit_accounts_update ON public.postit_accounts;
DROP POLICY IF EXISTS postit_accounts_delete ON public.postit_accounts;
CREATE POLICY postit_accounts_select ON public.postit_accounts FOR SELECT TO authenticated USING (public.postit_is_staff());
CREATE POLICY postit_accounts_insert ON public.postit_accounts FOR INSERT TO authenticated WITH CHECK (public.postit_is_staff());
CREATE POLICY postit_accounts_update ON public.postit_accounts FOR UPDATE TO authenticated USING (public.postit_is_staff()) WITH CHECK (public.postit_is_staff());
CREATE POLICY postit_accounts_delete ON public.postit_accounts FOR DELETE TO authenticated USING (public.postit_is_manager());

DROP POLICY IF EXISTS postit_posts_select ON public.postit_posts;
DROP POLICY IF EXISTS postit_posts_insert ON public.postit_posts;
DROP POLICY IF EXISTS postit_posts_update ON public.postit_posts;
DROP POLICY IF EXISTS postit_posts_delete ON public.postit_posts;
CREATE POLICY postit_posts_select ON public.postit_posts FOR SELECT TO authenticated USING (public.postit_is_staff());
CREATE POLICY postit_posts_insert ON public.postit_posts FOR INSERT TO authenticated WITH CHECK (public.postit_is_staff());
CREATE POLICY postit_posts_update ON public.postit_posts FOR UPDATE TO authenticated USING (public.postit_is_staff()) WITH CHECK (public.postit_is_staff());
CREATE POLICY postit_posts_delete ON public.postit_posts FOR DELETE TO authenticated
  USING (public.postit_is_staff() AND (created_by = auth.uid() OR public.postit_is_manager()));

-- Nothing for anon; authenticated gets row-level DML only (no TRUNCATE, which bypasses RLS).
REVOKE ALL ON public.postit_accounts, public.postit_posts FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.postit_accounts, public.postit_posts TO authenticated;

-- 5. Realtime: the calendar updates live when a teammate edits a post ------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.postit_posts;    EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.postit_accounts; EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;
END $$;

-- 6. Media bucket ---------------------------------------------------------------------------
-- Public so social networks (and the previews) can fetch the file by URL; object paths contain a
-- random id, so they can't be guessed. Only staff can upload or remove.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('postit-media', 'postit-media', true, 52428800,
        ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/quicktime','video/webm'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS postit_media_read   ON storage.objects;
DROP POLICY IF EXISTS postit_media_insert ON storage.objects;
DROP POLICY IF EXISTS postit_media_update ON storage.objects;
DROP POLICY IF EXISTS postit_media_delete ON storage.objects;
CREATE POLICY postit_media_read   ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'postit-media' AND public.postit_is_staff());
CREATE POLICY postit_media_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'postit-media' AND public.postit_is_staff());
CREATE POLICY postit_media_update ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'postit-media' AND public.postit_is_staff());
CREATE POLICY postit_media_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'postit-media' AND public.postit_is_staff());
