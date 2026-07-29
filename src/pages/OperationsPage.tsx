import { useState, useEffect } from "react";
import { useStaffData } from "@/hooks/useStaffData";
import { supabase } from "@/integrations/supabase/client";
import VirtualOfficeLayout from "@/components/staff/VirtualOfficeLayout";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutDashboard, Loader2, Cpu, TrendingUp, ShieldAlert, Award } from "lucide-react";

export default function OperationsPage() {
  const { profile, loading } = useStaffData();
  const [onlineUsers, setOnlineUsers] = useState<Record<string, any>>({});

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

  const METRICS = [
    { label: "Pipeline Load", value: "84%", trend: "Optimal Capacity", icon: Cpu, color: "text-blue-400" },
    { label: "Service Availability", value: "99.98%", trend: "Excellent SLA", icon: TrendingUp, color: "text-emerald-400" },
    { label: "Active Escalations", value: "0 Cases", trend: "All Cleared", icon: ShieldAlert, color: "text-amber-400" },
    { label: "Redemption Pool", value: "₹4,25,000", trend: "Fully Funded", icon: Award, color: "text-purple-400" },
  ];

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
            <LayoutDashboard className="w-8 h-8 text-blue-500" />
            Operations Overview
          </h1>
          <p className="text-xs text-white/40 uppercase tracking-widest font-bold">
            Real-time tracking of department metrics and performance standards
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {METRICS.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <Card key={idx} className="bg-black/30 border-white/10 text-white rounded-[2rem]">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-white/40">{metric.label}</span>
                    <Icon className={`w-5 h-5 ${metric.color}`} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">{metric.value}</h3>
                    <p className="text-[9px] font-bold text-white/30 uppercase mt-0.5">{metric.trend}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </VirtualOfficeLayout>
  );
}