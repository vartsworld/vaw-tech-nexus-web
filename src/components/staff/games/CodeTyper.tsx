import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, RotateCcw, Clock, Infinity as InfinityIcon, StopCircle, Sparkles, Quote, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const FALLBACK_QUOTES = [
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "The only way to do great work is to love what you do.",
  "Great things in business are never done by one person; they are done by a team of people.",
  "Design is not just what it looks like and feels like. Design is how it works.",
  "Opportunities don't happen. You create them.",
  "Quality is not an act, it is a habit that defines team excellence.",
  "Don't watch the clock; do what it does. Keep going.",
  "Small daily improvements over time lead to stunning results.",
  "Innovation distinguishes between a leader and a follower.",
  "The secret of getting ahead is getting started.",
  "Hard work beats talent when talent doesn't work hard.",
  "Believe you can and you're halfway there.",
  "Collaboration allows us to know more than we are capable of knowing alone.",
  "Creativity is intelligence having fun.",
  "Action is the foundational key to all success.",
  "The best way to predict the future is to create it.",
  "Turn your obstacles into opportunities and your problems into possibilities.",
  "Leadership is the capacity to translate vision into reality.",
  "Excellence is never an accident. It is always the result of high intention and sincere effort.",
  "Together we achieve extraordinary results."
];

