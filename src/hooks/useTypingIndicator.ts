import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TypingUser {
  user_id: string;
  full_name: string;
}

interface UseTypingIndicatorProps {
  userId: string;
  channelId?: string;
  recipientId?: string;
}

export const useTypingIndicator = ({ userId, channelId, recipientId }: UseTypingIndicatorProps) => {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingUpdateRef = useRef<number>(0);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!channelId && !recipientId) return;

    const filterColumn = channelId ? 'channel_id' : 'recipient_id';
    const filterValue = channelId || recipientId;

    console.log('[TypingIndicator] Setting up subscription:', { filterColumn, filterValue, userId });

    const channel = supabase
      .channel(`typing-${filterValue}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_typing_indicators',
        filter: `${filterColumn}=eq.${filterValue}`
      }, async (payload) => {
        console.log('[TypingIndicator] Received typing event:', payload);
        // Refetch typing users on any change
        await fetchTypingUsers();
      })
      .subscribe((status) => {
        console.log('[TypingIndicator] Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[TypingIndicator] Successfully subscribed to typing indicators');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[TypingIndicator] Failed to subscribe to typing indicators');
        }
      });

    // Initial fetch
    fetchTypingUsers();

    // Cleanup stale indicators every 5 seconds
    const cleanupInterval = setInterval(fetchTypingUsers, 5000);

    return () => {
      console.log('[TypingIndicator] Cleaning up subscription');
      supabase.removeChannel(channel);
      clearInterval(cleanupInterval);
    };
  }, [channelId, recipientId, userId]);

  const fetchTypingUsers = async () => {
    if (!channelId && !recipientId) return;

    try {
      let query = supabase
        .from('chat_typing_indicators')
        .select('user_id, updated_at')
        .eq('is_typing', true)
        .neq('user_id', userId);

      if (channelId) {
        query = query.eq('channel_id', channelId);
      } else if (recipientId) {
        // For DMs, we want to see if the recipient is typing to us
        query = query.eq('user_id', recipientId).eq('recipient_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching typing indicators:', error);
        return;
      }

      // Filter out stale indicators (older than 10 seconds)
      const now = Date.now();
      const activeTypers = (data || []).filter(t => {
        const updatedAt = new Date(t.updated_at).getTime();
        return now - updatedAt < 10000;
      });

      if (activeTypers.length === 0) {
        setTypingUsers([]);
        return;
      }

      // Fetch names for typing users
      const { data: profiles } = await supabase
        .from('staff_profiles')
        .select('user_id, full_name')
        .in('user_id', activeTypers.map(t => t.user_id));

      setTypingUsers(
        (profiles || []).map(p => ({
          user_id: p.user_id,
          full_name: p.full_name || 'Someone'
        }))
      );
    } catch (error) {
      console.error('Error in fetchTypingUsers:', error);
    }
  };

  // Set typing status
  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!userId || (!channelId && !recipientId)) return;

    // Throttle updates to max once per second
    const now = Date.now();
    if (isTyping && now - lastTypingUpdateRef.current < 1000) {
      return;
    }
    lastTypingUpdateRef.current = now;

    console.log('[TypingIndicator] Setting typing status:', { userId, isTyping, channelId, recipientId });

    try {
      const upsertData: any = {
        user_id: userId,
        is_typing: isTyping,
        updated_at: new Date().toISOString()
      };

      if (channelId) {
        upsertData.channel_id = channelId;
      }
      if (recipientId) {
        upsertData.recipient_id = recipientId;
      }

      const { error } = await supabase
        .from('chat_typing_indicators')
        .upsert(upsertData, {
          onConflict: channelId ? 'user_id,channel_id' : 'user_id,recipient_id'
        });

      if (error) {
        console.error('[TypingIndicator] Error setting typing status:', error);
      } else {
        console.log('[TypingIndicator] Successfully updated typing status');
      }
    } catch (error) {
      console.error('[TypingIndicator] Error setting typing status:', error);
    }
  }, [userId, channelId, recipientId]);

  // Handle input change - sets typing and auto-clears after 3 seconds of inactivity
  const handleTyping = useCallback(() => {
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set typing to true
    setTyping(true);

    // Auto-clear after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 3000);
  }, [setTyping]);

  // Stop typing (call when message is sent)
  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setTyping(false);
  }, [setTyping]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Clear typing status when leaving
      setTyping(false);
    };
  }, [setTyping]);

  return {
    typingUsers,
    handleTyping,
    stopTyping
  };
};
