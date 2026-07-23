import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
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
  Target,
  Eye,
  LayoutGrid,
  List,
  LayoutDashboard,
  ArrowLeft,
  ArrowRight,
  HandMetal,
  Layers,
  Flame,
  Coins
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TaskDetailDialog } from "./TaskDetailDialog";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'handover' | 'overdue' | 'pending_approval';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  due_time?: string;
  points: number;
  assigned_by: string;
  created_at: string;
  trial_period?: boolean;
  comments?: any[];
  attachments?: any;
  assignedBy?: {
    full_name: string;
  };
}

interface TasksManagerProps {
  userId: string;
  userProfile: any;
}

const TasksManager = ({
  userId,
  userProfile
}: TasksManagerProps) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'handover' | 'overdue'>('in_progress');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table' | 'kanban'>('card');
  const { toast } = useToast();
  // Use real-time query for subtasks assigned to the user
  const { data: subtasksData, isLoading: tasksLoading, refetch } = useRealtimeQuery<any[]>({
    queryKey: ['subtasks', userId],
    table: 'staff_subtasks',
    filter: `assigned_to=eq.${userId}`,
    select: '*, staff_tasks(*)',
    order: { column: 'created_at', ascending: false },
    staleTime: 2 * 60 * 1000,
  });

  // Group subtasks by parent task and map to Task interface
  const tasks: Task[] = useMemo(() => {
    const subtaskItems = (subtasksData || []) as any[];
    const taskGroups: Record<string, any[]> = {};
    
    subtaskItems.forEach(st => {
      if (!st.task_id || !st.staff_tasks) return;
      if (!taskGroups[st.task_id]) taskGroups[st.task_id] = [];
      taskGroups[st.task_id].push(st);
    });

    return Object.entries(taskGroups).map(([taskId, subs]) => {
      const parent = subs[0].staff_tasks;
      
      // Determine "effective" status for this user's dashboard view
      let effectiveStatus = "pending";
      if (subs.some(s => s.status === 'in_progress')) {
        effectiveStatus = 'in_progress';
      } else if (subs.every(s => ['completed', 'review_pending', 'pending_approval', 'handover'].includes(s.status || ''))) {
        effectiveStatus = 'completed';
      }

      // Use earliest due date from assigned subtasks
      const subtasksWithDates = subs.filter(s => s.due_date);
      const earliestDueDate = subtasksWithDates.length > 0 
        ? subtasksWithDates.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0].due_date 
        : parent.due_date;

      // Check for overdue (if not completed and date passed)
      const isPastDue = earliestDueDate && new Date(earliestDueDate) < new Date(new Date().setHours(0,0,0,0));
      if (effectiveStatus !== 'completed' && isPastDue) {
        effectiveStatus = 'overdue';
      }

      return {
        ...parent,
        status: effectiveStatus,
        due_date: earliestDueDate,
        assignedBy: { full_name: 'Team Lead' }, // Profile fetching can be added if needed
      };
    });
  }, [subtasksData]);

  // Real-time subscription for new subtask assignments
  useRealtimeSubscription({
    table: 'staff_subtasks',
    onInsert: (payload) => {
      const newTask = payload.new as any;
      if (newTask.assigned_to !== userId) return;
      toast({
        title: "🎯 New Subtask Assigned!",
        description: `You have been assigned: "${newTask.title}"`,
        duration: 5000,
      });
      refetch();
    },
    onUpdate: (payload) => {
      refetch();
    },
  });
  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    setIsLoading(true);
    try {
      const {
        error
      } = await supabase.from('staff_tasks').update({
        status: newStatus as any,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null
      }).eq('id', taskId);
      if (error) throw error;

      // Award points for completing task
      if (newStatus === 'completed') {
        const task = tasks.find(t => t.id === taskId);
        if (task && !task.trial_period) {
          let rewardPoints = task.points || 0;
          let bonusReason = "";

          if (task.due_date) {
            const dueDate = new Date(task.due_date);
            const completionDate = new Date();
            
            // Set both to midnight for day comparison
            const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
            const completionDay = new Date(completionDate.getFullYear(), completionDate.getMonth(), completionDate.getDate());
            
            const diffTime = completionDay.getTime() - dueDay.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
              // Early
              rewardPoints += 1;
              bonusReason = " (+1 early bonus)";
            } else if (diffDays > 0) {
              // Late
              rewardPoints = Math.max(0, rewardPoints - diffDays);
              bonusReason = ` (-${diffDays} late penalty)`;
            }
          }

          // Log coin transaction (for PointsBalance / MyCoins)
          await supabase.from('user_coin_transactions').insert({
            user_id: userId,
            coins: rewardPoints,
            transaction_type: 'task_earned',
            reason: `Task Completed: ${task.title}${bonusReason}`,
            category: 'task_completion',
            source_type: 'task',
            related_task_id: taskId
          } as any);

          // Log to user_activity_log for ActivityLogPanel
          await supabase.from('user_activity_log').insert({
            user_id: userId,
            activity_type: 'task_completed',
            points_earned: rewardPoints,
            metadata: { task_id: taskId, task_title: task.title, bonus_reason: bonusReason }
          });

          // Log to user_points_log (for HR PointsMonitoring visibility)
          await supabase.from('user_points_log').insert({
            user_id: userId,
            points: rewardPoints,
            reason: `Task completed: ${task.title}${bonusReason}`,
            category: 'task'
          });

          // Note: staff_profiles.total_points is updated automatically via DB trigger

          toast({
            title: rewardPoints > task.points ? "Task Completed Early! 🚀" : rewardPoints < task.points ? "Task Completed Late" : "Task Completed! 🎉",
            description: `You earned ${rewardPoints} coins for completing "${task.title}"${bonusReason}`
          });
        } else if (task?.trial_period) {
          toast({
            title: "Task Completed! 🎉",
            description: `Trial task "${task.title}" completed! (No coins for trial period)`
          });
        }
      }
      await refetch();

      // Update selected task if it's the same one
      if (selectedTask?.id === taskId) {
        const {
          data: updatedTask
        } = await supabase.from('staff_tasks').select(`
            *,
            due_time,
            trial_period,
            attachments,
            comments
          `).eq('id', taskId).single();
        if (updatedTask) {
          const {
            data: assignerData
          } = await supabase.from('staff_profiles').select('full_name').eq('user_id', updatedTask.assigned_by).single();
          setSelectedTask({
            ...updatedTask,
            assignedBy: assignerData
          } as Task);
        }
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task status.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const getPriorityBadge = (priority: string) => {
    const configs = {
      urgent: "bg-red-500/20 text-red-400 border-red-500/30",
      high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      low: "bg-green-500/20 text-green-400 border-green-500/30"
    };
    const config = configs[priority as keyof typeof configs] || configs.medium;
    return (
      <Badge variant="outline" className={`${config} uppercase text-[10px] font-bold tracking-wider`}>
        {priority}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      completed: { color: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle },
      handover: { color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: ArrowRight },
      in_progress: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Clock },
      overdue: { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: AlertTriangle },
      pending: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Target },
      pending_approval: { color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: Clock }
    };
    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`${config.color} flex items-center gap-1 py-0.5 px-2`}>
        <Icon className="w-3 h-3" />
        <span className="capitalize">{status.replace('_', ' ')}</span>
      </Badge>
    );
  };
  const getStageBadge = (task: any) => {
    const stage = task.current_stage || 1;
    const names: Record<string, string> = (task.stage_names && typeof task.stage_names === 'object') ? task.stage_names : {};
    const label = names[String(stage)] || `Stage ${stage}`;
    return (
      <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-[10px]">
        <Layers className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return task.status !== 'completed';
    if (filter === 'completed') return ['review_pending', 'pending_approval'].includes(task.status);
    return task.status === filter;
  });
  const completedCount = tasks.filter(t => ['completed', 'review_pending', 'pending_approval'].includes(t.status)).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? completedCount / totalTasks * 100 : 0;
  // If a task is selected, show inline detail view
  if (selectedTask) {
    return (
      <TaskDetailDialog
        task={selectedTask}
        open={true}
        onOpenChange={() => {}}
        onStatusUpdate={(taskId, status) => {
          updateTaskStatus(taskId, status);
        }}
        userId={userId}
        mode="inline"
        onBack={() => setSelectedTask(null)}
        isTeamHead={!!userProfile?.is_department_head}
      />
    );
  }

  return (
    <Card className="bg-black/20 backdrop-blur-lg border-white/10 text-white overflow-hidden flex flex-col min-h-[500px]">
      <CardHeader className="pb-4 space-y-4 flex-shrink-0">
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-blue-400" />
            My Dashboard
          </CardTitle>
          <div className="flex bg-white/5 rounded-lg p-1 gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 ${viewMode === 'card' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}
              onClick={() => setViewMode('card')}
              title="Card View"
              aria-label="Switch to Card view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 ${viewMode === 'table' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}
              onClick={() => setViewMode('table')}
              title="Table View"
              aria-label="Switch to Table view"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 ${viewMode === 'kanban' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}
              onClick={() => setViewMode('kanban')}
              title="Kanban View"
              aria-label="Switch to Kanban view"
            >
              <LayoutDashboard className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filter and Stats Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full overflow-hidden">
          <div className="flex flex-row flex-nowrap overflow-x-auto no-scrollbar gap-1.5 pb-2 sm:pb-0 max-w-full shrink-0">
            {[{
              key: 'overdue',
              label: 'Overdue',
              count: tasks.filter(t => t.status === 'overdue').length
            }, {
              key: 'in_progress',
              label: 'Current',
              count: tasks.filter(t => t.status === 'in_progress').length
            }, {
              key: 'pending',
              label: 'Upcoming',
              count: tasks.filter(t => t.status === 'pending').length
            }, {
              key: 'completed',
              label: 'Submitted',
              count: tasks.filter(t => ['completed', 'review_pending', 'pending_approval'].includes(t.status)).length
            }, {
              key: 'handover',
              label: 'Handover',
              count: tasks.filter(t => t.status === 'handover').length
            }, {
              key: 'all',
              label: 'All',
              count: tasks.length
            }].map(filterOption => (
              <Button
                key={filterOption.key}
                variant={filter === filterOption.key ? "default" : "ghost"}
                size="sm"
                className={`flex items-center gap-2 px-3 h-8 rounded-full transition-all shrink-0 ${filter === filterOption.key
                  ? filterOption.key === 'overdue' ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20" : "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : "text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                onClick={() => setFilter(filterOption.key as any)}
              >
                {filterOption.key === 'overdue' && <Flame className={cn("w-3 h-3", filter === 'overdue' ? "text-white" : "text-red-400")} />}
                <span className="text-xs font-medium">{filterOption.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filter === filterOption.key ? "bg-white/20" : "bg-white/10"
                  }`}>
                  {filterOption.count}
                </span>
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
            <div className="flex flex-col">
              <span className="text-[10px] text-white/50 uppercase font-semibold">Completion</span>
              <span className="text-sm font-bold text-green-400">{Math.round(completionRate)}%</span>
            </div>
            <div className="w-24 bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full w-full px-4 pb-4">
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="p-4 bg-white/5 rounded-full">
                <Target className="w-12 h-12 text-white/20" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white/80">No tasks found</h3>
                <p className="text-white/40 text-sm max-w-[200px]">
                  {filter === 'all' ? "You haven't been assigned any tasks yet." : `You have no ${filter} tasks right now.`}
                </p>
              </div>
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white/80 h-10 py-0">Task details</TableHead>
                     <TableHead className="text-white/80 h-10 py-0">Priority</TableHead>
                     <TableHead className="text-white/80 h-10 py-0">Stage</TableHead>
                     <TableHead className="text-white/80 h-10 py-0">Status</TableHead>
                    <TableHead className="text-white/80 h-10 py-0">Timeline</TableHead>
                    <TableHead className="text-white/80 h-10 py-0 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => (
                    <TableRow key={task.id} className="border-white/10 hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => setSelectedTask(task)}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-white text-sm group-hover:text-blue-400 transition-colors">
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-white/50 text-xs truncate max-w-[200px]">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                      <TableCell>{getStageBadge(task)}</TableCell>
                      <TableCell>{getStatusBadge(task.status)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-white/60">
                            <Calendar className="w-3 h-3 text-blue-400" />
                            {task.due_date ? format(new Date(task.due_date), 'MMM dd, yyyy') : 'No date'}
                          </div>
                          {task.due_time && (
                            <div className="flex items-center gap-1.5 text-[10px] text-white/40 ml-4.5">
                              <Clock className="w-2.5 h-2.5" />
                              {task.due_time}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-white/50 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTask(task);
                          }}
                          title="View task details"
                          aria-label="View task details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : viewMode === 'kanban' ? (
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {[
                { id: 'pending', title: 'Pending / Todo', color: 'border-yellow-500/20 bg-yellow-500/5' },
                { id: 'in_progress', title: 'In Progress', color: 'border-blue-500/20 bg-blue-500/5' },
                { id: 'handover', title: 'Handover / Review', color: 'border-purple-500/20 bg-purple-500/5' },
                { id: 'completed', title: 'Completed', color: 'border-emerald-500/20 bg-emerald-500/5' }
              ].map(column => {
                const columnTasks = filteredTasks.filter(t => t.status === column.id);
                return (
                  <div key={column.id} className={cn("flex-1 min-w-[280px] rounded-2xl border p-4 space-y-4", column.color)}>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">{column.title}</h4>
                      <Badge className="bg-white/10 text-white hover:bg-white/10 text-[10px] font-bold">{columnTasks.length}</Badge>
                    </div>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {columnTasks.map(task => (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTask(task)}
                          className={cn(
                            "bg-black/35 border border-white/10 rounded-xl p-3.5 space-y-3 cursor-pointer hover:border-white/20 transition-all hover:translate-y-[-1px]",
                            task.status === 'completed' && "opacity-60"
                          )}
                        >
                          <h5 className={cn("text-sm font-bold text-white leading-snug", task.status === 'completed' && "line-through text-white/50")}>
                            {task.title}
                          </h5>
                          {task.description && (
                            <p className="text-[11px] text-white/50 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}
                          <div className="flex justify-between items-center pt-2 border-t border-white/5 text-[10px] text-white/40">
                            <span>Due: {task.due_date ? format(new Date(task.due_date), "MMM d") : "Ongoing"}</span>
                            <div className="flex gap-1">
                              {column.id !== 'pending' && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-5 w-5 rounded bg-white/5 hover:bg-white/10 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const prevStatus = column.id === 'in_progress' ? 'pending' : column.id === 'handover' ? 'in_progress' : 'handover';
                                    updateTaskStatus(task.id, prevStatus as any);
                                  }}
                                  title="Move Left"
                                  aria-label="Move task to previous stage"
                                >
                                  <ArrowLeft className="h-3 w-3 text-white/70 hover:text-white" />
                                </Button>
                              )}
                              {column.id !== 'completed' && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-5 w-5 rounded bg-white/5 hover:bg-white/10 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const nextStatus = column.id === 'pending' ? 'in_progress' : column.id === 'in_progress' ? 'handover' : 'completed';
                                    updateTaskStatus(task.id, nextStatus as any);
                                  }}
                                  title="Move Right"
                                  aria-label="Move task to next stage"
                                >
                                  <ArrowRight className="h-3 w-3 text-white/70 hover:text-white" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {columnTasks.length === 0 && (
                        <p className="text-[11px] text-white/30 text-center py-6">No tasks in this stage</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4 flex flex-col hover:bg-white/[0.08] hover:border-white/20 hover:translate-y-[-2px] transition-all duration-300 relative group cursor-pointer"
                  onClick={() => setSelectedTask(task)}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="font-bold text-white text-base leading-tight line-clamp-2 group-hover:text-blue-400 transition-colors">
                        {task.title}
                      </h4>
                    </div>
                  </div>

                  {task.description && (
                    <p className="text-white/60 text-sm line-clamp-3 bg-black/20 p-2 rounded-lg border border-white/5 flex-1">
                      {task.description}
                    </p>
                  )}

                  <div className="space-y-2.5 pt-2">
                    {/* Row 1: Date and Points in the same row */}
                    <div className="flex items-center justify-between text-xs py-1 border-t border-white/5">
                      <div className="flex items-center gap-2 text-white/60">
                        <Calendar className="h-3.5 w-3.5 text-blue-400" />
                        <span>{task.due_date ? format(new Date(task.due_date), 'MMM dd') : 'Ongoing'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/10 text-emerald-400 font-bold text-[10px]">
                        <Coins className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{task.trial_period ? "TRIAL" : `${task.points || 0} PTS`}</span>
                      </div>
                    </div>

                    {/* Row 2: Status Chip, Priority, and Stage in the same row below */}
                    <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                      <div className="flex items-center gap-1.5">
                        {getStatusBadge(task.status)}
                        {getStageBadge(task)}
                      </div>
                      <div>
                        {getPriorityBadge(task.priority)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white h-9 font-bold text-xs rounded-lg shadow-lg shadow-blue-500/20 transition-all border-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTask(task);
                        }}
                      >
                        <Eye className="h-3.5 w-3.5 mr-2" />
                        VIEW DETAILS
                      </Button>

                      {task.status === 'completed' && (
                        <Button
                          className="flex-1 bg-purple-500 hover:bg-purple-600 text-white h-9 font-bold text-xs rounded-lg shadow-lg shadow-purple-500/20 transition-all border-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTaskStatus(task.id, 'handover');
                          }}
                          disabled={isLoading}
                        >
                          <ArrowRight className="h-3.5 w-3.5 mr-2" />
                          HANDOVER
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
export default TasksManager;