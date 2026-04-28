import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  AlertCircle, Upload, Lock, Unlock, ListOrdered, ExternalLink, Link2, Globe
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { SubtaskReviewDialog } from "@/components/staff/SubtaskReviewDialog";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { buildLinkAttachment, fetchLinkTitle, getFaviconUrl, extractDomain } from "@/lib/linkMetadata";

interface TaskDetailPageProps {
  task: any;
  onBack: () => void;
  onStatusUpdate: (taskId: string, status: string) => void;
  onEdit: (task: any) => void;
  onDelete: (task: any) => void;
  userProfile: any;
  staff: any[];
  departments: any[];
  subtaskTemplates: any[];
  taskTemplates: any[];
}

const TaskDetailPage = ({
  task, onBack, onStatusUpdate, onEdit, onDelete, userProfile, staff, departments = [], subtaskTemplates, taskTemplates
}: TaskDetailPageProps) => {
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);
  const [quickAddStage, setQuickAddStage] = useState<number | null>(null);
  const [isCreateSubtaskDialogOpen, setIsCreateSubtaskDialogOpen] = useState(false);
  const [bulkSubtasks, setBulkSubtasks] = useState<any[]>([]);
  const [selectedTaskTemplateId, setSelectedTaskTemplateId] = useState("none");
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [reviewDialogSubtask, setReviewDialogSubtask] = useState<any>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const stageScrollRef = useRef<HTMLDivElement>(null);
  const [newSubtask, setNewSubtask] = useState({
    title: "", description: "", assigned_to: "", priority: "medium" as string, points: 0, due_date: "", due_time: "", stage: 1, rank: 0,
    time_limit_hr: 0, penalty_coins: 0
  });
  const [newStageName, setNewStageName] = useState("");
  const [editingStageNum, setEditingStageNum] = useState<number | null>(null);
  const [editingStageName, setEditingStageName] = useState("");
  const [customStageNames, setCustomStageNames] = useState<Record<number, string>>(
    (task?.stage_names && typeof task.stage_names === 'object') ? task.stage_names : {}
  );
  
  // Attachment state for creation
  const [newSubtaskAttachType, setNewSubtaskAttachType] = useState<'none' | 'url' | 'file'>('none');
  const [newSubtaskURL, setNewSubtaskURL] = useState("");
  const [newSubtaskLinkName, setNewSubtaskLinkName] = useState("");
  const [isFetchingLinkMeta, setIsFetchingLinkMeta] = useState(false);
  const [newSubtaskFiles, setNewSubtaskFiles] = useState<any[]>([]);

  // Subtask Editing State
  const [editingSubtask, setEditingSubtask] = useState<any>(null);
  const [isEditSubtaskDialogOpen, setIsEditSubtaskDialogOpen] = useState(false);
  const [savingSubtask, setSavingSubtask] = useState(false);

  // Subtask submission state (for Team Head inline submit)
  const [expandedSubmitSubtask, setExpandedSubmitSubtask] = useState<string | null>(null);
  const [submitNotes, setSubmitNotes] = useState("");
  const [submitFiles, setSubmitFiles] = useState<any[]>([]);
  const [isSubmittingSubtask, setIsSubmittingSubtask] = useState(false);
  const [isUploadingSubtaskFile, setIsUploadingSubtaskFile] = useState(false);
  const submitFileInputRef = useRef<HTMLInputElement>(null);

  const checkScrollability = useCallback(() => {
    // We use a small timeout to ensure the DOM has finished rendering/reflowing
    setTimeout(() => {
      const el = stageScrollRef.current;
      if (!el) return;
      setCanScrollLeft(el.scrollLeft > 2);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
    }, 100);
  }, []);

  const scrollStages = (direction: 'left' | 'right') => {
    const el = stageScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === 'left' ? -260 : 260, behavior: 'smooth' });
    setTimeout(checkScrollability, 350);
  };

  const toggleStageSequential = async (stageNum: number) => {
    const currentConfig = task.stage_config || {};
    const stageSettings = currentConfig[stageNum] || {};
    const isSequential = !!stageSettings.sequential;
    
    const newConfig = {
      ...currentConfig,
      [stageNum]: {
        ...stageSettings,
        sequential: !isSequential
      }
    };

    try {
      const { error } = await supabase
        .from('staff_tasks')
        .update({ stage_config: newConfig })
        .eq('id', task.id);

      if (error) throw error;
      
      toast({
        title: isSequential ? "Sequential order disabled" : "Sequential order enabled",
        description: `Subtasks in ${stageLabels[stageNum] || `Stage ${stageNum}`} will ${isSequential ? 'no longer' : 'now'} strictly follow rank order.`
      });
    } catch (e: any) {
       console.error(e);
       toast({ title: "Update failed", description: e.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    const el = stageScrollRef.current;
    if (el) {
      checkScrollability();
      el.addEventListener('scroll', checkScrollability);
      window.addEventListener('resize', checkScrollability);
      
      return () => {
        el.removeEventListener('scroll', checkScrollability);
        window.removeEventListener('resize', checkScrollability);
      };
    }
  }, [subtasks, loadingSubtasks, checkScrollability]);
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
      // Build link attachment with metadata if URL is present
      const linkAttachments: any[] = [];
      if (newSubtaskURL.trim()) {
        const link = buildLinkAttachment(newSubtaskURL.trim(), newSubtaskLinkName.trim() || undefined);
        linkAttachments.push(link);
      }
      const insertData = {
        task_id: task.id, title: newSubtask.title, description: newSubtask.description,
        assigned_to: newSubtask.assigned_to, priority: newSubtask.priority, points: newSubtask.points || 0,
        due_date: newSubtask.due_date || null, due_time: newSubtask.due_time || null,
        created_by: user?.id, stage: newSubtask.stage || 1, status: 'pending',
        rank: (subtasks.filter(s => s.stage === newSubtask.stage).length + 1) * 10,
        time_limit_hr: newSubtask.time_limit_hr || 0,
        penalty_coins: newSubtask.penalty_coins || 0,
        attachments: [
          ...newSubtaskFiles,
          ...linkAttachments
        ]
      } as any;
      const { data, error } = await supabase.from('staff_subtasks').insert(insertData)
        .select('*, staff_profiles:assigned_to (full_name, username, avatar_url)').single();
      if (error) throw error;
      setSubtasks([data, ...subtasks]);
      setNewSubtask({ title: "", description: "", assigned_to: "", priority: "medium", points: 0, due_date: "", due_time: "", stage: newSubtask.stage, rank: 0, time_limit_hr: 0, penalty_coins: 0 });
      setNewSubtaskURL("");
      setNewSubtaskLinkName("");
      setNewSubtaskFiles([]);
      setNewSubtaskAttachType('none');
      setQuickAddStage(null);
      setIsCreateSubtaskDialogOpen(false);
      toast({ title: "Subtask created!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleAcceptSubtask = async (subtaskId: string) => {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase.from('staff_subtasks')
        .update({ 
          accepted_at: now,
          status: 'in_progress' as any,
          updated_at: now
        })
        .eq('id', subtaskId);
      if (error) throw error;
      setSubtasks(prev => prev.map(s => s.id === subtaskId ? { ...s, accepted_at: now, status: 'in_progress' } : s));
      toast({ title: "Subtask Accepted! 🚀", description: "The timer has started." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to accept subtask.", variant: "destructive" });
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

  const handleEditSubtaskSave = async () => {
    if (!editingSubtask || !editingSubtask.title || !editingSubtask.assigned_to) {
      toast({ title: "Error", description: "Title and assignee required.", variant: "destructive" });
      return;
    }
    setSavingSubtask(true);
    try {
      const updateData = {
        title: editingSubtask.title,
        description: editingSubtask.description,
        assigned_to: editingSubtask.assigned_to,
        priority: editingSubtask.priority,
        points: editingSubtask.points,
        due_date: editingSubtask.due_date || null,
        due_time: editingSubtask.due_time || null,
        stage: editingSubtask.stage,
        rank: editingSubtask.rank || 0,
        time_limit_hr: editingSubtask.time_limit_hr || 0,
        penalty_coins: editingSubtask.penalty_coins || 0,
        attachments: editingSubtask.attachments || [],
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase.from('staff_subtasks')
        .update(updateData)
        .eq('id', editingSubtask.id)
        .select('*, staff_profiles:assigned_to (full_name, username, avatar_url)')
        .single();
      
      if (error) throw error;
      
      setSubtasks(prev => prev.map(st => st.id === editingSubtask.id ? data : st));
      setIsEditSubtaskDialogOpen(false);
      setEditingSubtask(null);
      toast({ title: "Subtask updated!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSavingSubtask(false);
    }
  };

  // Team Head subtask work submission file upload
  const handleSubmitFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !task) return;
    setIsUploadingSubtaskFile(true);
    try {
      const uploadPromises = Array.from(files).map(async file => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${task.id}/subtask_submit_${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('task-attachments').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('task-attachments').getPublicUrl(fileName);
        return { url: fileName, name: file.name, size: file.size, type: file.type, publicUrl, uploadedBy: userProfile?.user_id };
      });
      const newFiles = await Promise.all(uploadPromises);
      setSubmitFiles(prev => [...prev, ...newFiles]);
    } catch (error) {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setIsUploadingSubtaskFile(false);
      if (event.target) event.target.value = '';
    }
  };

  // New subtask file upload handler (for creation/edit phase)
  const handleNewSubtaskFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !task) return;
    setIsUploadingSubtaskFile(true);
    try {
      const uploadPromises = Array.from(files).map(async file => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${task.id}/subtask_init_${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('task-attachments').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('task-attachments').getPublicUrl(fileName);
        return { name: file.name, url: fileName, publicUrl, size: file.size, type: file.type };
      });
      const newFiles = await Promise.all(uploadPromises);
      
      if (isEditSubtaskDialogOpen && editingSubtask) {
        setEditingSubtask({
          ...editingSubtask,
          attachments: [...(Array.isArray(editingSubtask.attachments) ? editingSubtask.attachments : []), ...newFiles]
        });
      } else {
        setNewSubtaskFiles(prev => [...prev, ...newFiles]);
      }
    } catch (error) {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setIsUploadingSubtaskFile(false);
      if (event.target) event.target.value = '';
    }
  };

  // Team Head subtask submission with notes + files
  const handleTeamHeadSubtaskSubmit = async (subtaskId: string, targetStatus: string = 'pending_approval') => {
    if (isSubmittingSubtask) return;
    setIsSubmittingSubtask(true);
    try {
      const subtask = subtasks.find(s => s.id === subtaskId);
      const existingComments = Array.isArray(subtask?.comments) ? subtask.comments : [];
      const existingAttachments = Array.isArray(subtask?.attachments) ? subtask.attachments : [];

      const newComment = submitNotes.trim() ? {
        user_id: userProfile?.user_id,
        user_name: userProfile?.full_name || 'Team Head',
        user_avatar: userProfile?.avatar_url,
        message: submitNotes.trim(),
        timestamp: new Date().toISOString(),
        type: 'submission_note'
      } : null;

      const updatedComments = newComment ? [...existingComments, newComment] : existingComments;
      const updatedAttachments = [...existingAttachments, ...submitFiles];

      const updateData: any = {
        status: targetStatus,
        comments: updatedComments,
        attachments: updatedAttachments,
        updated_at: new Date().toISOString()
      };
      if (targetStatus === 'completed' || targetStatus === 'pending_approval') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase.from('staff_subtasks')
        .update(updateData)
        .eq('id', subtaskId)
        .select('*, staff_profiles:assigned_to (full_name, username, avatar_url)').single();
      if (error) throw error;

      setSubtasks(prev => prev.map(st => st.id === subtaskId ? data : st));

      // Auto-advance stage logic
      const subtaskStage = (data as any).stage || 1;
      const updatedSubtasksList = subtasks.map(s => s.id === subtaskId ? data : s);
      const stageSubtasks = updatedSubtasksList.filter((st: any) => (st.stage || 1) === subtaskStage);
      const allStageDone = stageSubtasks.length > 0 && stageSubtasks.every((st: any) => st.status === 'completed' || st.status === 'pending_approval');
      if (allStageDone) {
        const allStages = [...new Set(updatedSubtasksList.map((st: any) => (st.stage || 1) as number))].sort((a, b) => a - b);
        const nextIncompleteStage = allStages.find(s => {
          const subs = updatedSubtasksList.filter((st: any) => (st.stage || 1) === s);
          return subs.some((st: any) => st.status !== 'completed' && st.status !== 'pending_approval');
        });
        const newCurrentStage = nextIncompleteStage ?? ((allStages[allStages.length - 1] || 1) + 1);
        await supabase.from('staff_tasks')
          .update({ current_stage: newCurrentStage, updated_at: new Date().toISOString() } as any)
          .eq('id', task.id);
      }

      toast({ title: "Subtask Updated", description: `Status set to ${targetStatus.replace('_', ' ')}.` });
      setSubmitNotes("");
      setSubmitFiles([]);
      setExpandedSubmitSubtask(null);
    } catch (error) {
      toast({ title: "Error", description: "Failed to submit subtask.", variant: "destructive" });
    } finally {
      setIsSubmittingSubtask(false);
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
      const toInsert = bulkSubtasks.map(st => {
        let dueDateStr = null;
        if (st.deadline_days && task.created_at) {
          const d = new Date(task.created_at);
          d.setDate(d.getDate() + st.deadline_days);
          dueDateStr = d.toISOString().split('T')[0];
        } else if (st.deadline_days) {
          const d = new Date();
          d.setDate(d.getDate() + st.deadline_days);
          dueDateStr = d.toISOString().split('T')[0];
        }
        return {
          task_id: task.id, title: st.title, description: st.description, assigned_to: st.assigned_to,
          priority: st.priority || 'medium', points: st.points || 0, stage: st.stage ?? 1, created_by: user.id, status: 'pending', due_date: dueDateStr
        };
      });
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

      // Calculate penalties
      let finalPoints = subtaskToApprove?.points || 0;
      let penaltyDetail = "";
      
      // 1. Acceptance Penalty (5 coins)
      if (subtaskToApprove?.ready_at && subtaskToApprove?.accepted_at) {
        const readyDate = new Date(subtaskToApprove.ready_at);
        const acceptedDate = new Date(subtaskToApprove.accepted_at);
        const diffMins = (acceptedDate.getTime() - readyDate.getTime()) / (1000 * 60);
        if (diffMins > 30) {
          finalPoints -= 5;
          penaltyDetail += "Acceptance delay (-5 pts). ";
        }
      } else if (subtaskToApprove?.ready_at && !subtaskToApprove?.accepted_at) {
        // If completed without accepting but it was ready for more than 30 mins
        const readyDate = new Date(subtaskToApprove.ready_at);
        const now = new Date();
        const diffMins = (now.getTime() - readyDate.getTime()) / (1000 * 60);
        if (diffMins > 30) {
          finalPoints -= 5;
          penaltyDetail += "Acceptance delay (-5 pts). ";
        }
      }
      
      // 2. Completion Penalty
      if (subtaskToApprove?.accepted_at && (subtaskToApprove?.time_limit_hr || 0) > 0) {
        const acceptedDate = new Date(subtaskToApprove.accepted_at);
        const completedDate = new Date();
        const diffHrs = (completedDate.getTime() - acceptedDate.getTime()) / (1000 * 60 * 60);
        if (diffHrs > subtaskToApprove.time_limit_hr) {
          const penalty = subtaskToApprove.penalty_coins || 0;
          finalPoints -= penalty;
          penaltyDetail += `Completion delay (-${penalty} pts). `;
        }
      }
      
      finalPoints = Math.max(0, finalPoints);

      // Award points if applicable
      if (finalPoints > 0 && subtaskToApprove?.assigned_to) {
        await supabase.rpc('increment_points' as any, {
          user_id_param: subtaskToApprove.assigned_to,
          points_param: finalPoints
        });
      }

      // Trigger next subtask "ready" state
      const currentRank = subtaskToApprove?.rank || 0;
      const nextSubtask = [...subtasks]
        .sort((a, b) => (a.rank || 0) - (b.rank || 0))
        .find(s => s.status === 'pending' && (s.rank || 0) > currentRank);
        
      if (nextSubtask) {
        await supabase.from('staff_subtasks')
          .update({ ready_at: new Date().toISOString() })
          .eq('id', nextSubtask.id);
      }

      toast({ 
        title: "Subtask Approved! ✅", 
        description: penaltyDetail ? `Awarded: ${finalPoints} pts (${penaltyDetail})` : `Awarded: ${finalPoints} pts` 
      });
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
                        priority: st.priority || 'medium', points: st.points || 0, stage: st.stage ?? 1,
                        deadline_days: st.deadline_days || 0
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
                      {bs.deadline_days > 0 && (
                        <Badge variant="outline" className="text-[8px] h-4 px-1.5 shrink-0 bg-amber-500/10 text-amber-400 border-amber-500/20">
                          {bs.deadline_days}d
                        </Badge>
                      )}
                      <Select value={bs.assigned_to || ''} onValueChange={v => {
                        const updated = [...bulkSubtasks];
                        updated[i] = { ...updated[i], assigned_to: v };
                        setBulkSubtasks(updated);
                      }}>
                        <SelectTrigger className="h-7 text-[10px] bg-transparent border-white/10 w-[120px]">
                          <SelectValue placeholder="Assign..." />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map(dept => {
                            const deptStaff = staff.filter(s => s.department_id === dept.id);
                            if (deptStaff.length === 0) return null;
                            return (
                              <SelectGroup key={dept.id}>
                                <SelectLabel className="text-[10px] uppercase text-muted-foreground px-2 py-1.5">{dept.name}</SelectLabel>
                                {deptStaff.map(m => (
                                  <SelectItem key={m.id} value={m.user_id} className="text-xs">{m.full_name}</SelectItem>
                                ))}
                              </SelectGroup>
                            );
                          })}
                          {/* Staff with no department */}
                          {staff.filter(s => !s.department_id).length > 0 && (
                            <SelectGroup>
                              <SelectLabel className="text-[10px] uppercase text-muted-foreground px-2 py-1.5">Other</SelectLabel>
                              {staff.filter(s => !s.department_id).map(m => (
                                <SelectItem key={m.id} value={m.user_id} className="text-xs">{m.full_name}</SelectItem>
                              ))}
                            </SelectGroup>
                          )}
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
                <button
                  onClick={() => scrollStages('left')}
                  disabled={!canScrollLeft}
                  className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full border shadow-lg backdrop-blur-sm flex items-center justify-center transition-all -ml-5",
                    canScrollLeft 
                      ? "bg-background/90 border-white/20 text-foreground hover:bg-primary/20 hover:border-primary/40 cursor-pointer" 
                      : "bg-background/50 border-white/5 text-muted-foreground/30 cursor-not-allowed"
                  )}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                {/* Right Arrow */}
                <button
                  onClick={() => scrollStages('right')}
                  disabled={!canScrollRight}
                  className={cn(
                    "absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full border shadow-lg backdrop-blur-sm flex items-center justify-center transition-all -mr-5",
                    canScrollRight 
                      ? "bg-background/90 border-white/20 text-foreground hover:bg-primary/20 hover:border-primary/40 cursor-pointer" 
                      : "bg-background/50 border-white/5 text-muted-foreground/30 cursor-not-allowed"
                  )}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                <DragDropContext onDragEnd={onSubtaskDragEnd}>
                  <div
                    ref={stageScrollRef}
                    className="flex gap-3 pb-4 overflow-x-auto scroll-smooth"
                  >
                    {stageNums.map((stageNum) => {
                      const color = stageColors[(stageNum - 1) % stageColors.length];
                      const stageSubtasks = (stageMap[stageNum] || []).sort((a, b) => (a.rank || 0) - (b.rank || 0));
                      const isQuickAddOpen = quickAddStage === stageNum;
                      
                      // Stages are NOT locked by default.
                      // Locking only occurs if:
                      // 1. The stage itself is sequential (subtasks must be done in order)
                      // 2. OR if we want to enforce that Stage 2 only starts after Stage 1 is done.
                      // The user said: "The locking of the subtask should only taken into effect only if the stage is opted or toggle with follow btn"
                      // and "the stages shouldn't be locked by default".
                      // So we treat the toggle as "Follow Sequential Order" for that stage's subtasks.
                      const isSequential = !!task.stage_config?.[stageNum]?.sequential;
                      
                      // For stage-level locking (can't even see/do subtasks of Stage 2 until Stage 1 is done):
                      // We'll only do this if it's explicitly opted-in as "Follow Previous".
                      const followPrevious = !!task.stage_config?.[stageNum]?.followPrevious;
                      const isStageUnlocked = !followPrevious || !stageNums.some(otherNum => otherNum < stageNum && (stageMap[otherNum] || []).some(st => st.status !== 'completed'));

                      return (
                        <StrictModeDroppable key={stageNum} droppableId={`stage-${stageNum}`}>
                          {(provided, snapshot) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className={cn(
                                "w-[260px] shrink-0 rounded-xl border p-3 transition-colors flex flex-col",
                                color.border, color.bg,
                                snapshot.isDraggingOver && "bg-white/5 shadow-inner",
                                !isStageUnlocked && "opacity-50 grayscale select-none"
                              )}
                            >
                               {!isStageUnlocked && (
                                  <div className="absolute inset-x-0 -top-1 flex justify-center z-10">
                                      <Badge className="bg-black/60 border-white/20 text-[8px] h-4">Locked Stage</Badge>
                                  </div>
                                )}
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className={cn(
                                      "flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-all duration-300",
                                      isSequential 
                                        ? "bg-primary/20 border-primary/40 shadow-[0_0_8px_rgba(var(--primary-rgb),0.2)]" 
                                        : "bg-white/5 border-white/5"
                                    )}>
                                      <span className={cn(
                                        "text-[8px] font-extrabold uppercase tracking-tighter transition-colors",
                                        isSequential ? "text-primary/90" : "text-white/30"
                                      )}>
                                        {isSequential ? "Following" : "Follow"}
                                      </span>
                                      <Switch 
                                        className="h-3 w-6 scale-75 data-[state=checked]:bg-primary"
                                        checked={isSequential}
                                        onCheckedChange={() => toggleStageSequential(stageNum)}
                                      />
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${color.text}`}>
                                      {stageLabels[stageNum] || `Stage ${stageNum}`}
                                    </span>
                                  </div>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                                  onClick={() => {
                                    setNewSubtask(prev => ({ ...prev, stage: stageNum, title: '', assigned_to: '' }));
                                    setIsCreateSubtaskDialogOpen(true);
                                  }}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </Button>
                              </div>


                              {/* Scrollable subtask list */}
                              <div className="flex-1 overflow-y-auto max-h-[400px] space-y-2 pr-0.5" style={{ scrollbarWidth: 'thin' }}>
                                  {stageSubtasks.map((st, index) => (
                                    <Draggable key={st.id} draggableId={st.id} index={index}>
                                      {(provided, snapshot) => {
                                        const isSequentialStage = !!task.stage_config?.[stageNum]?.sequential;
                                        
                                        const isSubtaskLocked = !isStageUnlocked || (
                                          isSequentialStage && stageSubtasks.some((other, oi) => {
                                            const otherRank = (other as any).rank || (oi * 10);
                                            const myRank = (st as any).rank || (index * 10);
                                            return otherRank < myRank && other.status !== 'completed' && other.status !== 'review_pending' && other.status !== 'pending_approval';
                                          })
                                        );

                                        return (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={cn(
                                              "rounded-lg border bg-black/30 p-3 space-y-2 transition-all hover:border-white/20 group cursor-pointer relative",
                                              (st.status === 'review_pending' || st.status === 'pending_approval')
                                                ? "border-orange-500/40 ring-1 ring-orange-500/20"
                                                : "border-white/10",
                                              isSubtaskLocked && "opacity-40 grayscale pointer-events-none",
                                              snapshot.isDragging && "rotate-2 scale-105 shadow-2xl z-50"
                                            )}
                                            onClick={() => {
                                              if (isSubtaskLocked) return;
                                              setReviewDialogSubtask(st);
                                              setReviewDialogOpen(true);
                                            }}
                                          >
                                            {isSubtaskLocked && (
                                              <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg pointer-events-none">
                                                <AlertCircle className="h-4 w-4 text-white/20" />
                                              </div>
                                            )}
                                            
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
                                                <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-primary"
                                                  onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    setEditingSubtask({...st}); 
                                                    setIsEditSubtaskDialogOpen(true);
                                                  }}>
                                                  <Edit className="h-3 w-3" />
                                                </Button>
                                                <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-400"
                                                  onClick={(e) => { e.stopPropagation(); handleDeleteSubtask(st.id); }}>
                                                  <Trash2 className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            </div>

                                            {/* Accept Button & Timing Info */}
                                            {st.status === 'pending' && !st.accepted_at && st.ready_at && (
                                              <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                                                <Button 
                                                  size="sm" 
                                                  className="w-full h-7 text-[10px] bg-green-600/90 hover:bg-green-600 font-bold shadow-sm"
                                                  onClick={() => handleAcceptSubtask(st.id)}
                                                >
                                                  <CheckCircle className="h-3 w-3 mr-1" /> ACCEPT SUBTASK
                                                </Button>
                                                <div className="flex items-center justify-between mt-1 px-1">
                                                   <span className="text-[8px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                                                     <Clock className="h-2 w-2" /> Buffer: 30m
                                                   </span>
                                                   <Badge variant="outline" className="text-[7px] h-3 px-1 bg-amber-500/10 text-amber-500 border-amber-500/20">READY</Badge>
                                                </div>
                                              </div>
                                            )}

                                            {/* Timer if accepted */}
                                            {st.accepted_at && st.status === 'in_progress' && (
                                               <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/10 border border-blue-500/20">
                                                  <Clock className="h-3 w-3 text-blue-400 animate-pulse" />
                                                  <div className="flex flex-col">
                                                     <span className="text-[8px] font-bold text-blue-300 uppercase leading-none">Started</span>
                                                     <span className="text-[9px] font-bold text-blue-300">{format(new Date(st.accepted_at), 'MMM dd, HH:mm')}</span>
                                                  </div>
                                                  {st.time_limit_hr > 0 && (
                                                    <div className="ml-auto flex flex-col items-end">
                                                      <span className="text-[8px] text-muted-foreground uppercase leading-none">Limit</span>
                                                      <span className="text-[9px] text-white/70 font-bold">{st.time_limit_hr}h</span>
                                                    </div>
                                                  )}
                                               </div>
                                            )}

                                            {st.description && (
                                              <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2 break-words">{st.description}</p>
                                            )}

                                            {st.points > 0 && (
                                              <div className="flex items-center gap-1">
                                                <Target className="h-3 w-3 text-primary" />
                                                <span className="text-[9px] text-primary font-semibold">{st.points} pts</span>
                                              </div>
                                            )}

                                            {st.due_date && (
                                              <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3 text-amber-400" />
                                                <span className="text-[9px] text-amber-400 font-medium">
                                                  {(() => { try { return format(new Date(st.due_date), 'MMM dd'); } catch { return st.due_date; } })()}
                                                </span>
                                              </div>
                                            )}

                                            {/* Link indicators */}
                                            {(() => {
                                              const links = (Array.isArray(st.attachments) ? st.attachments : []).filter((a: any) => a.type === 'url');
                                              if (links.length === 0) return null;
                                              return (
                                                <div className="flex flex-wrap gap-1">
                                                  {links.map((link: any, li: number) => (
                                                    <a
                                                      key={li}
                                                      href={link.url}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      onClick={(e) => e.stopPropagation()}
                                                      className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors group/link"
                                                    >
                                                      <img src={link.favicon || getFaviconUrl(link.url)} alt="" className="h-3 w-3 rounded-sm" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                      <span className="text-[8px] text-blue-300 truncate max-w-[80px] group-hover/link:text-blue-200">{link.name || link.domain || 'Link'}</span>
                                                      <ExternalLink className="h-2 w-2 text-blue-400/60 shrink-0" />
                                                    </a>
                                                  ))}
                                                </div>
                                              );
                                            })()}

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

                                            {/* Team Head Submit Button */}
                                            {(st.status === 'in_progress' || st.status === 'pending') && (
                                              <div onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                  size="sm"
                                                  className="w-full h-6 text-[9px] bg-purple-600/80 hover:bg-purple-600 mt-1"
                                                  onClick={() => {
                                                    setExpandedSubmitSubtask(expandedSubmitSubtask === st.id ? null : st.id);
                                                    setSubmitNotes("");
                                                    setSubmitFiles([]);
                                                  }}
                                                >
                                                  {expandedSubmitSubtask === st.id ? 'Cancel' : 'Write & Submit'}
                                                </Button>
                                              </div>
                                            )}

                                            {/* Expanded Submission Form */}
                                            {expandedSubmitSubtask === st.id && (
                                              <div className="space-y-2 mt-2 pt-2 border-t border-white/10" onClick={(e) => e.stopPropagation()}>
                                                <Textarea
                                                  placeholder="Add notes..."
                                                  value={submitNotes}
                                                  onChange={(e) => setSubmitNotes(e.target.value)}
                                                  className="bg-black/50 border-white/10 text-[10px] min-h-[50px] placeholder:text-white/30"
                                                />
                                                <div className="flex flex-wrap gap-1">
                                                  {submitFiles.map((file, fidx) => (
                                                    <div key={fidx} className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                                                      <FileText className="w-2.5 h-2.5 text-blue-400" />
                                                      <span className="text-[8px] text-white/60 max-w-[60px] truncate">{file.name}</span>
                                                      <button className="text-red-400 hover:text-red-300" onClick={() => setSubmitFiles(submitFiles.filter((_, i) => i !== fidx))}>
                                                        <Trash2 className="h-2.5 w-2.5" />
                                                      </button>
                                                    </div>
                                                  ))}
                                                  <Button variant="outline" size="sm" className="h-5 text-[8px] border-dashed border-white/20 px-1.5"
                                                    onClick={() => submitFileInputRef.current?.click()} disabled={isUploadingSubtaskFile}>
                                                    {isUploadingSubtaskFile ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Plus className="h-2.5 w-2.5 mr-0.5" />}
                                                    Upload
                                                  </Button>
                                                  <input type="file" multiple hidden ref={submitFileInputRef} onChange={handleSubmitFileUpload} />
                                                </div>
                                                <div className="flex gap-1">
                                                  <Button size="sm" className="flex-1 h-6 text-[9px] bg-emerald-600 hover:bg-emerald-700"
                                                    onClick={() => handleTeamHeadSubtaskSubmit(st.id, 'completed')} disabled={isSubmittingSubtask}>
                                                    {isSubmittingSubtask ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                                                    Complete
                                                  </Button>
                                                  <Button size="sm" className="flex-1 h-6 text-[9px] bg-orange-600 hover:bg-orange-700"
                                                    onClick={() => handleTeamHeadSubtaskSubmit(st.id, 'pending_approval')} disabled={isSubmittingSubtask}>
                                                    {isSubmittingSubtask ? <Loader2 className="h-3 w-3 animate-spin" /> : <Share2 className="h-3 w-3 mr-1" />}
                                                    For Review
                                                  </Button>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      }}
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

          {/* ─── All Attachments Panel ─── */}
          {(() => {
            const taskAtts = Array.isArray(task.attachments) ? task.attachments : [];
            // Collect subtask attachments (from attachments field + comment attachments)
            const subtaskGroups: Array<{ id: string; title: string; stage: number; files: any[] }> = [];
            subtasks.forEach(st => {
              const files: any[] = [];
              if (Array.isArray(st.attachments)) files.push(...st.attachments);
              if (Array.isArray(st.comments)) {
                st.comments.forEach((c: any) => {
                  if (c.attachment_url) files.push({ name: c.attachment_name || 'Attachment', url: c.attachment_url, publicUrl: c.attachment_url });
                  if (Array.isArray(c.attachments)) files.push(...c.attachments);
                });
              }
              if (files.length > 0) subtaskGroups.push({ id: st.id, title: st.title, stage: st.stage || 1, files });
            });
            const totalFiles = taskAtts.length + subtaskGroups.reduce((s, g) => s + g.files.length, 0);
            if (totalFiles === 0) return null;

            const renderAttFile = (att: any, i: number) => {
              const isImage = att.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(att.name || '');
              const src = att.publicUrl || att.url;
              const ext = (att.name || '').split('.').pop()?.toLowerCase() || '';
              const extColor =
                ext === 'pdf' ? 'bg-red-500/15 text-red-400' :
                ['doc','docx'].includes(ext) ? 'bg-blue-500/15 text-blue-400' :
                ['xls','xlsx','csv'].includes(ext) ? 'bg-emerald-500/15 text-emerald-400' :
                ['zip','rar','7z'].includes(ext) ? 'bg-amber-500/15 text-amber-400' : 'bg-white/5 text-muted-foreground';
              return (
                <div key={i} className="group flex flex-col rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-primary/30 transition-all cursor-pointer"
                  onClick={() => handleDownloadAttachment(att)}>
                  <div className="h-24 bg-black/30 flex items-center justify-center overflow-hidden relative">
                    {isImage && src ? (
                      <img src={src} alt={att.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`flex flex-col items-center gap-1 rounded-lg px-3 py-2 ${extColor}`}>
                        <FileText className="h-7 w-7" />
                        <span className="text-[10px] font-bold uppercase">.{ext || 'file'}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="bg-primary/90 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                        <Download className="h-3 w-3" /> Download
                      </span>
                    </div>
                  </div>
                  <div className="px-2.5 py-2">
                    <p className="text-[11px] font-medium truncate">{att.name || `File ${i + 1}`}</p>
                    {att.size && <p className="text-[10px] text-muted-foreground">{(att.size / 1024).toFixed(1)} KB</p>}
                  </div>
                </div>
              );
            };

            return (
              <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-lg p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    All Attachments
                  </h3>
                  <span className="text-[10px] text-primary font-bold">{totalFiles} file{totalFiles !== 1 ? 's' : ''}</span>
                </div>

                {/* Task-level attachments */}
                {taskAtts.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Task Files</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {taskAtts.map((att: any, i: number) => renderAttFile(att, i))}
                    </div>
                  </div>
                )}

                {/* Subtask attachments grouped */}
                {subtaskGroups.map(group => {
                  const color = stageColors[(group.stage - 1) % stageColors.length];
                  return (
                    <div key={group.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${color.badge}`}>
                          Stage {group.stage}
                        </span>
                        <p className="text-xs font-semibold truncate text-white/80">{group.title}</p>
                        <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{group.files.length} file{group.files.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {group.files.map((f: any, fi: number) => renderAttFile(f, fi))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

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
                  <span className="text-[10px] text-primary">{task.attachments.length} file{task.attachments.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-1.5">
                  {task.attachments.map((att: any, i: number) => {
                    const isImage = att.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(att.name || '');
                    const previewSrc = att.publicUrl || att.url;
                    const ext = (att.name || '').split('.').pop()?.toLowerCase() || '';
                    const extColor =
                      ext === 'pdf' ? 'text-red-400' :
                      ['doc','docx'].includes(ext) ? 'text-blue-400' :
                      ['xls','xlsx','csv'].includes(ext) ? 'text-emerald-400' :
                      ['zip','rar','7z'].includes(ext) ? 'text-amber-400' : 'text-muted-foreground';
                    return (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors group"
                        onClick={() => handleDownloadAttachment(att)}>
                        {isImage && previewSrc ? (
                          <img src={previewSrc} alt={att.name} className="h-8 w-8 rounded object-cover flex-shrink-0 border border-white/10" />
                        ) : (
                          <div className={`h-8 w-8 rounded flex items-center justify-center bg-white/5 flex-shrink-0 text-[9px] font-bold uppercase ${extColor}`}>
                            {ext || 'FILE'}
                          </div>
                        )}
                        <span className="text-xs truncate flex-1">{att.name || `Attachment ${i + 1}`}</span>
                        <Download className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Aggregated Links from All Subtasks */}
            {(() => {
              const allLinks = subtasks.flatMap(st => {
                const atts = Array.isArray(st.attachments) ? st.attachments : [];
                return atts.filter((a: any) => a.type === 'url').map((link: any) => ({
                  ...link,
                  subtaskTitle: st.title,
                  subtaskId: st.id,
                  stageNum: st.stage || 1
                }));
              });
              if (allLinks.length === 0) return null;
              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <Link2 className="h-3 w-3" />
                      Links
                    </Label>
                    <span className="text-[10px] text-primary">{allLinks.length} link{allLinks.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="space-y-1.5">
                    {allLinks.map((link: any, i: number) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-blue-500/10 hover:border-blue-500/30 transition-all group"
                      >
                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                          <img
                            src={link.favicon || getFaviconUrl(link.url)}
                            alt=""
                            className="h-4 w-4 rounded-sm"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-400"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate group-hover:text-blue-300 transition-colors">{link.name || link.domain || 'Link'}</p>
                          <p className="text-[9px] text-muted-foreground truncate">{link.domain || extractDomain(link.url)} · {link.subtaskTitle}</p>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              );
            })()}

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
        onEdit={(st) => {
          setEditingSubtask({...st});
          setIsEditSubtaskDialogOpen(true);
        }}
        viewOnly={reviewDialogSubtask?.status !== 'review_pending' && reviewDialogSubtask?.status !== 'pending_approval'}
      />

      {/* Edit Subtask Dialog */}
      <Dialog open={isEditSubtaskDialogOpen} onOpenChange={setIsEditSubtaskDialogOpen}>
        <DialogContent className="max-w-md bg-black/90 border-white/10 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Edit Subtask</DialogTitle>
          </DialogHeader>
          {editingSubtask && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-widest">Title</Label>
                <Input 
                  value={editingSubtask.title} 
                  onChange={e => setEditingSubtask({...editingSubtask, title: e.target.value})}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-widest">Description</Label>
                <Textarea 
                  value={editingSubtask.description || ''} 
                  onChange={e => setEditingSubtask({...editingSubtask, description: e.target.value})}
                  className="bg-white/5 border-white/10 min-h-[80px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-widest">Assignee</Label>
                  <Select value={editingSubtask.assigned_to} onValueChange={v => setEditingSubtask({...editingSubtask, assigned_to: v})}>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => {
                        const deptStaff = staff.filter(s => s.department_id === dept.id);
                        if (deptStaff.length === 0) return null;
                        return (
                          <SelectGroup key={dept.id}>
                            <SelectLabel className="text-[10px] uppercase text-muted-foreground px-2 py-1.5">{dept.name}</SelectLabel>
                            {deptStaff.map(m => (
                              <SelectItem key={m.id} value={m.user_id} className="text-xs">{m.full_name}</SelectItem>
                            ))}
                          </SelectGroup>
                        );
                      })}
                      {staff.filter(s => !s.department_id).length > 0 && (
                        <SelectGroup>
                          <SelectLabel className="text-[10px] uppercase text-muted-foreground px-2 py-1.5">Other</SelectLabel>
                          {staff.filter(s => !s.department_id).map(m => (
                            <SelectItem key={m.id} value={m.user_id} className="text-xs">{m.full_name}</SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-widest">Priority</Label>
                  <Select value={editingSubtask.priority} onValueChange={v => setEditingSubtask({...editingSubtask, priority: v})}>
                    <SelectTrigger className="bg-white/5 border-white/10 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-widest">Points</Label>
                  <Input 
                    type="number"
                    value={editingSubtask.points} 
                    onChange={e => setEditingSubtask({...editingSubtask, points: parseInt(e.target.value) || 0})}
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-widest">Time Limit (hr)</Label>
                  <Input 
                    type="number"
                    value={editingSubtask.time_limit_hr || 0} 
                    onChange={e => setEditingSubtask({...editingSubtask, time_limit_hr: parseInt(e.target.value) || 0})}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-widest">Penalty Coins</Label>
                  <Input 
                    type="number"
                    value={editingSubtask.penalty_coins || 0} 
                    onChange={e => setEditingSubtask({...editingSubtask, penalty_coins: parseInt(e.target.value) || 0})}
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-widest">Days to Due</Label>
                  <Input 
                    type="number"
                    placeholder="Days"
                    onChange={e => {
                      const days = parseInt(e.target.value);
                      if (!isNaN(days)) {
                        const d = new Date(task.created_at || new Date());
                        d.setDate(d.getDate() + days);
                        setEditingSubtask({...editingSubtask, due_date: d.toISOString().split('T')[0]});
                      }
                    }}
                    className="bg-white/5 border-white/10 text-xs"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-widest">Due Date</Label>
                  <Input 
                    type="date"
                    value={editingSubtask.due_date || ''} 
                    onChange={e => setEditingSubtask({...editingSubtask, due_date: e.target.value})}
                    className="bg-white/5 border-white/10 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-widest">Stage</Label>
                  <Select value={String(editingSubtask.stage)} onValueChange={v => setEditingSubtask({...editingSubtask, stage: parseInt(v)})}>
                    <SelectTrigger className="bg-white/5 border-white/10 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stageNums.map(n => (
                        <SelectItem key={n} value={String(n)}>{stageLabels[n] || `Stage ${n}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                   <Label className="text-xs text-muted-foreground uppercase tracking-widest">Rank / Order</Label>
                   <Input 
                     type="number"
                     value={editingSubtask.rank || 0} 
                     onChange={e => setEditingSubtask({...editingSubtask, rank: parseInt(e.target.value) || 0})}
                     className="bg-white/5 border-white/10"
                   />
                </div>
              </div>

              {/* Edit Attachments */}
              <div className="space-y-4 pt-2">
                <input type="file" multiple hidden id="edit-subtask-file-input" onChange={handleNewSubtaskFileUpload} />
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground uppercase tracking-widest">Attachments</Label>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="h-6 text-[9px] border-white/10" onClick={() => setNewSubtaskAttachType(newSubtaskAttachType === 'url' ? 'none' : 'url')}>
                      <Share2 className="h-2.5 w-2.5 mr-1" /> URL
                    </Button>
                    <Button size="sm" variant="outline" className="h-6 text-[9px] border-white/10" onClick={() => {
                        setNewSubtaskAttachType('file');
                        document.getElementById('edit-subtask-file-input')?.click();
                      }}>
                      <Upload className="h-2.5 w-2.5 mr-1" /> File
                    </Button>
                  </div>
                </div>

                {newSubtaskAttachType === 'url' && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input placeholder="https://..." value={newSubtaskURL}
                        onChange={e => setNewSubtaskURL(e.target.value)}
                        onBlur={async () => {
                          if (newSubtaskURL.trim() && !newSubtaskLinkName) {
                            setIsFetchingLinkMeta(true);
                            const title = await fetchLinkTitle(newSubtaskURL.trim());
                            setNewSubtaskLinkName(title);
                            setIsFetchingLinkMeta(false);
                          }
                        }}
                        className="h-8 text-xs bg-white/5 flex-1" />
                      {isFetchingLinkMeta && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mt-2" />}
                    </div>
                    <div className="flex gap-2 items-center">
                      {newSubtaskURL.trim() && (
                        <img src={getFaviconUrl(newSubtaskURL)} alt="" className="h-4 w-4 rounded-sm" />
                      )}
                      <Input placeholder="Link name (auto-fetched)" value={newSubtaskLinkName}
                        onChange={e => setNewSubtaskLinkName(e.target.value)}
                        className="h-8 text-xs bg-white/5 flex-1" />
                      <Button size="sm" className="h-8 text-xs" onClick={() => {
                        if (newSubtaskURL.trim()) {
                          const link = buildLinkAttachment(newSubtaskURL.trim(), newSubtaskLinkName.trim() || undefined);
                          setEditingSubtask({
                            ...editingSubtask,
                            attachments: [...(Array.isArray(editingSubtask.attachments) ? editingSubtask.attachments : []), link]
                          });
                          setNewSubtaskURL("");
                          setNewSubtaskLinkName("");
                          setNewSubtaskAttachType('none');
                        }
                      }}>Add</Button>
                    </div>
                  </div>
                )}

                {(editingSubtask.attachments || []).length > 0 && (
                  <div className="space-y-2 border-t border-white/10 pt-3">
                    {editingSubtask.attachments.map((att: any, i: number) => (
                      <div key={i} className={cn(
                        "flex items-center justify-between p-2 rounded-lg border",
                        att.type === 'url'
                          ? "bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10"
                          : "bg-white/5 border-white/10"
                      )}>
                        <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                          {att.type === 'url' ? (
                            <img src={att.favicon || getFaviconUrl(att.url)} alt="" className="h-4 w-4 rounded-sm shrink-0"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <FileText className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <span className="text-xs truncate block">{att.name || 'Attachment'}</span>
                            {att.type === 'url' && att.domain && (
                              <span className="text-[9px] text-muted-foreground truncate block">{att.domain}</span>
                            )}
                          </div>
                          {att.type === 'url' && (
                            <a href={att.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                              className="ml-auto mr-1">
                              <ExternalLink className="h-3 w-3 text-blue-400 hover:text-blue-300" />
                            </a>
                          )}
                        </div>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-400 shrink-0" onClick={() => {
                          setEditingSubtask({
                            ...editingSubtask,
                            attachments: editingSubtask.attachments.filter((_: any, j: number) => j !== i)
                          });
                        }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditSubtaskDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSubtaskSave} disabled={savingSubtask} className="bg-primary hover:bg-primary/80">
              {savingSubtask ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Subtask Dialog */}
      <Dialog open={isCreateSubtaskDialogOpen} onOpenChange={setIsCreateSubtaskDialogOpen}>
        <DialogContent className="max-w-md bg-black/90 border-white/10 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Add New Subtask</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-widest">Title *</Label>
              <Input 
                autoFocus
                placeholder="Subtask title"
                value={newSubtask.title} 
                onChange={e => setNewSubtask({...newSubtask, title: e.target.value})}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-widest">Description</Label>
              <Textarea 
                placeholder="Description (optional)"
                value={newSubtask.description || ''} 
                onChange={e => setNewSubtask({...newSubtask, description: e.target.value})}
                className="bg-white/5 border-white/10 min-h-[80px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-widest">Assignee *</Label>
                <Select value={newSubtask.assigned_to} onValueChange={v => setNewSubtask({...newSubtask, assigned_to: v})}>
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => {
                      const deptStaff = staff.filter(s => s.department_id === dept.id);
                      if (deptStaff.length === 0) return null;
                      return (
                        <SelectGroup key={dept.id}>
                          <SelectLabel className="text-[10px] uppercase text-muted-foreground px-2 py-1.5">{dept.name}</SelectLabel>
                          {deptStaff.map(m => (
                            <SelectItem key={m.id} value={m.user_id} className="text-xs">{m.full_name}</SelectItem>
                          ))}
                        </SelectGroup>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-widest">Priority</Label>
                <Select value={newSubtask.priority} onValueChange={v => setNewSubtask({...newSubtask, priority: v})}>
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-widest">Points</Label>
                <Input 
                  type="number"
                  value={newSubtask.points} 
                  onChange={e => setNewSubtask({...newSubtask, points: parseInt(e.target.value) || 0})}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-widest">Rank / Order</Label>
                <Input 
                  type="number"
                  value={newSubtask.rank} 
                  onChange={e => setNewSubtask({...newSubtask, rank: parseInt(e.target.value) || 0})}
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-widest">Time Limit (hr)</Label>
                <Input 
                  type="number"
                  value={newSubtask.time_limit_hr} 
                  onChange={e => setNewSubtask({...newSubtask, time_limit_hr: parseInt(e.target.value) || 0})}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-widest">Penalty Coins</Label>
                <Input 
                  type="number"
                  value={newSubtask.penalty_coins} 
                  onChange={e => setNewSubtask({...newSubtask, penalty_coins: parseInt(e.target.value) || 0})}
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-widest">Days to Due</Label>
                <Input 
                  type="number"
                  placeholder="Days"
                  onChange={e => {
                    const days = parseInt(e.target.value);
                    if (!isNaN(days)) {
                      const d = new Date(task.created_at || new Date());
                      d.setDate(d.getDate() + days);
                      setNewSubtask({...newSubtask, due_date: d.toISOString().split('T')[0]});
                    }
                  }}
                  className="bg-white/5 border-white/10 text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-widest">Due Date</Label>
                <Input 
                  type="date"
                  value={newSubtask.due_date || ''} 
                  onChange={e => setNewSubtask({...newSubtask, due_date: e.target.value})}
                  className="bg-white/5 border-white/10 text-xs"
                />
              </div>
            </div>

            {/* Attachments */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground uppercase tracking-widest">Attachments</Label>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="h-6 text-[9px] border-white/10" onClick={() => setNewSubtaskAttachType(newSubtaskAttachType === 'url' ? 'none' : 'url')}>
                    <Share2 className="h-2.5 w-2.5 mr-1" /> URL
                  </Button>
                  <Button size="sm" variant="outline" className="h-6 text-[9px] border-white/10" onClick={() => {
                      setNewSubtaskAttachType('file');
                      document.getElementById('new-subtask-file-input-dialog')?.click();
                    }}>
                    <Upload className="h-2.5 w-2.5 mr-1" /> File
                  </Button>
                </div>
              </div>
              
              <input type="file" multiple hidden id="new-subtask-file-input-dialog" onChange={handleNewSubtaskFileUpload} />

              {newSubtaskAttachType === 'url' && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input placeholder="https://..." value={newSubtaskURL}
                      onChange={e => setNewSubtaskURL(e.target.value)}
                      onBlur={async () => {
                        if (newSubtaskURL.trim() && !newSubtaskLinkName) {
                          setIsFetchingLinkMeta(true);
                          const title = await fetchLinkTitle(newSubtaskURL.trim());
                          setNewSubtaskLinkName(title);
                          setIsFetchingLinkMeta(false);
                        }
                      }}
                      className="h-8 text-xs bg-white/5 flex-1" />
                    {isFetchingLinkMeta && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mt-2" />}
                  </div>
                  <div className="flex gap-2 items-center">
                    {newSubtaskURL.trim() && (
                      <img src={getFaviconUrl(newSubtaskURL)} alt="" className="h-4 w-4 rounded-sm" />
                    )}
                    <Input placeholder="Link name (auto-fetched)" value={newSubtaskLinkName}
                      onChange={e => setNewSubtaskLinkName(e.target.value)}
                      className="h-8 text-xs bg-white/5 flex-1" />
                  </div>
                </div>
              )}

              {newSubtaskFiles.length > 0 && (
                <div className="space-y-1">
                  {newSubtaskFiles.map((file: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/10 text-[10px]">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="h-3 w-3 text-blue-400" />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-400" onClick={() => setNewSubtaskFiles(prev => prev.filter((_, j) => j !== i))}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateSubtaskDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateSubtask} className="bg-primary hover:bg-primary/80">
              Add Subtask
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskDetailPage;
