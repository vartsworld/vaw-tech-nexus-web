import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, Clock, Code, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const puzzles = [
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
  }
];

const CodePuzzle = ({ onClose, userId }: { onClose: () => void, userId: string }) => {
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
    } else if (timeLeft === 0) {
      setGameActive(false);
      saveScore();
    }
  }, [timeLeft, gameActive]);

  const saveScore = async () => {
    try {
      // Calculate coins earned: 15 points (no hint) = 5 coins, 10 points (hint) = 3 coins
      // Approximate coins from score:
      const coinsEarned = Math.floor(score / 3);

      if (coinsEarned > 0) {
        await supabase.from('user_coin_transactions').insert({
          user_id: userId,
          coins: coinsEarned,
          transaction_type: 'bonus',
          description: `Won ${coinsEarned} coins playing Code Puzzle (Score: ${score})`
        });
      }

      await supabase.from('user_activity_log').insert({
        user_id: userId,
        activity_type: 'game_played',
        metadata: { game: 'Code Puzzle', score: score, coins_earned: coinsEarned }
      });

      toast.success(`Puzzle session complete! You earned ${coinsEarned} coins! 🪙`);
    } catch (error) {
      console.error("Error saving puzzle result:", error);
      toast.error("Failed to save your result.");
    }
  };

  const checkAnswer = () => {
    const correct = puzzles[currentPuzzle].correctAnswer.toLowerCase();
    const answer = userAnswer.toLowerCase().trim();

    if (answer === correct) {
      const points = showHint ? 10 : 15; // Less points if hint was used
      setScore(score + points);
      setFeedback(`Correct! +${points} points`);

      setTimeout(() => {
        if (currentPuzzle < puzzles.length - 1) {
          nextPuzzle();
        } else {
          setGameActive(false);
          saveScore();
        }
      }, 1500);
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
    <Card className="w-full max-w-2xl mx-auto bg-gradient-to-br from-green-900/20 to-emerald-900/20">
      <CardHeader className="text-center">
        <CardTitle className="text-white flex items-center justify-center gap-2">
          <Code className="w-5 h-5 text-green-400" />
          Code Puzzle
        </CardTitle>
        <div className="flex justify-between text-sm">
          <span className="text-blue-300 flex items-center gap-1">
            <Trophy className="w-4 h-4" />
            Score: {score}
          </span>
          <span className="text-orange-300 flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {gameActive ? (
          <>
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-2">
                Puzzle {currentPuzzle + 1} of {puzzles.length}
              </p>
              <p className="text-green-300 mb-4">{puzzles[currentPuzzle].description}</p>
            </div>

            <div className="bg-black/40 rounded-lg p-4 font-mono text-sm">
              <pre className="text-white whitespace-pre-wrap">
                {puzzles[currentPuzzle].code.replace('__', '___')}
              </pre>
            </div>

            {showHint && (
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-yellow-300 text-sm flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  {puzzles[currentPuzzle].hint}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Input
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Your answer..."
                className="bg-white/10 border-white/20 text-white font-mono"
                onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
              />
              <Button onClick={checkAnswer} className="bg-green-600 hover:bg-green-700">
                Submit
              </Button>
            </div>

            <div className="flex justify-between items-center">
              <Button
                onClick={() => setShowHint(true)}
                variant="outline"
                size="sm"
                disabled={showHint}
                className="text-yellow-300 border-yellow-500/30"
              >
                <Lightbulb className="w-4 h-4 mr-1" />
                {showHint ? "Hint Shown" : "Get Hint"}
              </Button>

              {feedback && (
                <p className={`text-sm ${feedback.includes('Correct') ? 'text-green-400' : 'text-red-400'
                  }`}>
                  {feedback}
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="text-center space-y-4">
            <h3 className="text-xl font-bold text-white">
              {currentPuzzle >= puzzles.length - 1 ? "All Puzzles Complete!" : "Time's Up!"}
            </h3>
            <p className="text-green-300">Final Score: {score} points</p>
            <p className="text-gray-400">
              You solved {Math.floor(score / 10)} puzzles!
            </p>
            <div className="flex gap-2">
              <Button onClick={resetGame} className="bg-green-600 hover:bg-green-700 flex-1">
                Play Again
              </Button>
              <Button onClick={onClose} variant="outline" className="flex-1">
                Back to Lobby
              </Button>
            </div>
          </div>
        )}

        {gameActive && (
          <Button onClick={onClose} variant="outline" className="w-full">
            Back to Lobby
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default CodePuzzle;