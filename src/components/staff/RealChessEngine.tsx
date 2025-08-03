import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Crown, 
  Users, 
  Plus, 
  Play, 
  Pause, 
  RotateCcw, 
  Trophy,
  Clock,
  Target,
  Eye
} from "lucide-react";
import { Chess } from 'chess.js';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const RealChessEngine = ({ userId, userProfile }) => {
  const [chess] = useState(new Chess());
  const [board, setBoard] = useState([]);
  const [gameState, setGameState] = useState({
    turn: 'w',
    inCheck: false,
    isGameOver: false,
    winner: null,
    gameMode: 'ai' // 'ai' or 'multiplayer'
  });
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [gameHistory, setGameHistory] = useState([]);
  const [isCreateGameOpen, setIsCreateGameOpen] = useState(false);
  const [availableGames, setAvailableGames] = useState([]);
  const [currentGameId, setCurrentGameId] = useState(null);
  const [gameTimer, setGameTimer] = useState({ white: 600, black: 600 }); // 10 minutes each
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    initializeBoard();
    fetchAvailableGames();
  }, []);

  useEffect(() => {
    let interval;
    if (isTimerRunning && !gameState.isGameOver) {
      interval = setInterval(() => {
        setGameTimer(prev => {
          const currentPlayer = gameState.turn;
          const newTimer = { ...prev };
          if (currentPlayer === 'w') {
            newTimer.white = Math.max(0, newTimer.white - 1);
            if (newTimer.white === 0) {
              handleTimeOut('white');
            }
          } else {
            newTimer.black = Math.max(0, newTimer.black - 1);
            if (newTimer.black === 0) {
              handleTimeOut('black');
            }
          }
          return newTimer;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, gameState.turn, gameState.isGameOver]);

  const initializeBoard = () => {
    chess.reset();
    setBoard(chess.board());
    setGameState({
      turn: chess.turn(),
      inCheck: chess.inCheck(),
      isGameOver: chess.isGameOver(),
      winner: null,
      gameMode: 'ai'
    });
    setSelectedSquare(null);
    setPossibleMoves([]);
    setGameHistory([]);
    setGameTimer({ white: 600, black: 600 });
    setIsTimerRunning(false);
  };

  const fetchAvailableGames = async () => {
    try {
      const { data, error } = await supabase
        .from('chess_games')
        .select(`
          *,
          player1_profile:staff_profiles!chess_games_player1_id_fkey(full_name, username),
          player2_profile:staff_profiles!chess_games_player2_id_fkey(full_name, username)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAvailableGames(data || []);
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  };

  const handleSquareClick = useCallback((row, col) => {
    const square = String.fromCharCode(97 + col) + (8 - row);
    
    if (selectedSquare) {
      // Try to make a move
      const move = {
        from: selectedSquare,
        to: square,
        promotion: 'q' // Auto-promote to queen for simplicity
      };

      try {
        const moveResult = chess.move(move);
        if (moveResult) {
          // Valid move made
          setBoard(chess.board());
          setGameHistory([...gameHistory, moveResult.san]);
          setGameState({
            turn: chess.turn(),
            inCheck: chess.inCheck(),
            isGameOver: chess.isGameOver(),
            winner: chess.isGameOver() ? (chess.turn() === 'w' ? 'black' : 'white') : null,
            gameMode: gameState.gameMode
          });
          
          // Save move to database if in multiplayer mode
          if (gameState.gameMode === 'multiplayer' && currentGameId) {
            saveGameState();
          }

          // AI move if in AI mode and game not over
          if (gameState.gameMode === 'ai' && !chess.isGameOver()) {
            setTimeout(makeAIMove, 500);
          }

          setSelectedSquare(null);
          setPossibleMoves([]);

          if (chess.isGameOver()) {
            setIsTimerRunning(false);
            if (chess.isCheckmate()) {
              toast({
                title: "Game Over",
                description: `Checkmate! ${chess.turn() === 'w' ? 'Black' : 'White'} wins!`,
              });
            } else if (chess.isDraw()) {
              toast({
                title: "Game Over",
                description: "Game ended in a draw.",
              });
            }
          }
        } else {
          // Invalid move
          setSelectedSquare(null);
          setPossibleMoves([]);
        }
      } catch (error) {
        // Invalid move
        setSelectedSquare(null);
        setPossibleMoves([]);
      }
    } else {
      // Select a piece
      const piece = chess.get(square as any);
      if (piece && piece.color === chess.turn()) {
        setSelectedSquare(square);
        const moves = chess.moves({ square: square as any, verbose: true });
        setPossibleMoves(moves.map((move: any) => move.to));
      }
    }
  }, [selectedSquare, chess, gameHistory, gameState, currentGameId]);

  const makeAIMove = () => {
    const moves = chess.moves();
    if (moves.length > 0) {
      // Simple random AI - in a real implementation, use a proper chess engine
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      const moveResult = chess.move(randomMove);
      
      setBoard(chess.board());
      setGameHistory(prev => [...prev, moveResult.san]);
      setGameState({
        turn: chess.turn(),
        inCheck: chess.inCheck(),
        isGameOver: chess.isGameOver(),
        winner: chess.isGameOver() ? (chess.turn() === 'w' ? 'black' : 'white') : null,
        gameMode: 'ai'
      });

      if (chess.isGameOver()) {
        setIsTimerRunning(false);
        if (chess.isCheckmate()) {
          toast({
            title: "Game Over",
            description: `Checkmate! ${chess.turn() === 'w' ? 'Black' : 'White'} wins!`,
          });
        }
      }
    }
  };

  const saveGameState = async () => {
    if (!currentGameId) return;

    try {
      await supabase
        .from('chess_games')
        .update({
          game_state: {
            fen: chess.fen(),
            history: gameHistory,
            turn: chess.turn()
          },
          status: chess.isGameOver() ? 'completed' : 'active',
          winner_id: chess.isGameOver() && gameState.winner ? 
            (gameState.winner === 'white' ? 'player1_id' : 'player2_id') : null,
          completed_at: chess.isGameOver() ? new Date().toISOString() : null
        })
        .eq('id', currentGameId);
    } catch (error) {
      console.error('Error saving game state:', error);
    }
  };

  const createNewGame = async (opponent = null) => {
    try {
      const { data, error } = await supabase
        .from('chess_games')
        .insert([{
          player1_id: userId,
          player2_id: opponent || userId, // AI game uses same user for both players
          status: 'active',
          game_state: {
            fen: chess.fen(),
            history: [],
            turn: 'w'
          }
        }])
        .select()
        .single();

      if (error) throw error;

      setCurrentGameId(data.id);
      setGameState(prev => ({ ...prev, gameMode: opponent ? 'multiplayer' : 'ai' }));
      setIsTimerRunning(true);
      
      toast({
        title: "New Game Started",
        description: opponent ? "Multiplayer game created!" : "Playing against AI",
      });

      fetchAvailableGames();
    } catch (error) {
      console.error('Error creating game:', error);
      toast({
        title: "Error",
        description: "Failed to create new game.",
        variant: "destructive",
      });
    }
  };

  const joinGame = async (gameId) => {
    try {
      const { data, error } = await supabase
        .from('chess_games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (error) throw error;

      // Load game state
      if (data.game_state && typeof data.game_state === 'object') {
        const gameState = data.game_state as any;
        chess.load(gameState.fen);
        setBoard(chess.board());
        setGameHistory(gameState.history || []);
        setGameState({
          turn: chess.turn(),
          inCheck: chess.inCheck(),
          isGameOver: chess.isGameOver(),
          winner: data.winner_id,
          gameMode: 'multiplayer'
        });
      }

      setCurrentGameId(gameId);
      setIsTimerRunning(!chess.isGameOver());

      toast({
        title: "Game Joined",
        description: "You've joined the multiplayer game!",
      });
    } catch (error) {
      console.error('Error joining game:', error);
      toast({
        title: "Error",
        description: "Failed to join game.",
        variant: "destructive",
      });
    }
  };

  const handleTimeOut = (player) => {
    setIsTimerRunning(false);
    setGameState(prev => ({
      ...prev,
      isGameOver: true,
      winner: player === 'white' ? 'black' : 'white'
    }));

    toast({
      title: "Time's Up!",
      description: `${player === 'white' ? 'White' : 'Black'} ran out of time. ${player === 'white' ? 'Black' : 'White'} wins!`,
    });
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getPieceSymbol = (piece) => {
    if (!piece) return '';
    
    const symbols = {
      'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚',
      'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔'
    };
    
    return symbols[piece.color === 'w' ? piece.type.toUpperCase() : piece.type] || '';
  };

  const isSquareHighlighted = (row, col) => {
    const square = String.fromCharCode(97 + col) + (8 - row);
    return selectedSquare === square || possibleMoves.includes(square);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              Chess Engine
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={initializeBoard}
                className="flex items-center gap-1"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              <Dialog open={isCreateGameOpen} onOpenChange={setIsCreateGameOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex items-center gap-1">
                    <Plus className="h-4 w-4" />
                    New Game
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Chess Game</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => {
                          initializeBoard();
                          createNewGame();
                          setIsCreateGameOpen(false);
                        }}
                        className="flex-1"
                      >
                        <Target className="h-4 w-4 mr-2" />
                        Play vs AI
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          initializeBoard();
                          createNewGame(crypto.randomUUID()); // Placeholder for multiplayer
                          setIsCreateGameOpen(false);
                        }}
                        className="flex-1"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Multiplayer
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Game Info */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Badge variant={gameState.turn === 'w' ? 'default' : 'outline'}>
                White: {formatTime(gameTimer.white)}
              </Badge>
              <Badge variant={gameState.turn === 'b' ? 'default' : 'outline'}>
                Black: {formatTime(gameTimer.black)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {gameState.inCheck && (
                <Badge variant="destructive">Check!</Badge>
              )}
              {gameState.isGameOver && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  {gameState.winner ? `${gameState.winner} wins!` : 'Draw'}
                </Badge>
              )}
              <Badge variant="outline">
                {gameState.gameMode === 'ai' ? 'vs AI' : 'Multiplayer'}
              </Badge>
            </div>
          </div>

          {/* Chess Board */}
          <div className="bg-amber-100 p-4 rounded-lg">
            <div className="grid grid-cols-8 gap-0 max-w-md mx-auto border-2 border-amber-800">
              {board.map((row, rowIndex) =>
                row.map((piece, colIndex) => {
                  const isLight = (rowIndex + colIndex) % 2 === 0;
                  const isHighlighted = isSquareHighlighted(rowIndex, colIndex);
                  
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`
                        w-12 h-12 flex items-center justify-center cursor-pointer text-2xl font-bold
                        ${isLight ? 'bg-amber-200' : 'bg-amber-600'}
                        ${isHighlighted ? 'ring-2 ring-blue-400 ring-inset' : ''}
                        hover:opacity-80 transition-opacity
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

          {/* Game History */}
          {gameHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Move History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-32 overflow-y-auto">
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    {gameHistory.map((move, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <span className="text-gray-500">{Math.floor(index / 2) + 1}.</span>
                        <span className="font-mono">{move}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Available Games */}
          {availableGames.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Available Games
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {availableGames.slice(0, 3).map((game) => (
                    <div key={game.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="text-sm">
                        <div className="font-medium">
                          {game.player1_profile?.full_name} vs {game.player2_profile?.full_name || 'Waiting...'}
                        </div>
                        <div className="text-gray-500">
                          {new Date(game.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => joinGame(game.id)}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Join
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RealChessEngine;