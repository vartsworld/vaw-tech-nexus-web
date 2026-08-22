import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, Clock, Code, Lightbulb, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PuzzleItem {
  description: string;
  code: string;
  correctAnswer: string;
  hint: string;
}

const MASTER_PUZZLES_POOL: PuzzleItem[] = [
  {
    description: "Fix this JavaScript function to return the sum of two numbers:",
    code: "function add(a, b) {\n  return a - b;\n}",
    correctAnswer: "a + b",
    hint: "Change the operator to add instead of subtract"
  },
  {
    description: "Complete this loop to print numbers 1 to 5:",
    code: "for (let i = 1; i <= 5; i++) {\n  console.log(__);\n}",
    correctAnswer: "i",
    hint: "Print the loop variable"
  },
  {
    description: "Fix this array method to get the first element:",
    code: "const arr = [1, 2, 3];\nconst first = arr[__];",
    correctAnswer: "0",
    hint: "Arrays are zero-indexed"
  },
  {
    description: "Complete this condition to check if number is even:",
    code: "if (num __ 2 === 0) {\n  console.log('Even');\n}",
    correctAnswer: "%",
    hint: "Use the modulus operator"
  },
  {
    description: "Fix this function to return array length:",
    code: "function getLength(arr) {\n  return arr.__;\n}",
    correctAnswer: "length",
    hint: "Use the array property that gives size"
  },
  {
    description: "Complete this string method to make it uppercase:",
    code: "const text = 'hello';\nconst upper = text.__();",
    correctAnswer: "toUpperCase",
    hint: "Method to convert string to uppercase"
  },
  {
    description: "Complete this SQL query to select all columns from users:",
    code: "SELECT __ FROM users;",
    correctAnswer: "*",
    hint: "Use the wildcard symbol for all columns"
  },
  {
    description: "Fix this Python function to define a parameter:",
    code: "def greet(__):\n  print('Hello ' + name)",
    correctAnswer: "name",
    hint: "Name the function argument parameter"
  },
  {
    description: "Complete this CSS property to hide an element:",
    code: ".hidden {\n  display: __;\n}",
    correctAnswer: "none",
    hint: "Set display to hide element completely"
  },
  {
    description: "Complete this JS array method to add an item to the end:",
    code: "const list = [1, 2];\nlist.__(3);",
    correctAnswer: "push",
    hint: "Method that adds elements to end of array"
  },
  {
    description: "Fix this ternary operator syntax:",
    code: "const status = isReady __ 'Active' : 'Pending';",
    correctAnswer: "?",
    hint: "Ternary condition operator character"
  },
  {
    description: "Complete this React hook for state management:",
    code: "const [count, setCount] = __(0);",
    correctAnswer: "useState",
    hint: "Standard React state hook name"
  },
  {
    description: "Fix this equality check to prevent coercion:",
    code: "if (val ___ 5) {\n  console.log('Strict Match');\n}",
    correctAnswer: "===",
    hint: "Use strict equality operator"
  },
  {
    description: "Complete this JSON method to parse a string:",
    code: "const obj = JSON.__(jsonString);",
    correctAnswer: "parse",
    hint: "Method to convert JSON string into an object"
  },
  {
    description: "Fix this promise chain handler:",
    code: "fetch(url).__(res => res.json());",
    correctAnswer: "then",
    hint: "Promise callback method"
  }
];

