-- ==============================================================================
-- VAW MARKETING SITE — shared-database schema (hardened)
-- ------------------------------------------------------------------------------
-- Creates ONLY `market_*` tables plus two helper functions, all in `public`.
-- It never renames, alters, reads or drops any other table, policy, trigger or
-- function. The only DROP statements target objects named `market_*` that this
-- script itself creates (DROP TRIGGER / DROP POLICY IF EXISTS before re-creating).
-- Idempotent: safe to re-run. Run it as ONE script in the SQL editor: if any
-- statement fails the whole script rolls back and nothing is left half-applied.
--
-- Changes from the draft that was reviewed (marked "HARDENED" below):
--   * Staff access is limited to HR / super_admin, not "any logged-in user".
--     In this shared project clients can also sign in, and `authenticated`
--     includes them. `USING (true)` would let a client read every lead's phone
--     and email and delete or edit the case studies and blog.
--   * `GRANT ALL ... TO authenticated` replaced by explicit privileges. ALL
--     includes TRUNCATE, which ignores row-level security entirely.
--   * Default privileges are revoked on these tables first (Supabase grants
--     ALL to anon/authenticated on new public tables by default).
--   * The phone CHECK no longer rejects "+91 99468 82478" (digits are counted
--     after stripping spaces and punctuation).
--   * Public quote inserts are length-limited instead of `WITH CHECK (true)`.
--   * `""` in the blog seed text (an escaping slip) is now a single `"`.
--   * Trigger function pins its search_path.
--   * Live updates (realtime) enabled for the two inbound tables so HR sees
--     new leads instantly.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Helpers
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.market_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- HARDENED: who may manage marketing content / read leads. Mirrors the existing
-- HR policies (staff_profiles.role = 'hr' or 'super_admin'). SECURITY DEFINER so it
-- can read staff_profiles regardless of that table's own RLS (no recursion).
-- To let more roles in (e.g. a marketing team head), add them to the IN list.
CREATE OR REPLACE FUNCTION public.market_is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_profiles
    WHERE user_id = auth.uid() AND role::text IN ('hr', 'super_admin')
  );
$$;

-- ==============================================================================
-- 2. MARKET_ENQUIRIES — contact form / project brief submissions
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.market_enquiries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  full_name     TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 160),
  -- HARDENED: count digits after stripping spaces/dashes/brackets so "+91 99468 82478" is accepted.
  phone         TEXT NOT NULL CHECK (
                  char_length(phone) BETWEEN 8 AND 24
                  AND char_length(regexp_replace(phone, '[^0-9]', '', 'g')) >= 8),
  email         TEXT CHECK (email IS NULL OR char_length(email) <= 320),
  company       TEXT CHECK (company IS NULL OR char_length(company) <= 200),
  budget        TEXT CHECK (budget IS NULL OR char_length(budget) <= 200),
  message       TEXT CHECK (message IS NULL OR char_length(message) <= 8000),
  source        TEXT NOT NULL DEFAULT 'contact_form' CHECK (char_length(source) <= 100),
  privacy_acknowledged_at TIMESTAMPTZ,
  status        TEXT NOT NULL DEFAULT 'new'
                CHECK (status IN ('new','contacted','meeting_scheduled','in_progress','converted','closed')),
  assigned_to   UUID,              -- parent-platform staff user id (optional FK kept loose)
  notes         TEXT
);

ALTER TABLE public.market_enquiries
  ADD COLUMN IF NOT EXISTS privacy_acknowledged_at TIMESTAMPTZ;

-- HARDENED: if the draft already created this table, its phone CHECK is the strict one. Replace it with
-- the relaxed one (every existing row already satisfies the stricter rule, so this cannot fail on data).
ALTER TABLE public.market_enquiries DROP CONSTRAINT IF EXISTS market_enquiries_phone_check;
ALTER TABLE public.market_enquiries ADD CONSTRAINT market_enquiries_phone_check CHECK (
  char_length(phone) BETWEEN 8 AND 24
  AND char_length(regexp_replace(phone, '[^0-9]', '', 'g')) >= 8);

