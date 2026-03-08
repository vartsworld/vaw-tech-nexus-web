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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CheckCircle,
  XCircle,
  FileText,
  Download,
  User,
  Calendar,
  MessageSquare,
  Loader2,
  RotateCcw,
  Clock,
  Target,
  Flag,
  Paperclip,
  Star,
  Layers,
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SubtaskReviewDialogProps {
  subtask: any | null;
  parentTask: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (subtaskId: string) => void;
  onReject: (subtaskId: string, note: string) => void;
  viewOnly?: boolean;
}

const priorityConfig: Record<string, { color: string; label: string }> = {
  urgent: { color: "bg-red-500/20 text-red-300 border-red-500/40", label: "URGENT" },
  high: { color: "bg-orange-500/20 text-orange-300 border-orange-500/40", label: "HIGH" },
  medium: { color: "bg-amber-500/20 text-amber-300 border-amber-500/40", label: "MEDIUM" },
  low: { color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", label: "LOW" },
};

const stageNames: Record<number, string> = {
  1: "Discovery",
  2: "Design",
  3: "Development",
  4: "Testing",
  5: "Review",
};

export const SubtaskReviewDialog = ({
  subtask,
  parentTask,
  open,
  onOpenChange,
  onApprove,
  onReject,
  viewOnly = false,
}: SubtaskReviewDialogProps) => {
  const [rejectionNote, setRejectionNote] = useState("");
  const [showRejectSection, setShowRejectSection] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const resetState = () => {
    setRejectionNote("");
    setShowRejectSection(false);
    setIsSubmitting(false);
  };

  const handleApprove = async () => {
    if (!subtask) return;
    setIsSubmitting(true);
    try {
      await onApprove(subtask.id);
      onOpenChange(false);
      resetState();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!subtask || !rejectionNote.trim()) {
      toast({ title: "Note required", description: "Please explain what needs to be fixed.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await onReject(subtask.id, rejectionNote);
      onOpenChange(false);
      resetState();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadAttachment = async (attachment: any) => {
    try {
      if (attachment.url?.startsWith("http")) {
        window.open(attachment.url, "_blank");
        return;
      }
      const { data, error } = await supabase.storage
        .from("task-attachments")
        .download(attachment.url || attachment.file_url);
      if (error) throw error;
      const url = window.URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.name || attachment.file_name || "file";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      toast({ title: "Download failed", description: "Could not download the file", variant: "destructive" });
    }
  };

  if (!subtask) return null;

  const isReviewable = subtask.status === 'review_pending' || subtask.status === 'pending_approval';
  const assignee = subtask.staff_profiles;
  const priority = priorityConfig[subtask.priority] || priorityConfig.medium;
  const attachments = Array.isArray(subtask.attachments) ? subtask.attachments : [];
  const comments = Array.isArray(subtask.comments) ? subtask.comments : [];
  const stageName = stageNames[subtask.stage || 1] || `Stage ${subtask.stage || 1}`;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetState();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/80 border-purple-500/30 text-white p-0 overflow-hidden">
        {/* Hero header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-r from-purple-600/20 via-blue-600/15 to-indigo-600/20 border-b border-white/10">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs text-white/50 uppercase tracking-widest font-bold">
                <Layers className="h-3.5 w-3.5" />
                {subtask.status === 'review_pending' && !viewOnly ? 'Subtask Review' : 'Subtask Details'}
              </div>
              <h2 className="text-xl font-bold tracking-tight leading-tight break-words">
                {subtask.title}
              </h2>
              {parentTask && (
                <p className="text-sm text-white/50">
                  Parent: <span className="text-white/70 font-medium">{parentTask.title}</span>
                </p>
              )}
            </div>
            <Badge variant="outline" className={`${priority.color} text-[10px] font-bold px-2.5 py-1 shrink-0`}>
              <Flag className="h-3 w-3 mr-1" />
              {priority.label}
            </Badge>
          </div>

          {/* Meta chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="outline" className="bg-purple-500/15 border-purple-500/30 text-purple-300 text-[10px]">
              <Target className="h-3 w-3 mr-1" />
              {stageName}
            </Badge>
            {subtask.points > 0 && (
              <Badge variant="outline" className="bg-amber-500/15 border-amber-500/30 text-amber-300 text-[10px]">
                <Star className="h-3 w-3 mr-1" />
                {subtask.points} pts
              </Badge>
            )}
            {subtask.due_date && (
              <Badge variant="outline" className="bg-blue-500/15 border-blue-500/30 text-blue-300 text-[10px]">
                <Calendar className="h-3 w-3 mr-1" />
                {(() => {
                  try {
                    return format(new Date(subtask.due_date), "MMM dd, yyyy");
                  } catch {
                    return "Invalid date";
                  }
                })()}
                {subtask.due_time && ` at ${subtask.due_time}`}
              </Badge>
            )}
            <Badge variant="outline" className={`text-[10px] font-bold px-2.5 py-1 ${
              subtask.status === 'completed' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : subtask.status === 'review_pending' ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
              : subtask.status === 'in_progress' ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            }`}>
              <Clock className="h-3 w-3 mr-1" />
              {subtask.status === 'completed' ? 'COMPLETED' : subtask.status === 'review_pending' ? 'PENDING APPROVAL' : subtask.status === 'in_progress' ? 'IN PROGRESS' : 'PENDING'}
            </Badge>
          </div>
        </div>

        <ScrollArea className="max-h-[calc(90vh-280px)] px-6">
          <div className="space-y-5 py-4">
            {/* Assignee */}
            {assignee && (
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
                <Avatar className="h-10 w-10 border-2 border-purple-500/40">
                  <AvatarImage src={assignee.avatar_url || undefined} />
                  <AvatarFallback className="bg-purple-500/20 text-purple-300 text-sm font-bold">
                    {(assignee.full_name || "U").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{assignee.full_name}</p>
                  <p className="text-xs text-white/50">@{assignee.username} {assignee.role ? `· ${assignee.role}` : ""}</p>
                </div>
              </div>
            )}

            {/* Description */}
            {subtask.description && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Description
                </h4>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                  {subtask.description}
                </div>
              </div>
            )}

            {/* Attachments */}
            {attachments.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2 flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5" />
                  Attachments ({attachments.length})
                </h4>
                <div className="space-y-2">
                  {attachments.map((file: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="p-2 bg-blue-500/15 rounded-lg">
                          <FileText className="h-4 w-4 text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{file.name || file.file_name || `File ${i + 1}`}</p>
                          {file.size && <p className="text-xs text-white/40">{(file.size / 1024).toFixed(1)} KB</p>}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-blue-300 hover:bg-blue-500/20 h-8"
                        onClick={() => handleDownloadAttachment(file)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments / Activity */}
            {comments.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Activity ({comments.length})
                </h4>
                <div className="space-y-2">
                  {comments.map((comment: any, idx: number) => (
                    <div
                      key={idx}
                      className={cn(
                        "rounded-lg p-3 border text-sm",
                        comment.type === "rejection"
                          ? "bg-red-500/10 border-red-500/30"
                          : comment.type === "approval"
                            ? "bg-emerald-500/10 border-emerald-500/30"
                            : "bg-white/5 border-white/10"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {comment.user_name && (
                          <span className="text-xs font-semibold text-white/70">{comment.user_name}</span>
                        )}
                        {comment.timestamp && (
                          <span className="text-[10px] text-white/30">
                            {(() => {
                              try {
                                return format(new Date(comment.timestamp), "MMM dd, HH:mm");
                              } catch {
                                return "";
                              }
                            })()}
                          </span>
                        )}
                      </div>
                      <p className="text-white/80">{comment.message || comment.text}</p>
                      {comment.attachment_url && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-blue-300 hover:bg-blue-500/20 h-7 mt-1 text-xs"
                          onClick={() => handleDownloadAttachment({ url: comment.attachment_url, name: comment.attachment_name })}
                        >
                          <Paperclip className="h-3 w-3 mr-1" />
                          {comment.attachment_name || "Attachment"}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Created</span>
                <span className="text-white/60">
                  {(() => {
                    try {
                      return format(new Date(subtask.created_at), "MMM dd, yyyy HH:mm");
                    } catch {
                      return "—";
                    }
                  })()}
                </span>
              </div>
              {subtask.updated_at && (
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Last Updated</span>
                  <span className="text-white/60">
                    {(() => {
                      try {
                        return format(new Date(subtask.updated_at), "MMM dd, yyyy HH:mm");
                      } catch {
                        return "—";
                      }
                    })()}
                  </span>
                </div>
              )}
            </div>

            {/* Rejection section */}
            {showRejectSection && !viewOnly && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-red-300 flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Return for Rework
                  </h4>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-white/50" onClick={() => setShowRejectSection(false)}>
                    Cancel
                  </Button>
                </div>
                <Textarea
                  placeholder="Explain what needs to be fixed..."
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  className="bg-black/30 border-red-500/30 text-white placeholder:text-white/30 min-h-[80px]"
                />
                <Button
                  onClick={handleReject}
                  disabled={isSubmitting || !rejectionNote.trim()}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                  Send for Rework
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Action Footer */}
        {!viewOnly && subtask.status === 'review_pending' && !showRejectSection && (
          <div className="px-6 py-4 border-t border-white/10 bg-black/30 flex items-center gap-3">
            <Button
              onClick={() => setShowRejectSection(true)}
              variant="outline"
              className="flex-1 border-red-500/40 text-red-300 hover:bg-red-500/15 hover:text-red-200"
              disabled={isSubmitting}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reject & Rework
            </Button>
            <Button
              onClick={handleApprove}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Approve & Award
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
