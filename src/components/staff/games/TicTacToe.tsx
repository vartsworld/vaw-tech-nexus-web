import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, RefreshCw, Sparkles, X as XIcon, Circle as OIcon, Bot, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Player = 'X' | 'O' | null;

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

export default function TicTacToe({ userId }: { userId?: string }) {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState<boolean>(true);
  const [roundWinner, setRoundWinner] = useState<Player | 'Draw'>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);

  // 5-Round Series state
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [seriesScore, setSeriesScore] = useState({ x: 0, o: 0, draw: 0 });
  const [showSeriesPopup, setShowSeriesPopup] = useState<boolean>(false);
  const [seriesWinner, setSeriesWinner] = useState<'X' | 'O' | 'Draw' | null>(null);

  // Check Round Winner logic
  const checkWinner = (squares: Player[]) => {
    for (let i = 0; i < WINNING_LINES.length; i++) {
      const [a, b, c] = WINNING_LINES[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: WINNING_LINES[i] };
      }
    }
    if (!squares.includes(null)) {
      return { winner: 'Draw' as const, line: null };
    }
    return null;
  };

  // Intelligent AI strategy logic
  const getBestAiMove = (currentBoard: Player[]): number => {
    const available = currentBoard.map((val, idx) => (val === null ? idx : null)).filter((v): v is number => v !== null);

    // 1. Can AI ('O') win in 1 move?
    for (const idx of available) {
      const tempBoard = [...currentBoard];
      tempBoard[idx] = 'O';
      if (checkWinner(tempBoard)?.winner === 'O') return idx;
    }

    // 2. Can Player ('X') win in 1 move? Block them!
    for (const idx of available) {
      const tempBoard = [...currentBoard];
      tempBoard[idx] = 'X';
      if (checkWinner(tempBoard)?.winner === 'X') return idx;
    }

    // 3. Take Center cell (4) if available
    if (available.includes(4)) return 4;

    // 4. Take Corners (0, 2, 6, 8) if available
    const corners = [0, 2, 6, 8].filter(c => available.includes(c));
    if (corners.length > 0) {
      return corners[Math.floor(Math.random() * corners.length)];
    }

    // 5. Pick random available move
    return available[Math.floor(Math.random() * available.length)];
  };

  const handleRoundEnd = (resWinner: Player | 'Draw') => {
    setRoundWinner(resWinner);

    const newScore = {
      x: seriesScore.x + (resWinner === 'X' ? 1 : 0),
      o: seriesScore.o + (resWinner === 'O' ? 1 : 0),
      draw: seriesScore.draw + (resWinner === 'Draw' ? 1 : 0)
    };
    setSeriesScore(newScore);

    // Check if 5-round series finished or someone won majority (3 wins)
    const isSeriesOver = currentRound >= 5 || newScore.x >= 3 || newScore.o >= 3;

    if (isSeriesOver) {
      let champion: 'X' | 'O' | 'Draw' = 'Draw';
      if (newScore.x > newScore.o) champion = 'X';
      else if (newScore.o > newScore.x) champion = 'O';

      setSeriesWinner(champion);

      setTimeout(() => {
        setShowSeriesPopup(true);
        if (userId && champion === 'X') {
          saveSeriesCoins(newScore.x);
        }
      }, 1000);
    }
  };

  const saveSeriesCoins = async (xWins: number) => {
    try {
      const coinsEarned = xWins * 5;
      await supabase.from('user_coin_transactions').insert({
        user_id: userId,
        coins: coinsEarned,
        transaction_type: 'hr_grant',
        category: 'other',
        reason: `Won Tic Tac Toe 5-Round Series! (+${coinsEarned} coins)`
      } as any);
      toast.success(`Series Champion! You earned ${coinsEarned} coins 🪙`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClick = (index: number) => {
    if (board[index] || roundWinner || !xIsNext || showSeriesPopup) return;

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result) {
      setWinningLine(result.line);
      handleRoundEnd(result.winner);
    } else {
      setXIsNext(false); // AI Turn

      setTimeout(() => {
        const aiMove = getBestAiMove(newBoard);
        if (aiMove !== undefined) {
          const aiBoard = [...newBoard];
          aiBoard[aiMove] = 'O';
          setBoard(aiBoard);

          const aiResult = checkWinner(aiBoard);
          if (aiResult) {
            setWinningLine(aiResult.line);
            handleRoundEnd(aiResult.winner);
          } else {
            setXIsNext(true);
          }
        }
      }, 450);
    }
  };

  const nextRound = () => {
    if (currentRound < 5 && !showSeriesPopup) {
      setCurrentRound(prev => prev + 1);
    }
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    setRoundWinner(null);
    setWinningLine(null);
  };

  const resetFullSeries = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    setRoundWinner(null);
    setWinningLine(null);
    setCurrentRound(1);
    setSeriesScore({ x: 0, o: 0, draw: 0 });
    setShowSeriesPopup(false);
    setSeriesWinner(null);
  };

  return (
    <Card className="max-w-md mx-auto bg-zinc-950 border-white/10 text-white shadow-2xl relative overflow-hidden">
      <CardHeader className="bg-zinc-900/80 border-b border-white/5 pb-3">
        <CardTitle className="text-center text-xl font-black text-amber-500 flex items-center justify-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          Tic Tac Toe (5-Round Series)
        </CardTitle>
        <div className="flex items-center justify-between mt-2 text-xs font-mono font-bold bg-zinc-950 p-2 rounded-xl border border-white/5">
          <div className="flex items-center gap-1.5 text-blue-400">
            <User className="w-3.5 h-3.5" />
            <span>You (X): {seriesScore.x}</span>
          </div>
          <div className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
            Round {Math.min(currentRound, 5)} / 5
          </div>
          <div className="flex items-center gap-1.5 text-rose-400">
            <span>AI (O): {seriesScore.o}</span>
            <Bot className="w-3.5 h-3.5" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 flex flex-col items-center">
        {/* Round Turn / Result Banner */}
        <div className="mb-4 h-8 flex items-center justify-center font-bold text-sm">
          {roundWinner ? (
            roundWinner === 'Draw' ? (
              <span className="text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                Round {currentRound} is a Draw!
              </span>
            ) : roundWinner === 'X' ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                You won Round {currentRound}! 🎉
              </span>
            ) : (
              <span className="text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                AI won Round {currentRound}!
              </span>
            )
          ) : xIsNext ? (
            <span className="text-blue-400 flex items-center gap-1.5">
              <User className="w-4 h-4" />
              Your Turn (X)
            </span>
          ) : (
            <span className="text-rose-400 flex items-center gap-1.5 animate-pulse">
              <Bot className="w-4 h-4" />
              AI is thinking (O)...
            </span>
          )}
        </div>

        {/* 3x3 Board Grid */}
        <div className="grid grid-cols-3 gap-2.5 bg-zinc-900/60 p-3 rounded-2xl border border-white/10 shadow-inner">
          {board.map((square, i) => {
            const isWinningSquare = winningLine?.includes(i);

            return (
              <button
                key={i}
                onClick={() => handleClick(i)}
                disabled={!!square || !!roundWinner || !xIsNext || showSeriesPopup}
                className={`w-24 h-24 text-4xl font-black rounded-xl border-2 transition-all flex items-center justify-center ${
                  isWinningSquare
                    ? "bg-emerald-500/20 border-emerald-400 shadow-lg shadow-emerald-500/30 scale-105"
                    : square === 'X'
                    ? "bg-zinc-900 border-blue-500/50 text-blue-400"
                    : square === 'O'
                    ? "bg-zinc-900 border-rose-500/50 text-rose-400"
                    : !roundWinner && xIsNext
                    ? "bg-zinc-950 border-white/10 hover:border-white/30 hover:bg-zinc-900/80 cursor-pointer"
                    : "bg-zinc-950 border-white/10 cursor-default"
                }`}
              >
                {square === 'X' && <XIcon className="w-12 h-12 stroke-[3]" />}
                {square === 'O' && <OIcon className="w-12 h-12 stroke-[3]" />}
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex gap-3 w-full">
          {roundWinner && currentRound < 5 && !showSeriesPopup ? (
            <Button
              onClick={nextRound}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 font-bold"
            >
              Next Round ({currentRound + 1}/5)
            </Button>
          ) : (
            <Button
              onClick={resetFullSeries}
              variant="outline"
              className="flex-1 border-white/10 bg-zinc-900 hover:bg-zinc-800"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset Match Series
            </Button>
          )}
        </div>
      </CardContent>

      {/* SERIES WINNER POPUP MODAL OVERLAY */}
      {showSeriesPopup && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-3 animate-bounce">
            <Trophy className="w-8 h-8" />
          </div>

          <h2 className="text-3xl font-black text-white tracking-tight">
            {seriesWinner === 'X' && "🏆 SERIES CHAMPION!"}
            {seriesWinner === 'O' && "🤖 AI DEFEATED YOU!"}
            {seriesWinner === 'Draw' && "🤝 SERIES ENDED IN A DRAW!"}
          </h2>

          <p className="text-xs text-zinc-400 mt-2">5-Round Series Final Result</p>

          <div className="my-5 bg-zinc-900/90 border border-white/10 p-4 rounded-2xl w-full max-w-xs space-y-2">
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-blue-400">Your Wins (X):</span>
              <span className="text-white text-base">{seriesScore.x}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-rose-400">AI Wins (O):</span>
              <span className="text-white text-base">{seriesScore.o}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-amber-400">Draw Rounds:</span>
              <span className="text-white text-base">{seriesScore.draw}</span>
            </div>
          </div>

          <Button
            onClick={resetFullSeries}
            className="w-full max-w-xs bg-amber-500 hover:bg-amber-400 text-black font-black py-3 rounded-xl shadow-lg shadow-amber-500/20"
          >
            Play New 5-Round Series
          </Button>
        </div>
      )}
    </Card>
  );
}
