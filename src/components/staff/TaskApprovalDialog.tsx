import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  CheckCircle,
  XCircle,
  FileText,
  Download,
  User,
  Calendar,
  MessageSquare,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  points: number;
  trial_period?: boolean;
  assigned_to: string;
  created_at: string;
  attachments?: any[];
  comments?: any[];
  staff_profiles?: {
    full_name: string;
  };
}

interface TaskApprovalDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApproved: () => void;
}

export const TaskApprovalDialog = ({
  task,
  open,
  onOpenChange,
  onApproved,
}: TaskApprovalDialogProps) => {
  const [feedback, setFeedback] = useState("");
  const [requireHandover, setRequireHandover] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleApprove = async () => {
    if (!task) return;

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Add approval feedback to comments
      const approvalComment = {
        text: `Approved by team head${feedback ? `: ${feedback}` : ''}`,
        user_id: user.id,
        created_at: new Date().toISOString(),
        type: 'approval',
      };

      const updatedComments = [
        ...(task.comments || []),
        approvalComment,
      ];

      const { error } = await supabase
        .from('staff_tasks')
        .update({
          status: 'completed',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          comments: updatedComments,
        })
        .eq('id', task.id);

      if (error) throw error;

      // Award points to staff member if not trial period
      if (!task.trial_period) {
        const { data: staffProfile } = await supabase
          .from('staff_profiles')
          .select('total_points')
          .eq('user_id', task.assigned_to)
          .single();

        if (staffProfile) {
          await supabase
            .from('staff_profiles')
            .update({
              total_points: (staffProfile.total_points || 0) + task.points,
            })
            .eq('user_id', task.assigned_to);
        }
      }

      toast({
        title: "Task approved",
        description: "The task has been marked as completed",
      });

      onApproved();
      onOpenChange(false);
      setFeedback("");
      setRequireHandover(false);
    } catch (error) {
      console.error('Error approving task:', error);
      toast({
        title: "Approval failed",
        description: "Failed to approve the task",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestHandover = async () => {
    if (!task) return;

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Add handover request to comments
      const handoverComment = {
        text: `Handover requested${feedback ? `: ${feedback}` : ''}`,
        user_id: user.id,
        created_at: new Date().toISOString(),
        type: 'handover_request',
      };

      const updatedComments = [
        ...(task.comments || []),
        handoverComment,
      ];

      const { error } = await supabase
        .from('staff_tasks')
        .update({
          status: 'handover',
          comments: updatedComments,
        })
        .eq('id', task.id);

      if (error) throw error;

      toast({
        title: "Handover requested",
        description: "The staff member can now handover this task",
      });

      onApproved();
      onOpenChange(false);
      setFeedback("");
      setRequireHandover(false);
    } catch (error) {
      console.error('Error requesting handover:', error);
      toast({
        title: "Request failed",
        description: "Failed to request handover",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadAttachment = async (attachment: { name: string; url: string }) => {
    try {
      const { data, error } = await supabase.storage
        .from('task-attachments')
        .download(attachment.url);

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

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] bg-gradient-to-br from-slate-900 to-slate-800 border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-blue-400" />
            Review Task
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)] pr-4">
          <div className="space-y-6">
            {/* Task Info */}
            <div>
              <h3 className="text-xl font-semibold mb-2">{task.title}</h3>
              {task.description && (
                <p className="text-white/70">{task.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="border-blue-400/50 text-blue-300">
                {task.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <Badge className={`${
                task.priority === 'urgent' ? 'bg-red-500' :
                task.priority === 'high' ? 'bg-orange-500' :
                task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
              }`}>
                {task.priority.toUpperCase()}
              </Badge>
              {task.trial_period ? (
                <Badge variant="outline" className="border-yellow-400/50 text-yellow-300">
                  Trial Period
                </Badge>
              ) : (
                <Badge variant="outline" className="border-purple-400/50 text-purple-300">
                  {task.points} Points
                </Badge>
              )}
            </div>

            <Separator className="bg-white/10" />

            {/* Staff Info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-xs text-white/50">Assigned To</p>
                  <p className="text-sm font-medium">
                    {task.staff_profiles?.full_name || 'Unknown'}
                  </p>
                </div>
              </div>
              {task.due_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-400" />
                  <div>
                    <p className="text-xs text-white/50">Due Date</p>
                    <p className="text-sm font-medium">
                      {format(new Date(task.due_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Separator className="bg-white/10" />

            {/* Comments */}
            {task.comments && task.comments.length > 0 && (
              <>
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-400" />
                    Comments & Updates
                  </h3>
                  <div className="space-y-2">
                    {task.comments.map((comment: any, idx: number) => (
                      <div key={idx} className="bg-black/30 rounded-lg p-3 border border-white/10">
                        <p className="text-white/90 text-sm">{comment.text}</p>
                        <p className="text-white/50 text-xs mt-1">
                          {format(new Date(comment.created_at), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator className="bg-white/10" />
              </>
            )}

            {/* Attachments */}
            {task.attachments && task.attachments.length > 0 && (
              <>
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-400" />
                    Submitted Files ({task.attachments.length})
                  </h3>
                  <div className="space-y-2">
                    {task.attachments.map((file: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-black/30 rounded-lg p-3 border border-white/10"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-white text-sm font-medium truncate">
                              {file.title || file.name}
                            </p>
                            {file.size && (
                              <p className="text-white/50 text-xs">
                                {(file.size / 1024).toFixed(2)} KB
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20 flex-shrink-0"
                          onClick={() => handleDownloadAttachment(file)}
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

            {/* Approval Section */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="feedback" className="text-white">
                  Feedback (Optional)
                </Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Add feedback or comments..."
                  className="bg-black/30 border-white/20 text-white mt-2"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-orange-400" />
                  <Label htmlFor="handover" className="text-white cursor-pointer">
                    Require Handover
                  </Label>
                </div>
                <Switch
                  id="handover"
                  checked={requireHandover}
                  onCheckedChange={setRequireHandover}
                />
              </div>

              <div className="flex gap-3">
                {requireHandover ? (
                  <Button
                    onClick={handleRequestHandover}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4 mr-2" />
                    )}
                    Request Handover
                  </Button>
                ) : (
                  <Button
                    onClick={handleApprove}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Approve & Complete
                  </Button>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
