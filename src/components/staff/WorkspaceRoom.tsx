
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Clock, 
  Target, 
  TrendingUp, 
  StickyNote, 
  Plus,
  Play,
  Pause
} from "lucide-react";

const WorkspaceRoom = () => {
  const tasks = [
    { id: 1, title: "Design new landing page", priority: "High", deadline: "Today", status: "In Progress", reward: "$45" },
    { id: 2, title: "Review client feedback", priority: "Medium", deadline: "Tomorrow", status: "Pending", reward: "$25" },
    { id: 3, title: "Update documentation", priority: "Low", deadline: "This Week", status: "Pending", reward: "$30" }
  ];

  const notes = [
    "Meeting with client at 3 PM",
    "Review design mockups",
    "Submit timesheet by Friday"
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Workspace Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Your Workspace</h2>
          <p className="text-purple-300">Focus zone - Let's get things done! 💪</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-green-300" />
              <span className="text-green-300 text-sm">Focus Mode: ON</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks & Assignments */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-black/20 backdrop-blur-lg border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                Active Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-white font-medium">{task.title}</h4>
                    <Badge variant={task.priority === 'High' ? 'destructive' : task.priority === 'Medium' ? 'default' : 'secondary'}>
                      {task.priority}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-gray-400 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {task.deadline}
                      </span>
                      <Badge variant="outline" className="border-purple-500/30 text-purple-300">
                        {task.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 font-medium">{task.reward}</span>
                      <Button size="sm" variant="outline" className="bg-purple-500/20 border-purple-500/30 text-purple-300 hover:bg-purple-500/30">
                        {task.status === 'In Progress' ? 'Continue' : 'Start'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Daily Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">7</p>
                <p className="text-blue-300 text-sm">Tasks Completed</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
              <CardContent className="p-4 text-center">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">$180</p>
                <p className="text-green-300 text-sm">Today's Earnings</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
              <CardContent className="p-4 text-center">
                <Target className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">85%</p>
                <p className="text-purple-300 text-sm">Goal Progress</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Notes & Tools */}
        <div className="space-y-4">
          <Card className="bg-black/20 backdrop-blur-lg border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-yellow-400" />
                Quick Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {notes.map((note, index) => (
                <div key={index} className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                  <p className="text-yellow-200 text-sm">{note}</p>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10">
                <Plus className="w-4 h-4 mr-2" />
                Add Note
              </Button>
            </CardContent>
          </Card>

          {/* Music Player Mock */}
          <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Play className="w-8 h-8 text-white" />
                </div>
                <p className="text-white font-medium mb-1">Lo-Fi Hip Hop</p>
                <p className="text-green-300 text-sm mb-3">Chill Beats to Work To</p>
                <Button variant="outline" size="sm" className="bg-green-500/20 border-green-500/30 text-green-300 hover:bg-green-500/30">
                  Connect Spotify
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceRoom;
