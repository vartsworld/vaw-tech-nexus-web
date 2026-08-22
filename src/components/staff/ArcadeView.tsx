import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Swords, Circle, Quote, Gamepad2, Code, Globe, Zap, Sparkles, Palette } from "lucide-react";

const ArcadeView = () => {
  const navigate = useNavigate();

  const games = [
    {
      id: "chess",
      title: "Chess Arena",
      description: "Realtime multiplayer & AI chess battles",
      icon: Swords,
      color: "bg-gradient-to-br from-zinc-900 to-black text-white border border-white/20 shadow-emerald-500/10",
      iconColor: "text-amber-400",
      path: "?chess",
      available: true
    },
    {
      id: "tictactoe",
      title: "Tic Tac Toe",
      description: "Classic X's and O's 5-round match series vs AI",
      icon: Circle,
      color: "bg-gradient-to-br from-orange-600 to-amber-500 text-white shadow-orange-500/20",
      iconColor: "text-white",
      path: "?tictactoe",
      available: true
    },
    {
      id: "codetyper",
      title: "Quote Typer",
      description: "Inspiring motivational quotes typing speed test",
      icon: Quote,
      color: "bg-gradient-to-br from-amber-950 to-orange-900 text-white border border-amber-500/30",
      iconColor: "text-amber-400",
      path: "?codetyper",
      available: true
    },
    {
      id: "colormatch",
      title: "Color Match",
      description: "Design staff color vision & hex perception game",
      icon: Palette,
      color: "bg-gradient-to-br from-pink-950 to-rose-900 text-white border border-pink-500/30",
      iconColor: "text-pink-400",
      path: "?colormatch",
      available: true
    },
    {
      id: "quickquiz",
      title: "General Quiz",
      description: "Test general knowledge, science & trivia logic",
      icon: Globe,
      color: "bg-gradient-to-br from-blue-950 to-cyan-900 text-white border border-cyan-500/30",
      iconColor: "text-cyan-400",
      path: "?quickquiz",
      available: true
    },
    {
      id: "snake",
      title: "Snake Retro",
      description: "3 difficulty modes, portal walls & high score chase",
      icon: Zap,
      color: "bg-gradient-to-br from-lime-950 to-emerald-950 text-white border border-lime-500/30",
      iconColor: "text-lime-400",
      path: "?snake",
      available: true
    },
    {
      id: "codepuzzle",
      title: "Code Puzzle",
      description: "Debug code logic snippets under pressure",
      icon: Code,
      color: "bg-gradient-to-br from-emerald-950 to-teal-900 text-white border border-emerald-500/30",
      iconColor: "text-emerald-400",
      path: "?codepuzzle",
      available: true
    },
    {
      id: "memory",
      title: "Memory Matrix",
      description: "Match visual card pairs & test memory speed",
      icon: Sparkles,
      color: "bg-gradient-to-br from-fuchsia-950 to-purple-950 text-white border border-fuchsia-500/30",
      iconColor: "text-fuchsia-400",
      path: "?memory",
      available: true
    },
    {
      id: "pingpong",
      title: "Ping Pong",
      description: "Fast-paced retro arcade paddle pong vs AI",
      icon: Gamepad2,
      color: "bg-gradient-to-br from-slate-900 to-zinc-900 text-white border border-slate-700",
      iconColor: "text-blue-400",
      path: "?pingpong",
      available: true
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 p-4 lg:p-6 bg-black/40 border border-white/10 rounded-[2.5rem] min-h-[500px] backdrop-blur-md">
      {games.map((game) => (
        <div
          key={game.id}
          onClick={() => navigate(game.path)}
          className={`relative overflow-hidden rounded-[2rem] p-7 min-h-[200px] flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] cursor-pointer shadow-xl group border ${game.color}`}
        >
          {/* Content Top Left */}
          <div className="z-10 max-w-[75%] space-y-1">
            <h3 className="text-xl lg:text-2xl font-black leading-tight tracking-tight text-white group-hover:text-amber-300 transition-colors">
              {game.title}
            </h3>
            <p className="text-xs font-medium text-white/70 leading-relaxed">
              {game.description}
            </p>
          </div>

          {/* Action Button Bottom Left */}
          <div className="z-10 mt-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-black/60 border border-white/20 text-white group-hover:bg-white group-hover:text-black transition-all shadow-md">
              <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-white/90">
              Play Now
            </span>
          </div>

          {/* Large Icon Right */}
          <div className="absolute right-[-8%] bottom-[-8%] opacity-20 group-hover:opacity-35 group-hover:scale-110 transition-all pointer-events-none">
            <game.icon className={`w-44 h-44 ${game.iconColor} rotate-[-12deg]`} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ArcadeView;
