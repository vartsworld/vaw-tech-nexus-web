import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Crown, 
  Users, 
  Trophy, 
  Play, 
  Bot,
  Shuffle,
  Send,
  X,
  Clock,
  RotateCcw,
  Loader2,
  UserPlus,
  Gamepad2
} from "lucide-react";
import { Chess } from 'chess.js';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MiniChessProps {
  userId: string;
  userProfile: any;
}

interface TeamMember {
  user_id: string;
  full_name: string;
  status: string;
  avatar_url?: string;
}

interface ChessInvite {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  from_profile?: { full_name: string };
}

type GameMode = 'menu' | 'playing' | 'finding';

const MiniChess = ({ userId, userProfile }: MiniChessProps) => {
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [isVsBot, setIsVsBot] = useState(false);
  const [opponentId, setOpponentId] = useState<string | null>(null);
  const [opponentName, setOpponentName] = useState<string>('');
  
  // Chess game state
  const [chess] = useState(new Chess());
  const [board, setBoard] = useState(chess.board());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);
  const [gameHistory, setGameHistory] = useState<string[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  
  // Team & invites
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<ChessInvite[]>([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [isLookingForMatch, setIsLookingForMatch] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({ wins: 0, games: 0, rating: 1200 });

  useEffect(() => {
    fetchTeamMembers();
    fetchPendingInvites();
    fetchStats();

    // Subscribe to chess invites
    const channel = supabase
      .channel('chess_invites_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chess_games'
        },
        () => {
          fetchPendingInvites();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchTeamMembers = async () => {
    try {
      const { data: profiles } = await supabase
        .from('staff_profiles')
        .select('user_id, full_name, avatar_url')
        .neq('user_id', userId);

      const { data: statuses } = await supabase
        .from('user_presence_status')
        .select('user_id, current_status');

      if (profiles) {
        const members: TeamMember[] = profiles.map(profile => {
          const status = statuses?.find(s => s.user_id === profile.user_id);
          return {
            user_id: profile.user_id,
            full_name: profile.full_name,
            status: status?.current_status || 'offline',
            avatar_url: profile.avatar_url
          };
        }).filter(m => m.status === 'online' || m.status === 'active');
        
        setTeamMembers(members);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const fetchPendingInvites = async () => {
    try {
      const { data } = await supabase
        .from('chess_games')
        .select(`
          id,
          player1_id,
          player2_id,
          status,
          created_at
        `)
        .eq('player2_id', userId)
        .eq('status', 'pending');

      if (data) {
        // Fetch player names separately
        const player1Ids = data.map(d => d.player1_id);
        const { data: profiles } = await supabase
          .from('staff_profiles')
          .select('user_id, full_name')
          .in('user_id', player1Ids);

        const invites: ChessInvite[] = data.map(d => {
          const profile = profiles?.find(p => p.user_id === d.player1_id);
          return {
            id: d.id,
            from_user_id: d.player1_id,
            to_user_id: d.player2_id,
            status: d.status as 'pending',
            created_at: d.created_at,
            from_profile: profile ? { full_name: profile.full_name } : undefined
          };
        });
        setPendingInvites(invites);
      }
    } catch (error) {
      console.error('Error fetching invites:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: games } = await supabase
        .from('chess_games')
        .select('winner_id')
        .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
        .eq('status', 'completed');

      if (games) {
        const wins = games.filter(g => g.winner_id === userId).length;
        setStats({
          wins,
          games: games.length,
          rating: 1200 + (wins * 10)
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const startBotGame = () => {
    chess.reset();
    setBoard(chess.board());
    setSelectedSquare(null);
    setPossibleMoves([]);
    setGameHistory([]);
    setIsGameOver(false);
    setWinner(null);
    setIsVsBot(true);
    setOpponentName('Chess Bot');
    setGameMode('playing');
    toast.success("Game started! You play as White.");
  };

  const findRandomMatch = async () => {
    setIsLookingForMatch(true);
    setGameMode('finding');

    try {
      // Look for existing waiting games
      const { data: waitingGames } = await supabase
        .from('chess_games')
        .select('id, player1_id')
        .eq('status', 'waiting')
        .neq('player1_id', userId)
        .limit(1);

      if (waitingGames && waitingGames.length > 0) {
        // Join existing game
        const game = waitingGames[0];
        
        // Get opponent name
        const { data: opponentProfile } = await supabase
          .from('staff_profiles')
          .select('full_name')
          .eq('user_id', game.player1_id)
          .single();

        await supabase
          .from('chess_games')
          .update({ 
            player2_id: userId, 
            status: 'active',
            game_state: { fen: chess.fen(), history: [], turn: 'w' }
          })
          .eq('id', game.id);

        setOpponentId(game.player1_id);
        setOpponentName(opponentProfile?.full_name || 'Opponent');
        setIsVsBot(false);
        chess.reset();
        setBoard(chess.board());
        setGameMode('playing');
        toast.success(`Matched with ${opponentProfile?.full_name || 'opponent'}!`);
      } else {
        // Create waiting game
        const { data: newGame } = await supabase
          .from('chess_games')
          .insert({
            player1_id: userId,
            player2_id: userId, // Placeholder
            status: 'waiting',
            game_state: { fen: chess.fen(), history: [], turn: 'w' }
          })
          .select()
          .single();

        // Wait for opponent (with timeout)
        let matched = false;
        for (let i = 0; i < 20; i++) { // 20 seconds timeout
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { data: updatedGame } = await supabase
            .from('chess_games')
            .select('status, player2_id')
            .eq('id', newGame?.id)
            .single();

          if (updatedGame?.status === 'active' && updatedGame.player2_id !== userId) {
            // Get opponent name
            const { data: oppProfile } = await supabase
              .from('staff_profiles')
              .select('full_name')
              .eq('user_id', updatedGame.player2_id)
              .single();

            setOpponentId(updatedGame.player2_id);
            setOpponentName(oppProfile?.full_name || 'Opponent');
            setIsVsBot(false);
            chess.reset();
            setBoard(chess.board());
            setGameMode('playing');
            toast.success(`Matched with ${oppProfile?.full_name || 'opponent'}!`);
            matched = true;
            break;
          }
        }

        if (!matched) {
          // No match found, cancel and offer bot game
          await supabase.from('chess_games').delete().eq('id', newGame?.id);
          toast.info("No players available. Starting game vs Bot!");
          startBotGame();
        }
      }
    } catch (error) {
      console.error('Error finding match:', error);
      toast.error("Failed to find match. Try again!");
      setGameMode('menu');
    }

    setIsLookingForMatch(false);
  };

  const sendInvite = async (toUserId: string, toUserName: string) => {
    try {
      await supabase
        .from('chess_games')
        .insert({
          player1_id: userId,
          player2_id: toUserId,
          status: 'pending',
          game_state: { fen: chess.fen(), history: [], turn: 'w' }
        });

      toast.success(`Invite sent to ${toUserName}!`);
      setShowInviteDialog(false);
    } catch (error) {
      console.error('Error sending invite:', error);
      toast.error("Failed to send invite");
    }
  };

  const acceptInvite = async (invite: ChessInvite) => {
    try {
      await supabase
        .from('chess_games')
        .update({ status: 'active' })
        .eq('id', invite.id);

      setOpponentId(invite.from_user_id);
      setOpponentName(invite.from_profile?.full_name || 'Opponent');
      setIsVsBot(false);
      chess.reset();
      setBoard(chess.board());
      setGameHistory([]);
      setIsGameOver(false);
      setWinner(null);
      setGameMode('playing');
      
      toast.success(`Game started with ${invite.from_profile?.full_name}!`);
      fetchPendingInvites();
    } catch (error) {
      console.error('Error accepting invite:', error);
      toast.error("Failed to accept invite");
    }
  };

  const declineInvite = async (inviteId: string) => {
    try {
      await supabase
        .from('chess_games')
        .update({ status: 'declined' })
        .eq('id', inviteId);

      toast.info("Invite declined");
      fetchPendingInvites();
    } catch (error) {
      console.error('Error declining invite:', error);
    }
  };

  const handleSquareClick = useCallback((row: number, col: number) => {
    if (isGameOver) return;
    
    // Only allow moves when it's player's turn (white for now)
    if (!isVsBot && chess.turn() !== 'w') return;

    const square = String.fromCharCode(97 + col) + (8 - row);
    
    if (selectedSquare) {
      const move = {
        from: selectedSquare,
        to: square,
        promotion: 'q'
      };

      try {
        const moveResult = chess.move(move);
        if (moveResult) {
          setBoard(chess.board());
          setGameHistory([...gameHistory, moveResult.san]);
          setSelectedSquare(null);
          setPossibleMoves([]);

          if (chess.isGameOver()) {
            setIsGameOver(true);
            if (chess.isCheckmate()) {
              const winnerColor = chess.turn() === 'w' ? 'Black' : 'White';
              setWinner(winnerColor);
              toast.success(`Checkmate! ${winnerColor} wins!`);
            } else {
              toast.info("Game ended in a draw!");
            }
          } else if (isVsBot) {
            // Bot move
            setTimeout(makeBotMove, 500);
          }
        } else {
          setSelectedSquare(null);
          setPossibleMoves([]);
        }
      } catch {
        setSelectedSquare(null);
        setPossibleMoves([]);
      }
    } else {
      const piece = chess.get(square as any);
      if (piece && piece.color === chess.turn()) {
        setSelectedSquare(square);
        const moves = chess.moves({ square: square as any, verbose: true });
        setPossibleMoves(moves.map((move: any) => move.to));
      }
    }
  }, [selectedSquare, chess, gameHistory, isGameOver, isVsBot]);

  const makeBotMove = () => {
    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) return;

    // Simple bot: prioritize captures, then random
    const captures = moves.filter((m: any) => m.captured);
    const selectedMove = captures.length > 0 
      ? captures[Math.floor(Math.random() * captures.length)]
      : moves[Math.floor(Math.random() * moves.length)];

    const moveResult = chess.move(selectedMove);
    setBoard(chess.board());
    setGameHistory(prev => [...prev, moveResult.san]);

    if (chess.isGameOver()) {
      setIsGameOver(true);
      if (chess.isCheckmate()) {
        const winnerColor = chess.turn() === 'w' ? 'Black' : 'White';
        setWinner(winnerColor);
        toast.success(`Checkmate! ${winnerColor} wins!`);
      } else {
        toast.info("Game ended in a draw!");
      }
    }
  };

  const resetGame = () => {
    setGameMode('menu');
    setIsVsBot(false);
    setOpponentId(null);
    setOpponentName('');
    chess.reset();
    setBoard(chess.board());
    setSelectedSquare(null);
    setPossibleMoves([]);
    setGameHistory([]);
    setIsGameOver(false);
    setWinner(null);
  };

  const getPieceSymbol = (piece: any) => {
    if (!piece) return '';
    const symbols: Record<string, string> = {
      'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚',
      'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔'
    };
    return symbols[piece.color === 'w' ? piece.type.toUpperCase() : piece.type] || '';
  };

  const isSquareHighlighted = (row: number, col: number) => {
    const square = String.fromCharCode(97 + col) + (8 - row);
    return selectedSquare === square || possibleMoves.includes(square);
  };

  // Render game menu
  if (gameMode === 'menu') {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              Mini Chess
            </div>
            {pendingInvites.length > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {pendingInvites.length} invite{pendingInvites.length > 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Pending Invites */}
          {pendingInvites.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-white/70 font-medium">Pending Invites</p>
              {pendingInvites.map(invite => (
                <div key={invite.id} className="flex items-center justify-between bg-white/5 rounded-lg p-2">
                  <span className="text-sm text-white">{invite.from_profile?.full_name}</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-green-400 hover:text-green-300" onClick={() => acceptInvite(invite)}>
                      <Play className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-red-400 hover:text-red-300" onClick={() => declineInvite(invite.id)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Game Mode Tabs */}
          <Tabs defaultValue="play" className="w-full">
            <TabsList className="w-full bg-white/10">
              <TabsTrigger value="play" className="flex-1 text-xs">Play</TabsTrigger>
              <TabsTrigger value="invite" className="flex-1 text-xs">Invite</TabsTrigger>
              <TabsTrigger value="stats" className="flex-1 text-xs">Stats</TabsTrigger>
            </TabsList>

            <TabsContent value="play" className="space-y-2 mt-3">
              <Button 
                onClick={startBotGame}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                <Bot className="w-4 h-4 mr-2" />
                Play vs Bot
              </Button>
              <Button 
                onClick={findRandomMatch}
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                <Shuffle className="w-4 h-4 mr-2" />
                Random Match
              </Button>
            </TabsContent>

            <TabsContent value="invite" className="mt-3">
              <ScrollArea className="h-40">
                {teamMembers.length === 0 ? (
                  <p className="text-center text-white/50 text-sm py-4">No team members online</p>
                ) : (
                  <div className="space-y-2">
                    {teamMembers.map(member => (
                      <div key={member.user_id} className="flex items-center justify-between bg-white/5 rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-xs text-white">
                            {member.full_name?.charAt(0)}
                          </div>
                          <span className="text-sm text-white truncate max-w-[100px]">{member.full_name}</span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-7 px-2 text-blue-400 hover:text-blue-300"
                          onClick={() => sendInvite(member.user_id, member.full_name)}
                        >
                          <Send className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="stats" className="mt-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/5 rounded-lg p-2">
                  <Trophy className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                  <div className="text-xs text-white/70">Wins</div>
                  <div className="text-sm font-bold text-white">{stats.wins}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <Gamepad2 className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                  <div className="text-xs text-white/70">Games</div>
                  <div className="text-sm font-bold text-white">{stats.games}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <Crown className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                  <div className="text-xs text-white/70">Rating</div>
                  <div className="text-sm font-bold text-white">{stats.rating}</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  }

  // Finding match screen
  if (gameMode === 'finding') {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="py-8 text-center">
          <Loader2 className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin" />
          <p className="text-white font-medium">Finding opponent...</p>
          <p className="text-white/50 text-sm mt-2">This may take a few seconds</p>
          <Button 
            variant="ghost" 
            className="mt-4 text-white/70"
            onClick={resetGame}
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Playing screen
  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2 text-sm">
            <Crown className="w-4 h-4 text-yellow-400" />
            vs {opponentName}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={chess.turn() === 'w' ? 'default' : 'outline'} className="text-xs">
              {chess.turn() === 'w' ? 'Your Turn' : 'Opponent'}
            </Badge>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-white/70" onClick={resetGame}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Chess Board */}
        <div className="aspect-square bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg p-1">
          <div className="grid grid-cols-8 h-full w-full">
            {board.map((row, rowIndex) =>
              row.map((piece, colIndex) => {
                const isLight = (rowIndex + colIndex) % 2 === 0;
                const isHighlighted = isSquareHighlighted(rowIndex, colIndex);
                
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`
                      flex items-center justify-center text-xl cursor-pointer
                      ${isLight ? 'bg-amber-200' : 'bg-amber-600'}
                      ${isHighlighted ? 'ring-2 ring-blue-400 ring-inset bg-blue-400/30' : ''}
                      hover:opacity-80 transition-all
                    `}
                    onClick={() => handleSquareClick(rowIndex, colIndex)}
                  >
                    {getPieceSymbol(piece)}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Game Status */}
        {isGameOver ? (
          <div className="text-center py-2">
            <Badge variant="secondary" className="mb-2">
              <Trophy className="w-3 h-3 mr-1" />
              {winner} Wins!
            </Badge>
            <Button size="sm" onClick={resetGame} className="w-full">
              <RotateCcw className="w-3 h-3 mr-2" />
              New Game
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs">
            <div className="text-white/50">
              {gameHistory.length} moves
            </div>
            {chess.inCheck() && (
              <Badge variant="destructive" className="text-xs">Check!</Badge>
            )}
          </div>
        )}

        {/* Move History */}
        {gameHistory.length > 0 && (
          <ScrollArea className="h-16 bg-white/5 rounded-lg p-2">
            <div className="flex flex-wrap gap-1 text-xs text-white/70">
              {gameHistory.map((move, i) => (
                <span key={i} className="bg-white/10 px-1.5 py-0.5 rounded">
                  {Math.floor(i / 2) + 1}.{move}
                </span>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default MiniChess;
