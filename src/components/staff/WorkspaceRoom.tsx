
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  CheckCircle, 
  Clock, 
  Target, 
  TrendingUp, 
  StickyNote, 
  Plus,
  Play,
  Pause,
  Loader2
} from "lucide-react";
import { useStaffData } from "@/hooks/useStaffData";

const WorkspaceRoom = () => {
  const { tasks, notes, profile, loading, updateTaskStatus, addNote } = useStaffData();
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  const handleTaskAction = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Pending' ? 'In Progress' : 'Completed';
    await updateTaskStatus(taskId, nextStatus as any);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setAddingNote(true);
    await addNote(newNote);
    setNewNote("");
    setAddingNote(false);
  };

  const completedTasks = tasks.filter(task => task.status === 'Completed').length;
  const todayEarnings = tasks
    .filter(task => 
      task.status === 'Completed' && 
      new Date(task.created_at).toDateString() === new Date().toDateString()
    )
    .reduce((sum, task) => {
      // Calculate reward based on category for demo
      const reward = task.category === 'Design' ? 45 : task.category === 'Review' ? 25 : 30;
      return sum + reward;
    }, 0);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

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
              {tasks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No tasks assigned yet</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{task.title}</h4>
                        {task.description && (
                          <p className="text-gray-400 text-sm mt-1">{task.description}</p>
                        )}
                      </div>
                      <Badge variant={task.priority === 'High' ? 'destructive' : task.priority === 'Medium' ? 'default' : 'secondary'}>
                        {task.priority}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-4">
                        {task.due_date && (
                          <span className="text-gray-400 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                        <Badge variant="outline" className="border-purple-500/30 text-purple-300">
                          {task.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-green-400 font-medium">
                          ${task.category === 'Design' ? 45 : task.category === 'Review' ? 25 : 30}
                        </span>
                        {task.status !== 'Completed' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="bg-purple-500/20 border-purple-500/30 text-purple-300 hover:bg-purple-500/30"
                            onClick={() => handleTaskAction(task.id, task.status)}
                          >
                            {task.status === 'In Progress' ? 'Complete' : 'Start'}
                          </Button>
                        )}
                        {task.status === 'Completed' && (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Daily Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{completedTasks}</p>
                <p className="text-blue-300 text-sm">Tasks Completed</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
              <CardContent className="p-4 text-center">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">${todayEarnings}</p>
                <p className="text-green-300 text-sm">Today's Earnings</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
              <CardContent className="p-4 text-center">
                <Target className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">${profile?.earnings || 0}</p>
                <p className="text-purple-300 text-sm">Total Earnings</p>
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
              {notes.map((note) => (
                <div key={note.id} className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                  <p className="text-yellow-200 text-sm">{note.content}</p>
                  <p className="text-yellow-300/60 text-xs mt-1">
                    {new Date(note.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
              <div className="space-y-2">
                <Input
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a quick note..."
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
                  onClick={handleAddNote}
                  disabled={addingNote || !newNote.trim()}
                >
                  {addingNote ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Add Note
                </Button>
              </div>
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
