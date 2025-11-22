-- Create VAW Vendors table
CREATE TABLE IF NOT EXISTS public.vaw_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_name TEXT NOT NULL,
  shop_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  password TEXT NOT NULL,
  kyc_document_url TEXT,
  gst_certificate_url TEXT,
  total_points INTEGER DEFAULT 0,
  total_cups_used INTEGER DEFAULT 0,
  total_tissues_used INTEGER DEFAULT 0,
  total_recycled_cups INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create VAW Orders table
CREATE TABLE IF NOT EXISTS public.vaw_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vaw_vendors(id) ON DELETE CASCADE,
  cups_quantity INTEGER DEFAULT 0,
  tissues_quantity INTEGER DEFAULT 0,
  waste_bin_requested BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  delivery_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create VAW Sponsors table
CREATE TABLE IF NOT EXISTS public.vaw_sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  gst_number TEXT,
  business_category TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create VAW Campaigns table
CREATE TABLE IF NOT EXISTS public.vaw_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL REFERENCES public.vaw_sponsors(id) ON DELETE CASCADE,
  campaign_name TEXT NOT NULL,
  cup_design_url TEXT,
  tissue_design_url TEXT,
  qr_code_link TEXT,
  target_location TEXT,
  start_date DATE,
  end_date DATE,
  quantity INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create VAW Recycling Log table
CREATE TABLE IF NOT EXISTS public.vaw_recycling_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vaw_vendors(id) ON DELETE CASCADE,
  weight_kg DECIMAL(10,2) NOT NULL,
  points_earned INTEGER NOT NULL,
  image_url TEXT,
  qr_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create VAW Rewards table
CREATE TABLE IF NOT EXISTS public.vaw_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_name TEXT NOT NULL,
  reward_description TEXT,
  points_required INTEGER NOT NULL,
  reward_type TEXT NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create VAW Redemptions table
CREATE TABLE IF NOT EXISTS public.vaw_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vaw_vendors(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.vaw_rewards(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vaw_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaw_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaw_sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaw_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaw_recycling_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaw_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaw_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for VAW Vendors
CREATE POLICY "Vendors can view their own data" ON public.vaw_vendors
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert vendors" ON public.vaw_vendors
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Vendors can update their own data" ON public.vaw_vendors
  FOR UPDATE USING (true);

-- RLS Policies for VAW Orders
CREATE POLICY "Vendors can view their orders" ON public.vaw_orders
  FOR SELECT USING (true);

CREATE POLICY "Vendors can create orders" ON public.vaw_orders
  FOR INSERT WITH CHECK (true);

-- RLS Policies for other tables (open for now, can be restricted later)
CREATE POLICY "Public read access" ON public.vaw_sponsors FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON public.vaw_sponsors FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read campaigns" ON public.vaw_campaigns FOR SELECT USING (true);
CREATE POLICY "Public read recycling" ON public.vaw_recycling_log FOR SELECT USING (true);
CREATE POLICY "Public insert recycling" ON public.vaw_recycling_log FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read rewards" ON public.vaw_rewards FOR SELECT USING (true);
CREATE POLICY "Public read redemptions" ON public.vaw_redemptions FOR SELECT USING (true);
CREATE POLICY "Public insert redemptions" ON public.vaw_redemptions FOR INSERT WITH CHECK (true);