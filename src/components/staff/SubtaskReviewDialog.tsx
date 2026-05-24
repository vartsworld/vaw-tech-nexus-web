import { useState, useRef } from "react";
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
  Upload,
  X,
  Edit,
  Share2,
  Plus,
  ExternalLink,
  Link2,
  Eye,
  LayoutGrid,
  List,
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getFaviconUrl, extractDomain } from "@/lib/linkMetadata";

interface SubtaskReviewDialogProps {
  subtask: any | null;
  parentTask: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (subtaskId: string, attachments?: File[]) => void;
  onReject: (subtaskId: string, note: string, attachments?: File[]) => void;
  onEdit?: (subtask: any) => void;
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
  onEdit,
  viewOnly = false,
}: SubtaskReviewDialogProps) => {
  const [rejectionNote, setRejectionNote] = useState("");
  const [showRejectSection, setShowRejectSection] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectFiles, setRejectFiles] = useState<File[]>([]);
  const [approveFiles, setApproveFiles] = useState<File[]>([]);
  const [showApproveAttach, setShowApproveAttach] = useState(false);
  const rejectFileRef = useRef<HTMLInputElement>(null);
  const approveFileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [previewAttachment, setPreviewAttachment] = useState<any | null>(null);
  const [attachmentViewMode, setAttachmentViewMode] = useState<'grid' | 'list'>('grid');

  const isImage = (name: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(name);
  };

  const getFileUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from('task-attachments').getPublicUrl(path);
    return data.publicUrl;
  };

  const resetState = () => {
    setRejectionNote("");
    setShowRejectSection(false);
    setIsSubmitting(false);
    setRejectFiles([]);
    setApproveFiles([]);
    setShowApproveAttach(false);
    setPreviewAttachment(null);
  };

  const handleApprove = async () => {
    if (!subtask) return;
    setIsSubmitting(true);
    try {
      await onApprove(subtask.id, approveFiles.length > 0 ? approveFiles : undefined);
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
      await onReject(subtask.id, rejectionNote, rejectFiles.length > 0 ? rejectFiles : undefined);
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
    <>
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
                {isReviewable && !viewOnly ? 'Subtask Review' : 'Subtask Details'}
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
            <div className="flex flex-col items-end gap-2 shrink-0">
              <Badge variant="outline" className={`${priority.color} text-[10px] font-bold px-2.5 py-1`}>
                <Flag className="h-3 w-3 mr-1" />
                {priority.label}
              </Badge>
              {onEdit && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7 text-[10px] border-white/10 hover:bg-white/10 font-bold"
                  onClick={() => {
                    onEdit(subtask);
                    onOpenChange(false);
                  }}
                >
                  <Edit className="h-3 w-3 mr-1" /> EDIT
                </Button>
              )}
            </div>
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
              : isReviewable ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
              : subtask.status === 'in_progress' ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            }`}>
              <Clock className="h-3 w-3 mr-1" />
              {subtask.status === 'completed' ? 'COMPLETED' : isReviewable ? 'PENDING APPROVAL' : subtask.status === 'in_progress' ? 'IN PROGRESS' : 'PENDING'}
            </Badge>

            {/* Time stamps chip */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/40">
              <div className="flex items-center gap-1">
                <span className="font-bold uppercase tracking-tighter opacity-50">Created:</span>
                <span className="text-white/60">{subtask.created_at ? format(new Date(subtask.created_at), "MMM dd, HH:mm") : '—'}</span>
              </div>
              <div className="w-px h-2.5 bg-white/10 hidden sm:block" />
              <div className="flex items-center gap-1">
                <span className="font-bold uppercase tracking-tighter opacity-50">Updated:</span>
                <span className="text-white/60">{subtask.updated_at ? format(new Date(subtask.updated_at), "MMM dd, HH:mm") : '—'}</span>
              </div>
            </div>
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

            {/* Timing & Penalty Info */}
            {(subtask.ready_at || subtask.accepted_at || (subtask.time_limit_hr > 0)) && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  Timing & Penalties
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[9px] text-white/30 uppercase">Acceptance Window</p>
                    <p className="text-xs font-medium">
                      {subtask.ready_at ? `Ready: ${format(new Date(subtask.ready_at), "HH:mm")}` : 'Not ready yet'}
                    </p>
                    {subtask.accepted_at && (
                      <p className="text-[10px] text-emerald-400">
                        Accepted: {format(new Date(subtask.accepted_at), "HH:mm")}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[9px] text-white/30 uppercase">Time Limit & Penalty</p>
                    <p className="text-xs font-medium">
                      {subtask.time_limit_hr ? `${subtask.time_limit_hr} hours limit` : 'No time limit'}
                    </p>
                    {subtask.penalty_coins > 0 && (
                      <p className="text-[10px] text-red-400">
                        Penalty: {subtask.penalty_coins} coins
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Attachments */}
            {attachments.length > 0 && (() => {
              const links = attachments.filter((a: any) => a.type === 'url');
              const files = attachments.filter((a: any) => a.type !== 'url');
              return (
                <div className="space-y-4">
                  {/* Links Section */}
                  {links.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2 flex items-center gap-1.5">
                        <Link2 className="h-3.5 w-3.5" />
                        Links ({links.length})
                      </h4>
                      <div className="space-y-2">
                        {links.map((link: any, i: number) => (
                          <a
                            key={`link-${i}`}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all group cursor-pointer"
                          >
                            <div className="p-2 bg-blue-500/15 rounded-lg shrink-0">
                              <img
                                src={link.favicon || getFaviconUrl(link.url)}
                                alt=""
                                className="h-5 w-5 rounded-sm"
                                onError={(e) => {
                                  const img = e.target as HTMLImageElement;
                                  img.style.display = 'none';
                                  img.parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-400"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
                                }}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate group-hover:text-blue-300 transition-colors">
                                {link.name || 'Link'}
                              </p>
                              <p className="text-xs text-white/40 truncate">
                                {link.domain || extractDomain(link.url)}
                              </p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-blue-400/50 group-hover:text-blue-300 shrink-0 transition-colors" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* File Attachments Section */}
                  {files.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-1.5">
                          <Paperclip className="h-3.5 w-3.5" />
                          Files ({files.length})
                        </h4>
                        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                          <Button 
                            size="sm" 
                            type="button"
                            variant="ghost" 
                            className={`h-7 w-7 p-0 ${attachmentViewMode === 'grid' ? 'bg-purple-500/20 text-purple-300' : 'text-white/30 hover:text-white'}`}
                            onClick={() => setAttachmentViewMode('grid')}
                          >
                            <LayoutGrid className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            type="button"
                            variant="ghost" 
                            className={`h-7 w-7 p-0 ${attachmentViewMode === 'list' ? 'bg-purple-500/20 text-purple-300' : 'text-white/30 hover:text-white'}`}
                            onClick={() => setAttachmentViewMode('list')}
                          >
                            <List className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2 mb-3">
                        <Button size="sm" variant="outline" className="h-7 text-[10px] border-white/10 hover:bg-white/10" 
                          onClick={() => {
                            onEdit?.(subtask);
                            onOpenChange(false);
                          }}>
                          <Plus className="h-3.5 w-3.5 mr-1" /> Add Attachment
                        </Button>
                      </div>
                      
                      <div className={attachmentViewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 gap-3" : "space-y-2"}>
                        {files.map((file: any, i: number) => {
                          const fileName = file.name || file.file_name || `File ${i + 1}`;
                          const isImg = isImage(fileName);
                          const url = getFileUrl(file.url || file.file_url);

                          if (attachmentViewMode === 'grid') {
                            return (
                              <div 
                                key={`file-grid-${i}`} 
                                className="group relative aspect-square bg-black/40 rounded-xl border border-white/5 overflow-hidden cursor-pointer hover:border-purple-500/50 transition-all shadow-lg"
                                onClick={() => isImg ? setPreviewAttachment({ name: fileName, url: file.url || file.file_url, publicUrl: url }) : handleDownloadAttachment(file)}
                              >
                                {isImg ? (
                                  <img src={url} alt={fileName} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                ) : (
                                  <div className="h-full w-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-purple-500/5 to-indigo-500/5">
                                    <FileText className="w-8 h-8 text-purple-400/40 mb-2" />
                                  </div>
                                )}
                                
                                {/* Always visible info bar */}
                                <div className="absolute bottom-0 inset-x-0 bg-black/70 backdrop-blur-md p-2 border-t border-white/5">
                                  <p className="text-[10px] text-white/90 font-medium truncate text-center">{fileName}</p>
                                </div>

                                {/* Quick Download Button (Always Visible) */}
                                <Button 
                                  size="icon" 
                                  variant="secondary" 
                                  className="absolute top-1.5 right-1.5 h-7 w-7 rounded-lg bg-black/40 hover:bg-purple-500 border border-white/10 text-white z-10 transition-colors backdrop-blur-sm" 
                                  onClick={(e) => { e.stopPropagation(); handleDownloadAttachment(file); }}
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            );
                          }

                          return (
                            <div key={`file-list-${i}`} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3 group">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                  {isImg ? (
                                    <img 
                                      src={url} 
                                      alt={fileName} 
                                      className="h-full w-full object-cover cursor-pointer hover:scale-110 transition-transform" 
                                      onClick={() => setPreviewAttachment({ name: fileName, url: file.url || file.file_url, publicUrl: url })} 
                                    />
                                  ) : (
                                    <FileText className="h-4 w-4 text-purple-400" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate">{fileName}</p>
                                  {file.size && <p className="text-xs text-white/40">{(file.size / 1024).toFixed(1)} KB</p>}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {isImg && (
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-purple-300 hover:bg-purple-500/20 h-8" 
                                    onClick={() => setPreviewAttachment({ name: fileName, url: file.url || file.file_url, publicUrl: url })}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-purple-300 hover:bg-purple-500/20 h-8"
                                  onClick={() => handleDownloadAttachment(file)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

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

            {/* Timestamps in a single row */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-purple-400" />
                Created: <span className="text-white/70">
                  {(() => { try { return format(new Date(subtask.created_at), "MMM dd, yyyy HH:mm"); } catch { return "—"; } })()}
                </span>
              </div>
              {subtask.updated_at && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-blue-400" />
                  Updated: <span className="text-white/70">
                    {(() => { try { return format(new Date(subtask.updated_at), "MMM dd, yyyy HH:mm"); } catch { return "—"; } })()}
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
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-white/50" onClick={() => { setShowRejectSection(false); setRejectFiles([]); }}>
                    Cancel
                  </Button>
                </div>
                <Textarea
                  placeholder="Explain what needs to be fixed..."
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  className="bg-black/30 border-red-500/30 text-white placeholder:text-white/30 min-h-[80px]"
                />
                {/* Attachment section */}
                <div className="space-y-2">
                  <input ref={rejectFileRef} type="file" multiple className="hidden" onChange={(e) => {
                    if (e.target.files) setRejectFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                  }} />
                  <Button variant="outline" size="sm" className="h-7 text-xs border-red-500/30 text-red-300 hover:bg-red-500/10"
                    onClick={() => rejectFileRef.current?.click()}>
                    <Upload className="h-3 w-3 mr-1.5" /> Attach Files
                  </Button>
                  {rejectFiles.length > 0 && (
                    <div className="space-y-1">
                      {rejectFiles.map((file, i) => (
                        <div key={i} className="flex items-center justify-between text-xs bg-black/20 rounded px-2 py-1 border border-white/5">
                          <div className="flex items-center gap-1.5 truncate">
                            <Paperclip className="h-3 w-3 shrink-0" />
                            <span className="truncate">{file.name}</span>
                            <span className="text-white/30 shrink-0">({(file.size / 1024).toFixed(0)}KB)</span>
                          </div>
                          <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-red-400"
                            onClick={() => setRejectFiles(prev => prev.filter((_, idx) => idx !== i))}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
        {!viewOnly && isReviewable && !showRejectSection && (
          <div className="px-6 py-4 border-t border-white/10 bg-black/30 space-y-3">
            {/* Approve attachment section */}
            {showApproveAttach && (
              <div className="space-y-2 animate-in fade-in duration-200">
                <input ref={approveFileRef} type="file" multiple className="hidden" onChange={(e) => {
                  if (e.target.files) setApproveFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                }} />
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-xs border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
                    onClick={() => approveFileRef.current?.click()}>
                    <Upload className="h-3 w-3 mr-1.5" /> Add Files
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-white/50"
                    onClick={() => { setShowApproveAttach(false); setApproveFiles([]); }}>
                    Cancel
                  </Button>
                </div>
                {approveFiles.length > 0 && (
                  <div className="space-y-1">
                    {approveFiles.map((file, i) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-black/20 rounded px-2 py-1 border border-white/5">
                        <div className="flex items-center gap-1.5 truncate">
                          <Paperclip className="h-3 w-3 shrink-0" />
                          <span className="truncate">{file.name}</span>
                          <span className="text-white/30 shrink-0">({(file.size / 1024).toFixed(0)}KB)</span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-red-400"
                          onClick={() => setApproveFiles(prev => prev.filter((_, idx) => idx !== i))}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowRejectSection(true)}
                variant="outline"
                className="flex-1 border-red-500/40 text-red-300 hover:bg-red-500/15 hover:text-red-200"
                disabled={isSubmitting}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reject & Rework
              </Button>
              {!showApproveAttach && (
                <Button variant="ghost" size="sm" className="h-9 px-2 text-white/40 hover:text-white/70"
                  onClick={() => setShowApproveAttach(true)}>
                  <Paperclip className="h-4 w-4" />
                </Button>
              )}
              <Button
                onClick={handleApprove}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Approve & Award {approveFiles.length > 0 ? `(${approveFiles.length} files)` : ''}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Attachment Preview Dialog */}
    <Dialog open={!!previewAttachment} onOpenChange={() => setPreviewAttachment(null)}>
      <DialogContent className="max-w-4xl bg-black/95 border-white/10 p-0 overflow-hidden shadow-2xl z-[70]">
        <DialogHeader className="hidden">
          <DialogTitle>{previewAttachment?.name || 'Image Preview'}</DialogTitle>
        </DialogHeader>
        <div className="relative w-full h-full flex flex-col">
          <div className="p-4 flex items-center justify-between bg-black/50 backdrop-blur-md border-b border-white/5 z-10">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <FileText className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="text-sm font-medium text-white truncate max-w-[200px] sm:max-w-md">
                {previewAttachment?.name}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="border-white/10 text-white hover:bg-white/10" onClick={() => handleDownloadAttachment(previewAttachment)}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button size="sm" variant="ghost" className="text-white/50 hover:text-white" onClick={() => setPreviewAttachment(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 min-h-[300px] max-h-[85vh] overflow-auto bg-black/40">
            {previewAttachment && (
              <img 
                src={previewAttachment.publicUrl} 
                alt={previewAttachment.name} 
                className="max-w-full max-h-full object-contain shadow-2xl rounded-sm animate-in zoom-in-95 duration-200" 
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </>
);
};