CREATE INDEX IF NOT EXISTS idx_market_enquiries_created_at ON public.market_enquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_enquiries_phone      ON public.market_enquiries (phone);
CREATE INDEX IF NOT EXISTS idx_market_enquiries_status     ON public.market_enquiries (status);

COMMENT ON TABLE public.market_enquiries IS
  'VAW Marketing website: inbound project briefs / contact-form leads (market_ prefix avoids parent-platform collisions).';

DROP TRIGGER IF EXISTS trg_market_enquiries_updated_at ON public.market_enquiries;
CREATE TRIGGER trg_market_enquiries_updated_at
  BEFORE UPDATE ON public.market_enquiries
  FOR EACH ROW EXECUTE FUNCTION public.market_set_updated_at();

ALTER TABLE public.market_enquiries ENABLE ROW LEVEL SECURITY;

-- Legacy policy names from the draft are removed so they cannot linger with `USING (true)`.
DROP POLICY IF EXISTS "market_enquiries_staff_select" ON public.market_enquiries;
DROP POLICY IF EXISTS "market_enquiries_staff_update" ON public.market_enquiries;
DROP POLICY IF EXISTS "market_enquiries_staff_delete" ON public.market_enquiries;

DROP POLICY IF EXISTS "market_enquiries_public_insert" ON public.market_enquiries;
CREATE POLICY "market_enquiries_public_insert"
  ON public.market_enquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'new' AND assigned_to IS NULL AND notes IS NULL AND privacy_acknowledged_at IS NOT NULL);

DROP POLICY IF EXISTS "market_enquiries_staff_all" ON public.market_enquiries;
CREATE POLICY "market_enquiries_staff_all"
  ON public.market_enquiries FOR ALL
  TO authenticated
  USING (public.market_is_staff()) WITH CHECK (public.market_is_staff());

-- ==============================================================================
-- 3. MARKET_PLAN_QUOTES — saved configurator quotes (from the pricing page)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.market_plan_quotes (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  plan_id                  TEXT NOT NULL CHECK (plan_id IN ('launch','growth','scale','pro','max')),
  billing_cycle            TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','yearly')),
  videos                   INTEGER NOT NULL DEFAULT 8  CHECK (videos >= 0),
  posters                  INTEGER NOT NULL DEFAULT 8  CHECK (posters >= 0),
  extra_on_location_sessions INTEGER NOT NULL DEFAULT 0 CHECK (extra_on_location_sessions >= 0),
  personal_branding        BOOLEAN NOT NULL DEFAULT false,
  dubbing_languages        INTEGER NOT NULL DEFAULT 0 CHECK (dubbing_languages >= 0 AND dubbing_languages <= 10),
  seo_tier                 TEXT NOT NULL DEFAULT 'included' CHECK (seo_tier IN ('included','growth','pro')),
  selected_platforms       JSONB NOT NULL DEFAULT '[]'::jsonb,
  community_tier           TEXT NOT NULL DEFAULT 'included' CHECK (community_tier IN ('included','active','lead')),
  ads_tier                 TEXT NOT NULL DEFAULT 'none' CHECK (ads_tier IN ('none','meta','advanced')),
  include_website          BOOLEAN NOT NULL DEFAULT false,
  social_media_management  BOOLEAN NOT NULL DEFAULT true,
  monthly_total            NUMERIC(10,2) CHECK (monthly_total IS NULL OR monthly_total >= 0),
  yearly_total             NUMERIC(12,2) CHECK (yearly_total  IS NULL OR yearly_total  >= 0),
  website_one_time         NUMERIC(10,2),
  website_annual_renewal   NUMERIC(10,2),
  client_name              TEXT,
  client_phone             TEXT,
  client_email             TEXT,
  notes                    TEXT
);

