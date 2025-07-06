import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Users, Trophy, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MiniChessProps {
  userId: string;
  userProfile: any;
}

const MiniChess = ({ userId, userProfile }: MiniChessProps) => {
  const [isLookingForGame, setIsLookingForGame] = useState(false);
  const [currentGame, setCurrentGame] = useState<any>(null);
  const { toast } = useToast();

  const findGame = async () => {
    setIsLookingForGame(true);
    try {
      // For now, we'll show a placeholder chess interface
      // In a real implementation, this would connect to a chess engine
      toast({
        title: "Chess Game",
        description: "Looking for an opponent... (Feature coming soon!)",
      });
      
      setTimeout(() => {
        setIsLookingForGame(false);
        toast({
          title: "Chess Feature",
          description: "Full chess implementation is coming soon! For now, enjoy the other features.",
        });
      }, 2000);
    } catch (error) {
      console.error('Error finding chess game:', error);
      setIsLookingForGame(false);
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2">
          <Crown className="w-5 h-5" />
          Mini Chess
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Chess Board Preview */}
        <div className="aspect-square bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg p-2">
          <div className="grid grid-cols-8 h-full w-full">
            {Array.from({ length: 64 }, (_, i) => {
              const row = Math.floor(i / 8);
              const col = i % 8;
              const isDark = (row + col) % 2 === 1;
              
              return (
                <div
                  key={i}
                  className={`flex items-center justify-center text-lg ${
                    isDark ? 'bg-amber-600' : 'bg-amber-100'
                  }`}
                >
                  {/* Sample chess pieces */}
                  {(i === 0 || i === 7) && '♜'}
                  {(i === 1 || i === 6) && '♞'}
                  {(i === 2 || i === 5) && '♝'}
                  {i === 3 && '♛'}
                  {i === 4 && '♚'}
                  {(i >= 8 && i <= 15) && '♟'}
                  {(i >= 48 && i <= 55) && '♙'}
                  {i === 56 && '♖'}
                  {i === 63 && '♖'}
                  {i === 57 && '♘'}
                  {i === 62 && '♘'}
                  {i === 58 && '♗'}
                  {i === 61 && '♗'}
                  {i === 59 && '♕'}
                  {i === 60 && '♔'}
                </div>
              );
            })}
          </div>
        </div>

        {/* Game Controls */}
        <div className="space-y-3">
          <Button
            onClick={findGame}
            disabled={isLookingForGame}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          >
            {isLookingForGame ? (
              <>
                <Users className="w-4 h-4 mr-2 animate-pulse" />
                Looking for opponent...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Find Game
              </>
            )}
          </Button>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white/5 rounded-lg p-2">
              <Trophy className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
              <div className="text-xs text-white/70">Wins</div>
              <div className="text-sm font-bold text-white">0</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <Users className="w-4 h-4 text-blue-400 mx-auto mb-1" />
              <div className="text-xs text-white/70">Games</div>
              <div className="text-sm font-bold text-white">0</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <Crown className="w-4 h-4 text-purple-400 mx-auto mb-1" />
              <div className="text-xs text-white/70">Rating</div>
              <div className="text-sm font-bold text-white">1200</div>
            </div>
          </div>

          <div className="text-xs text-white/50 text-center">
            Play chess with your colleagues during breaks!<br/>
            Win games to earn bonus points and climb the leaderboard.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MiniChess;