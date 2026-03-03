-- Pricing Packages Table
-- Manages service packages that appear on the public pricing page
-- and sync to the project management package_type selectors.

create table if not exists public.pricing_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  original_price numeric(12,2) not null default 0,
  discount_price numeric(12,2) not null default 0,
  icon_name text default 'Globe', -- Lucide icon name
  is_popular boolean default false,
  is_enabled boolean default true,  -- When false, hidden from public pricing page
  sort_order int default 0,
  features text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Addon Services Table
create table if not exists public.pricing_addons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  price numeric(12,2) not null default 0,
  is_enabled boolean default true,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Disable RLS for now (HR managed)
alter table public.pricing_packages enable row level security;
alter table public.pricing_addons enable row level security;

-- Allow public read for enabled packages (for pricing page)
create policy "Public read enabled packages" on public.pricing_packages
  for select using (true);

create policy "Public read enabled addons" on public.pricing_addons
  for select using (true);

-- Allow authenticated full access (HR staff)
create policy "Auth full access packages" on public.pricing_packages
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Auth full access addons" on public.pricing_addons
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Seed with VAW current pricing packages
insert into public.pricing_packages (name, slug, description, original_price, discount_price, icon_name, is_popular, is_enabled, sort_order, features) values
('Basic Design Website', 'basic_design_website', 'Perfect for small businesses and startups', 16999, 7999, 'Globe', false, true, 1, ARRAY['Professional Website Design','Free Domain for 1 Year','Web Hosting Included','SSL Certificate','Mobile Responsive','SEO Optimized','Contact Form','Social Media Integration']),
('Interactive & Creative Website', 'interactive_creative_website', 'Enhanced features for growing businesses', 28999, 19999, 'Zap', true, true, 2, ARRAY['All Basic Features','Interactive Elements','Custom Animations','Advanced Design','Malware Security','Performance Optimization','Analytics Integration','Email Setup','Priority Support']),
('E-commerce Platform', 'ecommerce_platform', 'Complete online store solution', 80000, 49999, 'Shield', false, true, 3, ARRAY['Full E-commerce Setup','Product Catalog','Shopping Cart','Payment Gateway','Inventory Management','Order Management','Customer Dashboard','Advanced Security','Multi-currency Support']),
('Portfolio Showcase', 'portfolio_showcase', 'Professional portfolio websites', 18999, 9999, 'Star', false, true, 4, ARRAY['Creative Portfolio Design','Gallery Management','Project Showcase','Client Testimonials','Blog Integration','Custom Branding','Performance Optimized','SEO Enhanced']),
('Crypto Trading Portal', 'crypto_trading_portal', 'Advanced cryptocurrency platforms', 500000, 500000, 'TrendingUp', false, true, 5, ARRAY['Real-time Crypto Data','Trading Interface','Portfolio Tracking','News Integration','Market Analytics','User Authentication','Advanced Security','API Integrations','Custom Dashboard']),
('AI-Integrated Website', 'ai_integrated_website', 'Cutting-edge AI-powered websites', 300000, 199999, 'Bot', false, true, 6, ARRAY['AI Chatbot Integration','Machine Learning Features','Personalization Engine','Automated Content','Smart Analytics','Voice Integration','Advanced AI Tools','Custom AI Models','Future-ready Technology']),
('Social Media-Based News Website', 'social_media_news_website', 'Perfect for news channels, vlogs & social media platforms', 15999, 8599, 'Globe', false, true, 7, ARRAY['7 Days Development - Go Live Fast!','Automatic Content Fetching','1 Year Hosting Included','Free Domain (.com / .in)','SSL Certificate for Security','Malware Protection & Security Suite','Fully Managed Setup','Social Media Integration'])
on conflict (slug) do nothing;
