import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, RotateCcw, Brain, Code, Cpu, Database, Flame, Gamepad2, Shield, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ICONS = [
  { id: "code", icon: Code, color: "text-blue-400" },
  { id: "cpu", icon: Cpu, color: "text-emerald-400" },
  { id: "db", icon: Database, color: "text-purple-400" },
  { id: "flame", icon: Flame, color: "text-rose-400" },
  { id: "game", icon: Gamepad2, color: "text-amber-400" },
  { id: "shield", icon: Shield, color: "text-cyan-400" }
];

interface CardItem {
  id: number;
  iconId: string;
  icon: any;
  color: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export default function MemoryMatrix({ onClose, userId }: { onClose?: () => void; userId?: string }) {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    initializeBoard();
  }, []);

  useEffect(() => {
    let interval: any;
    if (isActive && !gameComplete) {
      interval = setInterval(() => setTimer(prev => prev + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, gameComplete]);

  const initializeBoard = () => {
    const deck: CardItem[] = [];
    const pairs = [...ICONS, ...ICONS];
    const shuffled = pairs.sort(() => Math.random() - 0.5);

    shuffled.forEach((item, index) => {
      deck.push({
        id: index,
        iconId: item.id,
        icon: item.icon,
        color: item.color,
        isFlipped: false,
        isMatched: false
      });
    });

    setCards(deck);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setTimer(0);
    setGameComplete(false);
    setIsActive(false);
  };

  const handleCardClick = (index: number) => {
    if (!isActive) setIsActive(true);
    if (flippedCards.length === 2 || cards[index].isFlipped || cards[index].isMatched) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      const [firstIdx, secondIdx] = newFlipped;

      if (newCards[firstIdx].iconId === newCards[secondIdx].iconId) {
        newCards[firstIdx].isMatched = true;
        newCards[secondIdx].isMatched = true;
        setCards(newCards);
        setFlippedCards([]);
        const newMatches = matches + 1;
        setMatches(newMatches);

        if (newMatches === ICONS.length) {
          setGameComplete(true);
          setIsActive(false);
          if (userId) saveResult(moves + 1);
        }
      } else {
        setTimeout(() => {
          newCards[firstIdx].isFlipped = false;
          newCards[secondIdx].isFlipped = false;
          setCards(newCards);
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const saveResult = async (finalMoves: number) => {
    try {
      const coinsEarned = Math.max(1, 15 - Math.floor(finalMoves / 2));
      await supabase.from("user_coin_transactions").insert({
        user_id: userId,
        coins: coinsEarned,
        transaction_type: "hr_grant",
        category: "other",
        reason: `Cleared Memory Matrix in ${finalMoves} moves! (+${coinsEarned} coins)`
      } as any);
      toast.success(`Memory Master! You earned ${coinsEarned} coins! 🪙`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Card className="max-w-md mx-auto bg-zinc-950 border-white/10 text-white overflow-hidden shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-3 bg-zinc-900/80 border-b border-white/5">
        <CardTitle className="text-xl font-black text-purple-400 flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          Memory Matrix
        </CardTitle>
        <div className="flex items-center gap-4 text-xs font-mono font-bold">
          <span className="text-purple-300">Moves: {moves}</span>
          <span className="text-amber-400">Time: {timer}s</span>
        </div>
      </CardHeader>

      <CardContent className="p-5 flex flex-col items-center">
        {gameComplete ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mx-auto text-purple-400 animate-bounce">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-white">Grid Cleared!</h3>
            <p className="text-xs text-zinc-400">
              Completed in <strong className="text-white">{moves} moves</strong> and <strong className="text-white">{timer} seconds</strong>.
            </p>
            <Button onClick={initializeBoard} className="bg-purple-600 hover:bg-purple-500 font-bold px-6 py-2 rounded-xl">
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3 w-full max-w-sm my-2">
            {cards.map((card, idx) => {
              const IconComp = card.icon;
              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(idx)}
                  className={`aspect-square rounded-xl border flex items-center justify-center transition-all duration-300 transform ${
                    card.isFlipped || card.isMatched
                      ? "bg-zinc-900 border-purple-500/50 shadow-md shadow-purple-500/20 scale-100 rotate-0"
                      : "bg-zinc-950 hover:bg-zinc-900 border-white/10 scale-95"
                  }`}
                >
                  {card.isFlipped || card.isMatched ? (
                    <IconComp className={`w-8 h-8 ${card.color} animate-in zoom-in-50 duration-200`} />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-zinc-800 border border-white/10" />
                  )}
                </button>
              );
            })}
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
