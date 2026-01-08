-- Create user_coin_transactions table if not exists
CREATE TABLE IF NOT EXISTS public.user_coin_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  coins INTEGER NOT NULL,
  transaction_type TEXT NOT NULL DEFAULT 'earning',
  description TEXT,
  source_type TEXT,
  source_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_coin_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions" 
ON public.user_coin_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own transactions
CREATE POLICY "Users can insert own transactions" 
ON public.user_coin_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- HR can view all transactions
CREATE POLICY "HR can view all transactions" 
ON public.user_coin_transactions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM staff_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('hr', 'admin')
  )
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user ON public.user_coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_created ON public.user_coin_transactions(created_at DESC);

-- Create chat channels for departments if they don't exist
INSERT INTO public.chat_channels (name, description, department_id, is_general)
SELECT 
  d.name,
  'Department chat for ' || d.name,
  d.id,
  false
FROM departments d
WHERE NOT EXISTS (
  SELECT 1 FROM chat_channels cc WHERE cc.department_id = d.id
);