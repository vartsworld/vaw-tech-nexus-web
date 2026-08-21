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
  Zap,
  Settings
} from "lucide-react";
import { Chess } from 'chess.js';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Chessboard } from "react-chessboard";

// ─── Main Component ──────────────────────────────────────────────────────────

const RealChessEngine = ({ userId, userProfile }: { userId: string; userProfile: any }) => {
  const chessRef = useRef(new Chess());
  const chess = chessRef.current;

  const [fen, setFen] = useState(chess.fen());
  const [difficulty, setDifficulty] = useState('Easy');
  const [gameState, setGameState] = useState({
    turn: 'w' as 'w' | 'b',
    inCheck: false,
    isGameOver: false,
    winner: null as string | null,
    gameMode: 'ai' as 'ai' | 'multiplayer'
  });
  const [gameHistory, setGameHistory] = useState<string[]>([]);
  const [isCreateGameOpen, setIsCreateGameOpen] = useState(false);
  const [availableGames, setAvailableGames] = useState<any[]>([]);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [isPlayerWhite, setIsPlayerWhite] = useState(true);
  const [gameTimer, setGameTimer] = useState(900);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);
  const [lastMovedSquare, setLastMovedSquare] = useState<string | null>(null);

  const [moveFrom, setMoveFrom] = useState<string | null>(null);
  const [optionSquares, setOptionSquares] = useState({});
  const boardRef = useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = useState<number>(400);
  const BOARD_THEMES = [
    { id: 'classic', name: 'Classic', dark: '#b58863', light: '#f0d9b5', bg: '#5d4037' },
    { id: 'ocean', name: 'Ocean', dark: '#006699', light: '#99ccff', bg: '#003366' },
    { id: 'emerald', name: 'Emerald', dark: '#4caf50', light: '#c8e6c9', bg: '#1b5e20' },
    { id: 'monochrome', name: 'Monochrome', dark: '#757575', light: '#e0e0e0', bg: '#212121' }
  ];
  const [boardTheme, setBoardTheme] = useState(BOARD_THEMES[0]);


  useEffect(() => {
    const handleResize = () => {
      if (boardRef.current) {
        setBoardWidth(boardRef.current.clientWidth - 12); // Account for padding
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { toast } = useToast();

  // ── Board Init ──────────────────────────────────────────────────────────────
  const syncBoardFromChess = () => {
    setFen(chess.fen());
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
    setFen(chess.fen());
    setGameState({ turn: 'w', inCheck: false, isGameOver: false, winner: null, gameMode: 'ai' });
    setGameHistory([]);
    setGameTimer(900);
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
          const nextTimer = Math.max(0, prev - 1);
          if (nextTimer === 0) handleTimeOut(gameState.turn === 'w' ? 'white' : 'black');
          return nextTimer;
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
              setFen(chess.fen());
              setGameHistory(newGameState.game_state.history || []);
              setLastMovedSquare(newGameState.game_state.lastMove?.to || null);
              setGameState(prev => ({
                ...prev,
                turn: chess.turn(),
                inCheck: chess.inCheck(),
                isGameOver: chess.isGameOver() || newGameState.status === 'completed',
                winner: newGameState.winner_id ? (newGameState.winner_id === userId ? 'you' : 'opponent') : null,
              }));
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

  // ── Piece Drop ──────────────────────────────────────────────────────────────
  const onPieceDrop = (sourceSquare: string, targetSquare: string) => {
    if (gameState.isGameOver) return false;

    try {
      const moveResult = chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });

      if (moveResult) {
        setLastMovedSquare(targetSquare);
        const newHistory = [...gameHistory, moveResult.san];
        setGameHistory(newHistory);
        syncBoardFromChess();

        if (gameState.gameMode === 'multiplayer' && currentGameId) {
          saveGameState(newHistory, moveResult.to);
        }
        if (gameState.gameMode === 'ai' && !chess.isGameOver()) {
          setTimeout(makeAIMove, 600);
        }

        if (chess.isGameOver()) {
          setIsTimerRunning(false);
          toast({ title: chess.isCheckmate() ? "Checkmate!" : "Game Over", description: chess.isCheckmate() ? `${chess.turn() === 'w' ? 'Black' : 'White'} wins!` : "Draw." });
        }
        return true;
      }
    } catch (_) { /* invalid move */ }
    return false;
  };

  // ── AI move ─────────────────────────────────────────────────────────────────
  const makeAIMove = () => {
    const moves = chess.moves({ verbose: true });
    if (!moves.length) return;

    let selectedMove = moves[Math.floor(Math.random() * moves.length)];

    if (difficulty === 'Hard' || difficulty === 'Medium') {
      // Basic heuristic: prioritize captures
      const captures = moves.filter(m => m.flags.includes('c') || m.flags.includes('e'));
      if (captures.length > 0) {
        // Hard always captures if possible, Medium has a 50% chance
        if (difficulty === 'Hard' || Math.random() > 0.5) {
          selectedMove = captures[Math.floor(Math.random() * captures.length)];
        }
      }
    }

    const moveResult = chess.move(selectedMove);
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
        player2_id: opponent || null,
        status: 'active',
        game_state: { fen: chess.fen(), history: [], turn: 'w' }
      }]).select().single();
      if (error) throw error;
      setCurrentGameId(data.id);
      setIsPlayerWhite(true); // Creator is always white (Player 1)
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
      setFen(chess.fen());
      setGameHistory(gs?.history || []);
      setGameState({ turn: chess.turn(), inCheck: chess.inCheck(), isGameOver: chess.isGameOver(), winner: null, gameMode: 'multiplayer' });
      setCurrentGameId(gameId);
      setIsPlayerWhite(data.player1_id === userId);
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


  // ── Click-to-Move ──────────────────────────────────────────────────────────
  const getMoveOptions = (square: string) => {
    const moves = chess.moves({
      square,
      verbose: true,
    });
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }
    const newSquares: Record<string, any> = {};
    moves.map((move: any) => {
      newSquares[move.to] = {
        background:
          chess.get(move.to as any) && chess.get(move.to as any)?.color !== chess.get(square as any)?.color
            ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)'
            : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
        borderRadius: '50%',
      };
      return move;
    });
    newSquares[square] = {
      background: 'rgba(255, 255, 0, 0.4)',
    };
    setOptionSquares(newSquares);
    return true;
  };

  const onSquareClick = (square: string) => {
    if (gameState.isGameOver) return;
    setLastMovedSquare(null);

    // Allow reselection if clicking another own piece
    if (chess.get(square as any) && chess.get(square as any)?.color === chess.turn()) {
      const hasMoveOptions = getMoveOptions(square);
      if (hasMoveOptions) {
        setMoveFrom(square);
      } else {
        setMoveFrom(null);
      }
      return;
    }

    // from square
    if (!moveFrom) {
      const hasMoveOptions = getMoveOptions(square);
      if (hasMoveOptions) setMoveFrom(square);
      return;
    }

    // to square
    if (moveFrom) {
      const moveResult = chess.move({
        from: moveFrom,
        to: square,
        promotion: 'q',
      });

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

        if (chess.isGameOver()) {
          setIsTimerRunning(false);
          toast({ title: chess.isCheckmate() ? "Checkmate!" : "Game Over", description: chess.isCheckmate() ? `${chess.turn() === 'w' ? 'Black' : 'White'} wins!` : "Draw." });
        }
      }

      setMoveFrom(null);
      setOptionSquares({});
    }
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
              <span className={`font-mono font-bold text-sm text-slate-300 ml-4 px-3 py-1 bg-black/40 rounded-full flex items-center gap-2`}>
                <Clock className="w-4 h-4 text-amber-500" /> {formatTime(gameTimer)}
              </span>
              <Badge variant="outline" className="text-[10px] ml-2">
                {gameState.gameMode === 'ai' ? 'vs AI' : 'Multiplayer'}
              </Badge>
              <span className={`text-center text-[10px] font-bold uppercase tracking-widest py-1 px-3 ml-2 rounded-full ${gameState.turn === 'w'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-800 text-slate-200'
                }`}>
                {gameState.isGameOver ? '— Game Over —' : `${gameState.turn === 'w' ? '⬜ White' : '⬛ Black'} to move`}
              </span>
              {gameState.gameMode === 'multiplayer' && (
                <span className={`ml-2 flex items-center gap-1 text-xs font-normal px-2 py-0.5 rounded-full ${isLive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                  {isLive ? <><Wifi className="h-3 w-3" /> LIVE</> : <><WifiOff className="h-3 w-3" /> Connecting...</>}
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 border-white/20 text-white hover:bg-white/10">
                    <Settings className="h-3.5 w-3.5 mr-1" /> Style
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xs">
                  <DialogHeader><DialogTitle>Board Style</DialogTitle></DialogHeader>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {BOARD_THEMES.map(theme => (
                      <Button
                        key={theme.id}
                        variant={boardTheme.id === theme.id ? "default" : "outline"}
                        onClick={() => setBoardTheme(theme)}
                        className="w-full h-auto py-2 flex flex-col gap-1 items-center"
                      >
                        <div className="flex w-full h-4 rounded overflow-hidden">
                          <div style={{ backgroundColor: theme.light }} className="w-1/2 h-full"></div>
                          <div style={{ backgroundColor: theme.dark }} className="w-1/2 h-full"></div>
                        </div>
                        <span className="text-xs">{theme.name}</span>
                      </Button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
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
                    <div className="flex-1 flex flex-col gap-2">
                      <Button onClick={() => { initializeBoard(); createNewGame(); setIsCreateGameOpen(false); }} className="h-12 w-full">
                        <Target className="h-4 w-4 mr-2" /> vs AI
                      </Button>
                      <select
                        className="bg-zinc-900 border border-white/20 text-white text-sm rounded-lg h-9 px-3 w-full outline-none focus:border-amber-500"
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                    <Button variant="outline" onClick={() => { initializeBoard(); createNewGame(null); setIsCreateGameOpen(false); }} className="flex-1 h-12">
                      <Users className="h-4 w-4 mr-2" /> Multiplayer
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {/* Status */}
          {(gameState.inCheck || gameState.isGameOver) && (
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="flex flex-col items-center gap-1">
                {gameState.inCheck && <Badge variant="destructive" className="animate-bounce text-xs">⚡ Check!</Badge>}
                {gameState.isGameOver && (
                  <Badge variant="secondary" className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                    <Trophy className="h-3 w-3" /> {gameState.winner ? `${gameState.winner} wins!` : 'Draw'}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Chess Board */}
          <div className="relative flex justify-center items-center w-full">
            {/* Board shadow/glow frame */}
            <div className={`absolute -inset-1 rounded-lg blur transition-all duration-700 ${gameState.turn === 'w' ? 'bg-amber-400/30' : 'bg-purple-600/30'}`}></div>
            <div ref={boardRef} className="relative p-1.5 rounded-lg shadow-2xl w-full max-w-[450px] aspect-square flex items-center justify-center transition-colors" style={{ backgroundColor: boardTheme.bg }}>
              <div style={{ width: boardWidth }}>
                <Chessboard
                  id="RealChessEngine"
                  position={fen}
                  onPieceDrop={onPieceDrop}
                  onSquareClick={onSquareClick}
                  customSquareStyles={optionSquares}
                  customDarkSquareStyle={{ backgroundColor: boardTheme.dark }}
                  customLightSquareStyle={{ backgroundColor: boardTheme.light }}
                  boardOrientation={isPlayerWhite ? "white" : "black"}
                  boardWidth={boardWidth}
                />
              </div>
            </div>
          </div>

          {/* Move History */}
          {gameHistory.length > 0 && (
            <details className="group bg-slate-50 rounded-lg p-3 border border-slate-200">
              <summary className="cursor-pointer text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Move History</summary>
              <div className="max-h-24 overflow-y-auto mt-2">
                <div className="grid grid-cols-5 gap-x-2 gap-y-0.5 text-xs font-mono">
                  {gameHistory.map((move, i) => (
                    <div key={i} className={`${i === gameHistory.length - 1 ? 'text-emerald-600 font-bold' : 'text-slate-600'} ${i % 2 === 0 ? '' : 'text-slate-500'}`}>
                      {i % 2 === 0 && <span className="text-slate-300 mr-0.5">{Math.floor(i / 2) + 1}.</span>}
                      {move}
                    </div>
                  ))}
                </div>
              </div>
            </details>
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