ALTER TABLE public.market_plan_quotes
  ADD COLUMN IF NOT EXISTS social_media_management BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_market_plan_quotes_created_at ON public.market_plan_quotes (created_at DESC);

COMMENT ON TABLE public.market_plan_quotes IS
  'VAW Marketing website: quotes saved from the interactive pricing configurator.';

DROP TRIGGER IF EXISTS trg_market_plan_quotes_updated_at ON public.market_plan_quotes;
CREATE TRIGGER trg_market_plan_quotes_updated_at
  BEFORE UPDATE ON public.market_plan_quotes
  FOR EACH ROW EXECUTE FUNCTION public.market_set_updated_at();

ALTER TABLE public.market_plan_quotes ENABLE ROW LEVEL SECURITY;

-- HARDENED: bounded public insert (was WITH CHECK (true)) so the endpoint can't be used to dump huge payloads.
DROP POLICY IF EXISTS "market_plan_quotes_public_insert" ON public.market_plan_quotes;
CREATE POLICY "market_plan_quotes_public_insert"
  ON public.market_plan_quotes FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    coalesce(char_length(client_name), 0)  <= 200
    AND coalesce(char_length(client_phone), 0) <= 40
    AND coalesce(char_length(client_email), 0) <= 320
    AND coalesce(char_length(notes), 0)        <= 4000
    AND jsonb_typeof(selected_platforms) = 'array'
    AND jsonb_array_length(selected_platforms) <= 20
  );

DROP POLICY IF EXISTS "market_plan_quotes_staff_all" ON public.market_plan_quotes;
CREATE POLICY "market_plan_quotes_staff_all"
  ON public.market_plan_quotes FOR ALL
  TO authenticated
  USING (public.market_is_staff()) WITH CHECK (public.market_is_staff());

-- ==============================================================================
-- 4. MARKET_PROJECTS — portfolio / case studies shown in the home "Work" area
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.market_projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  slug          TEXT NOT NULL UNIQUE,
  brand_label   TEXT NOT NULL,
  title         TEXT NOT NULL,
  tagline       TEXT NOT NULL DEFAULT '',
  client        TEXT NOT NULL DEFAULT '',
  category      TEXT NOT NULL DEFAULT '',
  year          TEXT NOT NULL DEFAULT '',
  description   TEXT NOT NULL DEFAULT '',
  metric        TEXT NOT NULL DEFAULT '',
  metric_label  TEXT NOT NULL DEFAULT '',
  metric_verified BOOLEAN NOT NULL DEFAULT false,
  tags          JSONB NOT NULL DEFAULT '[]'::jsonb,
  image_url     TEXT NOT NULL DEFAULT '',
  deliverables  JSONB NOT NULL DEFAULT '[]'::jsonb,
  featured      BOOLEAN NOT NULL DEFAULT true,
  published     BOOLEAN NOT NULL DEFAULT true,
  sort_order    INTEGER NOT NULL DEFAULT 100
);

ALTER TABLE public.market_projects
  ADD COLUMN IF NOT EXISTS metric_verified BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_market_projects_published ON public.market_projects (published, sort_order);

COMMENT ON TABLE public.market_projects IS
  'VAW Marketing website: portfolio case studies for the home-page work showcase (admin-managed).';

DROP TRIGGER IF EXISTS trg_market_projects_updated_at ON public.market_projects;
CREATE TRIGGER trg_market_projects_updated_at
  BEFORE UPDATE ON public.market_projects
  FOR EACH ROW EXECUTE FUNCTION public.market_set_updated_at();

ALTER TABLE public.market_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "market_projects_public_read" ON public.market_projects;
CREATE POLICY "market_projects_public_read"
  ON public.market_projects FOR SELECT
  TO anon, authenticated
  USING (published = true);

DROP POLICY IF EXISTS "market_projects_staff_all" ON public.market_projects;
CREATE POLICY "market_projects_staff_all"
  ON public.market_projects FOR ALL
  TO authenticated
  USING (public.market_is_staff()) WITH CHECK (public.market_is_staff());

