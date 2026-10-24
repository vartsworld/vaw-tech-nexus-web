import { ReactNode } from "react";
import { Brain, Circle, Code, Gamepad2, Globe, Palette, Quote, Sparkles, Swords, Trophy, Zap } from "lucide-react";
import ArcadeView from "@/components/staff/ArcadeView";
import ArcadeGameHeader from "@/components/staff/ArcadeGameHeader";
import RealChessEngine from "@/components/staff/RealChessEngine";
import TicTacToe from "@/components/staff/games/TicTacToe";
import PingPong from "@/components/staff/games/PingPong";
import CodeTyper from "@/components/staff/games/CodeTyper";
import ColorMatch from "@/components/staff/games/ColorMatch";
import CodePuzzle from "@/components/staff/games/CodePuzzle";
import QuickQuiz from "@/components/staff/games/QuickQuiz";
import SnakeGame from "@/components/staff/games/SnakeGame";
import MemoryMatrix from "@/components/staff/games/MemoryMatrix";

interface HRArcadeProps {
  /** "arcade" for the game list, otherwise a game id */
  room: string;
  profile: any;
  onNavigate: (room: string) => void;
}

/** The same games staff have, available to HR from the Arcade page. */
const HRArcade = ({ room, profile, onNavigate }: HRArcadeProps) => {
  const userId = profile?.user_id || "";
  const back = () => onNavigate("arcade");

  const shell = (title: string, description: string, icon: any, children: ReactNode) => (
    <div className="mx-auto max-w-5xl space-y-5 py-1">
      <ArcadeGameHeader title={title} description={description} icon={icon} onBack={back} />
      {children}
    </div>
  );

  switch (room) {
    case "chess":
      return shell("Chess Arena", "Realtime multiplayer & AI chess battles", Swords, (
        <div className="min-h-[560px] rounded-3xl border border-white/10 bg-black/30 p-3 sm:p-6"><RealChessEngine userId={userId} userProfile={profile} /></div>
      ));
    case "tictactoe": return shell("Tic Tac Toe", "Classic X's and O's vs AI", Circle, <TicTacToe userId={userId} />);
    case "pingpong": return shell("Ping Pong", "Fast-paced retro pong vs AI", Gamepad2, <PingPong />);
    case "codetyper": return shell("Quote Typer", "Typing speed test with motivational quotes", Quote, <CodeTyper userId={userId} onClose={back} />);
    case "colormatch": return shell("Color Match", "Colour vision and hex perception", Palette, <ColorMatch userId={userId} onClose={back} />);
    case "codepuzzle": return shell("Code Puzzle", "Debug code snippets under pressure", Code, <CodePuzzle userId={userId} onClose={back} />);
    case "quickquiz": return shell("General Quiz", "General knowledge, science and trivia", Brain, <QuickQuiz userId={userId} onClose={back} />);
    case "snake": return shell("Snake Retro", "Grow your snake and chase high scores", Zap, <SnakeGame userId={userId} onClose={back} />);
    case "memory": return shell("Memory Matrix", "Match tech pairs and test your memory", Sparkles, <MemoryMatrix userId={userId} onClose={back} />);
    default:
      return (
        <div className="mx-auto max-w-5xl space-y-5 py-1">
          <div>
            <h1 className="flex items-center gap-2.5 text-2xl font-semibold text-foreground"><Trophy className="h-6 w-6 text-amber-400" />Arcade</h1>
            <p className="mt-1 text-sm text-muted-foreground">Pick a game for a quick break. Scores count toward the team leaderboard.</p>
          </div>
          <ArcadeView />
        </div>
      );
  }
};

export default HRArcade;
