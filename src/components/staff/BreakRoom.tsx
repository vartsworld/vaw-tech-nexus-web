import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Coffee, Gamepad2, MessageCircle, Zap, Trophy, Loader2 } from "lucide-react";
import { useStaffData } from "@/hooks/useStaffData";
import MusicPlayer from "./MusicPlayer";
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
        activity_type: 'break_start',
        timestamp: new Date().toISOString(),
        duration_minutes: breakDuration
      });

    if (onStatusChange) onStatusChange('coffee_break');
    toast.success(`Break started! Enjoy your ${breakDuration}-minute break ☕`);
  };

  const pauseBreak = async () => {
    setIsBreakActive(false);

    // Update status back to online when paused
    await supabase
      .from('user_presence_status')
      .update({ current_status: 'online' })
      .eq('user_id', userId);

    if (onStatusChange) onStatusChange('online');
    toast.info("Break paused - Returned to work mode");
  };

  const resetBreak = async () => {
    setIsBreakActive(false);
    setBreakTimeRemaining(breakDuration * 60);

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
        activity_type: 'break_end',
        timestamp: new Date().toISOString()
      });

    if (onStatusChange) onStatusChange('online');
    toast.success("Back to work! 💼");
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
      <div className="p-6 flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  // Render active game
  if (activeGame !== 'none') {
    return (
      <div className="p-6 flex items-center justify-center min-h-[80vh]">
        {activeGame === 'word-challenge' && <WordChallenge onClose={() => setActiveGame('none')} />}
        {activeGame === 'quick-quiz' && <QuickQuiz onClose={() => setActiveGame('none')} />}
        {activeGame === 'code-puzzle' && <CodePuzzle onClose={() => setActiveGame('none')} />}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Break Room Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Break Room</h2>
        <p className="text-orange-300">Take a breather, connect with your team! ☕</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Team Chat */}
        <Card className="bg-black/20 backdrop-blur-lg border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-400" />
              Team Chat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {chatMessages.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-400 text-sm">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className="bg-white/5 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-blue-300 font-medium text-sm">
                        {msg.profiles?.full_name || msg.profiles?.username || 'Anonymous'}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-white text-sm">{msg.message}</p>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-white/10 border-white/20 text-white placeholder-gray-400"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button
                size="sm"
                className="bg-blue-500 hover:bg-blue-600"
                onClick={handleSendMessage}
                disabled={sendingMessage || !newMessage.trim()}
              >
                {sendingMessage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Send'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 2. Coffee Break Timer */}
        <Card className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/30">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <Coffee className={`w-16 h-16 mx-auto mb-2 transition-colors ${isBreakActive ? 'text-orange-400 animate-pulse' : 'text-orange-400'}`} />
              <h3 className="text-white font-bold text-lg">Coffee Break Timer</h3>

              {/* Timer Display */}
              <div className={`text-5xl font-bold ${getTimerColor()} transition-colors`}>
                {formatTime(breakTimeRemaining)}
              </div>

              {/* Duration Selection */}
              {!isBreakActive && (
                <div className="flex gap-2 justify-center">
                  {[5, 10, 15, 20].map((mins) => (
                    <Button
                      key={mins}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBreakDuration(mins);
                        setBreakTimeRemaining(mins * 60);
                      }}
                      className={`${breakDuration === mins
                          ? 'bg-orange-500/40 border-orange-400 text-white'
                          : 'bg-orange-500/10 border-orange-500/30 text-orange-300'
                        } hover:bg-orange-500/30`}
                    >
                      {mins}m
                    </Button>
                  ))}
                </div>
              )}

              {/* Control Buttons */}
              <div className="flex flex-col gap-2">
                {!isBreakActive ? (
                  <Button
                    onClick={startBreak}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
                  >
                    Start Break
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={resetBreak}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
                    >
                      Back to Work
                    </Button>
                    <Button
                      onClick={pauseBreak}
                      variant="outline"
                      size="sm"
                      className="w-full bg-orange-500/20 border-orange-500/30 text-orange-300 hover:bg-orange-500/30"
                    >
                      Pause & Return
                    </Button>
                  </>
                )}
              </div>

              {/* Progress Bar */}
              {isBreakActive && (
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-400 to-red-400 h-full transition-all duration-1000"
                    style={{
                      width: `${((breakDuration * 60 - breakTimeRemaining) / (breakDuration * 60)) * 100}%`
                    }}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 3. Lofi Music Player */}
        <MusicPlayer />
      </div>

      {/* 4. Team Games - Second Row */}
      <Card className="bg-black/20 backdrop-blur-lg border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-purple-400" />
            Team Games
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map((game, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10 flex flex-col justify-between">
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-white font-medium text-base sm:text-lg">{game.name}</h4>
                    <span className="px-2 py-1 rounded text-[10px] font-medium bg-green-500/20 text-green-300">
                      {game.status}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs sm:text-sm">{game.difficulty} • {game.players} players</p>
                  <p className="text-gray-500 text-xs mt-2 line-clamp-2">{game.description}</p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full bg-purple-500/20 border-purple-500/30 text-purple-300 hover:bg-purple-500/30 font-medium"
                  onClick={() => setActiveGame(game.id)}
                >
                  Play Now
                </Button>
              </div>
            ))}
          </div>

          <Button className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/20">
            <Zap className="w-4 h-4 mr-2" />
            Create New Game
          </Button>
        </CardContent>
      </Card>

      {/* 5. Weekly Leaderboard - Third Row */}
      <Card className="bg-black/20 backdrop-blur-lg border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Weekly Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {teamMembers.map((member, index) => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-gray-400 text-black' :
                        index === 2 ? 'bg-orange-500 text-black' :
                          'bg-gray-600 text-white'
                    }`}>
                    {index + 1}
                  </span>
                  <span className="text-white font-medium text-sm">
                    {member.full_name || member.username}
                  </span>
                </div>
                <span className="text-yellow-300 font-bold">${member.earnings}</span>
              </div>
            ))}
            {teamMembers.length === 0 && (
              <div className="text-center py-4 col-span-full">
                <p className="text-gray-400 text-sm">No team members yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BreakRoom;