-- ==============================================================================
-- 5. MARKET_BLOG_POSTS — blog / insights CMS (admin-managed, public read)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.market_blog_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  slug            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  excerpt         TEXT NOT NULL DEFAULT '',
  content_md      TEXT NOT NULL DEFAULT '',
  cover_image     TEXT NOT NULL DEFAULT '',
  author          TEXT NOT NULL DEFAULT 'VAW Marketing Team',
  author_role     TEXT NOT NULL DEFAULT '',
  category        TEXT NOT NULL DEFAULT 'Growth Playbooks',
  tags            JSONB NOT NULL DEFAULT '[]'::jsonb,
  reading_minutes INTEGER NOT NULL DEFAULT 5 CHECK (reading_minutes >= 1),
  seo_title       TEXT,
  seo_description TEXT,
  published       BOOLEAN NOT NULL DEFAULT false,
  published_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_market_blog_posts_published ON public.market_blog_posts (published, published_at DESC);

COMMENT ON TABLE public.market_blog_posts IS
  'VAW Marketing website: blog articles (lightweight markdown). Managed via the parent admin panel.';

DROP TRIGGER IF EXISTS trg_market_blog_posts_updated_at ON public.market_blog_posts;
CREATE TRIGGER trg_market_blog_posts_updated_at
  BEFORE UPDATE ON public.market_blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.market_set_updated_at();

ALTER TABLE public.market_blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "market_blog_posts_public_read" ON public.market_blog_posts;
CREATE POLICY "market_blog_posts_public_read"
  ON public.market_blog_posts FOR SELECT
  TO anon, authenticated
  USING (published = true);

DROP POLICY IF EXISTS "market_blog_posts_staff_all" ON public.market_blog_posts;
CREATE POLICY "market_blog_posts_staff_all"
  ON public.market_blog_posts FOR ALL
  TO authenticated
  USING (public.market_is_staff()) WITH CHECK (public.market_is_staff());

-- ==============================================================================
-- 6. MARKET_TESTIMONIALS — client feedback published only with explicit consent
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.market_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  quote TEXT NOT NULL CHECK (char_length(quote) BETWEEN 20 AND 2000),
  author_name TEXT NOT NULL CHECK (char_length(author_name) BETWEEN 2 AND 160),
  author_role TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  consent_received_at TIMESTAMPTZ,
  published BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 100
);
CREATE INDEX IF NOT EXISTS idx_market_testimonials_public ON public.market_testimonials (published, sort_order);
ALTER TABLE public.market_testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "market_testimonials_public_read" ON public.market_testimonials;
CREATE POLICY "market_testimonials_public_read" ON public.market_testimonials
  FOR SELECT TO anon, authenticated
  USING (published = true AND consent_received_at IS NOT NULL);

DROP POLICY IF EXISTS "market_testimonials_staff_all" ON public.market_testimonials;
CREATE POLICY "market_testimonials_staff_all" ON public.market_testimonials
  FOR ALL TO authenticated
  USING (public.market_is_staff()) WITH CHECK (public.market_is_staff());

-- ==============================================================================
-- 7. GRANTS (HARDENED: explicit, minimal; TRUNCATE/REFERENCES/TRIGGER never granted)
--    Row-level security decides which rows; these decide which operations at all.
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;

REVOKE ALL ON TABLE
  public.market_enquiries, public.market_plan_quotes, public.market_projects,
  public.market_blog_posts, public.market_testimonials
FROM PUBLIC, anon, authenticated;

GRANT INSERT ON TABLE public.market_enquiries, public.market_plan_quotes TO anon;
GRANT SELECT ON TABLE public.market_projects, public.market_blog_posts, public.market_testimonials TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.market_enquiries, public.market_plan_quotes, public.market_projects,
  public.market_blog_posts, public.market_testimonials
TO authenticated;

