ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS billing_sync_id VARCHAR(6) UNIQUE;
ALTER TABLE public.client_profiles ADD COLUMN IF NOT EXISTS billing_sync_id VARCHAR(6) UNIQUE;

-- Optional: Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_billing_sync_id ON public.clients(billing_sync_id);
CREATE INDEX IF NOT EXISTS idx_client_profiles_billing_sync_id ON public.client_profiles(billing_sync_id);
