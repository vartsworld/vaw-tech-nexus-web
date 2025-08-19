import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Filter,
  Calendar,
  User,
  Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  points: number;
  assigned_by: string;
  created_at: string;
  assignedBy?: {
    full_name: string;
  };
}

interface TasksManagerProps {
  userId: string;
  userProfile: any;
}

const TasksManager = ({ userId, userProfile }: TasksManagerProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
  }, [userId]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_tasks')
        .select(`
          *
        `)
        .eq('assigned_to', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get assigned by info separately
      const tasksWithAssigner = await Promise.all(
        (data || []).map(async (task) => {
          const { data: assignerData } = await supabase
            .from('staff_profiles')
            .select('full_name')
            .eq('user_id', task.assigned_by)
            .single();
            
          return {
            ...task,
            assignedBy: assignerData
          };
        })
      );

      setTasks(tasksWithAssigner);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('staff_tasks')
        .update({ 
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', taskId);

      if (error) throw error;

      // Award points for completing task
      if (newStatus === 'completed') {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          await supabase
            .from('user_points_log')
            .insert({
              user_id: userId,
              points: task.points,
              reason: `Task Completed: ${task.title}`,
              category: 'task_completion'
            });

          toast({
            title: "Task Completed! 🎉",
            description: `You earned ${task.points} points for completing "${task.title}"`,
          });
        }
      }

      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task status.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-black';
      case 'low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'in_progress':
        return 'text-blue-400';  
      case 'overdue':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const filteredTasks = tasks.filter(task => 
    filter === 'all' || task.status === filter
  );

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2">
          <Target className="w-5 h-5" />
          My Tasks
        </CardTitle>
        
        {/* Progress Overview */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-white/70">
            <span>Progress: {completedTasks}/{totalTasks} tasks</span>
            <span>{Math.round(completionRate)}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Filter Buttons */}
        <div className="flex gap-1 px-4 mb-4 overflow-x-auto">
          {[
            { key: 'all', label: 'All', count: tasks.length },
            { key: 'pending', label: 'Pending', count: tasks.filter(t => t.status === 'pending').length },
            { key: 'in_progress', label: 'In Progress', count: tasks.filter(t => t.status === 'in_progress').length },
            { key: 'completed', label: 'Completed', count: tasks.filter(t => t.status === 'completed').length }
          ].map((filterOption) => (
            <Button
              key={filterOption.key}
              variant={filter === filterOption.key ? "default" : "ghost"}
              size="sm"
              className={`flex items-center gap-1 whitespace-nowrap ${
                filter === filterOption.key
                  ? "bg-blue-500 text-white"
                  : "text-white/70 hover:text-white"
              }`}
              onClick={() => setFilter(filterOption.key as any)}
            >
              <Filter className="w-3 h-3" />
              {filterOption.label}
              <Badge variant="secondary" className="ml-1 h-4 text-xs">
                {filterOption.count}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Tasks List */}
        <ScrollArea className="flex-1 px-4" style={{ scrollBehavior: 'smooth' }}>
          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-white/30 mx-auto mb-4" />
                <p className="text-white/60">
                  {filter === 'all' ? 'No tasks assigned yet' : `No ${filter.replace('_', ' ')} tasks`}
                </p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <Card
                  key={task.id}
                  className="bg-white/5 border-white/20 hover:bg-white/10 transition-all"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`flex items-center gap-1 ${getStatusColor(task.status)}`}>
                            {getStatusIcon(task.status)}
                            <span className="text-xs font-medium capitalize">
                              {task.status.replace('_', ' ')}
                            </span>
                          </div>
                          <Badge className={`${getPriorityColor(task.priority)} text-xs`}>
                            {task.priority.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <h4 className="text-white font-medium mb-1 truncate">
                          {task.title}
                        </h4>
                        
                        {task.description && (
                          <p className="text-white/70 text-sm mb-2 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-white/50">
                          {task.assignedBy && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>by {task.assignedBy.full_name}</span>
                            </div>
                          )}
                          
                          {task.due_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>Due {new Date(task.due_date).toLocaleDateString()}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            <span>{task.points} pts</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Button */}
                      {task.status !== 'completed' && (
                        <div className="flex flex-col gap-1">
                          {task.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-blue-500/20 border-blue-500/30 text-blue-300 hover:bg-blue-500/30"
                              onClick={() => updateTaskStatus(task.id, 'in_progress')}
                              disabled={isLoading}
                            >
                              Start
                            </Button>
                          )}
                          
                          {task.status === 'in_progress' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-green-500/20 border-green-500/30 text-green-300 hover:bg-green-500/30"
                              onClick={() => updateTaskStatus(task.id, 'completed')}
                              disabled={isLoading}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TasksManager;