import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Swords, Circle, Type, Minus } from "lucide-react";

const ArcadeView = () => {
  const navigate = useNavigate();

  const games = [
    {
      id: "chess",
      title: "Chess",
      description: "Realtime multiplayer battles",
      icon: Swords,
      color: "bg-white text-black",
      iconColor: "text-black",
      path: "/staff/arcade/chess",
      available: true
    },
    {
      id: "tictactoe",
      title: "Tic Tac Toe",
      description: "Classic X's and O's multiplayer",
      icon: Circle,
      color: "bg-gradient-to-r from-orange-500 to-orange-400 text-white",
      iconColor: "text-white",
      path: "#",
      available: false
    },
    {
      id: "wordchallenge",
      title: "Word Challenge",
      description: "Vocabulary speed test",
      icon: Type,
      color: "bg-zinc-900 text-white border border-white/10",
      iconColor: "text-white",
      path: "#",
      available: false
    },
    {
      id: "pingpong",
      title: "Ping Pong",
      description: "Fast-paced action",
      icon: Minus,
      color: "bg-white text-black border border-zinc-200",
      iconColor: "text-black",
      path: "#",
      available: false
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 p-4 lg:p-6 bg-black/30 border border-white/10 rounded-[2.5rem] min-h-[500px] backdrop-blur-md">
      {games.map((game) => (
        <div
          key={game.id}
          className={`relative overflow-hidden rounded-[2rem] p-8 min-h-[220px] flex flex-col justify-between transition-all hover:scale-[1.02] ${game.color} ${!game.available ? 'opacity-80' : 'cursor-pointer shadow-lg'}`}
          onClick={() => game.available ? navigate(game.path) : null}
        >
          {/* Content Top Left */}
          <div className="z-10 max-w-[60%]">
            <h3 className="text-2xl lg:text-3xl font-black mb-2 leading-tight">
              {game.title}
            </h3>
            <p className={`text-sm lg:text-base font-medium opacity-70`}>
              {game.description}
            </p>
          </div>

          {/* Action Button Bottom Left */}
          <div className="z-10 mt-12 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-black text-white ${game.id === 'wordchallenge' ? 'bg-white text-black' : ''}`}>
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider">
              {game.available ? "Play Now" : "Coming Soon"}
            </span>
          </div>

          {/* Large Icon Right */}
          <div className="absolute right-[-10%] bottom-[-10%] opacity-20 pointer-events-none">
             <game.icon className={`w-64 h-64 ${game.iconColor} rotate-[-15deg]`} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ArcadeView;
