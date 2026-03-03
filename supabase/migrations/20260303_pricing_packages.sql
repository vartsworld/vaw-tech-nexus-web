-- Pricing Packages & Addons — Safe/Idempotent Setup
-- Run this in Supabase SQL Editor

-- ── 1. Create tables if they don't exist ──────────────────────────────────

create table if not exists public.pricing_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists public.pricing_addons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- ── 2. Add ALL missing columns safely ─────────────────────────────────────

alter table public.pricing_packages add column if not exists slug text;
alter table public.pricing_packages add column if not exists description text;
alter table public.pricing_packages add column if not exists original_price numeric(12,2) not null default 0;
alter table public.pricing_packages add column if not exists discount_price numeric(12,2) not null default 0;
alter table public.pricing_packages add column if not exists icon_name text default 'Globe';
alter table public.pricing_packages add column if not exists is_popular boolean default false;
alter table public.pricing_packages add column if not exists is_enabled boolean default true;
alter table public.pricing_packages add column if not exists sort_order int default 0;
alter table public.pricing_packages add column if not exists features text[] default '{}';
alter table public.pricing_packages add column if not exists updated_at timestamptz default now();

alter table public.pricing_addons add column if not exists slug text;
alter table public.pricing_addons add column if not exists description text;
alter table public.pricing_addons add column if not exists price numeric(12,2) not null default 0;
alter table public.pricing_addons add column if not exists is_enabled boolean default true;
alter table public.pricing_addons add column if not exists sort_order int default 0;
alter table public.pricing_addons add column if not exists updated_at timestamptz default now();

-- ── 3. Backfill slug for any existing rows ────────────────────────────────

update public.pricing_packages
set slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '_', 'g'))
where slug is null or slug = '';

update public.pricing_addons
set slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '_', 'g'))
where slug is null or slug = '';

-- ── 4. Add unique constraint on slug (safe — only if it doesn't exist) ────

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'pricing_packages_slug_key'
  ) then
    alter table public.pricing_packages add constraint pricing_packages_slug_key unique (slug);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'pricing_addons_slug_key'
  ) then
    alter table public.pricing_addons add constraint pricing_addons_slug_key unique (slug);
  end if;
end $$;

-- ── 5. RLS ─────────────────────────────────────────────────────────────────

alter table public.pricing_packages enable row level security;
alter table public.pricing_addons enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "Public read enabled packages" on public.pricing_packages;
drop policy if exists "Auth full access packages" on public.pricing_packages;
drop policy if exists "Public read enabled addons" on public.pricing_addons;
drop policy if exists "Auth full access addons" on public.pricing_addons;
drop policy if exists "Public read packages" on public.pricing_packages;
drop policy if exists "Auth manage packages" on public.pricing_packages;
drop policy if exists "Public read addons" on public.pricing_addons;
drop policy if exists "Auth manage addons" on public.pricing_addons;

create policy "Public read packages" on public.pricing_packages
  for select using (true);

create policy "Auth manage packages" on public.pricing_packages
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Public read addons" on public.pricing_addons
  for select using (true);

create policy "Auth manage addons" on public.pricing_addons
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ── 6. Seed VAW pricing packages ──────────────────────────────────────────

insert into public.pricing_packages
  (name, slug, description, original_price, discount_price, icon_name, is_popular, is_enabled, sort_order, features)
values
  ('Basic Design Website', 'basic_design_website', 'Perfect for small businesses and startups', 16999, 7999, 'Globe', false, true, 1,
    ARRAY['Professional Website Design','Free Domain for 1 Year','Web Hosting Included','SSL Certificate','Mobile Responsive','SEO Optimized','Contact Form','Social Media Integration']),
  ('Interactive & Creative Website', 'interactive_creative_website', 'Enhanced features for growing businesses', 28999, 19999, 'Zap', true, true, 2,
    ARRAY['All Basic Features','Interactive Elements','Custom Animations','Advanced Design','Malware Security','Performance Optimization','Analytics Integration','Email Setup','Priority Support']),
  ('E-commerce Platform', 'ecommerce_platform', 'Complete online store solution', 80000, 49999, 'Shield', false, true, 3,
    ARRAY['Full E-commerce Setup','Product Catalog','Shopping Cart','Payment Gateway','Inventory Management','Order Management','Customer Dashboard','Advanced Security','Multi-currency Support']),
  ('Portfolio Showcase', 'portfolio_showcase', 'Professional portfolio websites', 18999, 9999, 'Star', false, true, 4,
    ARRAY['Creative Portfolio Design','Gallery Management','Project Showcase','Client Testimonials','Blog Integration','Custom Branding','Performance Optimized','SEO Enhanced']),
  ('Crypto Trading Portal', 'crypto_trading_portal', 'Advanced cryptocurrency platforms', 500000, 500000, 'TrendingUp', false, true, 5,
    ARRAY['Real-time Crypto Data','Trading Interface','Portfolio Tracking','News Integration','Market Analytics','User Authentication','Advanced Security','API Integrations','Custom Dashboard']),
  ('AI-Integrated Website', 'ai_integrated_website', 'Cutting-edge AI-powered websites', 300000, 199999, 'Bot', false, true, 6,
    ARRAY['AI Chatbot Integration','Machine Learning Features','Personalization Engine','Automated Content','Smart Analytics','Voice Integration','Advanced AI Tools','Custom AI Models','Future-ready Technology']),
  ('Social Media-Based News Website', 'social_media_news_website', 'Perfect for news channels, vlogs & social media platforms', 15999, 8599, 'Globe', false, true, 7,
    ARRAY['7 Days Development - Go Live Fast!','Automatic Content Fetching','1 Year Hosting Included','Free Domain (.com / .in)','SSL Certificate for Security','Malware Protection & Security Suite','Fully Managed Setup','Social Media Integration'])
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  original_price = excluded.original_price,
  discount_price = excluded.discount_price,
  icon_name = excluded.icon_name,
  is_popular = excluded.is_popular,
  sort_order = excluded.sort_order,
  features = excluded.features;
