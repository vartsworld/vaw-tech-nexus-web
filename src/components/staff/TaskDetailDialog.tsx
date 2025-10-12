import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Clock,
  Calendar,
  User,
  Target,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  FileText,
  Download,
  Award,
} from "lucide-react";
import { format, differenceInSeconds } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  attachments?: Array<{
    name: string;
    url: string;
    type?: string;
    size?: number;
  }>;
  assignedBy?: {
    full_name: string;
  };
}

interface TaskDetailDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate: (taskId: string, status: Task['status']) => void;
}

export const TaskDetailDialog = ({
  task,
  open,
  onOpenChange,
  onStatusUpdate,
}: TaskDetailDialogProps) => {
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (!open || !task) {
      setIsTimerRunning(false);
      setElapsedSeconds(0);
      return;
    }

    // Calculate remaining time if due date exists
    if (task.due_date) {
      const dueDateTime = task.due_time 
        ? new Date(`${task.due_date}T${task.due_time}`)
        : new Date(task.due_date);
      
      const remaining = differenceInSeconds(dueDateTime, new Date());
      setRemainingSeconds(Math.max(0, remaining));
    }
  }, [open, task]);

  useEffect(() => {
    if (!isTimerRunning) return;

    const interval = setInterval(() => {
      if (task?.due_date) {
        // Countdown mode
        setRemainingSeconds((prev) => Math.max(0, prev - 1));
      } else {
        // Timer mode
        setElapsedSeconds((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, task?.due_date]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (task?.status === 'pending') {
      onStatusUpdate(task.id, 'in_progress');
    }
    setIsTimerRunning(true);
  };

  const handlePause = () => {
    setIsTimerRunning(false);
  };

  const handleComplete = () => {
    if (task) {
      onStatusUpdate(task.id, 'completed');
      setIsTimerRunning(false);
    }
  };

  const handleDownloadAttachment = async (attachment: { name: string; url: string }) => {
    try {
      const { data, error } = await supabase.storage
        .from('task_attachments')
        .download(attachment.url);

      if (error) throw error;

      // Create a download link
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download started",
        description: `Downloading ${attachment.name}`,
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download failed",
        description: "Could not download the file",
        variant: "destructive",
      });
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

  if (!task) return null;

  const hasDueDate = !!task.due_date;
  const isOverdue = hasDueDate && remainingSeconds === 0 && isTimerRunning;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] bg-gradient-to-br from-slate-900 to-slate-800 border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-400" />
            {task.title}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)] pr-4">
          <div className="space-y-6">
          {/* Status and Priority Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="border-blue-400/50 text-blue-300">
              {task.status.replace('_', ' ').toUpperCase()}
            </Badge>
            <Badge className={getPriorityColor(task.priority)}>
              {task.priority.toUpperCase()} PRIORITY
            </Badge>
            {task.trial_period ? (
              <Badge variant="outline" className="border-yellow-400/50 text-yellow-300 flex items-center gap-1">
                <Award className="w-3 h-3" />
                Trial Period
              </Badge>
            ) : (
              <Badge variant="outline" className="border-purple-400/50 text-purple-300">
                {task.points} Points
              </Badge>
            )}
          </div>

          <Separator className="bg-white/10" />

          {/* Description */}
          {task.description && (
            <div>
              <h3 className="text-lg font-semibold mb-2 text-white/90">Description</h3>
              <p className="text-white/70 leading-relaxed">{task.description}</p>
            </div>
          )}

          {/* Task Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {task.assignedBy && (
              <div className="flex items-center gap-2 text-white/70">
                <User className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-xs text-white/50">Assigned By</p>
                  <p className="text-sm font-medium text-white">
                    {task.assignedBy.full_name}
                  </p>
                </div>
              </div>
            )}

            {task.due_date && (
              <div className="flex items-center gap-2 text-white/70">
                <Calendar className="w-5 h-5 text-orange-400" />
                <div>
                  <p className="text-xs text-white/50">Due Date</p>
                  <p className="text-sm font-medium text-white">
                    {format(new Date(task.due_date), 'MMM dd, yyyy')}
                    {task.due_time && ` at ${task.due_time}`}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-white/70">
              <Clock className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-xs text-white/50">Created</p>
                <p className="text-sm font-medium text-white">
                  {format(new Date(task.created_at), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
          </div>

          <Separator className="bg-white/10" />

          {/* Attachments Section */}
          {task.attachments && task.attachments.length > 0 && (
            <>
              <div>
                <h3 className="text-lg font-semibold mb-3 text-white/90 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Attachments ({task.attachments.length})
                </h3>
                <div className="space-y-2">
                  {task.attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-black/30 rounded-lg p-3 border border-white/10 hover:bg-black/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-white text-sm font-medium truncate">
                            {attachment.name}
                          </p>
                          {attachment.size && (
                            <p className="text-white/50 text-xs">
                              {(attachment.size / 1024).toFixed(2)} KB
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20 flex-shrink-0"
                        onClick={() => handleDownloadAttachment(attachment)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-white/10" />
            </>
          )}

          {/* Timer/Countdown Section */}
          {task.status !== 'completed' && task.status !== 'handover' && (
            <div className="bg-black/30 rounded-lg p-6 text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold">
                  {hasDueDate ? 'Time Remaining' : 'Time Elapsed'}
                </h3>
              </div>

              <div
                className={`text-5xl font-mono font-bold ${
                  isOverdue ? 'text-red-400' : 'text-blue-400'
                }`}
              >
                {hasDueDate ? formatTime(remainingSeconds) : formatTime(elapsedSeconds)}
              </div>

              {isOverdue && (
                <div className="flex items-center justify-center gap-2 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Task is overdue!</span>
                </div>
              )}

              <div className="flex items-center justify-center gap-2">
                {!isTimerRunning ? (
                  <Button
                    onClick={handleStart}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {task.status === 'pending' ? 'Start Task' : 'Resume'}
                  </Button>
                ) : (
                  <Button
                    onClick={handlePause}
                    variant="outline"
                    className="border-orange-400/50 text-orange-300 hover:bg-orange-500/20"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                )}

                {task.status === 'in_progress' && (
                  <Button
                    onClick={handleComplete}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Task
                  </Button>
                )}
              </div>
            </div>
          )}

          {task.status === 'completed' && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
              <p className="text-green-300 font-semibold">Task Completed!</p>
              {!task.trial_period && (
                <p className="text-white/70 text-sm mt-1">
                  You earned {task.points} points
                </p>
              )}
              {task.trial_period && (
                <p className="text-yellow-300 text-sm mt-1 flex items-center justify-center gap-1">
                  <Award className="w-4 h-4" />
                  Trial Period Task
                </p>
              )}
            </div>
          )}
        </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
