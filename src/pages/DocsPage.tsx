import { useState, useEffect } from "react";
import { useStaffData } from "@/hooks/useStaffData";
import { supabase } from "@/integrations/supabase/client";
import VirtualOfficeLayout from "@/components/staff/VirtualOfficeLayout";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Loader2, BookOpen, Key, Sparkles, AlertCircle } from "lucide-react";

export default function DocsPage() {
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

  const DOCS = [
    {
      title: "VAW Coin Economy Guidelines",
      desc: "Comprehensive manual explaining the correlation between VAW Coin productivity, INR redemption, and reward standards.",
      icon: Sparkles,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20"
    },
    {
      title: "Vite & React Development Best Practices",
      desc: "Code standards, state-management policies, Supabase client subscription cleanup requirements, and design protocols.",
      icon: BookOpen,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20"
    },
    {
      title: "Security & Credential Vault Access",
      desc: "Protocols on environment variables, private access credentials, and user data privacy standards inside Bondify.",
      icon: Key,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    },
    {
      title: "Escalation Matrix & Core Directives",
      desc: "Emergency contact protocols, departmental head reviews, and standard code review workflows.",
      icon: AlertCircle,
      color: "text-red-400 bg-red-500/10 border-red-500/20"
    }
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
            <FileText className="w-8 h-8 text-blue-500" />
            Documents Nexus
          </h1>
          <p className="text-xs text-white/40 uppercase tracking-widest font-bold">
            Central repository of manuals, specifications, and code policies
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {DOCS.map((doc, idx) => {
            const Icon = doc.icon;
            return (
              <Card key={idx} className="bg-black/30 border-white/10 text-white rounded-[2.5rem] hover:bg-white/[0.04] transition-all cursor-pointer group">
                <CardContent className="p-6 space-y-4">
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${doc.color} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors leading-snug">{doc.title}</h3>
                    <p className="text-xs text-white/50 leading-relaxed">{doc.desc}</p>
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