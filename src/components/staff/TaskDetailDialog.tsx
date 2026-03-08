import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Clock, Calendar, User, Target, Play, Coffee, CheckCircle, AlertCircle, FileText, Download, Award, MessageSquare, Upload, Send, X, Loader2, Eye } from "lucide-react";
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
  comments?: any[];
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
  userId: string;
  mode?: 'dialog' | 'inline';
  onBack?: () => void;
}
export const TaskDetailDialog = ({
  task,
  open,
  onOpenChange,
  onStatusUpdate,
  userId,
  mode = 'dialog',
  onBack
}: TaskDetailDialogProps) => {
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [breaksTaken, setBreaksTaken] = useState(0);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakTimeRemaining, setBreakTimeRemaining] = useState(0);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [fileNames, setFileNames] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Subtasks State
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [isLoadingSubtasks, setIsLoadingSubtasks] = useState(false);
  const [expandedSubtask, setExpandedSubtask] = useState<string | null>(null);
  const [subtaskNotes, setSubtaskNotes] = useState("");
  const [subtaskFileURLs, setSubtaskFileURLs] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<{ full_name: string, avatar_url: string } | null>(null);
  const [projectInfo, setProjectInfo] = useState<any>(null);
  const [viewingSubtask, setViewingSubtask] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const subtaskFileInputRef = useRef<HTMLInputElement>(null);
  const {
    toast
  } = useToast();
  useEffect(() => {
    if (!open || !task) {
      setIsTimerRunning(false);
      setElapsedSeconds(0);
      setBreaksTaken(0);
      setIsOnBreak(false);
      setBreakTimeRemaining(0);
      setComments([]);
      setUploadedFiles([]);
      setFileNames({});
      return;
    }

    // Load existing comments
    if (task.comments) {
      setComments(Array.isArray(task.comments) ? task.comments : []);
    }

    // Fetch subtasks
    fetchSubtasks();

    // Fetch user profile for submission notes
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('staff_profiles')
        .select('full_name, avatar_url')
        .eq('user_id', userId)
        .single();
      if (data) setUserProfile(data);
    };
    fetchProfile();

    // Restore timer state if task is in progress
    if (task.status === 'in_progress' && (task as any).timer_started_at) {
      const startTime = new Date((task as any).timer_started_at).getTime();
      const now = new Date().getTime();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedSeconds(elapsed);
      setIsTimerRunning(true);

      // Restore breaks taken
      if ((task as any).breaks_taken) {
        setBreaksTaken((task as any).breaks_taken);
      }
    }

    // Calculate remaining time if due date exists
    if (task.due_date) {
      const dueDateTime = task.due_time ? new Date(`${task.due_date}T${task.due_time}`) : new Date(task.due_date);
      const remaining = differenceInSeconds(dueDateTime, new Date());
      setRemainingSeconds(Math.max(0, remaining));
    }
  }, [open, task]);

  const fetchSubtasks = async () => {
    if (!task) return;
    setIsLoadingSubtasks(true);
    try {
      const { data, error } = await supabase
        .from('staff_subtasks')
        .select('*')
        .eq('task_id', task.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      const fetched = data || [];
      setSubtasks(fetched);

      // Auto-stop timer when ALL subtasks are completed
      if (fetched.length > 0 && fetched.every(s => s.status === 'completed')) {
        setIsTimerRunning(false);
      }
    } catch (error) {
      console.error("Error fetching subtasks:", error);
    } finally {
      setIsLoadingSubtasks(false);
    }
  };

  const handleSubtaskStart = async (subtaskId: string) => {
    try {
      const { error } = await supabase
        .from('staff_subtasks')
        .update({ status: 'in_progress', updated_at: new Date().toISOString() } as any)
        .eq('id', subtaskId);
      if (error) throw error;

      // --- Sync: subtask in_progress → parent task in_progress → project in_progress ---
      // Also auto-start the timer
      if (task && (task.status === 'pending' || !isTimerRunning)) {
        const updates: any = {
          status: 'in_progress',
          updated_at: new Date().toISOString(),
        };
        // Only set timer_started_at if not already running
        if (!(task as any).timer_started_at) {
          updates.timer_started_at = new Date().toISOString();
          updates.breaks_taken = 0;
        }
        const { error: taskErr } = await supabase
          .from('staff_tasks')
          .update(updates)
          .eq('id', task.id);
        if (!taskErr) {
          onStatusUpdate(task.id, 'in_progress');
          setIsTimerRunning(true);
        }

        // Also update linked client project to in_progress if it's still pending
        if ((task as any).client_project_id) {
          await supabase
            .from('client_projects')
            .update({ status: 'in_progress', updated_at: new Date().toISOString() })
            .eq('id', (task as any).client_project_id)
            .eq('status', 'pending');
        }
      }

      toast({ title: "Subtask Started", description: "Timer started automatically." });
      fetchSubtasks();
    } catch (error) {
      console.error("Error starting subtask:", error);
      toast({ title: "Error", description: "Failed to start subtask.", variant: "destructive" });
    }
  };

  const handleSubtaskSubmit = async (subtaskId: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Get subtask to merge existing comments/attachments if needed
      const subtask = subtasks.find(s => s.id === subtaskId);
      const existingComments = Array.isArray(subtask.comments) ? subtask.comments : [];
      const existingAttachments = Array.isArray(subtask.attachments) ? subtask.attachments : [];

      const newComment = subtaskNotes.trim() ? {
        user_id: userId,
        user_name: userProfile?.full_name || 'Staff',
        user_avatar: userProfile?.avatar_url,
        message: subtaskNotes.trim(),
        timestamp: new Date().toISOString(),
        type: 'submission_note'
      } : null;

      const updatedComments = newComment ? [...existingComments, newComment] : existingComments;
      const updatedAttachments = [...existingAttachments, ...subtaskFileURLs];

      const { error } = await supabase
        .from('staff_subtasks')
        .update({
          status: 'pending_approval',
          comments: updatedComments,
          attachments: updatedAttachments,
          completed_at: new Date().toISOString()
        } as any)
        .eq('id', subtaskId);

      if (error) throw error;

      // --- Auto-advance current_stage when all subtasks in a stage are completed/pending_approval ---
      try {
        const subtaskStage = subtask.stage || 1;
        const updatedSubtasks = subtasks.map(s => s.id === subtaskId ? { ...s, status: 'pending_approval' } : s);
        const stageSubtasks = updatedSubtasks.filter((st: any) => (st.stage || 1) === subtaskStage);
        const allStageDone = stageSubtasks.length > 0 && stageSubtasks.every((st: any) => st.status === 'completed' || st.status === 'pending_approval');

        if (allStageDone) {
          const allStages = [...new Set(updatedSubtasks.map((st: any) => (st.stage || 1) as number))].sort((a, b) => a - b);
          const nextIncompleteStage = allStages.find(s => {
            const subs = updatedSubtasks.filter((st: any) => (st.stage || 1) === s);
            return subs.some((st: any) => st.status !== 'completed' && st.status !== 'pending_approval');
          });
          const newCurrentStage = nextIncompleteStage ?? ((allStages[allStages.length - 1] || 1) + 1);

          await supabase.from('staff_tasks')
            .update({ current_stage: newCurrentStage, updated_at: new Date().toISOString() } as any)
            .eq('id', task!.id);
        }
      } catch (stageErr) {
        console.error("Error auto-advancing stage:", stageErr);
      }

      toast({ title: "Subtask Submitted", description: "Submitted for review." });
      setSubtaskNotes("");
      setSubtaskFileURLs([]);
      setExpandedSubtask(null);
      fetchSubtasks();
    } catch (error) {
      console.error("Error submitting subtask:", error);
      toast({ title: "Error", description: "Failed to submit subtask.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubtaskFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !task) return;
    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async file => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${task.id}/subtask_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('task-attachments').upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('task-attachments').getPublicUrl(fileName);
        return {
          url: fileName,
          name: file.name,
          size: file.size,
          type: file.type,
          publicUrl,
          uploadedBy: userId
        };
      });
      const newFiles = await Promise.all(uploadPromises);
      setSubtaskFileURLs([...subtaskFileURLs, ...newFiles]);
    } catch (error) {
      console.error("Error uploading subtask files:", error);
      toast({ title: "Upload Failed", description: "Could not upload files.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };
  useEffect(() => {
    if (!isTimerRunning && !isOnBreak) return;
    const interval = setInterval(() => {
      if (isOnBreak) {
        // Break countdown
        setBreakTimeRemaining(prev => {
          if (prev <= 1) {
            // Break is over, resume work
            setIsOnBreak(false);
            setIsTimerRunning(true);
            toast({
              title: "Break over!",
              description: "Time to get back to work"
            });
            return 0;
          }
          return prev - 1;
        });
      } else if (isTimerRunning) {
        if (task?.due_date) {
          // Countdown mode
          setRemainingSeconds(prev => Math.max(0, prev - 1));
        } else {
          // Timer mode
          setElapsedSeconds(prev => prev + 1);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, isOnBreak, task?.due_date]);
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  const handleStart = async () => {
    if (!task) return;
    try {
      // Update task status and save timer start time
      const {
        error
      } = await supabase.from('staff_tasks').update({
        status: 'in_progress',
        timer_started_at: new Date().toISOString(),
        breaks_taken: 0
      } as any).eq('id', task.id);
      if (error) throw error;
      onStatusUpdate(task.id, 'in_progress');
      setIsTimerRunning(true);
    } catch (error) {
      console.error('Error starting task:', error);
      toast({
        title: "Error",
        description: "Failed to start task timer",
        variant: "destructive"
      });
    }
  };
  const handleStartBreak = async () => {
    if (!task) return;
    if (breaksTaken >= 2) {
      toast({
        title: "No breaks left",
        description: "You've already taken 2 breaks for this task",
        variant: "destructive"
      });
      return;
    }
    try {
      const newBreakCount = breaksTaken + 1;

      // Save break count to database
      const {
        error
      } = await supabase.from('staff_tasks').update({
        breaks_taken: newBreakCount
      } as any).eq('id', task.id);
      if (error) throw error;
      setIsTimerRunning(false);
      setIsOnBreak(true);
      setBreakTimeRemaining(300); // 5 minutes = 300 seconds
      setBreaksTaken(newBreakCount);
      toast({
        title: "Break started",
        description: "You have 5 minutes. Timer will resume automatically"
      });
    } catch (error) {
      console.error('Error starting break:', error);
      toast({
        title: "Error",
        description: "Failed to start break",
        variant: "destructive"
      });
    }
  };
  const handleComplete = () => {
    if (task) {
      onStatusUpdate(task.id, 'completed');
      setIsTimerRunning(false);
    }
  };
  const handleAddComment = async () => {
    if (!comment.trim() || !task) return;
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const newComment = {
        text: comment,
        user_id: user.id,
        created_at: new Date().toISOString()
      };
      const updatedComments = [...comments, newComment];
      const {
        error
      } = await supabase.from('staff_tasks').update({
        comments: updatedComments
      }).eq('id', task.id);
      if (error) throw error;
      setComments(updatedComments);
      setComment("");
      toast({
        title: "Comment added",
        description: "Your comment has been added to the task"
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    }
  };
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !task) return;
    setIsUploading(true);
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const uploadPromises = Array.from(files).map(async file => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${task.id}/${Date.now()}.${fileExt}`;
        const {
          error: uploadError
        } = await supabase.storage.from('task-attachments').upload(fileName, file);
        if (uploadError) throw uploadError;
        const {
          data: {
            publicUrl
          }
        } = supabase.storage.from('task-attachments').getPublicUrl(fileName);
        return {
          url: fileName,
          name: file.name,
          size: file.size,
          type: file.type,
          publicUrl,
          uploadedBy: user.id
        };
      });
      const newFiles = await Promise.all(uploadPromises);
      setUploadedFiles([...uploadedFiles, ...newFiles]);
      toast({
        title: "Files uploaded",
        description: `${files.length} file(s) uploaded successfully`
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload files",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  const handleSubmitForReview = async () => {
    if (!task) return;
    setIsSubmitting(true);
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Prepare submission data
      const submissionAttachments = uploadedFiles.map((file, index) => ({
        ...file,
        title: fileNames[index] || file.name
      }));

      // Merge with existing attachments
      const allAttachments = [...(task.attachments || []), ...submissionAttachments];
      const {
        error
      } = await supabase.from('staff_tasks').update({
        status: 'pending_approval',
        attachments: allAttachments,
        comments: comments
      }).eq('id', task.id);
      if (error) throw error;
      onStatusUpdate(task.id, 'pending_approval');
      setUploadedFiles([]);
      setFileNames({});
      toast({
        title: "Submitted for review",
        description: "Your task has been submitted to the team head for review"
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting task:', error);
      toast({
        title: "Submission failed",
        description: "Failed to submit task for review",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDownloadAttachment = async (attachment: {
    name: string;
    url: string;
  }) => {
    try {
      const {
        data,
        error
      } = await supabase.storage.from('task-attachments').download(attachment.url);
      if (error) throw error;
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
        description: `Downloading ${attachment.name}`
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download failed",
        description: "Could not download the file",
        variant: "destructive"
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
  // Fetch project info if linked
  useEffect(() => {
    const fetchProject = async () => {
      if (!task || !(task as any).client_project_id) { setProjectInfo(null); return; }
      const { data } = await supabase
        .from('client_projects')
        .select('title, status, project_type, package_type, progress')
        .eq('id', (task as any).client_project_id)
        .single();
      if (data) setProjectInfo(data);
    };
    fetchProject();
  }, [task]);

  if (!task) return null;
  const hasDueDate = !!task.due_date;
  const isOverdue = hasDueDate && remainingSeconds === 0 && isTimerRunning;

  // Shared badge/detail blocks
  const headerBlock = (
    <>
      {mode === 'inline' && (
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-white/70 hover:text-white hover:bg-white/10 -ml-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tasks
        </Button>
      )}
      <div>
        <h2 className={`font-bold flex items-center gap-3 ${mode === 'inline' ? 'text-2xl lg:text-3xl' : 'text-2xl'}`}>
          <div className="h-10 w-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
            <Target className="w-5 h-5 text-blue-400" />
          </div>
          {task.title}
        </h2>
      </div>
      <div className="flex items-center gap-2 flex-wrap mt-3">
        <Badge variant="outline" className="border-blue-400/50 text-blue-300">
          {(task.status || 'pending').replace('_', ' ').toUpperCase()}
        </Badge>
        <Badge className={getPriorityColor(task.priority || 'medium')}>
          {(task.priority || 'medium').toUpperCase()} PRIORITY
        </Badge>
        {task.trial_period ? (
          <Badge variant="outline" className="border-yellow-400/50 text-yellow-300 flex items-center gap-1">
            <Award className="w-3 h-3" /> Trial Period
          </Badge>
        ) : (
          <Badge variant="outline" className="border-purple-400/50 text-purple-300">
            {task.points} Points
          </Badge>
        )}
      </div>
    </>
  );

  const descriptionCard = (
    <div className="rounded-xl border border-white/[0.12] bg-white/[0.06] backdrop-blur-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02]">
        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Description</h3>
      </div>
      <div className="p-5">
        <p className="text-white/70 leading-relaxed text-sm">{task.description || 'No description provided.'}</p>
      </div>
    </div>
  );

  const attachmentsCard = task.attachments && Array.isArray(task.attachments) && task.attachments.length > 0 ? (
    <div className="rounded-xl border border-white/[0.12] bg-white/[0.06] backdrop-blur-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" /> Attached Files
        </h3>
        <Badge variant="outline" className="text-[10px] border-white/10 text-white/50">{task.attachments.length}</Badge>
      </div>
      <div className="p-4 space-y-2">
        {task.attachments.map((attachment, index) => (
          <div key={index} className="flex items-center justify-between bg-black/20 rounded-lg p-3 border border-white/5 hover:bg-black/30 transition-colors group">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-medium truncate">{attachment.name}</p>
                {attachment.size && <p className="text-white/40 text-xs">{(attachment.size / 1024).toFixed(1)} KB</p>}
              </div>
            </div>
            <Button size="sm" variant="ghost" className="text-blue-400 hover:bg-blue-500/20 opacity-60 group-hover:opacity-100 transition-opacity" onClick={() => handleDownloadAttachment(attachment)}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  ) : null;

  const timerCard = task.status !== 'completed' && task.status !== 'handover' ? (
    <div className="rounded-xl border border-white/[0.12] bg-white/[0.06] backdrop-blur-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02]">
        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" /> {hasDueDate ? 'Time Remaining' : 'Time Elapsed'}
        </h3>
      </div>
      <div className="p-5 text-center space-y-4">
        <div className={`text-4xl lg:text-5xl font-mono font-bold ${isOverdue ? 'text-red-400' : 'text-blue-400'}`}>
          {hasDueDate ? formatTime(remainingSeconds) : formatTime(elapsedSeconds)}
        </div>

        {isOverdue && (
          <div className="flex items-center justify-center gap-2 text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Task is overdue!</span>
          </div>
        )}

        {isOnBreak && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 text-orange-300 mb-2">
              <Coffee className="w-4 h-4" />
              <span className="font-semibold text-sm">On Break</span>
            </div>
            <div className="text-2xl font-mono font-bold text-orange-400">{formatTime(breakTimeRemaining)}</div>
            <p className="text-white/50 text-xs mt-1">Resumes automatically</p>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 flex-wrap">
          {!isTimerRunning && !isOnBreak && (
            <p className="text-xs text-white/40 italic">Timer starts automatically when you begin a subtask</p>
          )}
          {isTimerRunning && !isOnBreak && (
            <Button onClick={handleStartBreak} variant="outline" className="border-orange-400/50 text-orange-300 hover:bg-orange-500/20" disabled={breaksTaken >= 2}>
              <Coffee className="w-4 h-4 mr-2" />
              Take Break ({2 - breaksTaken} left)
            </Button>
          )}
        </div>
      </div>
    </div>
  ) : null;


  const projectInfoCard = (task as any)?.client_project_id ? (
    <div className="rounded-xl border border-white/[0.12] bg-white/[0.06] backdrop-blur-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02]">
        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-400" /> Project Info
        </h3>
      </div>
      <div className="p-4 space-y-3">
        {projectInfo ? (
          <>
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Project Name</p>
              <p className="text-sm font-medium text-white">{projectInfo.title}</p>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Type</p>
                <p className="text-xs text-white/70">{projectInfo.project_type || '—'}</p>
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Package</p>
                <p className="text-xs text-white/70">{projectInfo.package_type || '—'}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Progress</p>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all" style={{ width: `${projectInfo.progress || 0}%` }} />
              </div>
              <p className="text-[10px] text-white/50 mt-1">{projectInfo.progress || 0}% complete</p>
            </div>
          </>
        ) : (
          <p className="text-xs text-white/40 italic">Loading project info...</p>
        )}
      </div>
    </div>
  ) : null;

  const metadataCard = (
    <div className="rounded-xl border border-white/[0.12] bg-white/[0.06] backdrop-blur-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02]">
        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Task Info</h3>
      </div>
      <div className="p-4 space-y-4">
        {/* Description */}
        {task.description && (
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Description</p>
            <p className="text-sm text-white/70 leading-relaxed">{task.description}</p>
          </div>
        )}

        {/* Time Remaining */}
        {task.status !== 'completed' && task.status !== 'handover' && (
          <div className="bg-black/20 rounded-lg p-3 border border-white/5">
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">
              {hasDueDate ? 'Time Remaining' : 'Time Elapsed'}
            </p>
            <p className={`text-xl font-mono font-bold ${isOverdue ? 'text-red-400' : remainingSeconds < 86400 && hasDueDate ? 'text-orange-400' : 'text-emerald-400'}`}>
              {hasDueDate ? formatTime(remainingSeconds) : formatTime(elapsedSeconds)}
            </p>
            {isOverdue && <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Overdue</p>}
          </div>
        )}

        {task.assignedBy && (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <User className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Assigned By</p>
              <p className="text-sm font-medium text-white">{task.assignedBy.full_name}</p>
            </div>
          </div>
        )}
        {task.due_date && (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Due Date</p>
              <p className="text-sm font-medium text-white">
                {format(new Date(task.due_date), 'MMM dd, yyyy')}
                {task.due_time && <span className="text-white/50 ml-1">at {task.due_time}</span>}
              </p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <Clock className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Created</p>
            <p className="text-sm font-medium text-white">
              {task.created_at ? (() => { try { return format(new Date(task.created_at), 'MMM dd, yyyy'); } catch { return 'Unknown'; } })() : 'Unknown'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const subtasksCard = (
    <div className="rounded-xl border border-white/[0.12] bg-white/[0.06] backdrop-blur-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-400" /> Subtasks Workflow
        </h3>
        <Badge variant="outline" className="text-[10px] border-white/10 text-white/50">
          {subtasks.filter(s => s.status === 'completed').length}/{subtasks.length} Done
        </Badge>
      </div>
      <div className="p-4">
        {isLoadingSubtasks ? (
          <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-blue-400" /></div>
        ) : subtasks.length === 0 ? (
          <p className="text-sm text-white/40 italic text-center py-4 bg-black/20 rounded-lg border border-dashed border-white/10">
            No subtasks assigned to this task.
          </p>
        ) : (
          <div className="space-y-3">
            {subtasks.map((st, idx) => {
              const isAssignedToMe = st.assigned_to === userId;
              const stage = (st as any).stage || 1;
              const hasBlockingStage = subtasks.some(other => {
                const otherStage = (other as any).stage || 1;
                return otherStage < stage && other.status !== 'completed';
              });
              const isLocked = hasBlockingStage;
              const isExpanded = expandedSubtask === st.id;

              return (
                <div
                  key={st.id}
                  className={`rounded-xl border transition-all duration-300 ${isLocked ? 'opacity-50 grayscale' : ''} ${st.status === 'completed' ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 bg-black/30'}`}
                >
                  <div className="p-3 flex items-center gap-3 cursor-pointer hover:bg-white/[0.03] transition-colors rounded-t-xl" onClick={() => setViewingSubtask(st)}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${st.status === 'completed' ? 'bg-green-500 text-white' : st.status === 'in_progress' ? 'bg-blue-500 text-white animate-pulse' : 'bg-white/10 text-white/40'}`}>
                      {st.status === 'completed' ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-semibold truncate ${st.status === 'completed' ? 'text-green-400 line-through' : 'text-white'}`}>{st.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-blue-300/80 border border-blue-400/40 rounded-full px-1.5 py-0.5 bg-blue-500/10">Stage {stage}</span>
                        <span className="text-[9px] text-white/40">{st.points || 0} pts</span>
                        <span className={`text-[9px] font-medium ${isAssignedToMe ? 'text-purple-400' : 'text-white/30'}`}>
                          {isAssignedToMe ? 'You' : 'Others'}
                        </span>
                        <Eye className="w-3 h-3 text-white/20 ml-auto" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {st.status === 'pending' && isAssignedToMe && !isLocked && (
                        <Button size="sm" onClick={() => handleSubtaskStart(st.id)} className="h-7 text-[10px] bg-blue-600 hover:bg-blue-700 px-3">Start</Button>
                      )}
                      {st.status === 'in_progress' && isAssignedToMe && (
                        <Button size="sm" onClick={() => setExpandedSubtask(isExpanded ? null : st.id)} className="h-7 text-[10px] bg-purple-600 hover:bg-purple-700 px-3">
                          {isExpanded ? 'Cancel' : 'Submit'}
                        </Button>
                      )}
                      {st.status === 'pending_approval' && (
                        <Badge className="bg-orange-500/20 text-orange-400 border-none text-[9px] px-2 h-6">Review</Badge>
                      )}
                      {isLocked && <AlertCircle className="w-4 h-4 text-white/20" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 space-y-3 animate-in fade-in slide-in-from-top-2">
                      <Separator className="bg-white/5" />
                      <div className="space-y-2">
                        <Label className="text-[11px] text-white/60">Submission Notes</Label>
                        <Textarea
                          placeholder="What did you do? Any notes..."
                          value={subtaskNotes}
                          onChange={(e) => setSubtaskNotes(e.target.value)}
                          className="bg-black/50 border-white/10 text-xs min-h-[70px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] text-white/60">Attachments</Label>
                        <div className="flex flex-wrap gap-2">
                          {subtaskFileURLs.map((file, fidx) => (
                            <div key={fidx} className="flex items-center gap-2 bg-white/5 p-2 rounded border border-white/10">
                              <FileText className="w-3 h-3 text-blue-400" />
                              <span className="text-[9px] text-white/60 max-w-[80px] truncate">{file.name}</span>
                              <Button size="icon" variant="ghost" className="h-4 w-4 text-red-400 hover:bg-red-500/20" onClick={() => setSubtaskFileURLs(subtaskFileURLs.filter((_, i) => i !== fidx))}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" className="h-7 border-dashed border-white/20 text-[10px] text-white/40 hover:text-white" onClick={() => subtaskFileInputRef.current?.click()} disabled={isUploading}>
                            {isUploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
                            Upload
                          </Button>
                          <input type="file" multiple hidden ref={subtaskFileInputRef} onChange={handleSubtaskFileUpload} />
                        </div>
                      </div>
                      <Button className="w-full h-8 bg-green-600 hover:bg-green-700 font-bold text-[10px]" onClick={() => handleSubtaskSubmit(st.id)} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Send className="h-3 w-3 mr-2" />}
                        SUBMIT FOR APPROVAL
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const commentsCard = task.status === 'in_progress' ? (
    <div className="rounded-xl border border-white/[0.12] bg-white/[0.06] backdrop-blur-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02]">
        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-400" /> Comments
        </h3>
      </div>
      <div className="p-4 space-y-3">
        {comments.length > 0 && (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {comments.map((c, idx) => (
              <div key={idx} className="bg-black/20 rounded-lg p-3 border border-white/5">
                <p className="text-white/90 text-sm">{c.text || c.message}</p>
                <p className="text-white/40 text-xs mt-1">
                  {(() => { try { return format(new Date(c.created_at || c.timestamp), 'MMM dd, HH:mm'); } catch { return ''; } })()}
                </p>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..." className="bg-black/30 border-white/10 text-white resize-none text-sm flex-1" rows={2} />
          <Button onClick={handleAddComment} size="sm" className="bg-blue-500 hover:bg-blue-600 text-white self-end" disabled={!comment.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  const uploadAndSubmitCard = task.status === 'in_progress' ? (
    <div className="rounded-xl border border-white/[0.12] bg-white/[0.06] backdrop-blur-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02]">
        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider flex items-center gap-2">
          <Upload className="w-4 h-4 text-green-400" /> Submit Work
        </h3>
      </div>
      <div className="p-4 space-y-4">
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="bg-black/20 rounded-lg p-3 border border-white/5 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <Input value={fileNames[index] || file.name} onChange={e => setFileNames({ ...fileNames, [index]: e.target.value })} placeholder="File name" className="bg-white/5 border-white/10 text-white text-sm h-8 flex-1" />
                <Button size="sm" variant="ghost" onClick={() => { setUploadedFiles(uploadedFiles.filter((_, i) => i !== index)); const fn = { ...fileNames }; delete fn[index]; setFileNames(fn); }} className="text-red-400 hover:bg-red-500/20 h-8 w-8 p-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} className="hidden" />
          <Button onClick={() => fileInputRef.current?.click()} size="sm" variant="outline" className="border-green-400/50 text-green-300 hover:bg-green-500/20 flex-1" disabled={isUploading}>
            {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            Upload Files
          </Button>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-2">
          <p className="text-white/60 text-xs mb-3">Submit your completed work for team head review.</p>
          <Button onClick={handleSubmitForReview} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Submit for Review
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  const statusCard = task.status === 'pending_approval' ? (
    <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-6 text-center">
      <Clock className="w-10 h-10 text-orange-400 mx-auto mb-2" />
      <p className="text-orange-300 font-semibold">Pending Approval</p>
      <p className="text-white/50 text-sm mt-1">Your task is being reviewed by the team head</p>
    </div>
  ) : task.status === 'completed' ? (
    <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-6 text-center">
      <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
      <p className="text-green-300 font-semibold">Task Completed!</p>
      {!task.trial_period && <p className="text-white/50 text-sm mt-1">You earned {task.points} points</p>}
      {task.trial_period && <p className="text-yellow-300 text-sm mt-1 flex items-center justify-center gap-1"><Award className="w-4 h-4" /> Trial Period Task</p>}
    </div>
  ) : null;

  // For dialog mode, render flat stacked content
  const dialogContent = (
    <div className="space-y-6">
      {headerBlock}
      <Separator className="bg-white/10" />
      {descriptionCard}
      {attachmentsCard}
      {timerCard}
      {subtasksCard}
      {metadataCard}
      {commentsCard}
      {uploadAndSubmitCard}
      {statusCard}
    </div>
  );

  // For inline mode, render two-column card grid
  const inlineContent = (
    <div className="space-y-6">
      {headerBlock}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column - Main content */}
        <div className="lg:col-span-2 space-y-4">
          {attachmentsCard}
          {subtasksCard}
          {commentsCard}
          {uploadAndSubmitCard}
          {statusCard}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-4">
          {projectInfoCard}
          {metadataCard}

          {/* Quick Stats Card */}
          <div className="rounded-xl border border-white/[0.12] bg-white/[0.06] backdrop-blur-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02]">
              <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Progress</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">Subtasks</span>
                  <span className="text-white font-medium">{subtasks.filter(s => s.status === 'completed').length}/{subtasks.length}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: subtasks.length > 0 ? `${(subtasks.filter(s => s.status === 'completed').length / subtasks.length) * 100}%` : '0%' }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/20 rounded-lg p-3 text-center border border-white/5">
                  <p className="text-lg font-bold text-blue-400">{task.points}</p>
                  <p className="text-[10px] text-white/40 uppercase">Coins</p>
                </div>
                <div className="bg-black/20 rounded-lg p-3 text-center border border-white/5">
                  <p className="text-lg font-bold text-purple-400">{subtasks.length}</p>
                  <p className="text-[10px] text-white/40 uppercase">Subtasks</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const content = mode === 'inline' ? inlineContent : dialogContent;

  const subtaskDetailDialog = (
    <Dialog open={!!viewingSubtask} onOpenChange={(open) => !open && setViewingSubtask(null)}>
      <DialogContent className="max-w-lg max-h-[85vh] bg-gradient-to-br from-slate-900 to-slate-800 border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            {viewingSubtask?.title}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(85vh-100px)] pr-4">
          {viewingSubtask && (
            <div className="space-y-5">
              {/* Status & Meta */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={`text-[10px] ${
                  viewingSubtask.status === 'completed' ? 'border-green-500/50 text-green-400' :
                  viewingSubtask.status === 'in_progress' ? 'border-blue-500/50 text-blue-400' :
                  viewingSubtask.status === 'pending_approval' ? 'border-orange-500/50 text-orange-400' :
                  'border-white/20 text-white/60'
                }`}>
                  {(viewingSubtask.status || 'pending').replace('_', ' ').toUpperCase()}
                </Badge>
                <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400">
                  Stage {viewingSubtask.stage || 1}
                </Badge>
                <Badge variant="outline" className="text-[10px] border-white/10 text-white/50">
                  {viewingSubtask.points || 0} pts
                </Badge>
              </div>

              {/* Description */}
              {viewingSubtask.description && (
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Description</h4>
                  <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{viewingSubtask.description}</p>
                </div>
              )}

              {/* Attachments */}
              {viewingSubtask.attachments && Array.isArray(viewingSubtask.attachments) && viewingSubtask.attachments.length > 0 && (
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">
                    Attachments ({viewingSubtask.attachments.length})
                  </h4>
                  <div className="space-y-2">
                    {viewingSubtask.attachments.map((att: any, i: number) => (
                      <div key={i} className="flex items-center justify-between bg-black/20 rounded-lg p-2.5 border border-white/5 group">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-white font-medium truncate">{att.name || 'File'}</p>
                            {att.size && <p className="text-[10px] text-white/40">{(att.size / 1024).toFixed(1)} KB</p>}
                          </div>
                        </div>
                        {att.url && (
                          <Button size="sm" variant="ghost" className="text-blue-400 hover:bg-blue-500/20 h-7 w-7 p-0" onClick={() => handleDownloadAttachment(att)}>
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments / Activity */}
              {viewingSubtask.comments && Array.isArray(viewingSubtask.comments) && viewingSubtask.comments.length > 0 && (
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">
                    Comments ({viewingSubtask.comments.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {viewingSubtask.comments.map((c: any, i: number) => (
                      <div key={i} className="bg-black/20 rounded-lg p-3 border border-white/5">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-semibold text-white/70">{c.user_name || 'Staff'}</span>
                          {c.type && <Badge variant="outline" className="text-[8px] border-white/10 text-white/30 h-4">{c.type}</Badge>}
                        </div>
                        <p className="text-sm text-white/80">{c.message || c.text}</p>
                        <p className="text-[10px] text-white/30 mt-1">
                          {(() => { try { return format(new Date(c.timestamp || c.created_at), 'MMM dd, HH:mm'); } catch { return ''; } })()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Due date if any */}
              {viewingSubtask.due_date && (
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <Calendar className="w-3.5 h-3.5 text-orange-400" />
                  Due: {(() => { try { return format(new Date(viewingSubtask.due_date), 'MMM dd, yyyy'); } catch { return viewingSubtask.due_date; } })()}
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );

  if (mode === 'inline') {
    return (
      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.12] rounded-2xl text-white p-6 lg:p-8">
        {content}
        {subtaskDetailDialog}
      </div>
    );
  }

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
          {content}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};