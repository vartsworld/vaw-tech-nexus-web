import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Clock, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const questions = [
  {
    question: "What does HTML stand for?",
    options: ["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlink Text Management Language"],
    correct: 0
  },
  {
    question: "Which company created React?",
    options: ["Google", "Microsoft", "Facebook", "Apple"],
    correct: 2
  },
  {
    question: "What is the time complexity of binary search?",
    options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
    correct: 1
  },
  {
    question: "Which HTTP status code indicates 'Not Found'?",
    options: ["200", "401", "404", "500"],
    correct: 2
  },
  {
    question: "What does CSS stand for?",
    options: ["Computer Style Sheets", "Cascading Style Sheets", "Creative Style Sheets", "Colorful Style Sheets"],
    correct: 1
  },
  {
    question: "Which data structure uses LIFO principle?",
    options: ["Queue", "Array", "Stack", "LinkedList"],
    correct: 2
  },
  {
    question: "What is the default port for HTTPS?",
    options: ["80", "443", "8080", "3000"],
    correct: 1
  },
  {
    question: "Which programming paradigm does JavaScript support?",
    options: ["Only OOP", "Only Functional", "Only Procedural", "Multi-paradigm"],
    correct: 3
  }
];

const QuickQuiz = ({ onClose, userId }: { onClose: () => void, userId: string }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [gameActive, setGameActive] = useState(true);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    if (timeLeft > 0 && gameActive && !answered) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !answered) {
      handleNextQuestion();
    }
  }, [timeLeft, gameActive, answered]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (answered) return;

    setSelectedAnswer(answerIndex);
    setAnswered(true);

    if (answerIndex === questions[currentQuestion].correct) {
      setScore(score + 10);
    }

    setTimeout(() => {
      handleNextQuestion();
    }, 1500);
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
      await supabase.from('user_activity_log').insert({
        user_id: userId,
        activity_type: 'game_played',
        metadata: { game: 'Quick Quiz', score: score, total_questions: questions.length }
      });
      toast.success("Quiz complete! Results saved.");
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
  };

  const getButtonClass = (index: number) => {
    if (!answered) return "bg-white/10 hover:bg-white/20 border-white/20";

    if (index === questions[currentQuestion].correct) {
      return "bg-green-600 border-green-600";
    } else if (index === selectedAnswer) {
      return "bg-red-600 border-red-600";
    } else {
      return "bg-white/10 border-white/20";
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto bg-gradient-to-br from-blue-900/20 to-cyan-900/20">
      <CardHeader className="text-center">
        <CardTitle className="text-white flex items-center justify-center gap-2">
          <Brain className="w-5 h-5 text-cyan-400" />
          Quick Quiz
        </CardTitle>
        {!showResult && (
          <div className="flex justify-between text-sm">
            <span className="text-blue-300 flex items-center gap-1">
              <Trophy className="w-4 h-4" />
              Score: {score}
            </span>
            <span className="text-orange-300 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {timeLeft}s
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {!showResult ? (
          <>
            <div className="text-center mb-4">
              <p className="text-sm text-gray-400 mb-2">
                Question {currentQuestion + 1} of {questions.length}
              </p>
              <h3 className="text-lg font-semibold text-white mb-4">
                {questions[currentQuestion].question}
              </h3>
            </div>

            <div className="space-y-2">
              {questions[currentQuestion].options.map((option, index) => (
                <Button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full text-left justify-start text-white ${getButtonClass(index)}`}
                  variant="outline"
                  disabled={answered}
                >
                  {String.fromCharCode(65 + index)}. {option}
                </Button>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center space-y-4">
            <h3 className="text-xl font-bold text-white">Quiz Complete!</h3>
            <p className="text-cyan-300">Final Score: {score}/{questions.length * 10} points</p>
            <p className="text-gray-400">
              You got {score / 10} out of {questions.length} questions correct!
            </p>
            <div className="flex gap-2">
              <Button onClick={resetGame} className="bg-cyan-600 hover:bg-cyan-700 flex-1">
                Play Again
              </Button>
              <Button onClick={onClose} variant="outline" className="flex-1">
                Back to Lobby
              </Button>
            </div>
          </div>
        )}

        {!showResult && (
          <Button onClick={onClose} variant="outline" className="w-full">
            Back to Lobby
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickQuiz;