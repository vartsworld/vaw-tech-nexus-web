-- Client referral program
CREATE TABLE IF NOT EXISTS public.client_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id TEXT NOT NULL,              -- client_profiles.id of the referrer
  referral_code TEXT UNIQUE NOT NULL,     -- auto-generated, e.g. REF-XXXXXX
  referred_name TEXT,
  referred_email TEXT,
  referred_phone TEXT,
  referred_company TEXT,
  project_type TEXT,
  project_value DECIMAL(12,2),
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rewarded | rejected
  reward_amount DECIMAL(10,2),
  submitted_via TEXT DEFAULT 'manual',    -- 'manual' | 'link'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.client_referrals ENABLE ROW LEVEL SECURITY;

-- Referrer can see their own referrals
CREATE POLICY "Client can view own referrals" ON public.client_referrals
  FOR SELECT USING (referrer_id = auth.uid()::TEXT OR referrer_id IN (
    SELECT id::TEXT FROM public.client_profiles WHERE user_id = auth.uid()
  ));

-- Referrer can insert referrals
CREATE POLICY "Client can insert referrals" ON public.client_referrals
  FOR INSERT WITH CHECK (referrer_id IN (
    SELECT id::TEXT FROM public.client_profiles WHERE user_id = auth.uid()
  ));

-- Anyone can insert via referral link (public referral submission)
CREATE POLICY "Anyone can submit via referral link" ON public.client_referrals
  FOR INSERT WITH CHECK (submitted_via = 'link');

-- Staff/admin can manage all referrals
CREATE POLICY "Staff can manage referrals" ON public.client_referrals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.staff_profiles WHERE user_id = auth.uid())
  );
