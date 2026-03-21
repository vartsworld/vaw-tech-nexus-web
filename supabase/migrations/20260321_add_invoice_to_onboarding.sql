-- Add invoice_id to client_onboarding_links table (external invoice ID)
ALTER TABLE public.client_onboarding_links ADD COLUMN IF NOT EXISTS invoice_id TEXT;