const shuffleArray = <T,>(arr: T[]): T[] => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const CodePuzzle = ({ onClose, userId }: { onClose: () => void, userId: string }) => {
  const [puzzles, setPuzzles] = useState<PuzzleItem[]>(() => shuffleArray(MASTER_PUZZLES_POOL).slice(0, 8));
  const [currentPuzzle, setCurrentPuzzle] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const [gameActive, setGameActive] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (timeLeft > 0 && gameActive) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setGameActive(false);
      saveScore();
    }
  }, [timeLeft, gameActive]);

  const saveScore = async () => {
    try {
      const coinsEarned = Math.floor(score / 3);

      const { data: settingsData } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'points_config')
        .single();
      const gamesEnabled = (settingsData?.value as any)?.games_points_enabled !== false;

      if (coinsEarned > 0 && gamesEnabled && userId) {
        await supabase.from('user_coin_transactions').insert({
          user_id: userId,
          coins: coinsEarned,
          transaction_type: 'hr_grant',
          category: 'other',
          reason: `Won ${coinsEarned} coins playing Code Puzzle (Score: ${score})`
        } as any);
      }

      if (userId) {
        await supabase.from('user_activity_log').insert({
          user_id: userId,
          activity_type: 'game_played',
          metadata: { game: 'Code Puzzle', score: score, coins_earned: gamesEnabled ? coinsEarned : 0 }
        });
      }

      toast.success(gamesEnabled && coinsEarned > 0
        ? `Puzzle session complete! You earned ${coinsEarned} coins! 🪙`
        : `Puzzle complete! Score: ${score}`);
    } catch (error) {
      console.error("Error saving puzzle result:", error);
    }
  };

  const checkAnswer = () => {
    const correct = puzzles[currentPuzzle].correctAnswer.toLowerCase();
    const answer = userAnswer.toLowerCase().trim();

    if (answer === correct) {
      const points = showHint ? 10 : 15;
      setScore(score + points);
      setFeedback(`Correct! +${points} points`);

      setTimeout(() => {
        if (currentPuzzle < puzzles.length - 1) {
          nextPuzzle();
        } else {
          setGameActive(false);
          saveScore();
        }
      }, 1200);
    } else {
      setFeedback("Not quite right, try again!");
    }
  };

  const nextPuzzle = () => {
    setCurrentPuzzle(currentPuzzle + 1);
    setUserAnswer("");
    setFeedback("");
    setShowHint(false);
  };

  const resetGame = () => {
    setPuzzles(shuffleArray(MASTER_PUZZLES_POOL).slice(0, 8));
    setCurrentPuzzle(0);
    setScore(0);
    setTimeLeft(120);
    setGameActive(true);
    setUserAnswer("");
    setFeedback("");
    setShowHint(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-zinc-950 border-white/10 text-white shadow-2xl overflow-hidden">
      <CardHeader className="bg-zinc-900/80 border-b border-white/5 pb-3 text-center">
        <CardTitle className="text-white flex items-center justify-center gap-2 text-xl font-black">
          <Code className="w-5 h-5 text-emerald-400" />
          Code Puzzle Debugger
        </CardTitle>
        <div className="flex justify-between text-xs font-mono font-bold mt-2 bg-zinc-950 p-2 rounded-xl border border-white/5">
          <span className="text-emerald-300 flex items-center gap-1">
            <Trophy className="w-4 h-4 text-amber-400" />
            Score: {score}
          </span>
          <span className="text-amber-400 flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {gameActive ? (
          <>
            <div className="text-center">
              <p className="text-xs text-zinc-400 font-mono font-bold uppercase tracking-widest mb-1">
                Puzzle {currentPuzzle + 1} of {puzzles.length}
              </p>
              <p className="text-emerald-300 text-sm font-semibold mb-3">{puzzles[currentPuzzle].description}</p>
            </div>

            <div className="bg-black/60 border border-white/10 rounded-xl p-4 font-mono text-sm shadow-inner">
              <pre className="text-emerald-400 whitespace-pre-wrap leading-relaxed">
                {puzzles[currentPuzzle].code.replace('__', '___')}
              </pre>
            </div>

            {showHint && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                <p className="text-amber-300 text-xs flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 shrink-0 text-amber-400" />
                  Hint: {puzzles[currentPuzzle].hint}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Input
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type missing code fix..."
                className="bg-zinc-900 border-white/20 text-white font-mono text-sm rounded-xl focus:ring-emerald-500"
                onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                autoFocus
              />
              <Button onClick={checkAnswer} className="bg-emerald-600 hover:bg-emerald-500 font-bold px-6 rounded-xl">
                Submit
              </Button>
            </div>

            <div className="flex justify-between items-center pt-1">
              <Button
                onClick={() => setShowHint(true)}
                variant="outline"
                size="sm"
                disabled={showHint}
                className="text-amber-300 border-amber-500/30 text-xs rounded-lg"
              >
                <Lightbulb className="w-3.5 h-3.5 mr-1" />
                {showHint ? "Hint Active (-5 pts)" : "Get Hint"}
              </Button>

              {feedback && (
                <p className={`text-xs font-bold ${feedback.includes('Correct') ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {feedback}
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-6 space-y-4">
            <h3 className="text-2xl font-black text-white">
              {currentPuzzle >= puzzles.length - 1 ? "All Puzzles Complete!" : "Time's Up!"}
            </h3>
            <div className="bg-zinc-900 border border-white/10 p-4 rounded-2xl max-w-xs mx-auto space-y-1">
              <p className="text-emerald-400 font-bold text-xl">Final Score: {score} pts</p>
              <p className="text-xs text-zinc-400">
                Solved {Math.floor(score / 10)} debug puzzles correctly!
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={resetGame} className="bg-emerald-600 hover:bg-emerald-500 font-bold flex-1 rounded-xl">
                <RefreshCw className="w-4 h-4 mr-1.5" />
                Play New Puzzle Set
              </Button>
              <Button onClick={onClose} variant="outline" className="flex-1 rounded-xl border-white/10 bg-zinc-900">
                Back to Arcade
              </Button>
            </div>
          </div>
        )}

        {gameActive && (
          <Button onClick={onClose} variant="ghost" className="w-full text-zinc-400 hover:text-white text-xs">
            Back to Arcade
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default CodePuzzle;