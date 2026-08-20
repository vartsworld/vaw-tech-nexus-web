import { useState, useEffect } from "react";
import { useStaffData } from "@/hooks/useStaffData";
import { supabase } from "@/integrations/supabase/client";
import VirtualOfficeLayout from "@/components/staff/VirtualOfficeLayout";
import { Loader2, Gamepad2, Swords, Circle, Minus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function ArcadePage() {
  const { profile, loading } = useStaffData();
  const [onlineUsers, setOnlineUsers] = useState<Record<string, any>>({});
  const navigate = useNavigate();

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

  const games = [
    {
      id: "chess",
      title: "Chess",
      description: "Realtime multiplayer battles and strategic practice",
      icon: Swords,
      color: "from-amber-500 to-amber-700",
      path: "/staff/arcade/chess",
      available: true
    },
    {
      id: "tictactoe",
      title: "Tic Tac Toe",
      description: "Classic X's and O's multiplayer logic game",
      icon: Circle,
      color: "from-blue-500 to-blue-700",
      path: "#",
      available: false
    },
    {
      id: "pingpong",
      title: "Ping Pong",
      description: "Fast-paced arcade action table tennis",
      icon: Minus,
      color: "from-green-500 to-green-700",
      path: "#",
      available: false
    }
  ];

  return (
    <VirtualOfficeLayout
      currentRoom="arcade"
      onRoomChange={() => {}}
      onlineUsers={onlineUsers}
      userId={profile.user_id}
      userProfile={profile}
    >
      <div className="space-y-6 max-w-5xl mx-auto py-2 px-4 sm:px-6">
        <div className="flex flex-col space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Gamepad2 className="w-8 h-8 text-blue-500" />
            Arcade
          </h1>
          <p className="text-xs text-white/40 uppercase tracking-widest font-bold">
            Select a game to play with colleagues or AI
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {games.map((game) => (
            <div
              key={game.id}
              className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 p-6 rounded-3xl flex flex-col items-center text-center transition-all hover:bg-zinc-800/60 hover:scale-[1.02] hover:border-white/20"
            >
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center shadow-lg mb-6`}>
                <game.icon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{game.title}</h3>
              <p className="text-sm text-white/60 mb-8 flex-1">{game.description}</p>

              <Button
                onClick={() => game.available ? navigate(game.path) : null}
                disabled={!game.available}
                className="w-full rounded-xl font-bold uppercase tracking-wider"
                variant={game.available ? "default" : "secondary"}
              >
                {game.available ? "Play Now" : "Coming Soon"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </VirtualOfficeLayout>
  );
}
