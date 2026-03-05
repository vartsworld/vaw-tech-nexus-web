-- Increase column length for sync IDs to accommodate longer mocked codes and real external IDs
ALTER TABLE public.clients ALTER COLUMN billing_sync_id TYPE TEXT;
ALTER TABLE public.client_profiles ALTER COLUMN billing_sync_id TYPE TEXT;

-- Ensure indexes are present
CREATE INDEX IF NOT EXISTS idx_clients_billing_sync_id ON public.clients(billing_sync_id);
CREATE INDEX IF NOT EXISTS idx_client_profiles_billing_sync_id ON public.client_profiles(billing_sync_id);
