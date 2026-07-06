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
  Gamepad2,
  Coins
} from "lucide-react";
import { Chess } from 'chess.js';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChessGameOverDialog } from "@/components/staff/ChessGameOverDialog";
import confetti from 'canvas-confetti';
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface MiniChessProps {
  userId: string;
  userProfile: any;
  compact?: boolean;
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

const ChessPiece = ({ piece, color, compact }: { piece: string, color: 'w' | 'b', compact?: boolean }) => {
  const isWhite = color === 'w';

  const getIconName = () => {
    switch (piece.toLowerCase()) {
      case 'p': return "chess_pawn";
      case 'r': return "chess_rook";
      case 'n': return "chess_knight";
      case 'b': return "chess_bishop_2";
      case 'q': return "chess_queen";
      case 'k': return "chess_king_2";
      default: return "";
    }
  };

  return (
    <span
      className={`material-symbols-outlined select-none drop-shadow-md cursor-pointer
        ${isWhite ? 'text-white' : 'text-[#1a1a1a]'}
      `}
      style={{
        fontSize: compact ? 'clamp(14px, 2.8vw, 24px)' : 'clamp(20px, 4vw, 48px)',
        fontVariationSettings: `'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 48`,
        WebkitTextStroke: isWhite ? (compact ? '0.8px #1a1a1a' : '1.5px #1a1a1a') : '0.5px #ffffff'
      }}
    >
      {getIconName()}
    </span>
  );
};

const MiniChess = ({ userId, userProfile, compact = false }: MiniChessProps) => {

  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [isVsBot, setIsVsBot] = useState(false);
  const [opponentId, setOpponentId] = useState<string | null>(null);
  const [opponentName, setOpponentName] = useState<string>('');
  const [activeGameId, setActiveGameId] = useState<string | null>(null); // Track active game ID

  // Chess game state
  const [chess] = useState(new Chess());
  const [board, setBoard] = useState(chess.board());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);
  const [gameHistory, setGameHistory] = useState<string[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [myColor, setMyColor] = useState<'w' | 'b'>('w');
  const [gameOverTime, setGameOverTime] = useState<number | null>(null);

  // Team & invites
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<ChessInvite[]>([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [isLookingForMatch, setIsLookingForMatch] = useState(false);

  // Stats
  const [stats, setStats] = useState({ wins: 0, games: 0, rating: 1200 });
  const [showGameOverDialog, setShowGameOverDialog] = useState(false);
  const [gameOverData, setGameOverData] = useState<any>(null);
  const [eloChanges, setEloChanges] = useState<any>(null);
  const [coinsEarned, setCoinsEarned] = useState<number>(0);

  // 1. Permanent lobby channel for invites and general updates
  useEffect(() => {
    if (!userId) return;

    fetchTeamMembers();
    fetchPendingInvites();
    fetchStats();

    // Generate unique name to avoid "callbacks after subscribe" collisions
    const lobbyName = `lobby_${userId}_${Math.random().toString(36).substring(7)}`;
    const lobbyChannel = supabase.channel(lobbyName);

    console.log(`[Chess] Joining lobby channel: ${lobbyName}`);

    lobbyChannel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chess_games',
          filter: `player2_id=eq.${userId}`
        },
        () => {
          fetchPendingInvites();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Chess] Lobby joined successfully`);
        }
      });

    return () => {
      console.log(`[Chess] Cleaning up lobby: ${lobbyName}`);
      supabase.removeChannel(lobbyChannel);
    };
  }, [userId]);

  // 2. Dynamic channel for active game moves
  useEffect(() => {
    if (!userId || !activeGameId) return;

    const gameName = `game_${activeGameId}_${Math.random().toString(36).substring(7)}`;
    const gameChannel = supabase.channel(gameName);

    console.log(`[Chess] Joining game channel: ${gameName}`);

    gameChannel
      .on(
        'broadcast',
        { event: 'move' },
        (payload: any) => {
          if (payload.payload.gameId === activeGameId) {
            handleRealtimeMove(payload.payload.gameData);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chess_games',
          filter: `id=eq.${activeGameId}`
        },
        (payload: any) => {
          const game = payload.new;
          if (game && game.status === 'completed' && !isGameOver) {
            chess.load(game.fen_string);
            setBoard(chess.board());
            setIsGameOver(true);
            setWinner(game.winner_id);
            setGameOverData(game);
            setShowGameOverDialog(true);
            triggerGameOver(game.winner_id, game.winner_id === null);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Chess] Game channel joined successfully`);
        }
      });

    return () => {
      console.log(`[Chess] Cleaning up game: ${gameName}`);
      supabase.removeChannel(gameChannel);
    };
  }, [userId, activeGameId]);

  // Check for game over display timeout
  useEffect(() => {
    if (gameOverTime) {
      const fiveMinutesInMs = 5 * 60 * 1000;
      const timeout = setTimeout(() => {
        setGameOverTime(null);
        resetGame();
      }, fiveMinutesInMs);
      return () => clearTimeout(timeout);
    }
  }, [gameOverTime]);

  const handleRealtimeMove = (game: any) => {
    if (game.game_state && game.game_state.fen !== chess.fen()) {
      chess.load(game.game_state.fen);
      setBoard(chess.board());
      setGameHistory(game.game_state.history || []);

      if (chess.isGameOver()) {
        const winnerColor = chess.turn() === 'w' ? 'Black' : 'White';
        setIsGameOver(true);
        setWinner(winnerColor);
        
        // If my color won, or its a draw, process rewards
        const isMyWin = (winnerColor === 'White' && myColor === 'w') || (winnerColor === 'Black' && myColor === 'b');
        triggerGameOver(winnerColor === 'White' ? game.player1_id : game.player2_id, chess.isDraw());
      }
    }
  };

  const triggerGameOver = (winnerId: string | null, isDraw: boolean) => {
    if (isGameOver && gameOverTime) return; // Prevent double trigger

    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#fbbf24', '#f59e0b', '#3b82f6', '#8b5cf6']
    });

    setGameOverData({
      winner_id: winnerId,
      player1_id: userId,
      player2_id: opponentId || '',
      player1_name: 'You (White)',
      player2_name: isDraw ? 'Draw' : (opponentName || 'Opponent'),
      game_id: activeGameId || 'local',
      duration_seconds: 0
    });
    
    setGameOverTime(Date.now());
    setShowGameOverDialog(true);
  };

  // Function to finalize game and trigger ELO calculation & rewards
  const finalizeGame = async (winnerId: string | null, isDraw: boolean = false) => {
    if (!activeGameId || isVsBot) {
      if (isVsBot) {
        triggerGameOver(winnerId, isDraw);
      }
      return;
    }

    try {
      const myRating = stats.rating;
      const opponentRating = 1200;
      const kFactor = 32;
      const ea = 1 / (1 + Math.pow(10, (opponentRating - myRating) / 400));
      const sa = isDraw ? 0.5 : (winnerId === userId ? 1 : 0);
      const newRating = Math.round(myRating + kFactor * (sa - ea));

      // Calculate coins: Win 10, Draw 5, Loss 0
      const coins = isDraw ? 5 : (winnerId === userId ? 10 : 0);
      setCoinsEarned(coins);

      // Save Coins to DB
      if (coins > 0) {
        await supabase.from("user_coin_transactions").insert({
          user_id: userId,
          coins: coins,
          transaction_type: 'chess_reward',
          reason: `Chess Game: ${isDraw ? 'Draw' : 'Victory'} vs ${opponentName}`,
          category: 'chess',
          source_type: 'bonus'
        } as any);

        // Log to user_activity_log
        await supabase.from('user_activity_log').insert({
          user_id: userId,
          activity_type: 'chess_game_played',
          points_earned: coins,
          metadata: { opponent_name: opponentName, result: isDraw ? 'draw' : (winnerId === userId ? 'win' : 'loss') }
        });
      }

      await supabase
        .from('chess_games')
        .update({
          status: 'completed',
          winner_id: winnerId,
          ended_at: new Date().toISOString(),
          game_state: {
            fen: chess.fen(),
            history: gameHistory,
            turn: chess.turn()
          }
        } as any)
        .eq('id', activeGameId);

      // Update Stats
      const winCount = isDraw ? stats.wins : (winnerId === userId ? stats.wins + 1 : stats.wins);
      await supabase.from('chess_stats').upsert({
        user_id: userId,
        games_played: stats.games + 1,
        games_won: winCount,
        elo_rating: newRating
      });

      setStats({
        wins: winCount,
        games: stats.games + 1,
        rating: newRating
      });

      triggerGameOver(winnerId, isDraw);
    } catch (error) {
      console.error('Error finalizing game:', error);
      toast.error('Failed to update game results');
    }
  };


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
      const { data: profileStats } = await supabase
        .from('chess_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileStats) {
        setStats({
          wins: profileStats.games_won || 0,
          games: profileStats.games_played || 0,
          rating: profileStats.elo_rating || 1200
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
    setActiveGameId(null); // No DB tracking for bot games
    setMyColor('w');
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
        setActiveGameId(game.id); // Track game ID
        setIsVsBot(false);
        setMyColor('b'); // Joined game, usually player 2 (Black)
        chess.reset();
        setBoard(chess.board());
        setGameMode('playing');
        toast.success(`Matched with ${opponentProfile?.full_name || 'opponent'}! You are Black.`);
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
            setActiveGameId(newGame?.id || null); // Track game ID
            setIsVsBot(false);
            setMyColor('w'); // Created game, player 1 (White)
            chess.reset();
            setBoard(chess.board());
            setGameMode('playing');
            toast.success(`Matched with ${oppProfile?.full_name || 'opponent'}! You are White.`);
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
      setActiveGameId(invite.id); // Track game ID
      setIsVsBot(false);
      setMyColor('b'); // Invitee is Black
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

  const handleSquareClick = useCallback(async (row: number, col: number) => {
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

          // Broadcasting move (realtime fast sync)
          const gameChannel = supabase.channel(`chess_game_${activeGameId || 'global'}`);
          await gameChannel.send({
            type: 'broadcast',
            event: 'move',
            payload: {
              gameId: activeGameId,
              userId: userId,
              gameData: {
                game_state: {
                   fen: chess.fen(),
                   history: [...gameHistory, moveResult.san],
                   turn: chess.turn()
                }
              }
            }
          });

          // Sync move to database (persistence)
          if (activeGameId) {
            await supabase
              .from('chess_games')
              .update({
                game_state: {
                  fen: chess.fen(),
                  history: [...gameHistory, moveResult.san],
                  turn: chess.turn()
                }
              })
              .eq('id', activeGameId);
          }

          if (chess.isGameOver()) {
            setIsGameOver(true);
            const winnerColor = chess.turn() === 'w' ? 'Black' : 'White';
            setWinner(winnerColor);
            const winnerId = winnerColor === 'White' ? userId : opponentId;
            await finalizeGame(winnerId, chess.isDraw());
          } else if (isVsBot) {
            // Bot move
            setTimeout(makeBotMove, 500);
          }
        } else {
          setSelectedSquare(null);
          setPossibleMoves([]);
        }
      } catch (err) {
        console.error("Move error:", err);
        setSelectedSquare(null);
        setPossibleMoves([]);
      }
    } else {
      const piece = chess.get(square as any);
      if (piece && piece.color === chess.turn()) {
        // Ensure player only moves their own pieces
        if (!isVsBot && piece.color !== myColor) return;
        
        setSelectedSquare(square);
        const moves = chess.moves({ square: square as any, verbose: true });
        setPossibleMoves(moves.map((move: any) => move.to));
      }
    }
  }, [selectedSquare, chess, gameHistory, isGameOver, isVsBot, myColor, activeGameId, userId, opponentId, opponentName]);

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
      const isCheckmate = chess.isCheckmate();
      const isDraw = chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial();
      const winnerColor = chess.turn() === 'w' ? 'Black' : 'White';

      if (isCheckmate) {
        setWinner(winnerColor);
      }

      setGameOverData({
        winner_id: isCheckmate ? (winnerColor === 'White' ? userId : 'bot') : null,
        player1_id: userId,
        player2_id: 'bot',
        player1_name: 'You',
        player2_name: isDraw ? 'Draw' : 'AI Bot',
        game_id: 'bot-game',
        duration_seconds: 0
      });

      setTimeout(() => setShowGameOverDialog(true), 500);

      if (isCheckmate) {
        toast.success(`Checkmate! ${winnerColor} wins!`);
      } else if (isDraw) {
        toast.info("Game ended in a draw!");
      }
    }
  };

  const resetGame = () => {
    setGameMode('menu');
    setIsVsBot(false);
    setOpponentId(null);
    setOpponentName('');
    setActiveGameId(null); // Clear active game
    chess.reset();
    setBoard(chess.board());
    setSelectedSquare(null);
    setPossibleMoves([]);
    setGameHistory([]);
    setIsGameOver(false);
    setWinner(null);
    setGameOverTime(null);
  };


  const isSquareHighlighted = (row: number, col: number) => {
    const square = String.fromCharCode(97 + col) + (8 - row);
    return selectedSquare === square;
  };

  const isPossibleMove = (row: number, col: number) => {
    const square = String.fromCharCode(97 + col) + (8 - row);
    return possibleMoves.includes(square);
  };

  const getSquareNotation = (row: number, col: number) => {
    return String.fromCharCode(97 + col) + (8 - row);
  };

  // Render game menu
  if (gameMode === 'menu') {
    return (
      <Card className={`bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-amber-500/20 shadow-2xl shadow-amber-500/10 overflow-hidden ${compact ? 'border-0 shadow-none bg-transparent' : ''}`}>
        {/* Decorative chess pattern background */}
        <div className="absolute inset-0 opacity-5">
          <div className="grid grid-cols-8 h-full">
            {[...Array(64)].map((_, i) => (
              <div key={i} className={`${(Math.floor(i / 8) + i) % 2 === 0 ? 'bg-white' : 'bg-transparent'}`} />
            ))}
          </div>
        </div>

        <CardHeader className={`relative ${compact ? 'p-3 pb-2' : 'pb-3'}`}>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`rounded-xl bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/40 ${compact ? 'w-7 h-7' : 'w-10 h-10'}`}>
                <Crown className={compact ? 'w-3.5 h-3.5 text-white' : 'w-5 h-5 text-white'} />
              </div>
              <div>
                <span className={`font-bold bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 bg-clip-text text-transparent ${compact ? 'text-sm' : 'text-lg'}`}>
                  Chess Arena
                </span>
                <p className={`text-slate-500 font-normal ${compact ? 'text-[8px]' : 'text-[10px]'}`}>Challenge your teammates</p>
              </div>
            </div>
            {pendingInvites.length > 0 && (
              <Badge className="bg-gradient-to-r from-rose-500 to-pink-500 text-white border-0 animate-pulse shadow-lg shadow-rose-500/30 text-[10px]">
                {pendingInvites.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className={`space-y-3 relative ${compact ? 'p-3 pt-0' : ''}`}>
          {/* Pending Invites */}
          {pendingInvites.length > 0 && (
            <div className="space-y-2">
              <p className="text-[9px] uppercase tracking-wider text-amber-400/70 font-bold">🎯 Incoming Challenges</p>
              {pendingInvites.map(invite => (
                <div key={invite.id} className={`flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg border border-amber-500/20 ${compact ? 'p-2' : 'p-3 rounded-xl'}`}>
                  <div className="flex items-center gap-2">
                    <div className={`rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg ${compact ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-sm'}`}>
                      {invite.from_profile?.full_name?.charAt(0)}
                    </div>
                    <span className={`text-white font-medium ${compact ? 'text-xs' : 'text-sm'}`}>{invite.from_profile?.full_name}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      className={`bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white ${compact ? 'h-6 px-2 text-[10px]' : 'h-8 px-3'}`}
                      onClick={() => acceptInvite(invite)}
                    >
                      <Play className="w-3 h-3 mr-1" /> Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 ${compact ? 'h-6 w-6 p-0' : 'h-8 px-2'}`}
                      onClick={() => declineInvite(invite.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Game Mode Tabs */}
          <Tabs defaultValue="play" className="w-full">
            <TabsList className={`w-full bg-slate-800/80 border border-slate-700/50 p-0.5 h-auto ${compact ? 'gap-0' : 'p-1'}`}>
              <TabsTrigger value="play" className={`flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white ${compact ? 'text-[10px] py-1.5' : 'text-xs py-2'}`}>
                <Gamepad2 className={`mr-1 ${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} /> Play
              </TabsTrigger>
              <TabsTrigger value="invite" className={`flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white ${compact ? 'text-[10px] py-1.5' : 'text-xs py-2'}`}>
                <UserPlus className={`mr-1 ${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} /> Invite
              </TabsTrigger>
              <TabsTrigger value="stats" className={`flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white ${compact ? 'text-[10px] py-1.5' : 'text-xs py-2'}`}>
                <Trophy className={`mr-1 ${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} /> Stats
              </TabsTrigger>
            </TabsList>

            <TabsContent value="play" className={`space-y-2 ${compact ? 'mt-2' : 'mt-4'}`}>
              <Button
                onClick={startBotGame}
                className={`w-full bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] ${compact ? 'h-10' : 'h-14'}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`rounded-lg bg-white/20 flex items-center justify-center ${compact ? 'w-6 h-6' : 'w-8 h-8'}`}>
                    <Bot className={compact ? 'w-3.5 h-3.5' : 'w-5 h-5'} />
                  </div>
                  <div className="text-left">
                    <div className={`font-bold ${compact ? 'text-xs' : ''}`}>Play vs Bot</div>
                    <div className={`opacity-80 ${compact ? 'text-[8px]' : 'text-[10px]'}`}>Practice your skills</div>
                  </div>
                </div>
              </Button>
              <Button
                onClick={findRandomMatch}
                className={`w-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 hover:from-violet-600 hover:via-purple-600 hover:to-fuchsia-600 shadow-lg shadow-purple-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] ${compact ? 'h-10' : 'h-14'}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`rounded-lg bg-white/20 flex items-center justify-center ${compact ? 'w-6 h-6' : 'w-8 h-8'}`}>
                    <Shuffle className={compact ? 'w-3.5 h-3.5' : 'w-5 h-5'} />
                  </div>
                  <div className="text-left">
                    <div className={`font-bold ${compact ? 'text-xs' : ''}`}>Random Match</div>
                    <div className={`opacity-80 ${compact ? 'text-[8px]' : 'text-[10px]'}`}>Find an opponent</div>
                  </div>
                </div>
              </Button>
            </TabsContent>

            <TabsContent value="invite" className={compact ? 'mt-2' : 'mt-4'}>
              <ScrollArea className={compact ? 'h-32' : 'h-44'}>
                {teamMembers.length === 0 ? (
                  <div className="text-center py-4">
                    <Users className={`text-slate-600 mx-auto mb-1 ${compact ? 'w-6 h-6' : 'w-10 h-10'}`} />
                    <p className={`text-slate-500 ${compact ? 'text-xs' : 'text-sm'}`}>No team members online</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {teamMembers.map(member => (
                      <div key={member.user_id} className={`flex items-center justify-between bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 transition-all ${compact ? 'rounded-lg p-2' : 'rounded-xl p-3'}`}>
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <div className={`rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold ${compact ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-sm'}`}>
                              {member.full_name?.charAt(0)}
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 rounded-full bg-emerald-500 border-2 border-slate-800 ${compact ? 'w-2 h-2' : 'w-3 h-3'}`} />
                          </div>
                          <div>
                            <span className={`text-white font-medium block ${compact ? 'text-[11px]' : 'text-sm'}`}>{member.full_name}</span>
                            <span className={`text-emerald-400 ${compact ? 'text-[8px]' : 'text-[10px]'}`}>Online</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className={`bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/20 ${compact ? 'h-6 px-2 text-[10px]' : 'h-8 px-3'}`}
                          onClick={() => sendInvite(member.user_id, member.full_name)}
                        >
                          <Send className="w-3 h-3 mr-1" /> Challenge
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="stats" className={compact ? 'mt-2' : 'mt-4'}>
              <div className="grid grid-cols-3 gap-2">
                <div className={`bg-gradient-to-br from-yellow-500/20 to-amber-500/10 rounded-xl border border-yellow-500/20 text-center ${compact ? 'p-2' : 'p-4'}`}>
                  <div className={`rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center mx-auto shadow-lg shadow-yellow-500/30 ${compact ? 'w-7 h-7 mb-1' : 'w-10 h-10 mb-2'}`}>
                    <Trophy className={compact ? 'w-3.5 h-3.5 text-white' : 'w-5 h-5 text-white'} />
                  </div>
                  <div className={`text-yellow-400/70 uppercase tracking-wider font-bold ${compact ? 'text-[7px]' : 'text-[10px]'}`}>Wins</div>
                  <div className={`font-black text-white ${compact ? 'text-lg' : 'text-2xl'}`}>{stats.wins}</div>
                </div>
                <div className={`bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-xl border border-blue-500/20 text-center ${compact ? 'p-2' : 'p-4'}`}>
                  <div className={`rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30 ${compact ? 'w-7 h-7 mb-1' : 'w-10 h-10 mb-2'}`}>
                    <Gamepad2 className={compact ? 'w-3.5 h-3.5 text-white' : 'w-5 h-5 text-white'} />
                  </div>
                  <div className={`text-blue-400/70 uppercase tracking-wider font-bold ${compact ? 'text-[7px]' : 'text-[10px]'}`}>Games</div>
                  <div className={`font-black text-white ${compact ? 'text-lg' : 'text-2xl'}`}>{stats.games}</div>
                </div>
                <div className={`bg-gradient-to-br from-purple-500/20 to-pink-500/10 rounded-xl border border-purple-500/20 text-center ${compact ? 'p-2' : 'p-4'}`}>
                  <div className={`rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/30 ${compact ? 'w-7 h-7 mb-1' : 'w-10 h-10 mb-2'}`}>
                    <Crown className={compact ? 'w-3.5 h-3.5 text-white' : 'w-5 h-5 text-white'} />
                  </div>
                  <div className={`text-purple-400/70 uppercase tracking-wider font-bold ${compact ? 'text-[7px]' : 'text-[10px]'}`}>Rating</div>
                  <div className={`font-black text-white ${compact ? 'text-lg' : 'text-2xl'}`}>{stats.rating}</div>
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
      <Card className={`bg-white/10 backdrop-blur-sm border-white/20 ${compact ? 'border-0 shadow-none' : ''}`}>
        <CardContent className={`text-center ${compact ? 'py-4' : 'py-8'}`}>
          <Loader2 className={`text-blue-400 mx-auto mb-2 animate-spin ${compact ? 'w-8 h-8' : 'w-12 h-12'}`} />
          <p className={`text-white font-medium ${compact ? 'text-sm' : ''}`}>Finding opponent...</p>
          <p className={`text-white/50 mt-1 ${compact ? 'text-xs' : 'text-sm mt-2'}`}>This may take a few seconds</p>
          <Button
            variant="ghost"
            size={compact ? 'sm' : 'default'}
            className="mt-3 text-white/70"
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
    <Card className={`bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-amber-500/20 shadow-2xl shadow-amber-500/10 ${compact ? 'border-0 shadow-none bg-transparent' : ''}`}>
      <CardHeader className={`border-b border-white/5 ${compact ? 'p-2 pb-1.5' : 'pb-2'}`}>
        <div className="flex items-center justify-between">
          <CardTitle className={`text-white flex items-center gap-2 font-bold ${compact ? 'text-xs' : 'text-sm'}`}>
            <div className={`rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 ${compact ? 'w-6 h-6' : 'w-8 h-8'}`}>
              <Crown className={compact ? 'w-3 h-3 text-white' : 'w-4 h-4 text-white'} />
            </div>
            <span className="bg-gradient-to-r from-amber-200 to-yellow-400 bg-clip-text text-transparent truncate">
              vs {opponentName}
            </span>
          </CardTitle>
          <div className="flex items-center gap-1">
            <div className={`rounded-full font-bold transition-all ${compact ? 'px-2 py-0.5 text-[9px]' : 'px-3 py-1 text-xs'} ${chess.turn() === 'w'
              ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/30'
              : 'bg-slate-700 text-slate-400'
              }`}>
              {chess.turn() === 'w' ? '⚪ Your Turn' : '⚫ Waiting'}
            </div>
            <Button size="sm" variant="ghost" className={`p-0 text-slate-400 hover:text-white hover:bg-slate-700 ${compact ? 'h-6 w-6' : 'h-8 w-8'}`} onClick={resetGame}>
              <X className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={compact ? 'p-1.5' : 'p-2 sm:p-4 space-y-4'}>
        {/* Chess Board */}
        <div className="flex justify-center items-center w-full relative">
          <div
            className={`relative shadow-2xl rounded-lg overflow-hidden bg-[#5d4037] ${compact ? 'border-2 border-[#5d4037]' : 'border-4 border-[#5d4037] rounded-xl'}`}
            style={{
              width: compact ? '100%' : 'min(80vw, 80vh)',
              aspectRatio: '1/1'
            }}
          >
            {/* Visual Board Flipping Logic */}
            <div
              className={`grid grid-cols-8 grid-rows-8 h-full w-full transition-transform duration-500 ${myColor === 'b' ? 'rotate-180' : ''}`}
              style={{ gridTemplateRows: 'repeat(8, 1fr)' }}
            >
              {[...Array(64)].map((_, i) => {
                // If black, we flip the index for visual mapping
                const displayIndex = myColor === 'b' ? 63 - i : i;
                const row = Math.floor(displayIndex / 8);
                const col = displayIndex % 8;
                
                const isLight = (row + col) % 2 === 0;
                const piece = board[row][col];
                const isSelected = isSquareHighlighted(row, col);
                const isPossible = isPossibleMove(row, col);

                return (
                  <div
                    key={`${row}-${col}`}
                    onClick={() => handleSquareClick(row, col)}
                    className={`
                      relative flex items-center justify-center
                      ${isLight ? 'bg-[#efebe9]' : 'bg-[#a1887f]'}
                      ${isSelected ? 'after:absolute after:inset-0 after:bg-yellow-400/40' : ''}
                      ${isPossible && !piece ? 'after:absolute after:w-[30%] after:h-[30%] after:bg-black/25 after:rounded-full shadow-inner' : ''}
                      ${isPossible && piece ? 'after:absolute after:inset-[10%] after:border-4 after:border-black/30 after:rounded-full' : ''}
                      cursor-pointer select-none h-full w-full
                    `}
                  >
                    {piece && (
                      <div className={myColor === 'b' ? 'rotate-180' : ''}>
                        <ChessPiece piece={piece.type} color={piece.color} compact={compact} />
                      </div>
                    )}

                    {/* Coordinate Labels */}
                    {col === 0 && (
                      <span className={`absolute top-0 left-0.5 font-bold opacity-30 select-none ${compact ? 'text-[5px]' : 'text-[7px] sm:text-[10px]'} ${isLight ? 'text-[#a1887f]' : 'text-[#efebe9]'} ${myColor === 'b' ? 'rotate-180' : ''}`}>
                        {8 - row}
                      </span>
                    )}
                    {row === 7 && (
                      <span className={`absolute bottom-0 right-0.5 font-bold opacity-30 select-none ${compact ? 'text-[5px]' : 'text-[7px] sm:text-[10px]'} ${isLight ? 'text-[#a1887f]' : 'text-[#efebe9]'} ${myColor === 'b' ? 'rotate-180' : ''}`}>
                        {String.fromCharCode(97 + col)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Game Over Overlay (for next 5 min) */}
            {gameOverTime && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-500">
                    <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-transparent border border-amber-500/30">
                        <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-bounce" />
                        <h2 className="text-3xl font-black text-white italic tracking-tighter mb-2 uppercase">
                            {chess.isDraw() ? "Game Drawn!" : (winner === (myColor === 'w' ? 'White' : 'Black') ? "Victory!" : "Defeat")}
                        </h2>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10 mb-4">
                            <p className="text-amber-400 font-bold flex items-center justify-center gap-2">
                                <Coins className="w-5 h-5" />
                                {coinsEarned > 0 ? `+${coinsEarned} VAW Coins Earned` : "0 Coins (Try harder next time!)"}
                            </p>
                        </div>
                        <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest">
                            Analyzing position... (Resets automatically)
                        </p>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-6 border-white/10 hover:bg-white/5 text-white/70"
                            onClick={resetGame}
                        >
                            Return to Arena
                        </Button>
                    </div>
                </div>
            )}
          </div>
        </div>
      </CardContent>

      {showGameOverDialog && gameOverData && (
        <ChessGameOverDialog
          open={showGameOverDialog}
          onClose={() => {
            setShowGameOverDialog(false);
          }}
          gameData={gameOverData}
          eloChanges={eloChanges}
          coinsEarned={coinsEarned}
        />
      )}
    </Card>
  );
};

export default MiniChess;