// Clean smart quotes and special characters to standard keyboard ASCII
const normalizeQuote = (str: string): string => {
  return str
    .replace(/[“”]/g, '"')
    .replace(/[‘’`]/g, "'")
    .replace(/[—–]/g, "-")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const shuffleArray = <T,>(arr: T[]): T[] => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function CodeTyper({ onClose, userId }: { onClose?: () => void; userId?: string }) {
  const [quotesList, setQuotesList] = useState<string[]>(() => shuffleArray(FALLBACK_QUOTES.map(normalizeQuote)));
  const [snippetIndex, setSnippetIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [timer, setTimer] = useState(30);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isContinuous, setIsContinuous] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [isLoadingApi, setIsLoadingApi] = useState(false);

  // Stats tracking
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [totalCharsTarget, setTotalCharsTarget] = useState(0);

  // Calculated final stats
  const [finalWpm, setFinalWpm] = useState(0);
  const [finalAccuracy, setFinalAccuracy] = useState(100);

  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch motivational quotes from public API on mount
  useEffect(() => {
    fetchPublicQuotes();
  }, []);

  const fetchPublicQuotes = async () => {
    setIsLoadingApi(true);
    try {
      const res = await fetch("https://dummyjson.com/quotes?limit=30");
      if (res.ok) {
        const data = await res.json();
        if (data.quotes && data.quotes.length > 0) {
          const apiQuotes = data.quotes.map((q: any) => normalizeQuote(q.quote));
          setQuotesList(shuffleArray(apiQuotes));
        }
      }
    } catch (e) {
      console.log("Using shuffled fallback quotes pool");
      setQuotesList(shuffleArray(FALLBACK_QUOTES.map(normalizeQuote)));
    } finally {
      setIsLoadingApi(false);
    }
  };

  const targetText = quotesList[snippetIndex % quotesList.length] || FALLBACK_QUOTES[0];

  // Timer loop
  useEffect(() => {
    let interval: any;
    if (isActive && !isFinished) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);

        if (!isContinuous) {
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
  }, [isActive, isFinished, isContinuous]);

  const finishGame = () => {
    setIsActive(false);
    setIsFinished(true);

    const activeSeconds = Math.max(1, elapsedSeconds);
    const timeSpentMinutes = activeSeconds / 60;

    // Calculate current sentence mistakes if active
    let currentSentenceMistakes = 0;
    for (let i = 0; i < userInput.length; i++) {
      if (userInput[i] !== targetText[i]) currentSentenceMistakes++;
    }

    const overallMistakes = totalMistakes + currentSentenceMistakes;
    const overallTarget = totalCharsTarget + targetText.length;
    const correctCharsCount = Math.max(0, overallTarget - overallMistakes);

    const calculatedWpm = Math.round((correctCharsCount / 5) / timeSpentMinutes) || 0;
    const calculatedAccuracy = overallTarget > 0 
      ? Math.max(0, Math.round((correctCharsCount / overallTarget) * 100)) 
      : 100;

    setFinalWpm(calculatedWpm);
    setFinalAccuracy(calculatedAccuracy);

    if (userId && calculatedWpm > 0) {
      saveScore(calculatedWpm);
    }
  };

  const saveScore = async (wpmScore: number) => {
    try {
      const coinsEarned = Math.floor(wpmScore / 10);
      if (coinsEarned > 0) {
        await supabase.from('user_coin_transactions').insert({
          user_id: userId,
          coins: coinsEarned,
          transaction_type: 'hr_grant',
          category: 'other',
          reason: `Achieved ${wpmScore} WPM in Quote Speed Typer! (+${coinsEarned} coins)`
        } as any);
        toast.success(`Quote Typer Master! You earned ${coinsEarned} coins 🪙`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isActive && !isFinished) {
      if (e.key === 'Delete' || e.key === 'Escape' || (e.key === 'Backspace' && userInput === '')) {
        e.preventDefault();
        toast.info("Ending quote speed test...");
        finishGame();
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    if (!isActive && !isFinished) {
      setIsActive(true);
    }

    setUserInput(val);

    // Free-flow typing: when user reaches or exceeds the target text length, calculate mistakes & move to next quote!
    if (val.length >= targetText.length) {
      let sentenceMistakes = 0;
      for (let i = 0; i < targetText.length; i++) {
        if (val[i] !== targetText[i]) sentenceMistakes++;
      }

      setTotalMistakes(prev => prev + sentenceMistakes);
      setTotalCharsTarget(prev => prev + targetText.length);
      setCompletedCount(prev => prev + 1);

      if (isContinuous) {
        setSnippetIndex(prev => prev + 1);
        setUserInput('');
      } else {
        if (snippetIndex < quotesList.length - 1) {
          setSnippetIndex(prev => prev + 1);
          setUserInput('');
        } else {
          finishGame();
        }
      }
    }
  };

  const resetGame = () => {
    setQuotesList(shuffleArray(quotesList));
    setSnippetIndex(0);
    setUserInput('');
    setTimer(30);
    setElapsedSeconds(0);
    setIsActive(false);
    setIsFinished(false);
    setCompletedCount(0);
    setTotalMistakes(0);
    setTotalCharsTarget(0);
    setFinalWpm(0);
    setFinalAccuracy(100);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const toggleContinuousMode = () => {
    setIsContinuous(prev => !prev);
    resetGame();
  };

  // Calculate live current mistakes & accuracy
  let liveSentenceMistakes = 0;
  for (let i = 0; i < userInput.length; i++) {
    if (userInput[i] !== targetText[i]) liveSentenceMistakes++;
  }
  const currentTotalMistakes = totalMistakes + liveSentenceMistakes;
  const currentTotalTarget = totalCharsTarget + (userInput.length > 0 ? targetText.length : 0);
  const liveAccuracy = currentTotalTarget > 0 
    ? Math.max(0, Math.round(((currentTotalTarget - currentTotalMistakes) / currentTotalTarget) * 100)) 
    : 100;

  return (
    <Card className="max-w-xl mx-auto bg-zinc-950 border-white/10 text-white overflow-hidden shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-3 bg-zinc-900/80 border-b border-white/5">
        <CardTitle className="text-xl font-black text-amber-400 flex items-center gap-2">
          <Quote className="w-5 h-5 text-amber-400" />
          Motivational Quote Typer
        </CardTitle>

        <div className="flex items-center gap-3 text-xs font-mono font-bold">
          {!isContinuous ? (
            <span className="text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
              <Clock className="w-3.5 h-3.5" />
              {timer}s
            </span>
          ) : (
            <span className="text-purple-400 flex items-center gap-1 bg-purple-500/10 px-2 py-1 rounded-md border border-purple-500/20">
              <InfinityIcon className="w-3.5 h-3.5" />
              {elapsedSeconds}s
            </span>
          )}
          <span className="text-emerald-400">Acc: {liveAccuracy}%</span>
        </div>
      </CardHeader>

      <CardContent className="p-6 flex flex-col items-center">
        {/* Mode Selector & Controls Header */}
        <div className="flex items-center justify-between w-full mb-4 bg-zinc-900/90 p-1.5 rounded-xl border border-white/10">
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              onClick={() => { if (isContinuous) toggleContinuousMode(); }}
              className={`text-xs font-bold rounded-lg transition-all ${
                !isContinuous
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                  : "bg-transparent text-zinc-400 hover:text-white"
              }`}
            >
              <Clock className="w-3.5 h-3.5 mr-1" />
              30s Timed
            </Button>
            <Button
              size="sm"
              onClick={() => { if (!isContinuous) toggleContinuousMode(); }}
              className={`text-xs font-bold rounded-lg transition-all ${
                isContinuous
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "bg-transparent text-zinc-400 hover:text-white"
              }`}
            >
              <InfinityIcon className="w-3.5 h-3.5 mr-1" />
              Continuous Mode
            </Button>
          </div>

          {isActive && !isFinished && (
            <Button
              size="sm"
              onClick={finishGame}
              className="bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs rounded-lg px-3 flex items-center gap-1 animate-pulse"
            >
              <StopCircle className="w-3.5 h-3.5" />
              End & Stats (Del)
            </Button>
          )}
        </div>

        {isFinished ? (
          /* Final Stats Display Screen Popup */
          <div className="text-center py-6 space-y-5 w-full animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400 animate-bounce">
              <Trophy className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-3xl font-black text-white">Inspiring Session Complete!</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Mode: <span className="uppercase font-bold text-purple-400">{isContinuous ? 'Continuous' : 'Timed Quote Test'}</span>
              </p>
            </div>

            {/* Comprehensive Stats Breakdown */}
            <div className="grid grid-cols-4 gap-2.5 bg-zinc-900/90 border border-white/10 p-4 rounded-2xl max-w-md mx-auto">
              <div className="text-center">
                <span className="text-[10px] text-zinc-400 font-bold block uppercase">Speed</span>
                <span className="text-xl font-black text-amber-400">{finalWpm} <span className="text-[10px] font-normal text-zinc-400">WPM</span></span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-zinc-400 font-bold block uppercase">Accuracy</span>
                <span className="text-xl font-black text-emerald-400">{finalAccuracy}%</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-zinc-400 font-bold block uppercase">Mistakes</span>
                <span className="text-xl font-black text-rose-400">{totalMistakes}</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-zinc-400 font-bold block uppercase">Quotes</span>
                <span className="text-xl font-black text-purple-400">{completedCount}</span>
              </div>
            </div>

            <Button onClick={resetGame} className="bg-amber-500 hover:bg-amber-400 text-black font-black px-8 py-2.5 rounded-xl shadow-lg shadow-amber-500/20">
              <RotateCcw className="w-4 h-4 mr-2" />
              Play New Randomized Game
            </Button>
          </div>
        ) : (
          /* Active Quote Typing View */
          <div className="w-full space-y-4">
            <div className="flex justify-between items-center text-xs text-zinc-400 font-mono font-bold">
              <span>Quote {snippetIndex + 1} ({completedCount} Completed)</span>
              <span className="text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {isContinuous ? "Continuous Mode (Forgiving Flow)" : "Type Quote to Start"}
              </span>
            </div>

            {/* Target Quote Box */}
            <div className="bg-zinc-900 border border-white/10 p-4 rounded-xl font-sans text-base leading-relaxed overflow-x-auto select-none min-h-[85px] flex items-center relative">
              <Quote className="w-8 h-8 text-white/5 absolute right-3 bottom-2 pointer-events-none" />
              <div className="relative z-10 font-medium">
                {targetText.split('').map((char, idx) => {
                  let colorClass = 'text-zinc-500';
                  if (idx < userInput.length) {
                    colorClass = userInput[idx] === char ? 'text-emerald-400 font-bold' : 'text-rose-400 bg-rose-500/20 underline font-bold';
                  } else if (idx === userInput.length) {
                    colorClass = 'text-white underline decoration-amber-500 decoration-2 font-bold animate-pulse';
                  }

                  return (
                    <span key={idx} className={`${colorClass} transition-colors`}>
                      {char}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Typing Input Field */}
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Start typing the quote above..."
              className="w-full bg-zinc-900 border border-amber-500/40 rounded-xl px-4 py-3 text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-inner"
              autoFocus
            />

            {/* Instruction Footer */}
            <div className="flex justify-between items-center text-[11px] text-zinc-400 pt-1">
              <span>Press <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-white/10 text-white font-mono text-[10px]">Delete</kbd> or <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-white/10 text-white font-mono text-[10px]">Esc</kbd> to end & see stats</span>
              <Button onClick={() => setQuotesList(shuffleArray(quotesList))} variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300 text-xs h-7 px-2 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                Shuffle Quotes
              </Button>
            </div>
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
