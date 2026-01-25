-- Create typing indicators table for real-time chat typing status
CREATE TABLE public.chat_typing_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  recipient_id UUID, -- For DMs
  is_typing BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint to ensure one record per user per channel/recipient
CREATE UNIQUE INDEX idx_typing_user_channel ON public.chat_typing_indicators(user_id, channel_id) WHERE channel_id IS NOT NULL;
CREATE UNIQUE INDEX idx_typing_user_recipient ON public.chat_typing_indicators(user_id, recipient_id) WHERE recipient_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.chat_typing_indicators ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view typing indicators
CREATE POLICY "Users can view typing indicators"
ON public.chat_typing_indicators
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Allow users to manage their own typing status
CREATE POLICY "Users can manage own typing status"
ON public.chat_typing_indicators
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Enable realtime for typing indicators
ALTER PUBLICATION supabase_realtime ADD TABLE chat_typing_indicators;

-- Create function to auto-cleanup stale typing indicators (older than 10 seconds)
CREATE OR REPLACE FUNCTION public.cleanup_stale_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM public.chat_typing_indicators 
  WHERE updated_at < NOW() - INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;