import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Crown,
  Users,
  Plus,
  Play,
  RotateCcw,
  Trophy,
  Clock,
  Target,
  Eye,
  Wifi,
  WifiOff,
  Zap
} from "lucide-react";
import { Chess } from 'chess.js';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// ─── Piece rendering ────────────────────────────────────────────────────────

const WHITE_PIECES: Record<string, string> = {
  k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙'
};
const BLACK_PIECES: Record<string, string> = {
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟'
};

const PieceIcon = ({ piece }: { piece: any }) => {
  if (!piece) return null;
  const isWhite = piece.color === 'w';
  const symbol = isWhite ? WHITE_PIECES[piece.type] : BLACK_PIECES[piece.type];

  return (
    <span
      className={`
        select-none pointer-events-none leading-none
        ${isWhite
          ? 'text-amber-50 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] [text-shadow:0_0_6px_rgba(255,220,100,0.8),0_1px_2px_rgba(0,0,0,1)]'
          : 'text-slate-900 drop-shadow-[0_1px_3px_rgba(255,255,255,0.4)] [text-shadow:0_0_4px_rgba(80,0,200,0.5),0_1px_2px_rgba(0,0,0,0.9)]'
        }
      `}
      style={{ fontSize: '1.7rem', lineHeight: 1 }}
    >
      {symbol}
    </span>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const RealChessEngine = ({ userId, userProfile }: { userId: string; userProfile: any }) => {
  const chessRef = useRef(new Chess());
  const chess = chessRef.current;

  const [board, setBoard] = useState(chess.board());
  const [gameState, setGameState] = useState({
    turn: 'w' as 'w' | 'b',
    inCheck: false,
    isGameOver: false,
    winner: null as string | null,
    gameMode: 'ai' as 'ai' | 'multiplayer'
  });
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);
  const [gameHistory, setGameHistory] = useState<string[]>([]);
  const [isCreateGameOpen, setIsCreateGameOpen] = useState(false);
  const [availableGames, setAvailableGames] = useState<any[]>([]);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [gameTimer, setGameTimer] = useState({ white: 600, black: 600 });
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);
  const [lastMovedSquare, setLastMovedSquare] = useState<string | null>(null);
  const { toast } = useToast();

  // ── Board Init ──────────────────────────────────────────────────────────────
  const syncBoardFromChess = () => {
    setBoard([...chess.board()]);
    setGameState(prev => ({
      ...prev,
      turn: chess.turn(),
      inCheck: chess.inCheck(),
      isGameOver: chess.isGameOver(),
      winner: chess.isGameOver() ? (chess.turn() === 'w' ? 'black' : 'white') : null,
    }));
  };

  const initializeBoard = useCallback(() => {
    chess.reset();
    setBoard([...chess.board()]);
    setGameState({ turn: 'w', inCheck: false, isGameOver: false, winner: null, gameMode: 'ai' });
    setSelectedSquare(null);
    setPossibleMoves([]);
    setGameHistory([]);
    setGameTimer({ white: 600, black: 600 });
    setIsTimerRunning(false);
    setLastMovedSquare(null);
    setCurrentGameId(null);
    setIsLive(false);
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      setRealtimeChannel(null);
    }
  }, [chess, realtimeChannel]);

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isTimerRunning && !gameState.isGameOver) {
      interval = setInterval(() => {
        setGameTimer(prev => {
          const newTimer = { ...prev };
          if (gameState.turn === 'w') {
            newTimer.white = Math.max(0, newTimer.white - 1);
            if (newTimer.white === 0) handleTimeOut('white');
          } else {
            newTimer.black = Math.max(0, newTimer.black - 1);
            if (newTimer.black === 0) handleTimeOut('black');
          }
          return newTimer;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, gameState.turn, gameState.isGameOver]);

  // ── Fetch games on mount ────────────────────────────────────────────────────
  useEffect(() => {
    fetchAvailableGames();

    // Subscribe to the chess_games table for real-time lobby updates
    const lobbyChannel = supabase
      .channel('chess_lobby')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chess_games' }, () => {
        fetchAvailableGames();
      })
      .subscribe();

    return () => { supabase.removeChannel(lobbyChannel); };
  }, []);

  // ── Realtime game subscription ──────────────────────────────────────────────
  const subscribeToGame = (gameId: string) => {
    if (realtimeChannel) supabase.removeChannel(realtimeChannel);

    const channel = supabase
      .channel(`chess_game_${gameId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chess_games', filter: `id=eq.${gameId}` },
        (payload) => {
          const newGameState = payload.new as any;
          if (newGameState?.game_state?.fen) {
            try {
              chess.load(newGameState.game_state.fen);
              setBoard([...chess.board()]);
              setGameHistory(newGameState.game_state.history || []);
              setLastMovedSquare(newGameState.game_state.lastMove?.to || null);
              setGameState(prev => ({
                ...prev,
                turn: chess.turn(),
                inCheck: chess.inCheck(),
                isGameOver: chess.isGameOver() || newGameState.status === 'completed',
                winner: newGameState.winner_id ? (newGameState.winner_id === userId ? 'you' : 'opponent') : null,
              }));
              setSelectedSquare(null);
              setPossibleMoves([]);
            } catch (e) {
              console.error("Failed to load FEN from realtime:", e);
            }
          }
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    setRealtimeChannel(channel);
  };

  // ── Fetch games ─────────────────────────────────────────────────────────────
  const fetchAvailableGames = async () => {
    try {
      const { data } = await supabase
        .from('chess_games')
        .select(`*, player1_profile:staff_profiles!chess_games_player1_id_fkey(full_name), player2_profile:staff_profiles!chess_games_player2_id_fkey(full_name)`)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      setAvailableGames(data || []);
    } catch (e) { console.error(e); }
  };

  // ── Square click ────────────────────────────────────────────────────────────
  const handleSquareClick = useCallback((row: number, col: number) => {
    const square = String.fromCharCode(97 + col) + (8 - row);

    if (selectedSquare) {
      try {
        const moveResult = chess.move({ from: selectedSquare, to: square, promotion: 'q' });
        if (moveResult) {
          setLastMovedSquare(square);
          const newHistory = [...gameHistory, moveResult.san];
          setGameHistory(newHistory);
          syncBoardFromChess();

          if (gameState.gameMode === 'multiplayer' && currentGameId) {
            saveGameState(newHistory, moveResult.to);
          }
          if (gameState.gameMode === 'ai' && !chess.isGameOver()) {
            setTimeout(makeAIMove, 600);
          }
          setSelectedSquare(null);
          setPossibleMoves([]);

          if (chess.isGameOver()) {
            setIsTimerRunning(false);
            toast({ title: chess.isCheckmate() ? "Checkmate!" : "Game Over", description: chess.isCheckmate() ? `${chess.turn() === 'w' ? 'Black' : 'White'} wins!` : "Draw." });
          }
          return;
        }
      } catch (_) { /* invalid move */ }
      // Deselect if same square or invalid
      setSelectedSquare(null);
      setPossibleMoves([]);
      // Maybe select new piece
      const piece = chess.get(square as any);
      if (piece && piece.color === chess.turn()) {
        setSelectedSquare(square);
        setPossibleMoves(chess.moves({ square: square as any, verbose: true }).map((m: any) => m.to));
      }
    } else {
      const piece = chess.get(square as any);
      if (piece && piece.color === chess.turn()) {
        setSelectedSquare(square);
        setPossibleMoves(chess.moves({ square: square as any, verbose: true }).map((m: any) => m.to));
      }
    }
  }, [selectedSquare, chess, gameHistory, gameState, currentGameId]);

  // ── AI move ─────────────────────────────────────────────────────────────────
  const makeAIMove = () => {
    const moves = chess.moves();
    if (!moves.length) return;
    const moveResult = chess.move(moves[Math.floor(Math.random() * moves.length)]);
    setLastMovedSquare(moveResult?.to || null);
    setGameHistory(prev => [...prev, moveResult.san]);
    syncBoardFromChess();
    if (chess.isGameOver()) {
      setIsTimerRunning(false);
      toast({ title: "Game Over", description: chess.isCheckmate() ? `${chess.turn() === 'w' ? 'Black' : 'White'} wins!` : "Draw." });
    }
  };

  // ── Save to DB ───────────────────────────────────────────────────────────────
  const saveGameState = async (history: string[], lastMoveTo: string) => {
    if (!currentGameId) return;
    try {
      await supabase.from('chess_games').update({
        game_state: { fen: chess.fen(), history, turn: chess.turn(), lastMove: { to: lastMoveTo } },
        status: chess.isGameOver() ? 'completed' : 'active',
        completed_at: chess.isGameOver() ? new Date().toISOString() : null
      }).eq('id', currentGameId);
    } catch (e) { console.error(e); }
  };

  // ── Create game ──────────────────────────────────────────────────────────────
  const createNewGame = async (opponent: string | null = null) => {
    try {
      const { data, error } = await supabase.from('chess_games').insert([{
        player1_id: userId,
        player2_id: opponent || userId,
        status: 'active',
        game_state: { fen: chess.fen(), history: [], turn: 'w' }
      }]).select().single();
      if (error) throw error;
      setCurrentGameId(data.id);
      setGameState(prev => ({ ...prev, gameMode: opponent ? 'multiplayer' : 'ai' }));
      setIsTimerRunning(true);
      if (opponent) subscribeToGame(data.id);
      toast({ title: "New Game Started", description: opponent ? "Multiplayer — now live!" : "Playing vs AI" });
      fetchAvailableGames();
    } catch (e) {
      toast({ title: "Error", description: "Failed to start game.", variant: "destructive" });
    }
  };

  // ── Join game ─────────────────────────────────────────────────────────────────
  const joinGame = async (gameId: string) => {
    try {
      const { data, error } = await supabase.from('chess_games').select('*').eq('id', gameId).single();
      if (error || !data) throw error;
      const gs = data.game_state as any;
      if (gs?.fen) chess.load(gs.fen);
      setBoard([...chess.board()]);
      setGameHistory(gs?.history || []);
      setGameState({ turn: chess.turn(), inCheck: chess.inCheck(), isGameOver: chess.isGameOver(), winner: null, gameMode: 'multiplayer' });
      setCurrentGameId(gameId);
      subscribeToGame(gameId);
      setIsTimerRunning(!chess.isGameOver());
      toast({ title: "Game Joined", description: "You're in — connected live!" });
    } catch (_) {
      toast({ title: "Error", description: "Failed to join game.", variant: "destructive" });
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const handleTimeOut = (player: string) => {
    setIsTimerRunning(false);
    setGameState(prev => ({ ...prev, isGameOver: true, winner: player === 'white' ? 'black' : 'white' }));
    toast({ title: "Time's Up!", description: `${player === 'white' ? 'Black' : 'White'} wins on time!` });
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const squareInfo = (row: number, col: number) => {
    const sq = String.fromCharCode(97 + col) + (8 - row);
    return {
      isSelected: selectedSquare === sq,
      isPossible: possibleMoves.includes(sq),
      isLastMoved: lastMovedSquare === sq,
    };
  };

  // ── Board square colors ───────────────────────────────────────────────────────
  const getSquareBg = (row: number, col: number, isSelected: boolean, isPossible: boolean, isLastMoved: boolean) => {
    if (isSelected) return 'bg-yellow-400';
    if (isPossible) return (row + col) % 2 === 0 ? 'bg-emerald-300' : 'bg-emerald-400';
    if (isLastMoved) return (row + col) % 2 === 0 ? 'bg-sky-200' : 'bg-sky-400';
    return (row + col) % 2 === 0 ? 'bg-[#f0d9b5]' : 'bg-[#b58863]';
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CardHeader className="py-3 px-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-base">
              <Crown className="h-5 w-5 text-yellow-400" />
              Chess Engine
              {gameState.gameMode === 'multiplayer' && (
                <span className={`ml-2 flex items-center gap-1 text-xs font-normal px-2 py-0.5 rounded-full ${isLive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                  {isLive ? <><Wifi className="h-3 w-3" /> LIVE</> : <><WifiOff className="h-3 w-3" /> Connecting...</>}
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={initializeBoard} className="h-7 border-white/20 text-white hover:bg-white/10">
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
              </Button>
              <Dialog open={isCreateGameOpen} onOpenChange={setIsCreateGameOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-7 bg-yellow-500 hover:bg-yellow-400 text-black font-bold">
                    <Plus className="h-3.5 w-3.5 mr-1" /> New Game
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader><DialogTitle>Start New Game</DialogTitle></DialogHeader>
                  <div className="flex gap-3 pt-2">
                    <Button onClick={() => { initializeBoard(); createNewGame(); setIsCreateGameOpen(false); }} className="flex-1 h-12">
                      <Target className="h-4 w-4 mr-2" /> vs AI
                    </Button>
                    <Button variant="outline" onClick={() => { initializeBoard(); createNewGame(crypto.randomUUID()); setIsCreateGameOpen(false); }} className="flex-1 h-12">
                      <Users className="h-4 w-4 mr-2" /> Multiplayer
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {/* Timers / Status */}
          <div className="flex items-center justify-between gap-3">
            {/* Black timer */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${gameState.turn === 'b' && !gameState.isGameOver ? 'border-slate-600 bg-slate-800 shadow-[0_0_12px_rgba(100,80,200,0.5)] scale-105' : 'border-slate-200 bg-slate-100'}`}>
              <div className="w-5 h-5 rounded-full bg-slate-900 border-2 border-slate-600 shadow-inner" />
              <span className={`font-mono font-bold text-sm ${gameState.turn === 'b' && !gameState.isGameOver ? 'text-white' : 'text-slate-600'}`}>
                {formatTime(gameTimer.black)}
              </span>
              {gameState.turn === 'b' && !gameState.isGameOver && <Zap className="h-3.5 w-3.5 text-purple-400 animate-pulse" />}
            </div>

            <div className="flex flex-col items-center gap-1">
              {gameState.inCheck && <Badge variant="destructive" className="animate-bounce text-xs">⚡ Check!</Badge>}
              {gameState.isGameOver && (
                <Badge variant="secondary" className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                  <Trophy className="h-3 w-3" /> {gameState.winner ? `${gameState.winner} wins!` : 'Draw'}
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px]">
                {gameState.gameMode === 'ai' ? 'vs AI' : 'Multiplayer'}
              </Badge>
            </div>

            {/* White timer */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${gameState.turn === 'w' && !gameState.isGameOver ? 'border-amber-400 bg-amber-50 shadow-[0_0_12px_rgba(251,191,36,0.5)] scale-105' : 'border-slate-200 bg-slate-100'}`}>
              {gameState.turn === 'w' && !gameState.isGameOver && <Zap className="h-3.5 w-3.5 text-amber-500 animate-pulse" />}
              <span className={`font-mono font-bold text-sm ${gameState.turn === 'w' && !gameState.isGameOver ? 'text-amber-700' : 'text-slate-600'}`}>
                {formatTime(gameTimer.white)}
              </span>
              <div className="w-5 h-5 rounded-full bg-amber-50 border-2 border-amber-400 shadow-inner" />
            </div>
          </div>

          {/* Turn indicator */}
          <div className={`text-center text-xs font-bold uppercase tracking-widest py-1 rounded-full ${gameState.turn === 'w'
            ? 'bg-amber-100 text-amber-700'
            : 'bg-slate-800 text-slate-200'
            }`}>
            {gameState.isGameOver ? '— Game Over —' : `${gameState.turn === 'w' ? '⬜ White' : '⬛ Black'} to move`}
          </div>

          {/* Chess Board */}
          <div className="relative">
            {/* Board shadow/glow frame */}
            <div className={`absolute -inset-1 rounded-lg blur transition-all duration-700 ${gameState.turn === 'w' ? 'bg-amber-400/30' : 'bg-purple-600/30'}`}></div>
            <div className="relative bg-[#8B4513] p-1.5 rounded-lg shadow-2xl">
              {/* File labels top */}
              <div className="grid grid-cols-8 mb-0.5">
                {['a','b','c','d','e','f','g','h'].map(f => (
                  <div key={f} className="text-center text-[9px] font-bold text-amber-200/70 leading-none">{f}</div>
                ))}
              </div>
              <div className="flex">
                {/* Rank labels left */}
                <div className="flex flex-col mr-0.5">
                  {[8,7,6,5,4,3,2,1].map(r => (
                    <div key={r} className="h-10 flex items-center text-[9px] font-bold text-amber-200/70 leading-none w-2">{r}</div>
                  ))}
                </div>
                <div className="grid grid-cols-8 border border-[#5a2d0c] rounded overflow-hidden flex-1">
                  {board.map((row, rowIndex) =>
                    row.map((piece, colIndex) => {
                      const { isSelected, isPossible, isLastMoved } = squareInfo(rowIndex, colIndex);
                      const bgClass = getSquareBg(rowIndex, colIndex, isSelected, isPossible, isLastMoved);

                      return (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className={`
                            h-10 w-full flex items-center justify-center cursor-pointer
                            relative transition-all duration-100
                            ${bgClass}
                            ${isSelected ? 'ring-2 ring-yellow-300 ring-inset z-10' : ''}
                            hover:brightness-110
                          `}
                          onClick={() => handleSquareClick(rowIndex, colIndex)}
                        >
                          {/* Possible move dot */}
                          {isPossible && !piece && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-3 h-3 rounded-full bg-black/25"></div>
                            </div>
                          )}
                          {/* Capture ring */}
                          {isPossible && piece && (
                            <div className="absolute inset-0 ring-4 ring-black/30 ring-inset rounded-sm pointer-events-none z-10"></div>
                          )}
                          <PieceIcon piece={piece} />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Move History */}
          {gameHistory.length > 0 && (
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Move History</p>
              <div className="max-h-24 overflow-y-auto">
                <div className="grid grid-cols-5 gap-x-2 gap-y-0.5 text-xs font-mono">
                  {gameHistory.map((move, i) => (
                    <div key={i} className={`${i === gameHistory.length - 1 ? 'text-emerald-600 font-bold' : 'text-slate-600'} ${i % 2 === 0 ? '' : 'text-slate-500'}`}>
                      {i % 2 === 0 && <span className="text-slate-300 mr-0.5">{Math.floor(i / 2) + 1}.</span>}
                      {move}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Available Multiplayer Games */}
          {availableGames.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Eye className="h-3 w-3" /> Live Games
                <span className="ml-1 bg-green-100 text-green-700 rounded-full px-1.5 text-[9px] font-bold">
                  {availableGames.length}
                </span>
              </p>
              <div className="space-y-1">
                {availableGames.slice(0, 3).map(game => (
                  <div key={game.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <div>
                      <span className="font-semibold text-slate-800">{game.player1_profile?.full_name || 'Unknown'}</span>
                      <span className="text-slate-400 mx-1">vs</span>
                      <span className="font-semibold text-slate-800">{game.player2_profile?.full_name || 'Open'}</span>
                    </div>
                    <Button size="sm" className="h-6 text-[10px] px-2 bg-emerald-600 hover:bg-emerald-500 text-white" onClick={() => joinGame(game.id)}>
                      <Play className="h-2.5 w-2.5 mr-1" /> Join
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RealChessEngine;