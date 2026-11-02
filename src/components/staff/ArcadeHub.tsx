import { ReactNode, useState } from "react";
import { Brain, Circle, Code, Gamepad2, Grid3x3, Palette, Quote, Sparkles, Swords, Trophy, Zap } from "lucide-react";
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
import Sudoku from "@/components/staff/games/Sudoku";

interface ArcadeHubProps {
  /** null/undefined shows the game list; otherwise a game id */
  gameId?: string | null;
  profile: any;
  onSelect: (gameId: string) => void;
  onBack: () => void;
  /** Show the big "Arcade" heading above the list (the mobile tool card has its own) */
  showTitle?: boolean;
}

/**
 * The arcade list and every built-in game behind one component, driven by props instead of the URL,
 * so HR and the mobile dashboards (which don't route games through `?game`) can use it too.
 */
const ArcadeHub = ({ gameId, profile, onSelect, onBack, showTitle = true }: ArcadeHubProps) => {
  const userId = profile?.user_id || "";

  const shell = (title: string, description: string, icon: any, children: ReactNode) => (
    <div className="mx-auto max-w-5xl space-y-5 py-1">
      <ArcadeGameHeader title={title} description={description} icon={icon} onBack={onBack} />
      {children}
    </div>
  );

  switch (gameId) {
    case "chess":
      return shell("Chess Arena", "Realtime multiplayer & AI chess battles", Swords, (
        <div className="min-h-[560px] rounded-3xl border border-white/10 bg-black/30 p-3 sm:p-6"><RealChessEngine userId={userId} userProfile={profile} /></div>
      ));
    case "tictactoe": return shell("Tic Tac Toe", "Classic X's and O's vs AI", Circle, <TicTacToe userId={userId} />);
    case "pingpong": return shell("Ping Pong", "Fast-paced retro pong vs AI", Gamepad2, <PingPong />);
    case "codetyper": return shell("Quote Typer", "Typing speed test with motivational quotes", Quote, <CodeTyper userId={userId} onClose={onBack} />);
    case "colormatch": return shell("Color Match", "Colour vision and hex perception", Palette, <ColorMatch userId={userId} onClose={onBack} />);
    case "codepuzzle": return shell("Code Puzzle", "Debug code snippets under pressure", Code, <CodePuzzle userId={userId} onClose={onBack} />);
    case "quickquiz": return shell("General Quiz", "General knowledge, science and trivia", Brain, <QuickQuiz userId={userId} onClose={onBack} />);
    case "snake": return shell("Snake Retro", "Grow your snake and chase high scores", Zap, <SnakeGame userId={userId} onClose={onBack} />);
    case "memory": return shell("Memory Matrix", "Match tech pairs and test your memory", Sparkles, <MemoryMatrix userId={userId} onClose={onBack} />);
    case "sudoku": return shell("Sudoku", "Fill the grid so every row, column and box has 1 to 9", Grid3x3, <Sudoku userId={userId} onClose={onBack} />);
    default:
      return (
        <div className="mx-auto max-w-5xl space-y-5 py-1">
          {showTitle && (
            <div>
              <h1 className="flex items-center gap-2.5 text-2xl font-semibold text-foreground"><Trophy className="h-6 w-6 text-amber-400" />Arcade</h1>
              <p className="mt-1 text-sm text-muted-foreground">Pick a game for a quick break. Scores count toward the team leaderboard.</p>
            </div>
          )}
          <ArcadeView onSelect={onSelect} />
        </div>
      );
  }
};

/** Arcade with its own game state, for screens that have no room routing (mobile tool cards). */
export const StandaloneArcade = ({ profile }: { profile: any }) => {
  const [gameId, setGameId] = useState<string | null>(null);
  return <ArcadeHub gameId={gameId} profile={profile} onSelect={setGameId} onBack={() => setGameId(null)} showTitle={false} />;
};

export default ArcadeHub;
