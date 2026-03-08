import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ActivityTrackerOptions {
  userId: string;
  onStatusChange?: (status: string) => void;
}

export const useActivityTracker = ({ userId, onStatusChange }: ActivityTrackerOptions) => {
  const lastActivityRef = useRef<Date>(new Date());
  const lastDbUpdateRef = useRef<number>(0);
  const statusCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activityUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdateRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced DB write — at most once every 30 seconds
  const updateActivity = useCallback(async () => {
    if (!userId) return;

    const now = Date.now();
    // Skip if we updated less than 30s ago
    if (now - lastDbUpdateRef.current < 30000) return;
    lastDbUpdateRef.current = now;

    try {
      await supabase
        .from('user_presence_status')
        .upsert({
          user_id: userId,
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  }, [userId]);

  // Check status based on inactivity duration
  const checkAndUpdateStatus = useCallback(async () => {
    if (!userId) return;

    try {
      const { data: presenceData, error } = await supabase
        .from('user_presence_status')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !presenceData) return;

      const lastActivity = new Date(presenceData.last_activity_at);
      const now = new Date();
      const hoursInactive = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

      let newStatus = presenceData.current_status;

      if (presenceData.current_status === 'coffee_break') {
        return;
      }

      if (hoursInactive >= 5) {
        newStatus = 'sleeping';
        await handleAutoLogout();
      } else if (hoursInactive >= 4) {
        newStatus = 'resting';
      } else if (hoursInactive >= 3) {
        newStatus = 'afk';
      } else {
        newStatus = 'online';
      }

      if (newStatus !== presenceData.current_status) {
        await updateUserStatus(newStatus);
        if (onStatusChange) {
          onStatusChange(newStatus);
        }
      }
    } catch (error) {
      console.error('Error checking status:', error);
    }
  }, [userId, onStatusChange]);

  const updateUserStatus = async (status: string) => {
    try {
      const reactivationCode = ['afk', 'resting', 'sleeping'].includes(status)
        ? Math.floor(1000 + Math.random() * 9000)
        : null;

      await supabase
        .from('user_presence_status')
        .upsert({
          user_id: userId,
          current_status: status,
          reactivation_code: reactivationCode,
          updated_at: new Date().toISOString()
        });

      await supabase
        .from('user_activity_log')
        .insert({
          user_id: userId,
          activity_type: status.toLowerCase(),
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handleAutoLogout = async () => {
    try {
      await supabase
        .from('user_activity_log')
        .insert({
          user_id: userId,
          activity_type: 'logout',
          timestamp: new Date().toISOString(),
          metadata: { reason: 'auto_logout_inactivity' }
        });

      await supabase.auth.signOut();
      window.location.href = '/staff/login';
    } catch (error) {
      console.error('Error during auto-logout:', error);
    }
  };

  useEffect(() => {
    if (!userId) return;

    // Initialize presence status
    const initializePresence = async () => {
      await supabase
        .from('user_presence_status')
        .upsert({
          user_id: userId,
          current_status: 'online',
          last_activity_at: new Date().toISOString(),
          session_start_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    };

    initializePresence();

    // Lightweight local-only activity tracking — schedule a debounced DB write
    const handleActivity = () => {
      lastActivityRef.current = new Date();
      // Schedule a debounced write if not already pending
      if (!pendingUpdateRef.current) {
        pendingUpdateRef.current = setTimeout(() => {
          pendingUpdateRef.current = null;
          updateActivity();
        }, 5000); // batch writes: wait 5s after last interaction
      }
    };

    window.addEventListener('mousemove', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('click', handleActivity, { passive: true });
    window.addEventListener('touchstart', handleActivity, { passive: true });

    // Periodic DB update every 60s
    activityUpdateIntervalRef.current = setInterval(updateActivity, 60000);

    // Check status every 30s
    statusCheckIntervalRef.current = setInterval(checkAndUpdateStatus, 30000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);

      if (activityUpdateIntervalRef.current) {
        clearInterval(activityUpdateIntervalRef.current);
      }
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
      }
      if (pendingUpdateRef.current) {
        clearTimeout(pendingUpdateRef.current);
      }
    };
  }, [userId, updateActivity, checkAndUpdateStatus]);

  return { updateActivity, checkAndUpdateStatus };
};
