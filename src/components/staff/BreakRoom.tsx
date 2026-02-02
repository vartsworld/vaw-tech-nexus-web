import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Coffee, Gamepad2, MessageCircle, Zap, Trophy, Loader2, Star } from "lucide-react";
import { useStaffData } from "@/hooks/useStaffData";

import WordChallenge from "./games/WordChallenge";
import QuickQuiz from "./games/QuickQuiz";
import CodePuzzle from "./games/CodePuzzle";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type ActiveGame = 'none' | 'word-challenge' | 'quick-quiz' | 'code-puzzle';

interface BreakRoomProps {
  breakTimeRemaining: number;
  setBreakTimeRemaining: (value: number | ((prev: number) => number)) => void;
  isBreakActive: boolean;
  setIsBreakActive: (value: boolean) => void;
  breakDuration: number;
  setBreakDuration: (value: number) => void;
  userId: string;
  onStatusChange?: (status: string) => void;
}

const BreakRoom = ({
  breakTimeRemaining,
  setBreakTimeRemaining,
  isBreakActive,
  setIsBreakActive,
  breakDuration,
  setBreakDuration,
  userId,
  onStatusChange
}: BreakRoomProps) => {
  const { chatMessages, teamMembers, loading, sendChatMessage } = useStaffData();
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [activeGame, setActiveGame] = useState<ActiveGame>('none');
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [leaderboardType, setLeaderboardType] = useState<'coins' | 'chess'>('coins');

  useEffect(() => {
    fetchLeaderboard();
  }, [leaderboardType]);

  const fetchLeaderboard = async () => {
    try {
      let data;
      if (leaderboardType === 'coins') {
        const { data: coinData } = await supabase
          .from('top_coin_earners')
          .select('*')
          .limit(5);
        data = coinData?.map(d => ({
          id: d.user_id,
          name: d.full_name,
          value: d.total_coins,
          label: 'Coins'
        }));
      } else {
        const { data: chessData } = await supabase
          .from('chess_leaderboard')
          .select('*')
          .limit(5);
        data = chessData?.map(d => ({
          id: d.user_id,
          name: d.full_name,
          value: d.elo_rating,
          label: 'ELO'
        }));
      }
      setLeaderboard(data || []);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    }
  };

  // Check for active break session on mount
  useEffect(() => {
    checkActiveSession();
  }, [userId]);

  const checkActiveSession = async () => {
    try {
      const { data: session } = await supabase
        .from('break_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (session) {
        setSessionId(session.id);
        setBreakDuration(session.duration_minutes);

        // Calculate remaining time
        const startTime = new Date(session.start_time).getTime();
        const now = new Date().getTime();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        const totalSeconds = session.duration_minutes * 60;
        const remaining = Math.max(0, totalSeconds - elapsedSeconds);

        if (remaining > 0) {
          setBreakTimeRemaining(remaining);
          setIsBreakActive(true);
        } else {
          // Session expired while away
          await completeBreakSession(session.id);
          setIsBreakActive(false);
          setBreakTimeRemaining(0);
        }
      }
    } catch (error) {
      console.error("Error checking break session:", error);
    }
  };

  const completeBreakSession = async (id: string) => {
    await supabase
      .from('break_sessions')
      .update({ status: 'completed', end_time: new Date().toISOString() })
      .eq('id', id);
  };

  const games = [
    {
      id: 'word-challenge' as const,
      name: "Word Challenge",
      players: "3/4",
      status: "Ready",
      difficulty: "Easy",
      description: "Unscramble words related to programming"
    },
    {
      id: 'quick-quiz' as const,
      name: "Quick Quiz",
      players: "2/6",
      status: "Ready",
      difficulty: "Medium",
      description: "Test your programming knowledge"
    },
    {
      id: 'code-puzzle' as const,
      name: "Code Puzzle",
      players: "1/4",
      status: "Ready",
      difficulty: "Hard",
      description: "Fix and complete code snippets"
    }
  ];

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setSendingMessage(true);
    await sendChatMessage(newMessage);
    setNewMessage("");
    setSendingMessage(false);
  };

  // Break timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isBreakActive && breakTimeRemaining > 0) {
      interval = setInterval(() => {
        setBreakTimeRemaining(prev => {
          if (prev <= 1) {
            setIsBreakActive(false);
            toast.success("Break time is over! Time to get back to work 💪", {
              duration: 5000,
            });
            return breakDuration * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBreakActive, breakTimeRemaining, breakDuration]);

  const startBreak = async () => {
    setIsBreakActive(true);

    try {
      // Create new break session
      const { data: session, error } = await supabase
        .from('break_sessions')
        .insert({
          user_id: userId,
          duration_minutes: breakDuration,
          time_remaining_seconds: breakDuration * 60,
          status: 'active',
          break_type: 'coffee'
        })
        .select()
        .single();

      if (error) throw error;
      if (session) setSessionId(session.id);

      // Update status to coffee_break
      await supabase
        .from('user_presence_status')
        .update({ current_status: 'coffee_break' })
        .eq('user_id', userId);

      // Log break start
      await supabase
        .from('user_activity_log')
        .insert({
          user_id: userId,
          activity_type: 'break_started', // Fixed activity type
          metadata: { duration_minutes: breakDuration }
        });

      if (onStatusChange) onStatusChange('coffee_break');
      toast.success(`Break started! Enjoy your ${breakDuration}-minute break ☕`);
    } catch (error) {
      console.error('Error starting break:', error);
      toast.error('Failed to start break session');
      setIsBreakActive(false);
    }
  };

  const pauseBreak = async () => {
    setIsBreakActive(false);

    try {
      if (sessionId) {
        await supabase
          .from('break_sessions')
          .update({
            status: 'paused',
            time_remaining_seconds: breakTimeRemaining
          })
          .eq('id', sessionId);
      }

      // Update status back to online when paused
      await supabase
        .from('user_presence_status')
        .update({ current_status: 'online' })
        .eq('user_id', userId);

      if (onStatusChange) onStatusChange('online');
      toast.info("Break paused - Returned to work mode");
    } catch (error) {
      console.error('Error pausing break:', error);
    }
  };

  const resetBreak = async () => {
    setIsBreakActive(false);
    setBreakTimeRemaining(breakDuration * 60);

    try {
      if (sessionId) {
        await completeBreakSession(sessionId);
        setSessionId(null);
      }

      // Update status back to online
      await supabase
        .from('user_presence_status')
        .update({ current_status: 'online' })
        .eq('user_id', userId);

      // Log break end
      await supabase
        .from('user_activity_log')
        .insert({
          user_id: userId,
          activity_type: 'break_ended', // Fixed activity type
          metadata: { duration_minutes: breakDuration }
        });

      if (onStatusChange) onStatusChange('online');
      toast.success("Back to work! 💼");
    } catch (error) {
      console.error('Error ending break:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (!isBreakActive) return 'text-green-300';
    if (breakTimeRemaining <= 120) return 'text-red-400';
    return 'text-orange-300';
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto" />
          <p className="text-white/60 font-bold uppercase tracking-widest animate-pulse">Entering Break Room...</p>
        </div>
      </div>
    );
  }

  // Render active game
  if (activeGame !== 'none') {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[80vh]">
        {activeGame === 'word-challenge' && <WordChallenge onClose={() => setActiveGame('none')} userId={userId} />}
        {activeGame === 'quick-quiz' && <QuickQuiz onClose={() => setActiveGame('none')} userId={userId} />}
        {activeGame === 'code-puzzle' && <CodePuzzle onClose={() => setActiveGame('none')} userId={userId} />}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-10 relative z-10 flex flex-col min-h-full">
      {/* Break Room Header */}
      <div className="text-center space-y-2 py-4">
        <h2 className="text-4xl sm:text-6xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] tracking-tight uppercase">BREAK <span className="text-orange-500">ROOM</span></h2>
        <div className="inline-block relative">
          <div className="absolute inset-0 bg-orange-500/20 blur-lg rounded-full"></div>
          <p className="relative text-white font-bold bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-orange-500/30 shadow-xl">
            Take a breather, connect with your team! ☕
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch flex-1">
        {/* 1. Team Chat */}
        <div className="xl:col-span-5 h-full flex flex-col min-h-[500px]">
          <Card className="bg-black/60 backdrop-blur-xl border-white/10 h-full shadow-2xl flex flex-col overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-white/10 py-4">
              <CardTitle className="text-white flex items-center gap-2 text-xl font-black italic">
                <MessageCircle className="w-6 h-6 text-blue-500" />
                TEAM MESSAGES
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col flex-1">
              <div className="flex-1 space-y-4 mb-4 overflow-y-auto pr-2 custom-scrollbar min-h-[350px]">
                {!chatMessages || chatMessages.length === 0 ? (
                  <div className="text-center py-20">
                    <MessageCircle className="w-12 h-12 text-white/10 mx-auto mb-4" />
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">No signals yet...</p>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:border-white/20 transition-all group">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-blue-500 font-black text-xs uppercase tracking-tighter">
                          {msg.profiles?.full_name || msg.profiles?.username || 'ANONYMOUS'}
                        </span>
                        <span className="text-white/20 text-[10px] font-mono font-bold">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-white/80 text-sm leading-relaxed font-medium">{msg.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-white/10">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Broadcast a message..."
                  className="flex-1 bg-white/5 border-white/10 text-white placeholder-gray-600 focus:ring-blue-500/50 h-12 rounded-xl"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button
                  className="bg-blue-600 hover:bg-blue-700 h-12 px-6 rounded-xl shadow-lg shadow-blue-500/20 font-black"
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !newMessage.trim()}
                >
                  {sendingMessage ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SEND'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 2. Coffee Break Timer */}
        <div className="xl:col-span-7 h-full">
          <Card className="bg-zinc-900 border-orange-500/20 shadow-2xl overflow-hidden relative group h-full min-h-[500px]">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-red-500/10 pointer-events-none"></div>
            <CardContent className="p-10 relative z-10 h-full flex flex-col justify-center">
              <div className="text-center space-y-8">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-orange-500/30 blur-3xl rounded-full scale-150 animate-pulse"></div>
                  <Coffee className={`w-32 h-32 mx-auto transition-all relative z-10 ${isBreakActive ? 'text-orange-400 animate-bounce' : 'text-orange-500'}`} />
                </div>

                <div>
                  <h3 className="text-white font-black text-5xl tracking-tighter italic leading-none">COFFEE <span className="text-orange-500 underline decoration-orange-500/50">BREAK</span></h3>
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                    <div className={`w-2 h-2 rounded-full ${isBreakActive ? 'bg-orange-500 animate-ping' : 'bg-gray-600'}`}></div>
                    <span className="text-orange-400/80 text-[10px] font-bold tracking-[0.2em] uppercase">{isBreakActive ? 'Active Session' : 'Standby'}</span>
                  </div>
                </div>

                {/* Timer Display */}
                <div className={`text-9xl font-black font-mono tracking-tighter ${getTimerColor()} drop-shadow-[0_8px_8px_rgba(0,0,0,0.6)] leading-none select-none`}>
                  {formatTime(breakTimeRemaining)}
                </div>

                {/* Duration Selection */}
                {!isBreakActive && (
                  <div className="flex gap-3 justify-center">
                    {[5, 10, 15, 20].map((mins) => (
                      <Button
                        key={mins}
                        variant="outline"
                        size="lg"
                        onClick={() => {
                          setBreakDuration(mins);
                          setBreakTimeRemaining(mins * 60);
                        }}
                        className={`h-14 w-20 rounded-2xl font-black transition-all text-xl border-2 ${breakDuration === mins
                          ? 'bg-orange-500 border-orange-400 text-white shadow-2xl shadow-orange-500/50 scale-110'
                          : 'bg-white/5 border-white/10 text-white/30 hover:bg-white/10 hover:text-white'
                          }`}
                      >
                        {mins}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Control Buttons */}
                <div className="flex flex-col gap-4 pt-4 max-w-sm mx-auto w-full">
                  {!isBreakActive ? (
                    <Button
                      onClick={startBreak}
                      className="w-full h-16 text-2xl font-black uppercase tracking-widest bg-orange-500 hover:bg-orange-600 text-white shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:shadow-[0_0_40px_rgba(249,115,22,0.5)] transition-all rounded-2xl"
                    >
                      IGNITE BREAK
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={resetBreak}
                        className="w-full h-16 text-2xl font-black uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_30px_rgba(16,185,129,0.3)] rounded-2xl"
                      >
                        BACK TO WORK
                      </Button>
                      <Button
                        onClick={pauseBreak}
                        variant="outline"
                        className="w-full h-12 font-bold uppercase tracking-widest border-orange-500/30 text-orange-400 hover:bg-orange-500/10 rounded-2xl"
                      >
                        TEMP PAUSE
                      </Button>
                    </>
                  )}
                </div>

                {/* Progress Bar */}
                {isBreakActive && (
                  <div className="w-full max-w-md mx-auto bg-black/60 rounded-full h-5 border-2 border-white/5 p-1 mt-6 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-orange-400 via-red-500 to-orange-400 h-full rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(249,115,22,0.6)]"
                      style={{
                        width: `${((breakDuration * 60 - breakTimeRemaining) / (breakDuration * 60)) * 100}%`,
                        backgroundSize: '200% 100%',
                        animation: 'gradient-move 2s linear infinite'
                      }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>



      {/* 4. Team Games & Leaderboard Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
        <Card className="bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden">
          <CardHeader className="bg-white/5 border-b border-white/10">
            <CardTitle className="text-white flex items-center gap-3 text-xl font-bold uppercase tracking-tight">
              <Gamepad2 className="w-6 h-6 text-purple-500" />
              TEAM CHALLENGES
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {games.map((game, index) => (
                <div key={index} className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col justify-between hover:bg-white/10 transition-all group">
                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-white font-black text-lg group-hover:text-purple-400 transition-colors uppercase">{game.name}</h4>
                      <div className="px-2 py-0.5 rounded-full text-[9px] font-black bg-green-500/10 text-green-400 border border-green-500/20 uppercase">
                        {game.status}
                      </div>
                    </div>
                    <div className="flex gap-2 mb-3">
                      <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-bold uppercase">{game.difficulty}</span>
                      <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-bold uppercase">{game.players}</span>
                    </div>
                    <p className="text-gray-500 text-xs leading-relaxed font-medium">{game.description}</p>
                  </div>

                  <Button
                    size="sm"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl shadow-lg shadow-purple-500/20"
                    onClick={() => setActiveGame(game.id)}
                  >
                    PLAY NOW
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden">
          <CardHeader className="bg-white/5 border-b border-white/10">
            <CardTitle className="text-white flex items-center gap-3 text-xl font-bold uppercase tracking-tight">
              <Trophy className="w-6 h-6 text-yellow-500" />
              HALL OF FAME
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex gap-2 mb-4">
              <Button
                variant={leaderboardType === 'coins' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLeaderboardType('coins')}
                className="flex-1 text-xs font-bold uppercase"
              >
                Top Earners
              </Button>
              <Button
                variant={leaderboardType === 'chess' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLeaderboardType('chess')}
                className="flex-1 text-xs font-bold uppercase"
              >
                Chess Masters
              </Button>
            </div>

            <div className="space-y-3">
              {leaderboard.length === 0 ? (
                <div className="text-center py-10 opacity-20">
                  <Trophy className="w-12 h-12 mx-auto mb-2" />
                  <p className="font-bold text-xs uppercase tracking-widest">Awaiting legends...</p>
                </div>
              ) : (
                leaderboard.map((member, index) => (
                  <div key={member.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all hover:translate-x-1 duration-300">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shadow-lg ${index === 0 ? 'bg-yellow-500 text-black scale-110 ring-4 ring-yellow-500/20' :
                        index === 1 ? 'bg-zinc-400 text-black' :
                          index === 2 ? 'bg-orange-600 text-white' :
                            'bg-zinc-800 text-white'
                        }`}>
                        {index + 1}
                      </div>
                      <div>
                        <span className="text-white font-black text-sm uppercase tracking-tight">
                          {member.name || 'ANONYMOUS'}
                        </span>
                        <div className="flex gap-2 mt-0.5">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          <span className="text-[9px] text-zinc-500 font-bold uppercase">{member.label}: {member.value}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-yellow-500 font-black text-lg leading-none">{member.value}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <style>{`
        @keyframes gradient-move {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};

export default BreakRoom;
