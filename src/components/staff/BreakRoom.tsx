
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coffee, Gamepad2, MessageCircle, Users, Zap, Trophy } from "lucide-react";

const BreakRoom = () => {
  const games = [
    { name: "Word Challenge", players: "3/4", status: "Waiting", difficulty: "Easy" },
    { name: "Quick Quiz", players: "2/6", status: "Active", difficulty: "Medium" },
    { name: "Code Puzzle", players: "1/4", status: "Starting Soon", difficulty: "Hard" }
  ];

  const chatMessages = [
    { user: "Sarah", message: "Anyone up for a quick game?", time: "2m ago" },
    { user: "Mike", message: "Just finished my tasks! 🎉", time: "5m ago" },
    { user: "Emily", message: "Coffee break time!", time: "10m ago" }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Break Room Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Break Room</h2>
        <p className="text-orange-300">Take a breather, connect with your team! ☕</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Games Section */}
        <Card className="bg-black/20 backdrop-blur-lg border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-purple-400" />
              Team Games
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {games.map((game, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-white font-medium">{game.name}</h4>
                    <p className="text-gray-400 text-sm">{game.difficulty} • {game.players} players</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    game.status === 'Active' ? 'bg-green-500/20 text-green-300' :
                    game.status === 'Waiting' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-blue-500/20 text-blue-300'
                  }`}>
                    {game.status}
                  </span>
                </div>
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full bg-purple-500/20 border-purple-500/30 text-purple-300 hover:bg-purple-500/30"
                >
                  {game.status === 'Active' ? 'Join Game' : 'Join Lobby'}
                </Button>
              </div>
            ))}
            
            <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600">
              <Zap className="w-4 h-4 mr-2" />
              Create New Game
            </Button>
          </CardContent>
        </Card>

        {/* Team Chat */}
        <Card className="bg-black/20 backdrop-blur-lg border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-400" />
              Team Chat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {chatMessages.map((msg, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-blue-300 font-medium text-sm">{msg.user}</span>
                    <span className="text-gray-500 text-xs">{msg.time}</span>
                  </div>
                  <p className="text-white text-sm">{msg.message}</p>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Type a message..." 
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50"
              />
              <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                Send
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card className="bg-black/20 backdrop-blur-lg border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Weekly Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Alex Johnson", points: 1250, rank: 1 },
                { name: "Sarah Chen", points: 1180, rank: 2 },
                { name: "Mike Rodriguez", points: 1050, rank: 3 },
                { name: "You", points: 980, rank: 4 }
              ].map((player, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                  player.name === "You" ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-white/5'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      player.rank === 1 ? 'bg-yellow-500 text-black' :
                      player.rank === 2 ? 'bg-gray-400 text-black' :
                      player.rank === 3 ? 'bg-orange-500 text-black' :
                      'bg-gray-600 text-white'
                    }`}>
                      {player.rank}
                    </span>
                    <span className="text-white font-medium">{player.name}</span>
                  </div>
                  <span className="text-yellow-300 font-bold">{player.points}pts</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/30">
          <CardContent className="p-6">
            <div className="text-center">
              <Coffee className="w-16 h-16 text-orange-400 mx-auto mb-4" />
              <h3 className="text-white font-bold text-lg mb-2">Coffee Break Timer</h3>
              <p className="text-orange-300 text-sm mb-4">Take a 15-minute break</p>
              
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" size="sm" className="bg-orange-500/20 border-orange-500/30 text-orange-300 hover:bg-orange-500/30">
                  Start Break
                </Button>
                <Button variant="outline" size="sm" className="bg-orange-500/20 border-orange-500/30 text-orange-300 hover:bg-orange-500/30">
                  Back to Work
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BreakRoom;