-- ==============================================================================
-- 8. REALTIME — HR sees new leads instantly (RLS still applies to what is delivered)
-- ==============================================================================
DO $$
DECLARE t text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH t IN ARRAY ARRAY['market_enquiries', 'market_plan_quotes'] LOOP
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
      END IF;
    END LOOP;
  END IF;
END $$;

-- ==============================================================================
-- 9. SEED DATA — portfolio. Idempotent via ON CONFLICT (slug).
--    NOTE: re-running restores any seeded row you DELETED. Unpublish instead of deleting.
--    NOTE: the metrics below are the draft's figures. They are seeded with
--    metric_verified = false; confirm each with the client before it is shown as fact.
-- ==============================================================================
INSERT INTO public.market_projects
  (slug, brand_label, title, tagline, client, category, year, description, metric, metric_label, tags, image_url, deliverables, featured, published, sort_order)
VALUES
  ('s-mart-supermarkets','S MART','S Mart Supermarkets',
   'Retail video, festive offer creative and locally targeted campaign support.',
   'S Mart Supermarkets','Supermarket Retail & Omnichannel Footfall','2025',
   'Produced on-location commercial video and weekly offer assets, supported by WhatsApp circular planning and local Meta campaign creative across participating supermarket outlets.',
   '160,000+','Verified store walk-ins during festive campaigns',
   '["Supermarket Retail","Commercial Video","Meta Local Ads","WhatsApp Circulars"]'::jsonb,
   'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1600&q=85',
   '["Weekly Store Video Shoots","Hyper-local Meta Ads","WhatsApp CRM Circulars","Weekend Deals Motion Graphics"]'::jsonb,
   true, true, 10),
  ('hotel-raj-regency','RAJ REGENCY','Hotel Raj Regency',
   'Hospitality photography and video content for rooms, dining and event enquiries.',
   'Hotel Raj Regency','Luxury Hospitality & Fine Dining','2025',
   'Created visual content across guest rooms, dining and event spaces, with campaign assets for hospitality and event promotion.',
   '+82%','Increase in direct banquet & celebration bookings',
   '["Luxury Hotel","Fine Dining","Banquet Inquiries","Cinematic Shoots"]'::jsonb,
   'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=85',
   '["Culinary 4K Films","Banquet Event Lead Funnels","Architectural Drone Coverage","Social Media Experience Reels"]'::jsonb,
   true, true, 20),
  ('visage-eye-hospitals','VISAGE EYE','Visage Eye Hospitals',
   'Patient education and search campaign creative for an ophthalmology provider.',
   'Visage Eye Hospital & Laser Center','Super-Specialty Ophthalmology','2025',
   'Developed surgeon explainer videos and patient-education content about eye-care services, supported by regional search and video campaign assets.',
   '+74%','Increase in elective LASIK & cataract consultations',
   '["Eye Care Hospital","Medical Video Shoot","Google Health Search","Regional Ads"]'::jsonb,
   'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1600&q=85',
   '["Surgeon Explainer Masterclasses","LASIK Consultation Landing Page","Multilingual Patient Guides","Google Search Intent Blitz"]'::jsonb,
   true, true, 30),
  ('ceevees-mart','CEEVEES','Ceevees Mart',
   'Retail content and local campaign creative for grocery and FMCG promotions.',
   'Ceevees Mart','Modern FMCG & Supermarket Retail','2025',
   'Produced grocery product videos, store walkthroughs and offer creative for local retail and quick-commerce promotions.',
   '3.9x','Weekend footfall & fresh basket sales surge',
   '["FMCG Mart","Retail Growth","Commercial Shoots","Local Social Engine"]'::jsonb,
   'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1600&q=85',
   '["On-Site Mart Video Shoots","Flash Sale Promo Graphics","Neighborhood Ad Geofencing","Customer Interview Vignettes"]'::jsonb,
   true, true, 40),
  ('padavila-supermarket','PADAVILA','Padavila Supermarket',
   'Community-focused retail promotions, seasonal offers and WhatsApp content.',
   'Padavila Supermarket','Supermarket & Consumer Retail','2025',
   'Planned community-focused promotional content around local sourcing, seasonal pricing and grocery arrivals, including WhatsApp circulars.',
   '45,000+','Active local families in digital circular network',
   '["Supermarket Retail","WhatsApp Loyalty","Weekly Circulars","Local SEO"]'::jsonb,
   'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=1600&q=85',
   '["Weekly Offer Posters","On-Location Anchor Shoots","WhatsApp Customer Broadcasts","Google Maps Local Boost"]'::jsonb,
   true, true, 50),
  ('visage-dental-care','VISAGE DENTAL','Visage Dental Care',
   'Patient education and campaign content for dental and cosmetic services.',
   'Visage Dental Hospital','Dental Hospital & Oral Aesthetics','2025',
   'Produced dental service videos, doctor Q&As and campaign creative for cosmetic dentistry and implant enquiries.',
   '280+','Monthly qualified cosmetic & implant consultations',
   '["Dental Hospital","Smile Makeovers","Local SEO & Maps","High-Trust Video"]'::jsonb,
   'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1600&q=85',
   '["4K Clinical Shoot & Drone Exterior","Smile Transformation Case Series","Instant Inbound Booking Funnel","Local Google Ads Blitz"]'::jsonb,
   true, true, 60),
  ('glory-footwear','GLORY','Glory Footwear',
   'Product video and retail launch content for footwear collections.',
   'Glory Footwear Stores','Footwear & Fashion Retail','2024',
   'Created product films for seasonal footwear collections and promotional content for retail launches.',
   '5.2x','Campaign ROAS & record retail store turnout',
   '["Shoe Stores","Cinematic Macro Shoots","Product Launches","Omnichannel Sales"]'::jsonb,
   'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1600&q=85',
   '["Dynamic Macro Footwear Films","Influencer Styling Collaborations","Store Opening Launch Activation","Multi-Platform Ad Funnel"]'::jsonb,
   true, true, 70),
  ('vissy-sports-academy','VISSY SPORTS','Vissy Sports Academy',
   'Content and promotional campaigns for a sports academy and arena.',
   'Vissy Sports Academy','Sports Arena & Athletic Academy','2024',
   'Produced action videos showcasing turf courts, coaching and tournament activity, with campaign assets for bookings and enrolment.',
   '100%','Seasonal training batch capacity reached',
   '["Sports Arena","Athletic Coaching","Arena Bookings","High-Energy Video"]'::jsonb,
   'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1600&q=85',
   '["High-Frame-Rate Action Shoots","Student Enrollment Funnel","Turf Booking Ad Campaign","Tournament Highlights Coverage"]'::jsonb,
   true, true, 80),
  ('hotel-raj-residency','RAJ RESIDENCY','Hotel Raj Residency',
   'Hotel content for business stays, meetings and dining.',
   'Hotel Raj Residency','Hospitality & Business Suites','2024',
   'Produced lifestyle and interior assets for meeting spaces, guest suites and dining, alongside direct-booking promotional creative.',
   '+65%','Increase in direct corporate & suite booking revenue',
   '["Business Hotel","Conference Facilities","Corporate Travel","Direct Booking"]'::jsonb,
   'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1600&q=85',
   '["Executive Suite Virtual Tour","Corporate Conference Ad Kit","Direct Booking Website Funnel","Seasonal Travel Social Reels"]'::jsonb,
   true, true, 90)
