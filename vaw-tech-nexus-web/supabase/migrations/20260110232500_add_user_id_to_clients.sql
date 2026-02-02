-- Add user_id column to clients table to link with auth.users
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);

-- Disable RLS on this table again to be sure, although previously requested
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
