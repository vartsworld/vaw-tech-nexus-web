
-- Pricing packages table (seeded from existing Pricing page data)
CREATE TABLE public.pricing_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    original_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    features TEXT[] DEFAULT '{}',
    icon TEXT DEFAULT 'Globe',
    is_popular BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pricing_packages ENABLE ROW LEVEL SECURITY;

-- Anyone can read active packages (public pricing)
CREATE POLICY "Anyone can view active packages" ON public.pricing_packages
    FOR SELECT USING (is_active = true);

-- Only staff can manage packages
CREATE POLICY "Staff can manage packages" ON public.pricing_packages
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.staff_profiles WHERE user_id = auth.uid())
    );

-- Client onboarding links table
CREATE TABLE public.client_onboarding_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    created_by TEXT NOT NULL, -- staff user_id
    package_id UUID REFERENCES public.pricing_packages(id),
    additional_info TEXT,
    custom_fields JSONB DEFAULT '[]', -- [{label, type, required}]
    status TEXT DEFAULT 'active', -- active, completed, expired
    client_name TEXT, -- optional pre-fill
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.client_onboarding_links ENABLE ROW LEVEL SECURITY;

-- Public can read active links (for form page)
CREATE POLICY "Anyone can view active links" ON public.client_onboarding_links
    FOR SELECT USING (status = 'active');

-- Staff can create/manage links
CREATE POLICY "Staff can manage onboarding links" ON public.client_onboarding_links
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.staff_profiles WHERE user_id = auth.uid())
    );

-- Allow anonymous updates for form completion
CREATE POLICY "Anyone can complete onboarding" ON public.client_onboarding_links
    FOR UPDATE USING (status = 'active')
    WITH CHECK (status = 'completed');

-- Seed pricing packages from existing data
INSERT INTO public.pricing_packages (name, description, original_price, discount_price, features, icon, is_popular, display_order) VALUES
('Basic Design Website', 'Perfect for small businesses and startups', 16999, 7999, ARRAY['Professional Website Design', 'Free Domain for 1 Year', 'Web Hosting Included', 'SSL Certificate', 'Mobile Responsive', 'SEO Optimized', 'Contact Form', 'Social Media Integration'], 'Globe', false, 1),
('Interactive & Creative Website', 'Enhanced features for growing businesses', 28999, 19999, ARRAY['All Basic Features', 'Interactive Elements', 'Custom Animations', 'Advanced Design', 'Malware Security', 'Performance Optimization', 'Analytics Integration', 'Email Setup', 'Priority Support'], 'Zap', true, 2),
('E-commerce Platform', 'Complete online store solution', 80000, 49999, ARRAY['Full E-commerce Setup', 'Product Catalog', 'Shopping Cart', 'Payment Gateway', 'Inventory Management', 'Order Management', 'Customer Dashboard', 'Advanced Security', 'Multi-currency Support'], 'Shield', false, 3),
('Portfolio Showcase', 'Professional portfolio websites', 18999, 9999, ARRAY['Creative Portfolio Design', 'Gallery Management', 'Project Showcase', 'Client Testimonials', 'Blog Integration', 'Custom Branding', 'Performance Optimized', 'SEO Enhanced'], 'Star', false, 4),
('Crypto Trading Portal', 'Advanced cryptocurrency platforms', 500000, 500000, ARRAY['Real-time Crypto Data', 'Trading Interface', 'Portfolio Tracking', 'News Integration', 'Market Analytics', 'User Authentication', 'Advanced Security', 'API Integrations', 'Custom Dashboard'], 'TrendingUp', false, 5),
('AI-Integrated Website', 'Cutting-edge AI-powered websites', 300000, 199999, ARRAY['AI Chatbot Integration', 'Machine Learning Features', 'Personalization Engine', 'Automated Content', 'Smart Analytics', 'Voice Integration', 'Advanced AI Tools', 'Custom AI Models', 'Future-ready Technology'], 'Bot', false, 6),
('Social Media-Based News Website', 'Perfect for news channels, vlogs & social media platforms', 15999, 8599, ARRAY['7 Days Development - Go Live Fast!', 'Automatic Content Fetching', '1 Year Hosting Included', 'Free Domain (.com / .in)', 'SSL Certificate for Security', 'Malware Protection & Security Suite', 'Fully Managed Setup', 'Social Media Integration'], 'Globe', false, 7);
