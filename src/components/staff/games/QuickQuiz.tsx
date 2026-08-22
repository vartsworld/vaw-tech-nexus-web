import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Clock, Globe, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QuestionItem {
  question: string;
  options: string[];
  correct: number;
}

const FALLBACK_QUESTIONS: QuestionItem[] = [
  {
    question: "Which ocean is the largest on Earth?",
    options: ["Atlantic Ocean", "Indian Ocean", "Pacific Ocean", "Arctic Ocean"],
    correct: 2
  },
  {
    question: "What is the primary color missing from RGB (Red, Green, ...)?",
    options: ["Yellow", "Blue", "Cyan", "Magenta"],
    correct: 1
  },
  {
    question: "Which element has the chemical symbol 'O'?",
    options: ["Gold", "Oxygen", "Osmium", "Silver"],
    correct: 1
  },
  {
    question: "Who painted the Mona Lisa?",
    options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Claude Monet"],
    correct: 2
  },
  {
    question: "What is the capital city of Japan?",
    options: ["Kyoto", "Osaka", "Tokyo", "Hiroshima"],
    correct: 2
  },
  {
    question: "How many continents are there on Earth?",
    options: ["5", "6", "7", "8"],
    correct: 2
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correct: 1
  },
  {
    question: "What format is commonly used for vector graphics in modern UI design?",
    options: ["PNG", "JPG", "SVG", "GIF"],
    correct: 2
  },
  {
    question: "Which unit is used to measure electric current?",
    options: ["Volt", "Watt", "Ampere", "Ohm"],
    correct: 2
  },
  {
    question: "What is the hardest natural substance on Earth?",
    options: ["Titanium", "Diamond", "Quartz", "Granite"],
    correct: 1
  },
  {
    question: "Which country gifted the Statue of Liberty to the United States?",
    options: ["United Kingdom", "Germany", "France", "Spain"],
    correct: 2
  },
  {
    question: "What is the boiling point of water in Celsius?",
    options: ["90°C", "100°C", "110°C", "120°C"],
    correct: 1
  },
  {
    question: "Which instrument measures atmospheric pressure?",
    options: ["Thermometer", "Barometer", "Hygrometer", "Anemometer"],
    correct: 1
  },
  {
    question: "What is the fastest land animal in the world?",
    options: ["Lion", "Cheetah", "Gazelle", "Leopard"],
    correct: 1
  },
  {
    question: "In what year did Apollo 11 land on the Moon?",
    options: ["1965", "1969", "1972", "1975"],
    correct: 1
  }
];

const decodeHtml = (html: string): string => {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
};

