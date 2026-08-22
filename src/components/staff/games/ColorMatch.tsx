import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, Trophy, Clock, RotateCcw, Infinity as InfinityIcon, StopCircle, Flame, Target, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface HSLColor {
  h: number; // 0 - 360
  s: number; // 0 - 100
  l: number; // 0 - 100
}

const hslToHex = (h: number, s: number, l: number): string => {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

export default function ColorMatch({ onClose, userId }: { onClose?: () => void; userId?: string }) {
  const [targetHsl, setTargetHsl] = useState<HSLColor>({ h: 180, s: 80, l: 50 });
  const [selectedHsl, setSelectedHsl] = useState<HSLColor>({ h: 0, s: 50, l: 50 });

  const [isUnlimited, setIsUnlimited] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timer, setTimer] = useState(45);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [gameActive, setGameActive] = useState(true);
  const [isFinished, setIsFinished] = useState(false);

  // Round Results State
  const [lastMatchAccuracy, setLastMatchAccuracy] = useState<number | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDragging = useRef(false);

  // Draw 360° Color Spectrum Wheel on HTML5 Canvas
  useEffect(() => {
    drawColorWheel();
  }, [selectedHsl]);

  const drawColorWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const radius = width / 2 - 8;
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);

    // Draw Radial Color Wheel Spectrum
    for (let angle = 0; angle < 360; angle += 1) {
      const startAngle = (angle - 1) * (Math.PI / 180);
      const endAngle = (angle + 1) * (Math.PI / 180);

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, `hsl(${angle}, 0%, 50%)`);
      gradient.addColorStop(1, `hsl(${angle}, 100%, 50%)`);

      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Draw Selected Color Indicator Marker Ring
    const selRad = (selectedHsl.h * Math.PI) / 180;
    const selDist = (selectedHsl.s / 100) * radius;
    const markerX = centerX + selDist * Math.cos(selRad);
    const markerY = centerY + selDist * Math.sin(selRad);

    ctx.beginPath();
    ctx.arc(markerX, markerY, 8, 0, Math.PI * 2);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.closePath();
  };

  const handleCanvasInteraction = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isConfirmed || !gameActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left - canvas.width / 2;
    const y = clientY - rect.top - canvas.height / 2;

    const radius = canvas.width / 2 - 8;
    const dist = Math.min(radius, Math.sqrt(x * x + y * y));
    let angle = Math.atan2(y, x) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    const sat = Math.round((dist / radius) * 100);
    const hue = Math.round(angle);

    setSelectedHsl({ h: hue, s: sat, l: 50 });
  };

  const generateNewTarget = () => {
    const randomHue = Math.floor(Math.random() * 360);
    const randomSat = Math.floor(Math.random() * 60) + 40; // 40-100%
    setTargetHsl({ h: randomHue, s: randomSat, l: 50 });
    setSelectedHsl({ h: (randomHue + 120) % 360, s: 50, l: 50 });
    setLastMatchAccuracy(null);
    setIsConfirmed(false);
  };

  useEffect(() => {
    generateNewTarget();
  }, []);

  // Timer loop
  useEffect(() => {
    let interval: any;
    if (gameActive && !isFinished) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);

        if (!isUnlimited) {
          setTimer(prev => {
            if (prev <= 1) {
              finishGame();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameActive, isFinished, isUnlimited]);

  // Confirm Color & Calculate Match Accuracy %
  const confirmColorMatch = () => {
    if (isConfirmed || !gameActive) return;

    // Calculate Hue distance (circular 0-360)
    const rawHueDiff = Math.abs(targetHsl.h - selectedHsl.h);
    const hueDiff = Math.min(rawHueDiff, 360 - rawHueDiff) / 180; // 0 to 1

    // Calculate Saturation distance (0-100)
    const satDiff = Math.abs(targetHsl.s - selectedHsl.s) / 100; // 0 to 1

    // Combined Weighted Error
    const colorError = Math.sqrt(0.7 * (hueDiff * hueDiff) + 0.3 * (satDiff * satDiff));
    const rawAccuracy = Math.max(0, (1 - colorError) * 100);
    const roundedAcc = Math.round(rawAccuracy * 10) / 10;

    setLastMatchAccuracy(roundedAcc);
    setIsConfirmed(true);
    setRoundsPlayed(prev => prev + 1);

    if (roundedAcc >= 80) {
      const newStreak = streak + 1;
      const points = Math.round(roundedAcc * Math.min(newStreak, 3));
      setScore(prev => prev + points);
      setStreak(newStreak);
      toast.success(`Great Vision! ${roundedAcc}% Match (+${points} pts)`);
    } else {
      setStreak(0);
      toast.error(`Accuracy: ${roundedAcc}%. Try matching hue closer!`);
    }

    setTimeout(() => {
      generateNewTarget();
    }, 1800);
  };

  const finishGame = () => {
    setGameActive(false);
    setIsFinished(true);

    if (userId && score > 0) {
      saveCoins();
    }
  };

  const saveCoins = async () => {
    try {
      const coinsEarned = Math.floor(score / 20);
      if (coinsEarned > 0) {
        await supabase.from('user_coin_transactions').insert({
          user_id: userId,
          coins: coinsEarned,
          transaction_type: 'hr_grant',
          category: 'other',
          reason: `Earned ${coinsEarned} coins playing Color Wheel Perception (Score: ${score})`
        } as any);
        toast.success(`Design Visionary! You earned ${coinsEarned} coins 🪙`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const resetGame = () => {
    setScore(0);
    setStreak(0);
    setTimer(45);
    setElapsedSeconds(0);
    setRoundsPlayed(0);
    setGameActive(true);
    setIsFinished(false);
    generateNewTarget();
  };

  const toggleUnlimitedMode = (unlimited: boolean) => {
    setIsUnlimited(unlimited);
    resetGame();
  };

  const targetHex = hslToHex(targetHsl.h, targetHsl.s, targetHsl.l);
  const selectedHex = hslToHex(selectedHsl.h, selectedHsl.s, selectedHsl.l);

  return (
    <Card className="max-w-md mx-auto bg-zinc-950 border-white/10 text-white overflow-hidden shadow-2xl">
      <CardHeader className="bg-zinc-900/80 border-b border-white/5 pb-3">
        <CardTitle className="text-xl font-black text-pink-400 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-pink-400" />
            Color Wheel Perception
          </span>
        </CardTitle>

        <div className="flex items-center justify-between mt-2 text-xs font-mono font-bold bg-zinc-950 p-2 rounded-xl border border-white/5">
          <div className="flex items-center gap-1.5 text-amber-400">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Score: {score}</span>
          </div>
          {streak > 1 && (
            <div className="flex items-center gap-1 text-rose-400 animate-pulse bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
              <Flame className="w-3.5 h-3.5" />
              <span>{streak}x Combo</span>
            </div>
          )}
          {!isUnlimited ? (
            <div className="flex items-center gap-1 text-pink-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{timer}s</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-purple-400">
              <InfinityIcon className="w-3.5 h-3.5" />
              <span>{elapsedSeconds}s</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 flex flex-col items-center">
        {/* Mode Selector Header */}
        <div className="flex items-center justify-between w-full mb-4 bg-zinc-900/90 p-1.5 rounded-xl border border-white/10">
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              onClick={() => toggleUnlimitedMode(false)}
              className={`text-xs font-bold rounded-lg transition-all ${!isUnlimited
                  ? "bg-pink-600 text-white shadow-md shadow-pink-600/30"
                  : "bg-transparent text-zinc-400 hover:text-white"
                }`}
            >
              <Clock className="w-3.5 h-3.5 mr-1" />
              45s Timed
            </Button>
            <Button
              size="sm"
              onClick={() => toggleUnlimitedMode(true)}
              className={`text-xs font-bold rounded-lg transition-all ${isUnlimited
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "bg-transparent text-zinc-400 hover:text-white"
                }`}
            >
              <InfinityIcon className="w-3.5 h-3.5 mr-1" />
              Unlimited Mode
            </Button>
          </div>

          {isUnlimited && gameActive && !isFinished && (
            <Button
              size="sm"
              onClick={finishGame}
              className="bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs rounded-lg px-2.5 flex items-center gap-1 animate-pulse"
            >
              <StopCircle className="w-3.5 h-3.5" />
              End & Stats
            </Button>
          )}
        </div>

        {isFinished ? (
          /* Final Results Screen */
          <div className="text-center py-6 space-y-4 w-full animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-pink-500/20 border border-pink-500/40 flex items-center justify-center mx-auto text-pink-400 animate-bounce">
              <Award className="w-8 h-8" />
            </div>

            <h3 className="text-3xl font-black text-white">Design Challenge Complete!</h3>
            <p className="text-xs text-zinc-400">
              Mode: <span className="uppercase font-bold text-purple-400">{isUnlimited ? 'Unlimited Color Practice' : '45s Timed Challenge'}</span>
            </p>

            <div className="bg-zinc-900 border border-white/10 p-4 rounded-2xl max-w-xs mx-auto space-y-2">
              <p className="text-pink-400 font-bold text-2xl">Final Score: {score}</p>
              <p className="text-xs text-zinc-400">Rounds Completed: {roundsPlayed}</p>
            </div>

            <Button onClick={resetGame} className="bg-pink-600 hover:bg-pink-500 text-white font-black px-8 py-2.5 rounded-xl shadow-lg shadow-pink-600/30">
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
          </div>
        ) : (
          /* Active Color Wheel Game View */
          <div className="w-full space-y-5 flex flex-col items-center">
            {/* Target vs Selected Comparison Cards */}
            <div className="grid grid-cols-2 gap-3 w-full">
              {/* Target Color Display Card */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-zinc-400 block text-center">
                  Target Color
                </span>
                <div
                  className="w-full h-24 rounded-2xl border-2 border-white/20 shadow-xl flex items-center justify-center relative overflow-hidden transition-all duration-300"
                  style={{ backgroundColor: targetHex }}
                >
                  {isConfirmed && lastMatchAccuracy !== null && (
                    <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center text-center p-2 animate-in zoom-in-90">
                      <span className="text-xs font-bold text-zinc-300">Accuracy</span>
                      <span className={`text-xl font-black ${lastMatchAccuracy >= 80 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {lastMatchAccuracy}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Color Live Preview Card */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-pink-400 block text-center">
                  Your Selection
                </span>
                <div
                  className="w-full h-24 rounded-2xl border-2 border-pink-500/50 shadow-xl flex items-center justify-center relative overflow-hidden transition-all duration-100"
                  style={{ backgroundColor: selectedHex }}
                >
                  <span className="text-[10px] font-mono font-bold text-white bg-black/50 px-2 py-0.5 rounded border border-white/10">
                    {selectedHex.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Color Wheel Canvas */}
            <div className="relative group cursor-crosshair">
              <canvas
                ref={canvasRef}
                width={200}
                height={200}
                onMouseDown={(e) => { isDragging.current = true; handleCanvasInteraction(e); }}
                onMouseMove={(e) => { if (isDragging.current) handleCanvasInteraction(e); }}
                onMouseUp={() => { isDragging.current = false; }}
                onTouchStart={(e) => handleCanvasInteraction(e)}
                onTouchMove={(e) => handleCanvasInteraction(e)}
                className="rounded-full shadow-2xl border-4 border-zinc-900 hover:border-pink-500/40 transition-colors"
              />
            </div>

            <p className="text-[11px] text-zinc-400 text-center font-medium">
              Click or drag around the color wheel to pick the matching hue & saturation
            </p>

            {/* Confirm Color Button */}
            <Button
              onClick={confirmColorMatch}
              disabled={isConfirmed}
              className="w-full bg-pink-600 hover:bg-pink-500 text-white font-black py-3 rounded-xl shadow-lg shadow-pink-600/30 text-sm tracking-wide"
            >
              <Target className="w-4 h-4 mr-2" />
              Confirm Color
            </Button>
          </div>
        )}

        {onClose && (
          <Button onClick={onClose} variant="ghost" className="mt-4 text-zinc-400 hover:text-white text-xs">
            Back to Arcade
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
