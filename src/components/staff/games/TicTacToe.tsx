import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Player = 'X' | 'O' | null;

export default function TicTacToe() {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState<boolean>(true);
  const [winner, setWinner] = useState<Player | 'Draw'>(null);

  const calculateWinner = (squares: Player[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    if (!squares.includes(null)) return 'Draw';
    return null;
  };

  const makeMove = (index: number, player: Player, currentBoard?: Player[]) => {
    const newBoard = [...(currentBoard || board)];
    newBoard[index] = player;
    setBoard(newBoard);

    const win = calculateWinner(newBoard);
    if (win) {
      setWinner(win);
    } else {
      setXIsNext(player === 'O'); // If X moved, O is next, but AI handles O
    }
    return newBoard;
  };

  const handleClick = (index: number) => {
    if (board[index] || winner || !xIsNext) return;
    const newBoard = makeMove(index, 'X');

    // AI Move
    if (!calculateWinner(newBoard)) {
      setXIsNext(false); // Disable board for AI turn
      setTimeout(() => {
        const available = newBoard.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
        if (available.length > 0) {
          const aiMove = available[Math.floor(Math.random() * available.length)];
          // Pass the newBoard so the AI doesn't use the stale closure board
          makeMove(aiMove as number, 'O', newBoard);
          setXIsNext(true);
        }
      }, 500); // Small delay for realistic feeling
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    setWinner(null);
  };

  return (
    <Card className="max-w-md mx-auto mt-8 bg-zinc-950 border-white/10 text-white">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-black text-amber-500">
          Tic Tac Toe vs AI
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="mb-4 h-6 font-bold">
          {winner
            ? (winner === 'Draw' ? "It's a Draw!" : `Winner: ${winner}`)
            : (xIsNext ? "Your Turn (X)" : "AI is thinking (O)...")}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {board.map((square, i) => (
            <button
              key={i}
              className={`w-24 h-24 text-4xl font-black rounded-lg border-2 border-white/10 flex items-center justify-center transition-all ${
                !square && !winner && xIsNext ? 'hover:bg-white/5 cursor-pointer' : 'cursor-default'
              } ${square === 'X' ? 'text-blue-500' : 'text-rose-500'} bg-zinc-900`}
              onClick={() => handleClick(i)}
              disabled={!!square || !!winner || !xIsNext}
            >
              {square}
            </button>
          ))}
        </div>

        <Button
          onClick={resetGame}
          className="mt-6 w-full max-w-[200px]"
          variant="outline"
        >
          Reset Game
        </Button>
      </CardContent>
    </Card>
  );
}
