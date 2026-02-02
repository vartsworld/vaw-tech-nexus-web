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
import { ChessGameOverDialog } from "@/components/staff/ChessGameOverDialog";

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

const ChessPiece = ({ piece, color }: { piece: string, color: 'white' | 'black' }) => {
  const isWhite = color === 'white';
  const fill = isWhite ? '#FFFFFF' : '#333333';
  const stroke = isWhite ? '#000000' : '#FFFFFF';

  // Unified minimalist style
  switch (piece) {
    case 'p':
      return (
        <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm">
          <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
    case 'r':
      return (
        <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm">
          <path d="M9 39h27v-3H9v3zM12 36h21v-4H12v4zM11 14V9h4v2h5V9h5v2h5V9h4v5" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path d="M34 14l-3 3H14l-3-3" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path d="M31 17v12.5l-2.5 2.5h-12l-2.5-2.5V17" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path d="M31 29.5l1.5 2.5h-20l1.5-2.5" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path d="M11 14h23" fill="none" stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
    case 'n':
      return (
        <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm">
          <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path d="M24 18c.3 1.2 1.5 2 2.5 1" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path d="M9.5 25.5A.5.5 0 1 1 9 25.5.5.5 0 1 1 9.5 25.5" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path d="M15 15.5c4.5 2 5.5 12 11 12.5" fill="none" stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
    case 'b':
      return (
        <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm">
          <g fill="none" fillRule="evenodd" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <g fill={fill}>
              <path d="M9 36c3.39-.97 10.11.43 13.5-1 3.39 1.43 10.11.03 13.5 1-1.35-3.69-5.4-6.31-7.5-12 1.48-1.57 2.5-4.5 2.5-7.5 0-4.63-3.12-8-6.5-8s-6.5 3.37-6.5 8c0 3 1.02 5.93 2.5 7.5-2.1 5.69-6.15 8.31-7.5 12z" />
              <path d="M15 32c2.5 2.5 12.5 2.5 15 0" />
              <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0" />
            </g>
            <path d="M17.5 26h10M15 30h15" />
          </g>
        </svg>
      );
    case 'q':
      return (
        <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm">
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 12c2.5 2.5 4.5 1.5 6 4.5 1.5-3 3.5-2 6-4.5 2.5 2.5 4.5 1.5 6 4.5 1.5-3 3.5-2 6-4.5V9H8v3z" />
            <path d="M9 26c8.5-1.5 21-1.5 27 0l2-12H7l2 12z" />
            <path d="M9 26c0 2 1.5 2 2.5 4 2.5 5.5 1.5 10.5 4 10.5 1.5 0 2.5-.5 7-2.5 4.5 2 5.5 2.5 7 2.5 2.5 0 1.5-5 4-10.5 1-2 2.5-2 2.5-4h-27z" />
            <path d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0" fill="none" />
            <circle cx="22.5" cy="5.5" r="2.5" />
          </g>
        </svg>
      );
    case 'k':
      return (
        <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-sm">
          <g fill="none" fillRule="evenodd" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22.5 11.63V6M20 8h5" stroke={stroke} />
            <g fill={fill}>
              <path d="M22.5 25s4.5-7.5 3-10c-1.5-2.5-6-2.5-7.5 0-1.5 2.5 3 10 3 10" />
              <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-1-1-6.5-6-3-6 4-3.5 5-11 5s-5-1-11-5c-5-3.5-2 2-6 3-3 6 6 10.5 6 10.5v7z" />
            </g>
            <path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" />
          </g>
        </svg>
      );
    default:
      return null;
  }
};

const MiniChess = ({ userId, userProfile }: MiniChessProps) => {

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

  // Function to finalize game and trigger ELO calculation
  const finalizeGame = async (winnerId: string | null, isDraw: boolean = false) => {
    if (!activeGameId || isVsBot) {
      // For bot games, don't update database
      return;
    }

    try {
      const updateData: any = {
        status: 'completed',
        winner_id: winnerId,
        ended_at: new Date().toISOString(), // Use ended_at as per schema
        game_state: {
          fen: chess.fen(),
          history: gameHistory,
          turn: chess.turn()
        }
      };

      const { error } = await supabase
        .from('chess_games')
        .update(updateData)
        .eq('id', activeGameId);

      if (error) throw error;

      // Refresh stats to show new ELO rating
      await fetchStats();

      // Fetch game history to get ELO changes
      // Wait a moment for trigger to process
      setTimeout(async () => {
        const { data: historyData } = await supabase
          .from('chess_game_history')
          .select('*')
          .eq('game_id', activeGameId);

        if (historyData && historyData.length > 0) {
          const myHistory = historyData.find(h => h.player_id === userId);
          const opponentHistory = historyData.find(h => h.player_id !== userId);

          if (myHistory && opponentHistory) {
            const isWinner = winnerId === userId;
            setEloChanges({
              winner_elo_before: isWinner ? myHistory.elo_before : opponentHistory.elo_before,
              winner_elo_after: isWinner ? myHistory.elo_after : opponentHistory.elo_after,
              loser_elo_before: isWinner ? opponentHistory.elo_before : myHistory.elo_before,
              loser_elo_after: isWinner ? opponentHistory.elo_after : myHistory.elo_after
            });

            if (isWinner) {
              await supabase.from('user_coin_transactions').insert({
                user_id: userId,
                coins: 10,
                transaction_type: 'bonus',
                description: `Won 10 coins for winning a Chess game against ${opponentName}`
              });
              setCoinsEarned(10);
            } else {
              setCoinsEarned(0);
            }
          }
        }

        setGameOverData({
          winner_id: winnerId,
          player1_id: userId,
          player2_id: opponentId || '',
          player1_name: 'You',
          player2_name: isDraw ? 'Draw' : (opponentName || 'Opponent'),
          game_id: activeGameId,
          duration_seconds: 0
        });

        setShowGameOverDialog(true);
      }, 500);

      const message = isDraw
        ? 'Game ended in a draw! ELO ratings updated.'
        : `${winnerId === userId ? `You won! +10 Coins 🪙` : opponentName + ' wins!'}`;

      toast.success(message);
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
    setActiveGameId(null); // No DB tracking for bot games
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
            setActiveGameId(newGame?.id || null); // Track game ID
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
      setActiveGameId(invite.id); // Track game ID
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

          if (chess.isGameOver()) {
            setIsGameOver(true);
            if (chess.isCheckmate()) {
              const winnerColor = chess.turn() === 'w' ? 'Black' : 'White';
              setWinner(winnerColor);

              // Determine winner ID for database
              const winnerId = winnerColor === 'White' ? userId : opponentId;
              await finalizeGame(winnerId, false);

              toast.success(`Checkmate! ${winnerColor} wins!`);
            } else {
              // Draw
              await finalizeGame(null, true);
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
  };

  const getPieceSymbol = (piece: any) => {
    if (!piece) return null;

    // Use stylized piece representations
    const pieceMap: Record<string, { symbol: string; isWhite: boolean }> = {
      'wk': { symbol: '♔', isWhite: true },
      'wq': { symbol: '♕', isWhite: true },
      'wr': { symbol: '♖', isWhite: true },
      'wb': { symbol: '♗', isWhite: true },
      'wn': { symbol: '♘', isWhite: true },
      'wp': { symbol: '♙', isWhite: true },
      'bk': { symbol: '♚', isWhite: false },
      'bq': { symbol: '♛', isWhite: false },
      'br': { symbol: '♜', isWhite: false },
      'bb': { symbol: '♝', isWhite: false },
      'bn': { symbol: '♞', isWhite: false },
      'bp': { symbol: '♟', isWhite: false },
    };

    const key = piece.color + piece.type;
    return pieceMap[key] || null;
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
      <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-amber-500/20 shadow-2xl shadow-amber-500/10 overflow-hidden">
        {/* Decorative chess pattern background */}
        <div className="absolute inset-0 opacity-5">
          <div className="grid grid-cols-8 h-full">
            {[...Array(64)].map((_, i) => (
              <div key={i} className={`${(Math.floor(i / 8) + i) % 2 === 0 ? 'bg-white' : 'bg-transparent'}`} />
            ))}
          </div>
        </div>

        <CardHeader className="pb-3 relative">
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/40">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 bg-clip-text text-transparent">
                  Chess Arena
                </span>
                <p className="text-[10px] text-slate-500 font-normal">Challenge your teammates</p>
              </div>
            </div>
            {pendingInvites.length > 0 && (
              <div className="relative">
                <Badge className="bg-gradient-to-r from-rose-500 to-pink-500 text-white border-0 animate-pulse shadow-lg shadow-rose-500/30">
                  {pendingInvites.length} invite{pendingInvites.length > 1 ? 's' : ''}
                </Badge>
              </div>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 relative">
          {/* Pending Invites */}
          {pendingInvites.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-amber-400/70 font-bold">🎯 Incoming Challenges</p>
              {pendingInvites.map(invite => (
                <div key={invite.id} className="flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-3 border border-amber-500/20">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm text-white font-bold shadow-lg">
                      {invite.from_profile?.full_name?.charAt(0)}
                    </div>
                    <span className="text-sm text-white font-medium">{invite.from_profile?.full_name}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="h-8 px-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg shadow-emerald-500/30"
                      onClick={() => acceptInvite(invite)}
                    >
                      <Play className="w-3 h-3 mr-1" /> Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                      onClick={() => declineInvite(invite.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Game Mode Tabs */}
          <Tabs defaultValue="play" className="w-full">
            <TabsList className="w-full bg-slate-800/80 border border-slate-700/50 p-1 h-auto">
              <TabsTrigger value="play" className="flex-1 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white py-2">
                <Gamepad2 className="w-3 h-3 mr-1" /> Play
              </TabsTrigger>
              <TabsTrigger value="invite" className="flex-1 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white py-2">
                <UserPlus className="w-3 h-3 mr-1" /> Invite
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex-1 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white py-2">
                <Trophy className="w-3 h-3 mr-1" /> Stats
              </TabsTrigger>
            </TabsList>

            <TabsContent value="play" className="space-y-3 mt-4">
              <Button
                onClick={startBotGame}
                className="w-full h-14 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold">Play vs Bot</div>
                    <div className="text-[10px] opacity-80">Practice your skills</div>
                  </div>
                </div>
              </Button>
              <Button
                onClick={findRandomMatch}
                className="w-full h-14 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 hover:from-violet-600 hover:via-purple-600 hover:to-fuchsia-600 shadow-lg shadow-purple-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Shuffle className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold">Random Match</div>
                    <div className="text-[10px] opacity-80">Find an opponent</div>
                  </div>
                </div>
              </Button>
            </TabsContent>

            <TabsContent value="invite" className="mt-4">
              <ScrollArea className="h-44">
                {teamMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">No team members online</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {teamMembers.map(member => (
                      <div key={member.user_id} className="flex items-center justify-between bg-slate-800/50 hover:bg-slate-700/50 rounded-xl p-3 border border-slate-700/50 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm text-white font-bold">
                              {member.full_name?.charAt(0)}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-800" />
                          </div>
                          <div>
                            <span className="text-sm text-white font-medium block">{member.full_name}</span>
                            <span className="text-[10px] text-emerald-400">Online</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="h-8 px-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/20"
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

            <TabsContent value="stats" className="mt-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-yellow-500/20 to-amber-500/10 rounded-xl p-4 border border-yellow-500/20 text-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-yellow-500/30">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-[10px] text-yellow-400/70 uppercase tracking-wider font-bold">Wins</div>
                  <div className="text-2xl font-black text-white">{stats.wins}</div>
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-xl p-4 border border-blue-500/20 text-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-blue-500/30">
                    <Gamepad2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-[10px] text-blue-400/70 uppercase tracking-wider font-bold">Games</div>
                  <div className="text-2xl font-black text-white">{stats.games}</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 rounded-xl p-4 border border-purple-500/20 text-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-purple-500/30">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-[10px] text-purple-400/70 uppercase tracking-wider font-bold">Rating</div>
                  <div className="text-2xl font-black text-white">{stats.rating}</div>
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
    <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-amber-500/20 shadow-2xl shadow-amber-500/10">
      <CardHeader className="pb-2 border-b border-white/5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2 text-sm font-bold">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <span className="bg-gradient-to-r from-amber-200 to-yellow-400 bg-clip-text text-transparent">
              vs {opponentName}
            </span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${chess.turn() === 'w'
              ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/30'
              : 'bg-slate-700 text-slate-400'
              }`}>
              {chess.turn() === 'w' ? '⚪ Your Turn' : '⚫ Waiting'}
            </div>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700" onClick={resetGame}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-2 sm:p-4 space-y-4">
        {/* Chess Board with elegant wood texture styling */}
        <div className="relative mx-auto w-full max-w-[300px]">
          {/* Board frame/border */}
          <div className="rounded-xl overflow-hidden shadow-2xl border-4 border-[#5d4037] bg-[#5d4037]">
            {/* Actual board grid - 1:1 Aspect Ratio ensured by aspect-square */}
            <div className="grid grid-cols-8 aspect-square w-full">
              {[...Array(64)].map((_, i) => {
                const row = Math.floor(i / 8);
                const col = i % 8;
                const isLight = (row + col) % 2 === 0;
                const piece = board[row][col];
                const isSelected = isSquareHighlighted(row, col);
                const isPossible = isPossibleMove(row, col);

                return (
                  <div
                    key={`${row}-${col}`}
                    onClick={() => handleSquareClick(row, col)}
                    className={`
                      relative flex items-center justify-center aspect-square
                      ${isLight ? 'bg-[#efebe9]' : 'bg-[#a1887f]'}
                      ${isSelected ? 'after:absolute after:inset-0 after:bg-yellow-400/40' : ''}
                      ${isPossible && !piece ? 'after:absolute after:w-[30%] after:h-[30%] after:bg-black/10 after:rounded-full shadow-inner' : ''}
                      ${isPossible && piece ? 'after:absolute after:inset-[10%] after:border-4 after:border-black/20 after:rounded-full' : ''}
                      cursor-pointer select-none transition-all duration-200
                      hover:brightness-105 active:scale-95
                    `}
                  >
                    {piece && (
                      <div className="w-4/5 h-4/5 flex items-center justify-center transition-transform hover:scale-110 drop-shadow-sm">
                        <ChessPiece piece={piece.type} color={piece.color === 'w' ? 'white' : 'black'} />
                      </div>
                    )}
                    
                    {/* Minimalist Coordinate Labels */}
                    {col === 0 && (
                      <span className={`absolute top-0.5 left-0.5 text-[7px] font-bold opacity-30 select-none ${isLight ? 'text-[#a1887f]' : 'text-[#efebe9]'}`}>
                        {8 - row}
                      </span>
                    )}
                    {row === 7 && (
                      <span className={`absolute bottom-0.5 right-0.5 text-[7px] font-bold opacity-30 select-none ${isLight ? 'text-[#a1887f]' : 'text-[#efebe9]'}`}>
                        {String.fromCharCode(97 + col)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>

      {showGameOverDialog && gameOverData && (
        <ChessGameOverDialog
          open={showGameOverDialog}
          onClose={() => {
            setShowGameOverDialog(false);
            resetGame(); // Reset game when dialog is closed
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
