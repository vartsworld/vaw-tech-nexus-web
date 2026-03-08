import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DragDropContext, Draggable } from "react-beautiful-dnd";
import StrictModeDroppable from "@/components/ui/StrictModeDroppable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, CheckCircle, Clock, Target, Flag, Eye, Edit, Trash2,
  Plus, Calendar, User, Layers, FileText, Download, MessageSquare,
  Loader2, Share2, LayoutTemplate, Minimize2, Maximize2, ChevronLeft, ChevronRight,
  AlertCircle
} from "lucide-react";
import { SubtaskReviewDialog } from "@/components/staff/SubtaskReviewDialog";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface TaskDetailPageProps {
  task: any;
  onBack: () => void;
  onStatusUpdate: (taskId: string, status: string) => void;
  onEdit: (task: any) => void;
  onDelete: (task: any) => void;
  userProfile: any;
  staff: any[];
  subtaskTemplates: any[];
  taskTemplates: any[];
}

const TaskDetailPage = ({
  task, onBack, onStatusUpdate, onEdit, onDelete, userProfile, staff, subtaskTemplates, taskTemplates
}: TaskDetailPageProps) => {
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);
  const [quickAddStage, setQuickAddStage] = useState<number | null>(null);
  const [bulkSubtasks, setBulkSubtasks] = useState<any[]>([]);
  const [selectedTaskTemplateId, setSelectedTaskTemplateId] = useState("none");
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [reviewDialogSubtask, setReviewDialogSubtask] = useState<any>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const stageScrollRef = useRef<HTMLDivElement>(null);
  const [newSubtask, setNewSubtask] = useState({
    title: "", description: "", assigned_to: "", priority: "medium" as string, points: 0, due_date: "", due_time: "", stage: 1
  });
  const [newStageName, setNewStageName] = useState("");
  const [editingStageNum, setEditingStageNum] = useState<number | null>(null);
  const [editingStageName, setEditingStageName] = useState("");
  const [customStageNames, setCustomStageNames] = useState<Record<number, string>>(
    (task?.stage_names && typeof task.stage_names === 'object') ? task.stage_names : {}
  );

  const checkScrollability = useCallback(() => {
    const el = stageScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  const scrollStages = (direction: 'left' | 'right') => {
    const el = stageScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === 'left' ? -260 : 260, behavior: 'smooth' });
    setTimeout(checkScrollability, 350);
  };

  useEffect(() => {
    checkScrollability();
    const el = stageScrollRef.current;
    if (el) el.addEventListener('scroll', checkScrollability);
    return () => { if (el) el.removeEventListener('scroll', checkScrollability); };
  }, [subtasks, checkScrollability]);
  const { toast } = useToast();

  useEffect(() => {
    if (task?.id) fetchSubtasks(task.id);
  }, [task?.id]);

  const fetchSubtasks = async (taskId: string) => {
    setLoadingSubtasks(true);
    try {
      const { data, error } = await supabase.from('staff_subtasks')
        .select('*, staff_profiles:assigned_to (full_name, username, avatar_url)')
        .eq('task_id', taskId).order('created_at', { ascending: false });
      if (error) throw error;
      setSubtasks(data || []);
    } catch (error) {
      console.error('Error fetching subtasks:', error);
    } finally {
      setLoadingSubtasks(false);
    }
  };

  const handleCreateSubtask = async () => {
    if (!newSubtask.title || !newSubtask.assigned_to) {
      toast({ title: "Error", description: "Title and assignee required.", variant: "destructive" });
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const insertData = {
        task_id: task.id, title: newSubtask.title, description: newSubtask.description,
        assigned_to: newSubtask.assigned_to, priority: newSubtask.priority, points: newSubtask.points || 0,
        due_date: newSubtask.due_date || null, due_time: newSubtask.due_time || null,
        created_by: user?.id, stage: newSubtask.stage || 1, status: 'pending'
      } as any;
      const { data, error } = await supabase.from('staff_subtasks').insert(insertData)
        .select('*, staff_profiles:assigned_to (full_name, username, avatar_url)').single();
      if (error) throw error;
      setSubtasks([data, ...subtasks]);
      setNewSubtask({ title: "", description: "", assigned_to: "", priority: "medium", points: 0, due_date: "", due_time: "", stage: newSubtask.stage });
      setQuickAddStage(null);
      toast({ title: "Subtask created!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSubtaskStatusUpdate = async (subtaskId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus, updated_at: new Date().toISOString() };
      if (newStatus === 'completed') updateData.completed_at = new Date().toISOString();

      const { data, error } = await supabase.from('staff_subtasks')
        .update(updateData)
        .eq('id', subtaskId)
        .select('*, staff_profiles:assigned_to (full_name, username, avatar_url)').single();
      if (error) throw error;

      const updatedSubtasks = subtasks.map(st => st.id === subtaskId ? data : st);
      setSubtasks(updatedSubtasks);

      // --- Sync: subtask in_progress → parent task in_progress → project in_progress ---
      if (newStatus === 'in_progress' && task.status === 'pending') {
        await supabase.from('staff_tasks')
          .update({ status: 'in_progress', updated_at: new Date().toISOString() } as any)
          .eq('id', task.id);
        onStatusUpdate(task.id, 'in_progress');

        // Also update linked client project to in_progress
        if (task.client_project_id) {
          await supabase.from('client_projects')
            .update({ status: 'in_progress', updated_at: new Date().toISOString() })
            .eq('id', task.client_project_id)
            .eq('status', 'pending');
        }
      }

      // --- Auto-advance current_stage when all subtasks in a stage are completed ---
      const subtaskStage = (data as any).stage || 1;
      const stageSubtasks = updatedSubtasks.filter((st: any) => (st.stage || 1) === subtaskStage);
      const allStageComplete = stageSubtasks.length > 0 && stageSubtasks.every((st: any) => st.status === 'completed');

      if (allStageComplete) {
        const allStages = [...new Set(updatedSubtasks.map((st: any) => (st.stage || 1) as number))].sort((a, b) => a - b);
        const nextIncompleteStage = allStages.find(s => {
          const subs = updatedSubtasks.filter((st: any) => (st.stage || 1) === s);
          return subs.some((st: any) => st.status !== 'completed');
        });
        const newCurrentStage = nextIncompleteStage ?? ((allStages[allStages.length - 1] || 1) + 1);

        await supabase.from('staff_tasks')
          .update({ current_stage: newCurrentStage, updated_at: new Date().toISOString() } as any)
          .eq('id', task.id);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update subtask.", variant: "destructive" });
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      await supabase.from('staff_subtasks').delete().eq('id', subtaskId);
      setSubtasks(subtasks.filter(st => st.id !== subtaskId));
    } catch {
      toast({ title: "Error", description: "Failed to delete subtask.", variant: "destructive" });
    }
  };

  const handleSubtaskStageUpdate = async (subtaskId: string, newStage: number) => {
    try {
      await supabase.from('staff_subtasks').update({ stage: newStage }).eq('id', subtaskId);
      setSubtasks(prev => prev.map(st => st.id === subtaskId ? { ...st, stage: newStage } : st));
    } catch (error) {
      console.error('Error updating subtask stage:', error);
    }
  };

  const onSubtaskDragEnd = (result: any) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    if (destination.droppableId.startsWith('stage-')) {
      const newStage = parseInt(destination.droppableId.replace('stage-', ''));
      const subtask = subtasks.find(st => st.id === draggableId);
      if (subtask && subtask.stage !== newStage) handleSubtaskStageUpdate(draggableId, newStage);
    }
  };

  const handleBulkAddSubtasks = async () => {
    if (bulkSubtasks.length === 0) return;
    const unassigned = bulkSubtasks.some(st => !st.assigned_to);
    if (unassigned) {
      toast({ title: "Error", description: "Assign all subtasks first.", variant: "destructive" });
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const toInsert = bulkSubtasks.map(st => ({
        task_id: task.id, title: st.title, description: st.description, assigned_to: st.assigned_to,
        priority: st.priority || 'medium', points: st.points || 0, stage: st.stage ?? 1, created_by: user.id, status: 'pending'
      }));
      const { data, error } = await supabase.from('staff_subtasks').insert(toInsert as any)
        .select('*, staff_profiles:assigned_to (full_name, username, avatar_url)');
      if (error) throw error;
      setSubtasks([...(data || []), ...subtasks]);
      setBulkSubtasks([]);
      setSelectedTaskTemplateId("none");
      toast({ title: "Success", description: `${data?.length} subtasks added.` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDownloadAttachment = async (attachment: any) => {
    try {
      const { data, error } = await supabase.storage.from('task-attachments').download(attachment.url);
      if (error) throw error;
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url; a.download = attachment.name || 'attachment';
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch {
      toast({ title: "Error", description: "Failed to download.", variant: "destructive" });
    }
  };

  if (!task) return null;

  const statusConfig: Record<string, { color: string; label: string }> = {
    pending: { color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', label: 'PENDING' },
    in_progress: { color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', label: 'IN PROGRESS' },
    completed: { color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', label: 'COMPLETED' },
    review_pending: { color: 'bg-orange-500/15 text-orange-400 border-orange-500/30', label: 'IN REVIEW' },
    pending_approval: { color: 'bg-orange-500/15 text-orange-400 border-orange-500/30', label: 'PENDING APPROVAL' },
    handover: { color: 'bg-purple-500/15 text-purple-400 border-purple-500/30', label: 'HANDOVER' },
    cancelled: { color: 'bg-red-500/15 text-red-400 border-red-500/30', label: 'CANCELLED' },
  };

  const priorityConfig: Record<string, string> = {
    low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    medium: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    urgent: 'bg-red-500/15 text-red-400 border-red-500/30',
  };

  const stageColors = [
    { border: 'border-indigo-500/40', bg: 'bg-indigo-500/5', badge: 'bg-indigo-500/20 text-indigo-300', text: 'text-indigo-400' },
    { border: 'border-emerald-500/40', bg: 'bg-emerald-500/5', badge: 'bg-emerald-500/20 text-emerald-300', text: 'text-emerald-400' },
    { border: 'border-orange-500/40', bg: 'bg-orange-500/5', badge: 'bg-orange-500/20 text-orange-300', text: 'text-orange-400' },
    { border: 'border-cyan-500/40', bg: 'bg-cyan-500/5', badge: 'bg-cyan-500/20 text-cyan-300', text: 'text-cyan-400' },
    { border: 'border-pink-500/40', bg: 'bg-pink-500/5', badge: 'bg-pink-500/20 text-pink-300', text: 'text-pink-400' },
  ];

  // Stage map
  const stageMap: Record<number, any[]> = {};
  subtasks.forEach(st => { const s = st.stage || 1; if (!stageMap[s]) stageMap[s] = []; stageMap[s].push(st); });
  const stageNums = Object.keys(stageMap).map(Number).sort((a, b) => a - b);
  if (stageNums.length === 0) stageNums.push(1);
  // Include the newly added stage so its column renders immediately
  if (quickAddStage !== null && !stageNums.includes(quickAddStage)) {
    stageNums.push(quickAddStage);
    stageNums.sort((a, b) => a - b);
  }

  const reviewPendingSubtasks = subtasks.filter(s => s.status === 'review_pending' || s.status === 'pending_approval');

  const uploadReviewAttachments = async (subtaskId: string, files: File[], actionType: string) => {
    const uploaded: any[] = [];
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const filePath = `subtasks/${subtaskId}/review-${actionType}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('task-attachments').upload(filePath, file);
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('task-attachments').getPublicUrl(filePath);
        uploaded.push({ name: file.name, url: filePath, publicUrl, size: file.size, type: file.type });
      }
    }
    return uploaded;
  };

  const handleSubtaskApprove = async (subtaskId: string, attachmentFiles?: File[]) => {
    try {
      const subtaskToApprove = subtasks.find(s => s.id === subtaskId);

      let reviewAttachments: any[] = [];
      if (attachmentFiles && attachmentFiles.length > 0) {
        reviewAttachments = await uploadReviewAttachments(subtaskId, attachmentFiles, 'approve');
      }

      const updateData: any = { status: 'completed' as any, updated_at: new Date().toISOString() };

      if (reviewAttachments.length > 0) {
        const existingComments = Array.isArray(subtaskToApprove?.comments) ? subtaskToApprove.comments : [];
        const approveComment = {
          type: 'approval',
          message: '✅ Approved with attachments',
          user_name: userProfile?.full_name || 'Team Head',
          timestamp: new Date().toISOString(),
          attachments: reviewAttachments
        };
        updateData.comments = [...existingComments, approveComment];
      }

      const { error } = await supabase.from('staff_subtasks')
        .update(updateData)
        .eq('id', subtaskId);
      if (error) throw error;
      setSubtasks(prev => prev.map(s => s.id === subtaskId ? { ...s, status: 'completed', ...(updateData.comments ? { comments: updateData.comments } : {}) } : s));

      // Award points if applicable
      if (subtaskToApprove?.points > 0 && subtaskToApprove?.assigned_to) {
        await supabase.rpc('increment_points' as any, {
          user_id_param: subtaskToApprove.assigned_to,
          points_param: subtaskToApprove.points
        });
      }

      toast({ title: "Subtask Approved! ✅", description: `Points awarded: ${subtaskToApprove?.points || 0}` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to approve subtask.", variant: "destructive" });
    }
  };

  const handleSubtaskReject = async (subtaskId: string, note: string, attachmentFiles?: File[]) => {
    try {
      const subtaskToReject = subtasks.find(s => s.id === subtaskId);
      const existingComments = Array.isArray(subtaskToReject?.comments) ? subtaskToReject.comments : [];

      let reviewAttachments: any[] = [];
      if (attachmentFiles && attachmentFiles.length > 0) {
        reviewAttachments = await uploadReviewAttachments(subtaskId, attachmentFiles, 'reject');
      }

      const newComment: any = {
        type: 'rejection',
        message: note,
        user_name: userProfile?.full_name || 'Team Head',
        timestamp: new Date().toISOString()
      };
      if (reviewAttachments.length > 0) {
        newComment.attachments = reviewAttachments;
      }

      const { error } = await supabase.from('staff_subtasks')
        .update({
          status: 'in_progress' as any,
          comments: [...existingComments, newComment] as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', subtaskId);
      if (error) throw error;
      setSubtasks(prev => prev.map(s => s.id === subtaskId
        ? { ...s, status: 'in_progress', comments: [...existingComments, newComment] }
        : s
      ));
      toast({ title: "Subtask Returned", description: "Sent back for rework with feedback." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to reject subtask.", variant: "destructive" });
    }
  };

  const completedSubtasks = subtasks.filter(s => s.status === 'completed').length;

  const defaultStageLabels: Record<number, string> = { 1: 'DISCOVERY', 2: 'DESIGN', 3: 'DEVELOPMENT', 4: 'TESTING', 5: 'REVIEW' };
  const stageLabels: Record<number, string> = {};
  // Merge: custom names override defaults
  for (const num of [...Object.keys(defaultStageLabels).map(Number), ...Object.keys(customStageNames).map(Number)]) {
    stageLabels[num] = customStageNames[num] || defaultStageLabels[num] || `STAGE ${num}`;
  }

  const saveStageNames = async (updated: Record<number, string>) => {
    setCustomStageNames(updated);
    try {
      await supabase.from('staff_tasks').update({ stage_names: updated as any, updated_at: new Date().toISOString() } as any).eq('id', task.id);
    } catch (e) {
      console.error('Error saving stage names:', e);
    }
  };

  const profiles = task.assigned_to_profiles?.length > 0
    ? task.assigned_to_profiles
    : task.assigned_to_profile ? [task.assigned_to_profile] : [];

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <button onClick={onBack} className="hover:text-foreground transition-colors">Tasks</button>
        <span>›</span>
        {task.staff_projects?.title && (
          <>
            <span className="text-muted-foreground/60">{task.staff_projects.title}</span>
            <span>›</span>
          </>
        )}
        <span className="text-primary font-medium">Task Details</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Main Content */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {/* Title & Status */}
          <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-lg p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold tracking-tight leading-tight break-words min-w-0">{task.title}</h1>
              <Badge variant="outline" className={`${statusConfig[task.status]?.color || ''} text-[10px] font-bold tracking-wider px-3 py-1.5 shrink-0`}>
                {statusConfig[task.status]?.label || task.status?.toUpperCase()}
              </Badge>
            </div>

            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap break-words">
              {task.description || 'No description provided.'}
            </p>
          </div>

          {/* Subtasks Stage Board */}
          <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-lg p-4 sm:p-6 space-y-4 min-w-0">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Project Stages & Subtasks
              </h3>
              <div className="flex items-center gap-3">
                {reviewPendingSubtasks.length > 0 && (
                  <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/40 text-[10px] font-bold animate-pulse cursor-default">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {reviewPendingSubtasks.length} Review Request{reviewPendingSubtasks.length > 1 ? 's' : ''}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground shrink-0">
                  {completedSubtasks}/{subtasks.length} completed
                </span>
              </div>
            </div>

            {/* Stage Tabs - Scrollable */}
            <ScrollArea className="w-full" type="scroll">
              <div className="flex gap-0 border-b border-white/10 w-max min-w-full">
                {stageNums.map((stageNum) => {
                  const color = stageColors[(stageNum - 1) % stageColors.length];
                  const count = (stageMap[stageNum] || []).length;
                  return (
                    <div key={stageNum} className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 shrink-0 ${color.border}`}>
                      {editingStageNum === stageNum ? (
                        <Input
                          autoFocus
                          value={editingStageName}
                          onChange={e => setEditingStageName(e.target.value)}
                          onBlur={() => {
                            if (editingStageName.trim()) {
                              const updated = { ...customStageNames, [stageNum]: editingStageName.trim().toUpperCase() };
                              saveStageNames(updated);
                            }
                            setEditingStageNum(null);
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              if (editingStageName.trim()) {
                                const updated = { ...customStageNames, [stageNum]: editingStageName.trim().toUpperCase() };
                                saveStageNames(updated);
                              }
                              setEditingStageNum(null);
                            } else if (e.key === 'Escape') {
                              setEditingStageNum(null);
                            }
                          }}
                          className="h-6 w-24 text-[10px] sm:text-xs font-bold uppercase bg-transparent border-white/20 px-1 py-0"
                        />
                      ) : (
                        <span
                          className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer hover:underline ${color.text}`}
                          onDoubleClick={() => {
                            setEditingStageNum(stageNum);
                            setEditingStageName(stageLabels[stageNum] || `STAGE ${stageNum}`);
                          }}
                          title="Double-click to rename"
                        >
                          {stageLabels[stageNum] || `STAGE ${stageNum}`}
                        </span>
                      )}
                      <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full ${color.badge}`}>{count}</span>
                    </div>
                  );
                })}
                {/* Add Stage with name input */}
                {newStageName !== null && quickAddStage === null ? (
                  <div className="flex items-center gap-1 px-2 py-1.5 shrink-0">
                    <button
                      onClick={() => {
                        const nextStage = stageNums.length > 0 ? Math.max(...stageNums) + 1 : 1;
                        setNewStageName("");
                        setQuickAddStage(nextStage);
                        setNewSubtask(prev => ({ ...prev, stage: nextStage }));
                      }}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 whitespace-nowrap"
                    >
                      <Plus className="h-3 w-3" /> Add Stage
                    </button>
                  </div>
                ) : null}
                {quickAddStage !== null && (
                  <div className="flex items-center gap-1 px-2 py-1.5 shrink-0">
                    <Input
                      autoFocus
                      placeholder="Stage name..."
                      value={newStageName}
                      onChange={e => setNewStageName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newStageName.trim()) {
                          const updated = { ...customStageNames, [quickAddStage!]: newStageName.trim().toUpperCase() };
                          saveStageNames(updated);
                        }
                      }}
                      className="h-6 w-24 text-[10px] font-bold uppercase bg-transparent border-white/20 px-1 py-0"
                    />
                    <button
                      onClick={() => {
                        if (newStageName.trim()) {
                          const updated = { ...customStageNames, [quickAddStage!]: newStageName.trim().toUpperCase() };
                          saveStageNames(updated);
                        }
                      }}
                      className="text-[10px] text-primary hover:underline whitespace-nowrap"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Template Loader */}
            {taskTemplates && taskTemplates.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <LayoutTemplate className="h-4 w-4 text-muted-foreground shrink-0" />
                <Select value={selectedTaskTemplateId} onValueChange={(v) => {
                  setSelectedTaskTemplateId(v);
                  if (v !== 'none') {
                    const tpl = taskTemplates.find((t: any) => t.id === v);
                    if (tpl?.subtask_templates) {
                      setBulkSubtasks(tpl.subtask_templates.map((st: any) => ({
                        title: st.title, description: st.description || '', assigned_to: '',
                        priority: st.priority || 'medium', points: st.points || 0, stage: st.stage ?? 1
                      })));
                    }
                  } else {
                    setBulkSubtasks([]);
                  }
                }}>
                  <SelectTrigger className="h-8 text-xs bg-transparent border-white/10 w-[200px]">
                    <SelectValue placeholder="Load from template..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">No template</SelectItem>
                    {taskTemplates.map((t: any) => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">{t.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {bulkSubtasks.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">{bulkSubtasks.length} subtasks ready</span>
                )}
              </div>
            )}

            {/* Bulk Subtask Preview & Assignment */}
            {bulkSubtasks.length > 0 && (
              <div className="space-y-2 p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Template Subtasks</span>
                  <Button size="sm" className="h-7 text-[10px] bg-primary/80 hover:bg-primary" onClick={handleBulkAddSubtasks}>
                    <Plus className="h-3 w-3 mr-1" /> Add All ({bulkSubtasks.length})
                  </Button>
                </div>
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                  {bulkSubtasks.map((bs, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-black/20 border border-white/5">
                      <span className="text-xs flex-1 truncate">{bs.title}</span>
                      <Select value={bs.assigned_to || ''} onValueChange={v => {
                        const updated = [...bulkSubtasks];
                        updated[i] = { ...updated[i], assigned_to: v };
                        setBulkSubtasks(updated);
                      }}>
                        <SelectTrigger className="h-7 text-[10px] bg-transparent border-white/10 w-[120px]">
                          <SelectValue placeholder="Assign..." />
                        </SelectTrigger>
                        <SelectContent>
                          {staff.map(m => <SelectItem key={m.id} value={m.user_id} className="text-xs">{m.full_name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-400" onClick={() => {
                        setBulkSubtasks(bulkSubtasks.filter((_, j) => j !== i));
                      }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stage Columns with Arrow Navigation */}
            {loadingSubtasks ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="relative">
                {/* Left Arrow */}
                {canScrollLeft && (
                  <button
                    onClick={() => scrollStages('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/90 border border-white/15 shadow-lg backdrop-blur-sm flex items-center justify-center hover:bg-primary/20 hover:border-primary/40 transition-all -ml-4"
                  >
                    <ChevronLeft className="h-5 w-5 text-foreground" />
                  </button>
                )}

                {/* Right Arrow */}
                {canScrollRight && (
                  <button
                    onClick={() => scrollStages('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/90 border border-white/15 shadow-lg backdrop-blur-sm flex items-center justify-center hover:bg-primary/20 hover:border-primary/40 transition-all -mr-4"
                  >
                    <ChevronRight className="h-5 w-5 text-foreground" />
                  </button>
                )}

                <DragDropContext onDragEnd={onSubtaskDragEnd}>
                  <div
                    ref={stageScrollRef}
                    className="flex gap-3 pb-2 overflow-x-auto"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {stageNums.map((stageNum) => {
                      const color = stageColors[(stageNum - 1) % stageColors.length];
                      const stageSubtasks = stageMap[stageNum] || [];
                      const isQuickAddOpen = quickAddStage === stageNum;

                      return (
                        <StrictModeDroppable key={stageNum} droppableId={`stage-${stageNum}`}>
                          {(provided, snapshot) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className={cn(
                                "w-[240px] shrink-0 rounded-xl border p-3 transition-colors flex flex-col",
                                color.border, color.bg,
                                snapshot.isDraggingOver && "bg-white/5 shadow-inner"
                              )}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${color.text}`}>
                                  {stageLabels[stageNum] || `Stage ${stageNum}`}
                                </span>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                                  onClick={() => {
                                    setQuickAddStage(isQuickAddOpen ? null : stageNum);
                                    setNewSubtask(prev => ({ ...prev, stage: stageNum, title: '', assigned_to: '' }));
                                  }}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </Button>
                              </div>

                              {/* Quick Add */}
                              {isQuickAddOpen && (
                                <div className="space-y-2 p-2.5 bg-black/30 rounded-lg border border-white/10 animate-in fade-in duration-200 mb-2">
                                  <Input autoFocus placeholder="Subtask title *" value={newSubtask.title}
                                    onChange={e => setNewSubtask({ ...newSubtask, title: e.target.value })}
                                    className="h-8 text-xs bg-transparent border-white/10" />
                                  <Textarea placeholder="Description (optional)" value={newSubtask.description}
                                    onChange={e => setNewSubtask({ ...newSubtask, description: e.target.value })}
                                    className="text-xs bg-transparent border-white/10 min-h-[50px] resize-none" />
                                  <Select value={newSubtask.assigned_to} onValueChange={v => setNewSubtask({ ...newSubtask, assigned_to: v })}>
                                    <SelectTrigger className="h-8 text-xs bg-transparent border-white/10"><SelectValue placeholder="Assign to..." /></SelectTrigger>
                                    <SelectContent>
                                      {staff.map(m => <SelectItem key={m.id} value={m.user_id} className="text-xs">{m.full_name}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                  <div className="grid grid-cols-2 gap-1">
                                    <Select value={newSubtask.priority} onValueChange={v => setNewSubtask({ ...newSubtask, priority: v })}>
                                      <SelectTrigger className="h-7 text-[10px] bg-transparent border-white/10"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="low" className="text-xs">Low</SelectItem>
                                        <SelectItem value="medium" className="text-xs">Medium</SelectItem>
                                        <SelectItem value="high" className="text-xs">High</SelectItem>
                                        <SelectItem value="urgent" className="text-xs">Urgent</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Input type="number" placeholder="Points" value={newSubtask.points || ''}
                                      onChange={e => setNewSubtask({ ...newSubtask, points: parseInt(e.target.value) || 0 })}
                                      className="h-7 text-[10px] bg-transparent border-white/10" />
                                  </div>
                                  <div className="flex gap-1">
                                    <Button size="sm" className="flex-1 h-7 text-[10px] bg-primary/80 hover:bg-primary" onClick={handleCreateSubtask}>
                                      <Plus className="h-3 w-3 mr-1" /> Add
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => setQuickAddStage(null)}>Cancel</Button>
                                  </div>
                                </div>
                              )}

                              {/* Scrollable subtask list */}
                              <div className="flex-1 overflow-y-auto max-h-[400px] space-y-2 pr-0.5" style={{ scrollbarWidth: 'thin' }}>
                                {stageSubtasks.map((st, index) => (
                                  <Draggable key={st.id} draggableId={st.id} index={index}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={cn(
                                          "rounded-lg border bg-black/30 p-3 space-y-2 transition-all hover:border-white/20 group cursor-pointer",
                                          (st.status === 'review_pending' || st.status === 'pending_approval')
                                            ? "border-orange-500/40 ring-1 ring-orange-500/20"
                                            : "border-white/10",
                                          snapshot.isDragging && "rotate-2 scale-105 shadow-2xl"
                                        )}
                                        onClick={() => {
                                          setReviewDialogSubtask(st);
                                          setReviewDialogOpen(true);
                                        }}
                                      >
                                        {/* Review Request Banner */}
                                        {(st.status === 'review_pending' || st.status === 'pending_approval') && (
                                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-orange-500/15 border border-orange-500/30 -mt-1 mb-1">
                                            <AlertCircle className="h-3 w-3 text-orange-400 animate-pulse" />
                                            <span className="text-[9px] font-bold text-orange-300 uppercase tracking-wider">Review Requested</span>
                                          </div>
                                        )}

                                        <div className="flex items-start justify-between gap-2">
                                          <span className="text-xs font-medium leading-tight break-words min-w-0">{st.title}</span>
                                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-400"
                                              onClick={(e) => { e.stopPropagation(); handleDeleteSubtask(st.id); }}>
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>

                                        {st.description && (
                                          <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2 break-words">{st.description}</p>
                                        )}

                                        {st.points > 0 && (
                                          <div className="flex items-center gap-1">
                                            <Target className="h-3 w-3 text-primary" />
                                            <span className="text-[9px] text-primary font-semibold">{st.points} pts</span>
                                          </div>
                                        )}

                                        <div className="flex items-center justify-between gap-1">
                                          {st.staff_profiles && (
                                            <div className="flex items-center gap-1.5 min-w-0">
                                              <Avatar className="h-5 w-5 border border-white/10 shrink-0">
                                                <AvatarImage src={st.staff_profiles.avatar_url} />
                                                <AvatarFallback className="text-[8px]">
                                                  {st.staff_profiles.full_name?.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                              </Avatar>
                                              <span className="text-[10px] text-muted-foreground truncate">{st.staff_profiles.full_name}</span>
                                            </div>
                                          )}
                                          <Badge variant="outline" className={`text-[8px] h-4 px-1.5 shrink-0 ${
                                            st.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                            : (st.status === 'review_pending' || st.status === 'pending_approval') ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                                            : st.status === 'in_progress' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                                              : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                            }`}>
                                            {st.status === 'completed' ? 'DONE' : (st.status === 'review_pending' || st.status === 'pending_approval') ? 'IN REVIEW' : st.status === 'in_progress' ? 'ACTIVE' : 'PENDING'}
                                          </Badge>
                                        </div>

                                        {/* Status toggle */}
                                        <div onClick={(e) => e.stopPropagation()}>
                                          <Select value={st.status} onValueChange={(v) => handleSubtaskStatusUpdate(st.id, v)}>
                                            <SelectTrigger className="h-6 text-[9px] bg-transparent border-white/5">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                                              <SelectItem value="in_progress" className="text-xs">In Progress</SelectItem>
                                              <SelectItem value="review_pending" className="text-xs">Review Pending</SelectItem>
                                              <SelectItem value="pending_approval" className="text-xs">Pending Approval</SelectItem>
                                              <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}

                                {stageSubtasks.length === 0 && !isQuickAddOpen && (
                                  <div className="py-6 text-center text-[10px] text-muted-foreground/50 border border-dashed border-white/10 rounded-lg">
                                    No tasks yet
                                  </div>
                                )}
                                {provided.placeholder}
                              </div>
                            </div>
                          )}
                        </StrictModeDroppable>
                      );
                    })}
                  </div>
                </DragDropContext>

                {/* Creative Stage Progress Bar */}
                <div className="flex items-center gap-3 mt-3 px-1">
                  <button
                    onClick={() => scrollStages('left')}
                    disabled={!canScrollLeft}
                    className={cn(
                      "h-8 w-8 rounded-lg border flex items-center justify-center transition-all shrink-0",
                      canScrollLeft
                        ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
                        : "border-white/5 bg-white/[0.02] text-muted-foreground/30 cursor-not-allowed"
                    )}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="flex-1 flex items-center gap-1">
                    {stageNums.map((stageNum, i) => {
                      const color = stageColors[(stageNum - 1) % stageColors.length];
                      const stageSubtasks = stageMap[stageNum] || [];
                      const completedInStage = stageSubtasks.filter(s => s.status === 'completed').length;
                      const progress = stageSubtasks.length > 0 ? (completedInStage / stageSubtasks.length) * 100 : 0;
                      return (
                        <div key={stageNum} className="flex-1 flex flex-col items-center gap-1">
                          <div className={`w-full h-1.5 rounded-full bg-white/5 overflow-hidden`}>
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : progress > 0 ? 'bg-primary' : 'bg-transparent'
                                }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className={`text-[8px] font-bold uppercase tracking-wider ${color.text}`}>
                            {stageLabels[stageNum]?.substring(0, 3) || stageNum}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => scrollStages('right')}
                    disabled={!canScrollRight}
                    className={cn(
                      "h-8 w-8 rounded-lg border flex items-center justify-center transition-all shrink-0",
                      canScrollRight
                        ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
                        : "border-white/5 bg-white/[0.02] text-muted-foreground/30 cursor-not-allowed"
                    )}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Handover History */}
          {task.comments && Array.isArray(task.comments) && task.comments.filter((c: any) => c.type === 'handover').length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-lg p-6 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Handover History</h3>
              {task.comments.filter((c: any) => c.type === 'handover').map((h: any, i: number) => (
                <div key={i} className="bg-blue-500/5 border border-blue-500/20 p-3 rounded-xl text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs">{h.user_name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {(() => { try { return format(new Date(h.timestamp), 'MMM dd, yyyy HH:mm'); } catch { return ''; } })()}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">{h.from_department}</Badge>
                    <span className="mx-1">→</span>
                    <Badge variant="outline" className="text-[10px]">{h.to_department}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-lg p-5 space-y-5 lg:sticky lg:top-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Task Details</h3>

            {/* Assigned To */}
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Assigned To</Label>
              <div className="flex flex-wrap gap-2">
                {profiles.map((p: any, i: number) => (
                  <TooltipProvider key={i}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar className="h-9 w-9 border-2 border-white/10 hover:scale-110 transition-transform cursor-pointer">
                          <AvatarImage src={p.avatar_url} />
                          <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                            {p.full_name?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent><p className="text-xs font-semibold">{p.full_name}</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
                {profiles.length === 0 && (
                  <span className="text-xs text-muted-foreground">No assignees</span>
                )}
              </div>
            </div>

            {/* Priority & Points */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Priority</Label>
                <Badge variant="outline" className={`${priorityConfig[task.priority] || ''} text-[10px] font-bold uppercase w-full justify-center py-1.5`}>
                  <Flag className="h-3 w-3 mr-1" />
                  {task.priority}
                </Badge>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Points</Label>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] font-bold w-full justify-center py-1.5">
                  <Target className="h-3 w-3 mr-1" />
                  {task.points}
                </Badge>
              </div>
            </div>

            {/* Stage */}
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Stage</Label>
              <div className="text-sm font-semibold">
                {stageLabels[task.current_stage] || `Stage ${task.current_stage || 1}`}
              </div>
            </div>

            {/* Client */}
            {task.clients && (
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Client</Label>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {task.clients.company_name?.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{task.clients.company_name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{task.clients.contact_person}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Project */}
            {task.staff_projects && (
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Project</Label>
                <div className="flex items-center gap-2 text-sm min-w-0">
                  <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                  <span className="font-medium truncate">{task.staff_projects.title}</span>
                </div>
              </div>
            )}

            {/* Timeline - Countdown Clock */}
            {(() => {
              const now = new Date();
              const dueDate = task.due_date ? new Date(task.due_date + (task.due_time ? `T${task.due_time}` : 'T23:59:59')) : null;
              const createdDate = new Date(task.created_at);
              const totalMs = dueDate ? dueDate.getTime() - createdDate.getTime() : 0;
              const remainingMs = dueDate ? dueDate.getTime() - now.getTime() : 0;
              const progress = totalMs > 0 ? Math.max(0, Math.min(1, 1 - remainingMs / totalMs)) : 0;
              const isPast = remainingMs <= 0;

              // Color based on urgency
              let color = 'emerald'; // > 7 days
              let glowColor = '142 71% 45%';
              if (isPast) { color = 'red'; glowColor = '0 84% 60%'; }
              else if (remainingMs < 24 * 60 * 60 * 1000) { color = 'red'; glowColor = '0 84% 60%'; }
              else if (remainingMs < 3 * 24 * 60 * 60 * 1000) { color = 'orange'; glowColor = '25 95% 53%'; }
              else if (remainingMs < 7 * 24 * 60 * 60 * 1000) { color = 'amber'; glowColor = '38 92% 50%'; }

              // Time remaining text
              let timeText = 'No deadline';
              if (dueDate) {
                if (isPast) {
                  const overMs = Math.abs(remainingMs);
                  const overDays = Math.floor(overMs / (24*60*60*1000));
                  const overHrs = Math.floor((overMs % (24*60*60*1000)) / (60*60*1000));
                  timeText = `Overdue by ${overDays}d ${overHrs}h`;
                } else {
                  const days = Math.floor(remainingMs / (24*60*60*1000));
                  const hrs = Math.floor((remainingMs % (24*60*60*1000)) / (60*60*1000));
                  const mins = Math.floor((remainingMs % (60*60*1000)) / (60*1000));
                  timeText = days > 0 ? `${days}d ${hrs}h remaining` : hrs > 0 ? `${hrs}h ${mins}m remaining` : `${mins}m remaining`;
                }
              }

              // SVG clock arc
              const radius = 54;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference * (1 - progress);
              const handAngle = progress * 360;

              const colorMap: Record<string, { ring: string; text: string; bg: string; hand: string }> = {
                emerald: { ring: 'stroke-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-500/10', hand: 'stroke-emerald-300' },
                amber: { ring: 'stroke-amber-400', text: 'text-amber-400', bg: 'bg-amber-500/10', hand: 'stroke-amber-300' },
                orange: { ring: 'stroke-orange-400', text: 'text-orange-400', bg: 'bg-orange-500/10', hand: 'stroke-orange-300' },
                red: { ring: 'stroke-red-400', text: 'text-red-400', bg: 'bg-red-500/10', hand: 'stroke-red-300' },
              };
              const c = colorMap[color];

              return (
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Timeline</Label>
                  <div className={`rounded-2xl border border-white/10 ${c.bg} backdrop-blur-xl p-4 flex flex-col items-center gap-3`}>
                    {/* Clock SVG */}
                    <div className="relative w-[140px] h-[140px]">
                      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                        {/* Background track */}
                        <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" className="text-white/5" strokeWidth="5" />
                        {/* Tick marks */}
                        {Array.from({ length: 12 }).map((_, i) => {
                          const a = (i / 12) * 2 * Math.PI;
                          const r1 = 48, r2 = 52;
                          return (
                            <line key={i}
                              x1={60 + r1 * Math.cos(a)} y1={60 + r1 * Math.sin(a)}
                              x2={60 + r2 * Math.cos(a)} y2={60 + r2 * Math.sin(a)}
                              stroke="currentColor" className="text-white/15" strokeWidth="1"
                            />
                          );
                        })}
                        {/* Progress arc with pulse animation */}
                        <circle cx="60" cy="60" r={radius} fill="none"
                          className={`${c.ring} animate-pulse-ring`}
                          strokeWidth="5" strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 8px hsl(${glowColor} / 0.7))` }}
                        />
                        {/* Additional glow ring */}
                        <circle cx="60" cy="60" r={radius} fill="none"
                          className={`${c.ring}`}
                          strokeWidth="2" strokeLinecap="round" opacity="0.3"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 12px hsl(${glowColor} / 0.5))` }}
                        />
                        {/* Clock hand with rotation */}
                        {dueDate && (
                          <g style={{ transform: `rotate(${handAngle}deg)`, transformOrigin: '60px 60px', transition: 'all 1s ease' }}>
                            <line x1="60" y1="60" x2="60" y2="25"
                              className={c.hand} strokeWidth="3" strokeLinecap="round"
                              style={{ filter: `drop-shadow(0 0 4px hsl(${glowColor} / 0.6))` }}
                            />
                          </g>
                        )}
                        {/* Center dot with glow */}
                        <circle cx="60" cy="60" r="3.5" className={`fill-current ${c.text}`} 
                          style={{ filter: `drop-shadow(0 0 6px hsl(${glowColor} / 0.8))` }}
                        />
                      </svg>
                      {/* Center text */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
                        <span className={`text-lg font-bold tabular-nums ${c.text}`}>
                          {dueDate ? (isPast ? '0' : Math.max(0, Math.floor(remainingMs / (24*60*60*1000))).toString()) : '—'}
                        </span>
                        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
                          {dueDate ? (isPast ? 'overdue' : 'days left') : 'no date'}
                        </span>
                      </div>
                    </div>

                    {/* Time remaining label */}
                    <span className={`text-xs font-semibold ${c.text} ${isPast ? 'animate-pulse' : ''}`}>
                      {timeText}
                    </span>

                    {/* Due date & created */}
                    <div className="w-full space-y-1 text-[11px] text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Due</span>
                        <span className="font-medium text-foreground/80">
                          {task.due_date ? (() => { try { return format(new Date(task.due_date), 'MMM dd, yyyy'); } catch { return 'Invalid'; } })() : 'Not set'}
                        </span>
                      </div>
                      {task.due_time && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> Time</span>
                          <span className="font-medium text-foreground/80">{task.due_time}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> Created</span>
                        <span className="font-medium text-foreground/80">
                          {(() => { try { return format(new Date(task.created_at), 'MMM dd, yyyy'); } catch { return ''; } })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Attachments */}
            {task.attachments && Array.isArray(task.attachments) && task.attachments.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Attachments</Label>
                  <span className="text-[10px] text-primary cursor-pointer hover:underline">View all</span>
                </div>
                <div className="space-y-1.5">
                  {task.attachments.slice(0, 3).map((att: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => handleDownloadAttachment(att)}>
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-xs truncate">{att.name || `Attachment ${i + 1}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="space-y-2 pt-4 border-t border-white/10">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Quick Actions</h3>

              {task.status === 'review_pending' && (userProfile?.role === 'hr' || userProfile?.role === 'admin') && (
                <Button className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm"
                  onClick={() => onStatusUpdate(task.id, 'completed')}>
                  <CheckCircle className="h-4 w-4 mr-2" /> Mark as Complete
                </Button>
              )}

              <Button variant="outline" className="w-full h-10 rounded-xl border-white/10 hover:bg-white/5 text-sm"
                onClick={() => onEdit(task)}>
                <Edit className="h-4 w-4 mr-2" /> Edit Task
              </Button>

              <Button variant="ghost" className="w-full h-10 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 text-sm"
                onClick={() => onDelete(task)}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete Task
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Subtask Review Dialog */}
      <SubtaskReviewDialog
        subtask={reviewDialogSubtask}
        parentTask={task}
        open={reviewDialogOpen}
        onOpenChange={(open) => {
          setReviewDialogOpen(open);
          if (!open) setReviewDialogSubtask(null);
        }}
        onApprove={handleSubtaskApprove}
        onReject={handleSubtaskReject}
        viewOnly={reviewDialogSubtask?.status !== 'review_pending' && reviewDialogSubtask?.status !== 'pending_approval'}
      />
    </div>
  );
};

export default TaskDetailPage;
