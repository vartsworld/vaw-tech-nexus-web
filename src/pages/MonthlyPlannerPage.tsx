import { useState, useEffect } from 'react';
import MonthlyPlanner from '@/components/staff/MonthlyPlanner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import VirtualOfficeLayout from '@/components/staff/VirtualOfficeLayout';

const MonthlyPlannerPage = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, any>>({});

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          const { data, error } = await supabase
            .from('staff_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (error) throw error;
          setProfile(data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

  // Presence tracking for VirtualOfficeLayout
  useEffect(() => {
    if (!profile?.user_id || !profile?.full_name) return;

    const channel = supabase.channel('team-presence');

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineUsers(state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        setOnlineUsers(prev => ({ ...prev, [key]: newPresences }));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => {
          const updated = { ...prev };
          delete updated[key];
          return updated;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: profile.user_id,
            full_name: profile.full_name,
            username: profile.username || 'user',
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.user_id, profile?.full_name]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user || !profile) {
     return (
       <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
         <p>Access Denied. Please login as staff.</p>
       </div>
     );
  }

  return (
    <VirtualOfficeLayout
      currentRoom="planner"
      onRoomChange={() => {}}
      onlineUsers={onlineUsers}
      userId={user.id}
      userProfile={profile}
    >
      <div className="max-w-7xl mx-auto py-2">
        <div className="mb-6">
          <h1 className="text-3xl font-black tracking-tight uppercase italic text-white">
            Monthly <span className="text-blue-500">Planner</span>
          </h1>
          <p className="text-white/40 uppercase text-xs font-bold tracking-[0.2em] mt-1">
            Strategic Company Roadmap & Client Directives
          </p>
        </div>
        <MonthlyPlanner userId={user.id} userProfile={profile} />
      </div>
    </VirtualOfficeLayout>
  );
};

export default MonthlyPlannerPage;