ON CONFLICT (slug) DO NOTHING;

-- ==============================================================================
-- 10. SEED DATA — launch blog articles. Lightweight markdown rendered client-side.
-- ==============================================================================
INSERT INTO public.market_blog_posts
  (slug, title, excerpt, content_md, cover_image, author, author_role, category, tags, reading_minutes, seo_title, seo_description, published, published_at)
VALUES
  ('kerala-local-seo-playbook',
   'The Kerala Local SEO Playbook: Own Your District Before Your Competitor Wakes Up',
   'A practical, step-by-step local SEO system for Kerala businesses — Google Business Profile, Malayalam keyword intent, review velocity and locality landing pages that actually rank.',
   '# The Kerala Local SEO Playbook

Most Kerala businesses lose customers they never knew existed: the person in Kollam who typed *"best eye hospital near me"* and found a competitor because your Google Business Profile was half-finished.

Local SEO is not "digital marketing". It is **shelf space in the only street that matters — the search results page**.

## 1. Claim and complete your Google Business Profile (GBP)

- Use your exact legal business name — no keyword stuffing ("S Mart Supermarkets", not "Best Supermarket Kollam").
- Pick the *most specific* primary category ("Ophthalmology clinic" beats "Hospital").
- Add every service line as a GBP service with a two-sentence description.
- Refresh photos regularly with current images that accurately show the business and its services.

## 2. Write for Malayalam-English search behaviour

People search in Tanglish/Manglish transliteration and in Malayalam script. Build one locality page per town you serve, and answer the exact question format:

- "eye hospital in kollam fees"
- "dental implant cost kerala"
- "supermarket delivery near ranni"

## 3. Review velocity beats review count

Recent, genuine reviews give customers current context about your business. Our QR counter stands (included with every marketing plan) can make it simpler for willing customers to find the review page.

## 4. Earn local links that Google trusts

Malayalam newspapers, district panchayat directories, hospital association listings and chamber-of-commerce pages carry real local authority. One link from a Kerala news domain is worth fifty directory spam links.

## 5. Measure what matters

Track three numbers weekly: GBP searches (direct vs discovery), direction requests, and calls. If discovery searches rise while calls stay flat, your profile is winning attention but losing trust — fix photos and reviews first.

**Bottom line:** local search visibility takes ongoing attention. Keep business information accurate and review customer questions regularly.',
   '', 'VAW Marketing Team', 'Local Search & Growth', 'Local SEO',
   '["local seo","kerala","google business profile","malayalam search"]'::jsonb,
   6,
   'Kerala Local SEO Playbook — Rank in Your District | VAW Marketing',
   'Step-by-step local SEO for Kerala businesses: Google Business Profile, Malayalam keyword intent, review velocity and locality pages.',
   true, '2026-08-12T09:00:00+05:30'),

  ('onam-campaign-playbook',
   'Onam Is a Demand Spike, Not a Festival: The Retail Campaign Playbook',
   'How supermarkets and retail chains in Kerala plan the 6-week Onam window — circulars, WhatsApp broadcasts, geo-fenced Meta ads and shoot calendars that convert festive intent into footfall.',
   '# Onam Is a Demand Spike, Not a Festival

Onam compresses a quarter of retail intent into six weeks. The stores that win start **before** the first pookalam appears.

## T-6 weeks: lock the offer architecture

Decide your hero bundles (sadya kits, grocery hampers, electronics EMIs) and price anchors. Everything downstream — creatives, circulars, ads — repeats these three anchors only.

## T-5 weeks: shoot everything in one batch

One structured production day can capture 15–20 finished reels: anchor walk-throughs, produce close-ups, price-card reveals. Batching keeps store disruption near zero and visual consistency high.

## T-4 to T-1 weeks: the WhatsApp + Meta pincer

- **WhatsApp circulars** to your subscriber list when the update is useful, using only a list of customers who have opted in.
- **Geo-fenced Meta ads** at 3–5 km radius per outlet, creative rotated every 72 hours to beat fatigue.
- **Google Search** on high-intent terms: "onam sadya kit delivery", "onam offers supermarket kochi".

## Festival week: social proof loop

Film real crowds, real counters, real families. Same-day edits posted by 7 PM become next-day footfall.

## The numbers that matter

Track walk-ins per circular (unique coupon codes), WhatsApp forward rate, and cost per store visit — not vanity reach.',
   '', 'VAW Marketing Team', 'Retail & Festive Campaigns', 'Retail Campaigns',
   '["onam","festive marketing","retail footfall","whatsapp marketing"]'::jsonb,
   5,
   'Onam Retail Campaign Playbook for Kerala Stores | VAW Marketing',
   'A 6-week Onam campaign system: batched shoots, WhatsApp circulars and geo-fenced Meta ads that drive real store footfall.',
   true, '2026-08-26T09:00:00+05:30'),

  ('video-first-marketing-kerala',
   'Planning Short-Form Video for Your Business',
   'A practical brief for planning short-form video: audience, message, production, consent and measurement.',
   '# Planning Short-Form Video for Your Business

Short-form video is one useful format among several. Whether it suits a business depends on its audience, offer, creative and distribution plan.

## What "one video" actually means at VAW

A finished, edited, colour-graded short film (15–90 seconds) including:

- hook optimisation (first 1.5 seconds)
- on-screen subtitles in Malayalam or English
- sound design and licensed audio
- branded captions and end-frame CTA

It is **not** a raw clip from a phone.

## Batching: the unglamorous secret

30 videos a month does not mean 30 visits. We schedule structured production sessions — one focused shoot captures multiple approved pieces — so your staff stays with customers while we work.

## Format mix that converts

- **60%** proof content (crowds, results, patient stories, before/after)
- **25%** offer content (price cards, bundles, festival deals)
- **15%** brand texture (founder story, behind-the-scenes, craft)

## Healthcare caveat

Hospitals and clinics need consent-first storytelling. Use consent-first, accurate patient education. Have qualified healthcare professionals review medical statements before publication.',
   '', 'VAW Marketing Team', 'Production & Creative', 'Video Marketing',
   '["video marketing","reels","4k production","kerala business"]'::jsonb,
   5,
   'Video-First Marketing in Kerala — What Works | VAW Marketing',
   'Why short-form vertical video wins for Kerala retail & healthcare, and exactly what a finished marketing video includes.',
   true, '2026-09-09T09:00:00+05:30'),

  ('transparent-agency-pricing',
   'What a Marketing Retainer Should Cost in India: Our Full Pricing Logic, Public',
   'We publish our entire pricing engine — plan baselines, per-video and per-creative rates, add-on costs and the yearly discount — so you can audit any agency quote, including ours.',
   '# What a Marketing Retainer Should Cost in India

Comparing retainers is easier when scope and costs are clear. Our pricing page shows the published package rates, selected add-ons and annual billing calculation.

## The baseline

**₹20,000/month** covers 4 finished videos, 4 creatives, 1 on-location anchor shoot, social management (Instagram, Facebook, Google Business Profile), basic SEO and monthly reporting.

## How scaling is priced (per month)

| Item | Rate |
| --- | --- |
| Extra video beyond plan | ₹1,500 |
| Extra creative/poster | ₹1,000 |
| Extra on-location film session | ₹3,500 |
| Additional social platform | ₹2,000 |
| Personal branding add-on | ₹5,000 |
| SEO Growth / SEO Pro | ₹5,000 / ₹10,000 |
| Meta ads management | ₹5,000 |
| Advanced omnichannel ads | ₹10,000 |

## Three policies we will never bend

1. **0% markup on creator fees.** Influencers are paid by you, directly.
2. **Ad spend stays on your card.** We never commingle media budgets.
3. **Clear kickoff.** Meeting format, production location and schedule are agreed with each client before work begins.

Yearly billing is shown with a 10% reduction to recurring marketing fees. Confirm final contract terms, taxes and any approved scope changes in your written proposal.',
   '', 'VAW Marketing Team', 'Pricing & Policies', 'Pricing',
   '["agency pricing","marketing retainer india","transparent pricing"]'::jsonb,
   4,
   'Marketing Retainer Pricing in India, Fully Explained | VAW Marketing',
   'Our complete pricing logic published: baselines, per-unit rates, add-ons and the three policies we never bend.',
   true, '2026-09-30T09:00:00+05:30')
ON CONFLICT (slug) DO NOTHING;

-- ==============================================================================
-- END
-- ==============================================================================
