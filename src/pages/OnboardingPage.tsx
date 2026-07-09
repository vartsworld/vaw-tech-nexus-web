import { useState, useEffect } from "react";
import { useStaffData } from "@/hooks/useStaffData";
import { supabase } from "@/integrations/supabase/client";
import VirtualOfficeLayout from "@/components/staff/VirtualOfficeLayout";
import ClientOnboardingCreator from "@/components/staff/ClientOnboardingCreator";
import { Compass, Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const { profile, loading } = useStaffData();
  const [onlineUsers, setOnlineUsers] = useState<Record<string, any>>({});

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

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <VirtualOfficeLayout
      currentRoom="workspace"
      onRoomChange={() => {}}
      onlineUsers={onlineUsers}
      userId={profile.user_id}
      userProfile={profile}
    >
      <div className="space-y-6 max-w-4xl mx-auto py-2">
        <div className="flex flex-col space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Compass className="w-8 h-8 text-blue-400" />
            Client Onboarding Portal
          </h1>
          <p className="text-xs text-white/40 uppercase tracking-widest font-bold">
            Generate and manage direct client project initialization channels
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-white/10 rounded-[2.5rem] p-6 lg:p-8 min-h-[500px]">
          <ClientOnboardingCreator userId={profile.user_id} />
        </div>
      </div>
    </VirtualOfficeLayout>
  );
}