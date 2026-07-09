import { useState, useEffect } from "react";
import { useStaffData } from "@/hooks/useStaffData";
import { supabase } from "@/integrations/supabase/client";
import VirtualOfficeLayout from "@/components/staff/VirtualOfficeLayout";
import TeamChat from "@/components/staff/TeamChat";
import TeamStatusSidebar from "@/components/staff/TeamStatusSidebar";
import { MessageSquare, Users, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function InboxPage() {
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
      <div className="space-y-6 max-w-5xl mx-auto py-2">
        <div className="flex flex-col space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-blue-500" />
            Inbox
          </h1>
          <p className="text-xs text-white/40 uppercase tracking-widest font-bold">
            Professional Team Communications & Direct Messages
          </p>
        </div>

        <Tabs defaultValue="channels" className="w-full">
          <TabsList className="bg-black/40 border border-white/5 p-1 rounded-2xl mb-6">
            <TabsTrigger
              value="channels"
              className="rounded-xl text-xs uppercase font-black tracking-wider px-5 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Group Channels
            </TabsTrigger>
            <TabsTrigger
              value="dms"
              className="rounded-xl text-xs uppercase font-black tracking-wider px-5 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all"
            >
              <Users className="w-4 h-4 mr-2" />
              Direct Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="channels" className="mt-0 outline-none">
            <div className="bg-black/30 border border-white/10 rounded-[2.5rem] p-4 lg:p-6 h-[600px] overflow-hidden">
              <TeamChat userId={profile.user_id} userProfile={profile} />
            </div>
          </TabsContent>

          <TabsContent value="dms" className="mt-0 outline-none">
            <div className="bg-black/30 border border-white/10 rounded-[2.5rem] p-4 lg:p-6 h-[600px] overflow-y-auto">
              <TeamStatusSidebar onlineUsers={onlineUsers} currentUserId={profile.user_id} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </VirtualOfficeLayout>
  );
}