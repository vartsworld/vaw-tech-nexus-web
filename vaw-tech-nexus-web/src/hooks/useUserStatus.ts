import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useUserStatus = (userId: string) => {
  const [status, setStatus] = useState<string>('online');
  const [reactivationCode, setReactivationCode] = useState<number | null>(null);
  const [lastActivityAt, setLastActivityAt] = useState<Date>(new Date());

  useEffect(() => {
    if (!userId) return;

    // Fetch initial status
    const fetchStatus = async () => {
      const { data, error } = await supabase
        .from('user_presence_status')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (data && !error) {
        setStatus(data.current_status);
        setReactivationCode(data.reactivation_code);
        setLastActivityAt(new Date(data.last_activity_at));
      }
    };

    fetchStatus();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`presence:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence_status',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.new && 'current_status' in payload.new) {
            setStatus(payload.new.current_status as string);
            setReactivationCode(payload.new.reactivation_code as number | null);
            setLastActivityAt(new Date(payload.new.last_activity_at as string));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const updateStatus = async (newStatus: string) => {
    try {
      await supabase
        .from('user_presence_status')
        .update({
          current_status: newStatus,
          updated_at: new Date().toISOString(),
          reactivation_code: null // Clear code when manually updating
        })
        .eq('user_id', userId);

      // Log the status change
      await supabase
        .from('user_activity_log')
        .insert({
          user_id: userId,
          activity_type: newStatus.toLowerCase(),
          timestamp: new Date().toISOString()
        });

      setStatus(newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const reactivate = async (code: number) => {
    try {
      const { data, error } = await supabase
        .from('user_presence_status')
        .select('reactivation_code')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        throw new Error('Failed to verify code');
      }

      if (data.reactivation_code !== code) {
        throw new Error('Invalid code');
      }

      // Update status to online
      await updateStatus('online');

      // Update last activity
      await supabase
        .from('user_presence_status')
        .update({
          last_activity_at: new Date().toISOString(),
          reactivation_code: null
        })
        .eq('user_id', userId);

      // Log reactivation
      await supabase
        .from('user_activity_log')
        .insert({
          user_id: userId,
          activity_type: 'reactivate',
          timestamp: new Date().toISOString(),
          metadata: { code }
        });

      return true;
    } catch (error) {
      console.error('Error reactivating:', error);
      return false;
    }
  };

  return {
    status,
    reactivationCode,
    lastActivityAt,
    updateStatus,
    reactivate
  };
};
