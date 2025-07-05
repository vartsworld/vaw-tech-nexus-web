import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, Clock, Zap } from "lucide-react";

const words = [
  { word: "JAVASCRIPT", hint: "Popular programming language" },
  { word: "REACT", hint: "Frontend library by Facebook" },
  { word: "DATABASE", hint: "Stores and organizes data" },
  { word: "ALGORITHM", hint: "Step-by-step problem solving method" },
  { word: "DEVELOPER", hint: "Person who writes code" },
  { word: "FRONTEND", hint: "User-facing part of application" },
  { word: "BACKEND", hint: "Server-side of application" },
  { word: "DEBUGGING", hint: "Finding and fixing code errors" }
];

const WordChallenge = ({ onClose }: { onClose: () => void }) => {
  const [currentWord, setCurrentWord] = useState(words[0]);
  const [scrambledWord, setScrambledWord] = useState("");
  const [userGuess, setUserGuess] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameActive, setGameActive] = useState(true);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    scrambleWord();
  }, [currentWord]);

  useEffect(() => {
    if (timeLeft > 0 && gameActive) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setGameActive(false);
    }
  }, [timeLeft, gameActive]);

  const scrambleWord = () => {
    const letters = currentWord.word.split('');
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    setScrambledWord(letters.join(''));
  };

  const checkAnswer = () => {
    if (userGuess.toUpperCase() === currentWord.word) {
      setScore(score + 10);
      setFeedback("Correct! +10 points");
      nextWord();
    } else {
      setFeedback("Try again!");
    }
    setUserGuess("");
  };

  const nextWord = () => {
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * words.length);
      setCurrentWord(words[randomIndex]);
      setFeedback("");
    }, 1500);
  };

  const resetGame = () => {
    setScore(0);
    setTimeLeft(60);
    setGameActive(true);
    setUserGuess("");
    setFeedback("");
    setCurrentWord(words[Math.floor(Math.random() * words.length)]);
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-purple-900/20 to-pink-900/20">
      <CardHeader className="text-center">
        <CardTitle className="text-white flex items-center justify-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Word Challenge
        </CardTitle>
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
      </CardHeader>
      
      <CardContent className="space-y-4">
        {gameActive ? (
          <>
            <div className="text-center">
              <p className="text-purple-300 text-sm mb-2">Hint: {currentWord.hint}</p>
              <div className="text-2xl font-bold text-white tracking-widest bg-black/20 rounded p-3 mb-4">
                {scrambledWord}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Input
                value={userGuess}
                onChange={(e) => setUserGuess(e.target.value)}
                placeholder="Your answer..."
                className="bg-white/10 border-white/20 text-white"
                onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
              />
              <Button onClick={checkAnswer} className="bg-purple-600 hover:bg-purple-700">
                Submit
              </Button>
            </div>
            
            {feedback && (
              <p className={`text-center text-sm ${
                feedback.includes('Correct') ? 'text-green-400' : 'text-red-400'
              }`}>
                {feedback}
              </p>
            )}
          </>
        ) : (
          <div className="text-center space-y-4">
            <h3 className="text-xl font-bold text-white">Game Over!</h3>
            <p className="text-purple-300">Final Score: {score} points</p>
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

export default WordChallenge;