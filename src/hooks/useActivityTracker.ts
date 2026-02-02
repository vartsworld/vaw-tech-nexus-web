import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ActivityTrackerOptions {
  userId: string;
  onStatusChange?: (status: string) => void;
}

export const useActivityTracker = ({ userId, onStatusChange }: ActivityTrackerOptions) => {
  const lastActivityRef = useRef<Date>(new Date());
  const statusCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activityUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update last activity timestamp
  const updateActivity = async () => {
    if (!userId) return;
    
    lastActivityRef.current = new Date();
    
    try {
      // Update presence status in database
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
  };

  // Check status based on inactivity duration
  const checkAndUpdateStatus = async () => {
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

      // Determine status based on inactivity
      if (presenceData.current_status === 'coffee_break') {
        // Don't change status if on break
        return;
      }

      if (hoursInactive >= 5) {
        newStatus = 'sleeping';
        // Auto-logout after 5 hours
        await handleAutoLogout();
      } else if (hoursInactive >= 4) {
        newStatus = 'resting';
      } else if (hoursInactive >= 3) {
        newStatus = 'afk';
      } else {
        newStatus = 'online';
      }

      // Update status if changed
      if (newStatus !== presenceData.current_status) {
        await updateUserStatus(newStatus);
        if (onStatusChange) {
          onStatusChange(newStatus);
        }
      }
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  // Update user status
  const updateUserStatus = async (status: string) => {
    try {
      // Generate reactivation code for AFK/Resting/Sleeping
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

      // Log activity change
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

  // Handle auto-logout after 5 hours
  const handleAutoLogout = async () => {
    try {
      // Log the logout event
      await supabase
        .from('user_activity_log')
        .insert({
          user_id: userId,
          activity_type: 'logout',
          timestamp: new Date().toISOString(),
          metadata: { reason: 'auto_logout_inactivity' }
        });

      // Sign out
      await supabase.auth.signOut();
      
      // Redirect to login
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

    // Track user activity
    const handleActivity = () => {
      updateActivity();
    };

    // Listen to mouse, keyboard, and touch events
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    // Update activity in database every 1 minute (debounced)
    activityUpdateIntervalRef.current = setInterval(updateActivity, 60000);

    // Check status every 30 seconds
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
    };
  }, [userId]);

  return { updateActivity, checkAndUpdateStatus };
};
