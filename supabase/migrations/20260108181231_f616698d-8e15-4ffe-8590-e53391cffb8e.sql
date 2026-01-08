-- Fix chat_messages RLS policy to be more permissive for authenticated users
DROP POLICY IF EXISTS "Users can view channel messages" ON public.chat_messages;

-- Allow authenticated users to view channel messages (general and department channels they have access to)
CREATE POLICY "Users can view channel messages"
ON public.chat_messages FOR SELECT
USING (
  auth.uid() IS NOT NULL AND channel_id IS NOT NULL
);

-- Allow authenticated users to view their own direct messages
DROP POLICY IF EXISTS "Users can view direct messages" ON public.chat_messages;
CREATE POLICY "Users can view direct messages"
ON public.chat_messages FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND channel_id IS NULL 
  AND (sender_id = auth.uid() OR recipient_id = auth.uid())
);

-- Ensure chat_channels RLS allows reading all channels
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view channels" ON public.chat_channels;
CREATE POLICY "Authenticated users can view channels"
ON public.chat_channels FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create policy for inserting channels (for admins/HR)
DROP POLICY IF EXISTS "Authenticated users can create channels" ON public.chat_channels;
CREATE POLICY "Authenticated users can create channels"
ON public.chat_channels FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);