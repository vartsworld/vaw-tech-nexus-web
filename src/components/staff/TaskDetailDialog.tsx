import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Clock, Calendar, User, Target, Play, Coffee, CheckCircle, AlertCircle, FileText, Download, Award, MessageSquare, Upload, Send, X, Loader2 } from "lucide-react";
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
}
export const TaskDetailDialog = ({
  task,
  open,
  onOpenChange,
  onStatusUpdate,
  userId
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
        .order('created_at', { ascending: true }); // Order by creation for sequential

      if (error) throw error;
      setSubtasks(data || []);
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
      if (task && task.status === 'pending') {
        const { error: taskErr } = await supabase
          .from('staff_tasks')
          .update({ status: 'in_progress', updated_at: new Date().toISOString() } as any)
          .eq('id', task.id);
        if (!taskErr) {
          onStatusUpdate(task.id, 'in_progress');
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

      toast({ title: "Subtask Started", description: "You are now working on this subtask." });
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
  if (!task) return null;
  const hasDueDate = !!task.due_date;
  const isOverdue = hasDueDate && remainingSeconds === 0 && isTimerRunning;
  return <Dialog open={open} onOpenChange={onOpenChange}>
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
              {(task.status || 'pending').replace('_', ' ').toUpperCase()}
            </Badge>
            <Badge className={getPriorityColor(task.priority || 'medium')}>
              {(task.priority || 'medium').toUpperCase()} PRIORITY
            </Badge>
            {task.trial_period ? <Badge variant="outline" className="border-yellow-400/50 text-yellow-300 flex items-center gap-1">
              <Award className="w-3 h-3" />
              Trial Period
            </Badge> : <Badge variant="outline" className="border-purple-400/50 text-purple-300">
              {task.points} Points
            </Badge>}
          </div>

          <Separator className="bg-white/10" />

          {/* Description */}
          {task.description && <div>
            <h3 className="text-lg font-semibold mb-2 text-white/90">Description</h3>
            <p className="text-white/70 leading-relaxed">{task.description}</p>
          </div>}

          {/* Comments Section */}
          {task.status === 'in_progress' && <>
            <Separator className="bg-white/10" />

            <div>
              <h3 className="text-lg font-semibold mb-3 text-white/90 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                Comments & Updates
              </h3>

              {comments.length > 0 && <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                {comments.map((c, idx) => <div key={idx} className="bg-black/30 rounded-lg p-3 border border-white/10">
                  <p className="text-white/90 text-sm">{c.text || c.message}</p>
                  <p className="text-white/50 text-xs mt-1">
                    {(() => { try { return format(new Date(c.created_at || c.timestamp), 'MMM dd, yyyy HH:mm'); } catch { return ''; } })()}
                  </p>
                </div>)}
              </div>}

              <div className="space-y-2">
                <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment or update..." className="bg-black/30 border-white/20 text-white resize-none" rows={3} />
                <Button onClick={handleAddComment} size="sm" className="bg-blue-500 hover:bg-blue-600 text-white" disabled={!comment.trim()}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Add Comment
                </Button>
              </div>
            </div>

            <Separator className="bg-white/10" />

            {/* File Upload Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-white/90 flex items-center gap-2">
                <Upload className="w-5 h-5 text-green-400" />
                Upload Work Files
              </h3>

              {uploadedFiles.length > 0 && <div className="space-y-2 mb-4">
                {uploadedFiles.map((file, index) => <div key={index} className="bg-black/30 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <Input value={fileNames[index] || file.name} onChange={e => setFileNames({
                          ...fileNames,
                          [index]: e.target.value
                        })} placeholder="File name/description" className="bg-white/10 border-white/20 text-white text-sm h-8" />
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => {
                      setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
                      const newFileNames = {
                        ...fileNames
                      };
                      delete newFileNames[index];
                      setFileNames(newFileNames);
                    }} className="text-red-400 hover:bg-red-500/20">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>)}
              </div>}

              <div className="flex gap-2">
                <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} className="hidden" />
                <Button onClick={() => fileInputRef.current?.click()} size="sm" variant="outline" className="border-green-400/50 text-green-300 hover:bg-green-500/20" disabled={isUploading}>
                  {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  Upload Files
                </Button>
              </div>
            </div>

            <Separator className="bg-white/10" />

            {/* Submit for Review Button */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-white/70 text-sm mb-3">
                Once you're done with your work, submit the task for review by your team head.
              </p>
              <Button onClick={handleSubmitForReview} className="w-full bg-blue-500 hover:bg-blue-600 text-white" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Submit for Review
              </Button>
            </div>
          </>}

          {task.status === 'pending_approval' && <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-4 text-center">
            <Clock className="w-12 h-12 text-orange-400 mx-auto mb-2" />
            <p className="text-orange-300 font-semibold">Pending Approval</p>
            <p className="text-white/70 text-sm mt-1">
              Your task is being reviewed by the team head
            </p>
          </div>}

          {task.status === 'completed' && <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
            <p className="text-green-300 font-semibold">Task Completed!</p>
            {!task.trial_period && <p className="text-white/70 text-sm mt-1">
              You earned {task.points} points
            </p>}
            {task.trial_period && <p className="text-yellow-300 text-sm mt-1 flex items-center justify-center gap-1">
              <Award className="w-4 h-4" />
              Trial Period Task
            </p>}
          </div>}
        </div>
      </ScrollArea>
    </DialogContent>
  </Dialog>;
};