const shuffleArray = <T,>(arr: T[]): T[] => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const QuickQuiz = ({ onClose, userId }: { onClose: () => void, userId: string }) => {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [gameActive, setGameActive] = useState(true);
  const [answered, setAnswered] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch API questions on mount
  useEffect(() => {
    fetchApiQuestions();
  }, []);

  const fetchApiQuestions = async () => {
    setLoading(true);
    try {
      // Free public trivia API
      const res = await fetch("https://opentdb.com/api.php?amount=10&type=multiple");
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const parsedQuestions: QuestionItem[] = data.results.map((q: any) => {
            const decodedQuestion = decodeHtml(q.question);
            const decodedCorrect = decodeHtml(q.correct_answer);
            const decodedIncorrect = q.incorrect_answers.map((ans: string) => decodeHtml(ans));

            const allOptions = shuffleArray([decodedCorrect, ...decodedIncorrect]);
            const correctIndex = allOptions.indexOf(decodedCorrect);

            return {
              question: decodedQuestion,
              options: allOptions,
              correct: correctIndex
            };
          });

          setQuestions(parsedQuestions);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.log("Using shuffled fallback trivia question pool");
    }

    // Fallback if API fails
    setQuestions(shuffleArray(FALLBACK_QUESTIONS).slice(0, 10));
    setLoading(false);
  };

  useEffect(() => {
    if (timeLeft > 0 && gameActive && !answered && !loading) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !answered && !loading) {
      handleNextQuestion();
    }
  }, [timeLeft, gameActive, answered, loading]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (answered || questions.length === 0) return;

    setSelectedAnswer(answerIndex);
    setAnswered(true);

    if (answerIndex === questions[currentQuestion].correct) {
      setScore(score + 10);
    }

    setTimeout(() => {
      handleNextQuestion();
    }, 1200);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setAnswered(false);
      setTimeLeft(15);
    } else {
      setGameActive(false);
      setShowResult(true);
      saveScore();
    }
  };

  const saveScore = async () => {
    try {
      const coinsEarned = (score / 10) * 2;

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
          reason: `Won ${coinsEarned} coins playing General Knowledge Quiz (Score: ${score}/${questions.length * 10})`
        } as any);
      }

      if (userId) {
        await supabase.from('user_activity_log').insert({
          user_id: userId,
          activity_type: 'game_played',
          metadata: { game: 'General Knowledge Quiz', score: score, total_questions: questions.length, coins_earned: gamesEnabled ? coinsEarned : 0 }
        });
      }

      toast.success(gamesEnabled && coinsEarned > 0
        ? `Quiz complete! You earned ${coinsEarned} coins! 🪙`
        : `Quiz complete! Score: ${score}/${questions.length * 10}`);
    } catch (error) {
      console.error("Error saving quiz result:", error);
    }
  };

  const resetGame = () => {
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setTimeLeft(15);
    setGameActive(true);
    setAnswered(false);
    fetchApiQuestions();
  };

  const getButtonClass = (index: number) => {
    if (!answered) return "bg-white/10 hover:bg-white/20 border-white/20";

    if (index === questions[currentQuestion]?.correct) {
      return "bg-emerald-600 border-emerald-500 font-bold text-white";
    } else if (index === selectedAnswer) {
      return "bg-rose-600 border-rose-500 font-bold text-white";
    } else {
      return "bg-white/10 border-white/20 text-zinc-400";
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto bg-zinc-950 border-white/10 text-white shadow-2xl overflow-hidden">
      <CardHeader className="bg-zinc-900/80 border-b border-white/5 pb-3 text-center">
        <CardTitle className="text-white flex items-center justify-center gap-2 text-xl font-black">
          <Globe className="w-5 h-5 text-cyan-400" />
          General Knowledge Quiz
        </CardTitle>
        {!showResult && !loading && (
          <div className="flex justify-between text-xs font-mono font-bold mt-2 bg-zinc-950 p-2 rounded-xl border border-white/5">
            <span className="text-cyan-300 flex items-center gap-1">
              <Trophy className="w-4 h-4 text-amber-400" />
              Score: {score}
            </span>
            <span className="text-amber-400 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {timeLeft}s
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {loading ? (
          <div className="text-center py-12 space-y-3">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
            <p className="text-sm font-mono text-cyan-300 animate-pulse">Fetching randomized trivia questions...</p>
          </div>
        ) : !showResult ? (
          <>
            <div className="text-center mb-4">
              <p className="text-xs text-zinc-400 font-mono font-bold uppercase tracking-widest mb-2">
                Question {currentQuestion + 1} of {questions.length}
              </p>
              <h3 className="text-lg font-bold text-white leading-snug">
                {questions[currentQuestion]?.question}
              </h3>
            </div>

            <div className="space-y-2.5">
              {questions[currentQuestion]?.options.map((option, index) => (
                <Button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full text-left justify-start text-sm py-3 px-4 rounded-xl border transition-all ${getButtonClass(index)}`}
                  variant="outline"
                  disabled={answered}
                >
                  <span className="font-mono text-cyan-400 font-bold mr-3">{String.fromCharCode(65 + index)}.</span>
                  {option}
                </Button>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mx-auto text-cyan-400 animate-bounce">
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-white">Quiz Complete!</h3>
            <div className="bg-zinc-900 border border-white/10 p-4 rounded-2xl max-w-xs mx-auto space-y-1">
              <p className="text-cyan-300 font-bold text-lg">Score: {score} / {questions.length * 10}</p>
              <p className="text-xs text-zinc-400">
                You answered {score / 10} out of {questions.length} correctly!
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={resetGame} className="bg-cyan-600 hover:bg-cyan-500 font-bold flex-1 rounded-xl">
                <RefreshCw className="w-4 h-4 mr-1.5" />
                Play New Trivia
              </Button>
              <Button onClick={onClose} variant="outline" className="flex-1 rounded-xl border-white/10 bg-zinc-900">
                Back to Arcade
              </Button>
            </div>
          </div>
        )}

        {!showResult && !loading && (
          <Button onClick={onClose} variant="ghost" className="w-full text-zinc-400 hover:text-white text-xs mt-2">
            Back to Arcade
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickQuiz;