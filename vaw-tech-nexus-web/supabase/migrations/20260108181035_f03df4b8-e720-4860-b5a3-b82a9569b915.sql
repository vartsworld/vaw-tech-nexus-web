-- 1. Delete duplicate general chat channel (keep the first one created)
DELETE FROM chat_channels 
WHERE is_general = true 
AND id != (SELECT id FROM chat_channels WHERE is_general = true ORDER BY created_at ASC LIMIT 1);

-- 2. Create task-attachments storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Create storage policy for task-attachments
CREATE POLICY "Users can upload task attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'task-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view task attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'task-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own task attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'task-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4. Ensure RLS is enabled on user_coin_transactions
ALTER TABLE public.user_coin_transactions ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for user_coin_transactions if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_coin_transactions' AND policyname = 'Users can view own transactions'
  ) THEN
    CREATE POLICY "Users can view own transactions"
    ON public.user_coin_transactions FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_coin_transactions' AND policyname = 'Users can insert own transactions'
  ) THEN
    CREATE POLICY "Users can insert own transactions"
    ON public.user_coin_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- 6. Add source_type column to user_coin_transactions if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_coin_transactions' AND column_name = 'source_type'
  ) THEN
    ALTER TABLE public.user_coin_transactions ADD COLUMN source_type TEXT;
  END IF;
END$$;

-- 7. Ensure chat_messages RLS allows reading messages for channels user has access to
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view channel messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view direct messages" ON public.chat_messages;

-- Allow users to view messages in channels they have access to
CREATE POLICY "Users can view channel messages"
ON public.chat_messages FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- Channel messages: user can see if channel is general or matches their department
    channel_id IS NOT NULL
    OR 
    -- Direct messages: user is sender or recipient
    (recipient_id IS NOT NULL AND (sender_id = auth.uid() OR recipient_id = auth.uid()))
  )
);

-- Allow authenticated users to send messages
CREATE POLICY "Users can send messages"
ON public.chat_messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- 8. Ensure reward_catalog has proper RLS
ALTER TABLE public.reward_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view available rewards" ON public.reward_catalog;
CREATE POLICY "Anyone can view available rewards"
ON public.reward_catalog FOR SELECT
USING (is_available = true OR auth.uid() IS NOT NULL);

-- 9. Ensure reward_redemptions has proper RLS
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own redemptions" ON public.reward_redemptions;
DROP POLICY IF EXISTS "Users can create redemptions" ON public.reward_redemptions;

CREATE POLICY "Users can view own redemptions"
ON public.reward_redemptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create redemptions"
ON public.reward_redemptions FOR INSERT
WITH CHECK (auth.uid() = user_id);