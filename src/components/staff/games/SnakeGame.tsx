import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Play, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Zap, Shield, Flame, Gauge } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type DifficultyMode = 'easy' | 'medium' | 'hard';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 10, y: 12 },
  { x: 10, y: 13 },
  { x: 10, y: 14 }
];
const INITIAL_DIRECTION = { x: 0, y: -1 };

export default function SnakeGame({ onClose, userId }: { onClose?: () => void; userId?: string }) {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [mode, setMode] = useState<DifficultyMode>('easy');
  const [speed, setSpeed] = useState(160);

  const directionRef = useRef(direction);
  directionRef.current = direction;

  useEffect(() => {
    const savedHighScore = localStorage.getItem(`vaw_snake_highscore_${mode}`);
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    } else {
      setHighScore(0);
    }
  }, [mode]);

  useEffect(() => {
    spawnFood(INITIAL_SNAKE);
  }, []);

  const spawnFood = (currentSnake: { x: number; y: number }[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      const collides = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!collides) break;
    }
    setFood(newFood);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyW", "KeyS", "KeyA", "KeyD"].includes(e.code)) {
      e.preventDefault();
    }

    const currentDir = directionRef.current;

    switch (e.code) {
      case "ArrowUp":
      case "KeyW":
        if (currentDir.y === 0) setDirection({ x: 0, y: -1 });
        break;
      case "ArrowDown":
      case "KeyS":
        if (currentDir.y === 0) setDirection({ x: 0, y: 1 });
        break;
      case "ArrowLeft":
      case "KeyA":
        if (currentDir.x === 0) setDirection({ x: -1, y: 0 });
        break;
      case "ArrowRight":
      case "KeyD":
        if (currentDir.x === 0) setDirection({ x: 1, y: 0 });
        break;
      case "Space":
        setIsPaused(prev => !prev);
        break;
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isPaused || gameOver) return;

    const timer = setInterval(() => {
      setSnake(prevSnake => {
        let nextX = prevSnake[0].x + directionRef.current.x;
        let nextY = prevSnake[0].y + directionRef.current.y;

        // Hard Mode: Border Collision Check (Wall crash = Game Over)
        if (mode === 'hard') {
          if (nextX < 0 || nextX >= GRID_SIZE || nextY < 0 || nextY >= GRID_SIZE) {
            handleGameOver(score);
            return prevSnake;
          }
        } else {
          // Easy & Medium Mode: Portal Wrapping (Wrap around screen borders)
          nextX = (nextX + GRID_SIZE) % GRID_SIZE;
          nextY = (nextY + GRID_SIZE) % GRID_SIZE;
        }

        const head = { x: nextX, y: nextY };

        // Self Collision Check
        if (prevSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
          handleGameOver(score);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Check if Food Eaten
        if (head.x === food.x && head.y === food.y) {
          const newScore = score + 10;
          setScore(newScore);

          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem(`vaw_snake_highscore_${mode}`, newScore.toString());
          }

          // Speed Adjustments by Mode
          if (mode === 'medium') {
            // Medium mode: starts slow, increases speed gradually up to a limit (80ms cap)
            setSpeed(prev => Math.max(80, prev - 6));
          } else if (mode === 'hard') {
            // Hard mode: starts slow, increases speed gradually with no loose cap (down to 50ms)
            setSpeed(prev => Math.max(50, prev - 8));
          }
          // Easy mode: speed stays fixed!

          spawnFood(newSnake);
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, speed);

    return () => clearInterval(timer);
  }, [isPaused, gameOver, food, score, highScore, speed, mode]);

  const handleGameOver = (finalScore: number) => {
    setGameOver(true);
    setIsPaused(true);

    if (userId && finalScore > 0) {
      saveScore(finalScore);
    }
  };

  const saveScore = async (finalScore: number) => {
    try {
      const multiplier = mode === 'hard' ? 3 : mode === 'medium' ? 2 : 1;
      const coinsEarned = Math.floor((finalScore / 20) * multiplier);
      if (coinsEarned > 0) {
        await supabase.from("user_coin_transactions").insert({
          user_id: userId,
          coins: coinsEarned,
          transaction_type: "hr_grant",
          category: "other",
          reason: `Earned ${coinsEarned} coins playing Snake Retro (${mode.toUpperCase()} mode, Score: ${finalScore})`
        } as any);
        toast.success(`Game over! Earned ${coinsEarned} coins 🪙`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectMode = (newMode: DifficultyMode) => {
    setMode(newMode);
    restartGame(newMode);
  };

  const restartGame = (targetMode = mode) => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setSpeed(targetMode === 'easy' ? 160 : targetMode === 'medium' ? 150 : 130);
    setGameOver(false);
    setIsPaused(false);
    spawnFood(INITIAL_SNAKE);
  };

  // Border styling by mode
  const getBoardBorderStyle = () => {
    if (mode === 'hard') {
      return "border-2 border-rose-500/90 shadow-xl shadow-rose-500/20 ring-2 ring-rose-500/40";
    }
    if (mode === 'medium') {
      return "border border-amber-500/50 shadow-md shadow-amber-500/10";
    }
    return "border border-emerald-500/40 shadow-md shadow-emerald-500/10";
  };

  return (
    <Card className="max-w-md mx-auto bg-zinc-950 border-white/10 text-white overflow-hidden shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-3 bg-zinc-900/80 border-b border-white/5">
        <CardTitle className="text-xl font-black text-emerald-400 flex items-center gap-2">
          <Zap className="w-5 h-5 text-emerald-400" />
          Snake Retro
        </CardTitle>
        <div className="flex items-center gap-4 text-xs font-mono font-bold">
          <span className="text-emerald-400 flex items-center gap-1">
            <Trophy className="w-4 h-4 text-amber-400" />
            {score}
          </span>
          <span className="text-zinc-500">HI: {highScore}</span>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex flex-col items-center">
        {/* Difficulty Mode Selector */}
        <div className="flex items-center justify-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-white/10 w-full mb-4">
          <Button
            size="sm"
            onClick={() => selectMode('easy')}
            className={`flex-1 text-xs font-bold rounded-lg transition-all ${mode === 'easy'
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
              : "bg-transparent text-zinc-400 hover:text-white"
              }`}
          >
            <Shield className="w-3.5 h-3.5 mr-1" />
            Easy
          </Button>
          <Button
            size="sm"
            onClick={() => selectMode('medium')}
            className={`flex-1 text-xs font-bold rounded-lg transition-all ${mode === 'medium'
              ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
              : "bg-transparent text-zinc-400 hover:text-white"
              }`}
          >
            <Gauge className="w-3.5 h-3.5 mr-1" />
            Medium
          </Button>
          <Button
            size="sm"
            onClick={() => selectMode('hard')}
            className={`flex-1 text-xs font-bold rounded-lg transition-all ${mode === 'hard'
              ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
              : "bg-transparent text-zinc-400 hover:text-white"
              }`}
          >
            <Flame className="w-3.5 h-3.5 mr-1" />
            Hard
          </Button>
        </div>

        {/* Mode Rules Banner */}
        <div className="text-[11px] font-medium text-zinc-400 mb-3 text-center">
          {mode === 'easy' && "✨ Constant slow pace, portals on borders (no wall crashes)"}
          {mode === 'medium' && "⚡ Starts slow, speeds up gradually to a cap, portals on borders"}
          {mode === 'hard' && "🔥 Starts slow, speeds up fast! RED BORDER = crash on wall hit"}
        </div>

        {/* Game Canvas Board */}
        <div
          className={`relative w-full aspect-square bg-zinc-900 rounded-xl overflow-hidden grid gap-0 p-1 transition-all duration-300 ${getBoardBorderStyle()}`}
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
            const x = idx % GRID_SIZE;
            const y = Math.floor(idx / GRID_SIZE);

            const isHead = snake[0].x === x && snake[0].y === y;
            const isBody = snake.slice(1).some(seg => seg.x === x && seg.y === y);
            const isFoodItem = food.x === x && food.y === y;

            return (
              <div
                key={idx}
                className={`w-full h-full rounded-sm transition-all duration-75 ${isHead
                  ? "bg-emerald-400 shadow-md shadow-emerald-400/50 scale-105"
                  : isBody
                    ? "bg-emerald-600/90"
                    : isFoodItem
                      ? "bg-rose-500 animate-pulse rounded-full shadow-md shadow-rose-500/50"
                      : "bg-zinc-950/40"
                  }`}
              />
            );
          })}

          {/* Overlay state */}
          {(isPaused || gameOver) && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20 space-y-4">
              {gameOver ? (
                <>
                  <h3 className="text-3xl font-black text-rose-500">Game Over!</h3>
                  <p className="text-zinc-300 text-xs">
                    Mode: <span className="uppercase font-bold text-amber-400">{mode}</span> | Final Score: <strong className="text-white text-base">{score}</strong>
                  </p>
                  <Button onClick={() => restartGame()} className="bg-emerald-600 hover:bg-emerald-500 font-bold px-6 py-2 rounded-xl">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Play Again
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-white">Press Start to Play</h3>
                  <p className="text-xs text-zinc-400">Use Arrow keys or WASD to navigate.</p>
                  <Button onClick={() => setIsPaused(false)} className="bg-emerald-600 hover:bg-emerald-500 font-bold px-6 py-2 rounded-xl">
                    <Play className="w-4 h-4 mr-2" />
                    Start Game
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Mobile / D-Pad Controls */}
        <div className="mt-4 grid grid-cols-3 gap-2 w-48 mx-auto sm:hidden">
          <div></div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => directionRef.current.y === 0 && setDirection({ x: 0, y: -1 })}
            className="border-white/10 bg-zinc-900"
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
          <div></div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => directionRef.current.x === 0 && setDirection({ x: -1, y: 0 })}
            className="border-white/10 bg-zinc-900"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsPaused(prev => !prev)}
            className="border-white/10 bg-emerald-600/30 text-emerald-400 text-[10px] font-bold"
          >
            {isPaused ? "START" : "PAUSE"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => directionRef.current.x === 0 && setDirection({ x: 1, y: 0 })}
            className="border-white/10 bg-zinc-900"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>

          <div></div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => directionRef.current.y === 0 && setDirection({ x: 0, y: 1 })}
            className="border-white/10 bg-zinc-900"
          >
            <ArrowDown className="w-4 h-4" />
          </Button>
          <div></div>
        </div>

        {onClose && (
          <Button onClick={onClose} variant="ghost" className="mt-4 text-zinc-400 hover:text-white text-xs">
            Back to Arcade
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
