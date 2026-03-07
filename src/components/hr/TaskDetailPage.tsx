import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, CheckCircle, Clock, Target, Flag, Eye, Edit, Trash2,
  Plus, Calendar, User, Layers, FileText, Download, MessageSquare,
  Loader2, Share2, LayoutTemplate, Minimize2, Maximize2
} from "lucide-react";
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
  const [newSubtask, setNewSubtask] = useState({
    title: "", description: "", assigned_to: "", priority: "medium" as string, points: 0, due_date: "", due_time: "", stage: 1
  });
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
      const { data, error } = await supabase.from('staff_subtasks').insert({
        task_id: task.id, title: newSubtask.title, description: newSubtask.description,
        assigned_to: newSubtask.assigned_to, priority: newSubtask.priority, points: newSubtask.points || 0,
        due_date: newSubtask.due_date || null, due_time: newSubtask.due_time || null,
        created_by: user?.id, stage: newSubtask.stage || 1, status: 'pending'
      }).select('*, staff_profiles:assigned_to (full_name, username, avatar_url)').single();
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
      const { data, error } = await supabase.from('staff_subtasks')
        .update({ status: newStatus as any, updated_at: new Date().toISOString() })
        .eq('id', subtaskId)
        .select('*, staff_profiles:assigned_to (full_name, username, avatar_url)').single();
      if (error) throw error;
      setSubtasks(subtasks.map(st => st.id === subtaskId ? data : st));
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

  const completedSubtasks = subtasks.filter(s => s.status === 'completed').length;

  const stageLabels: Record<number, string> = { 1: 'DISCOVERY', 2: 'DESIGN', 3: 'DEVELOPMENT', 4: 'TESTING', 5: 'REVIEW' };

  const profiles = task.assigned_to_profiles?.length > 0
    ? task.assigned_to_profiles
    : task.assigned_to_profile ? [task.assigned_to_profile] : [];

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <button onClick={onBack} className="hover:text-white transition-colors">Tasks</button>
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
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Status */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold tracking-tight leading-tight">{task.title}</h1>
              <Badge variant="outline" className={`${statusConfig[task.status]?.color || ''} text-[10px] font-bold tracking-wider px-3 py-1.5 shrink-0`}>
                {statusConfig[task.status]?.label || task.status?.toUpperCase()}
              </Badge>
            </div>

            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {task.description || 'No description provided.'}
            </p>
          </div>

          {/* Subtasks Stage Board */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Project Stages & Subtasks
              </h3>
              <span className="text-xs text-muted-foreground">
                {completedSubtasks}/{subtasks.length} completed
              </span>
            </div>

            {/* Stage Tabs */}
            <div className="flex gap-0 border-b border-white/10">
              {stageNums.map((stageNum) => {
                const color = stageColors[(stageNum - 1) % stageColors.length];
                const count = (stageMap[stageNum] || []).length;
                return (
                  <div key={stageNum} className={`flex items-center gap-2 px-4 py-2.5 border-b-2 ${color.border}`}>
                    <span className={`text-xs font-bold uppercase tracking-wider ${color.text}`}>
                      {stageLabels[stageNum] || `STAGE ${stageNum}`}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${color.badge}`}>{count}</span>
                  </div>
                );
              })}
              <button
                onClick={() => {
                  const nextStage = stageNums.length > 0 ? Math.max(...stageNums) + 1 : 1;
                  setQuickAddStage(nextStage);
                  setNewSubtask(prev => ({ ...prev, stage: nextStage }));
                }}
                className="px-3 py-2.5 text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Add Stage
              </button>
            </div>

            {/* Stage Columns */}
            {loadingSubtasks ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <DragDropContext onDragEnd={onSubtaskDragEnd}>
                <div className="flex gap-4 overflow-x-auto pb-2" style={{ minWidth: stageNums.length * 260 }}>
                  {stageNums.map((stageNum) => {
                    const color = stageColors[(stageNum - 1) % stageColors.length];
                    const stageSubtasks = stageMap[stageNum] || [];
                    const isQuickAddOpen = quickAddStage === stageNum;

                    return (
                      <Droppable key={stageNum} droppableId={`stage-${stageNum}`}>
                        {(provided, snapshot) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className={cn(
                              "flex-1 min-w-[220px] rounded-xl border p-3 space-y-2 transition-colors",
                              color.border, color.bg,
                              snapshot.isDraggingOver && "bg-white/5 shadow-inner"
                            )}
                          >
                            <div className="flex items-center justify-between mb-1">
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
                              <div className="space-y-2 p-2.5 bg-black/30 rounded-lg border border-white/10 animate-in fade-in duration-200">
                                <Input autoFocus placeholder="Subtask title *" value={newSubtask.title}
                                  onChange={e => setNewSubtask({ ...newSubtask, title: e.target.value })}
                                  className="h-8 text-xs bg-transparent border-white/10" />
                                <Select value={newSubtask.assigned_to} onValueChange={v => setNewSubtask({ ...newSubtask, assigned_to: v })}>
                                  <SelectTrigger className="h-8 text-xs bg-transparent border-white/10"><SelectValue placeholder="Assign to..." /></SelectTrigger>
                                  <SelectContent>
                                    {staff.map(m => <SelectItem key={m.id} value={m.user_id} className="text-xs">{m.full_name}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                                <div className="flex gap-1">
                                  <Button size="sm" className="flex-1 h-7 text-[10px] bg-primary/80 hover:bg-primary" onClick={handleCreateSubtask}>
                                    <Plus className="h-3 w-3 mr-1" /> Add
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => setQuickAddStage(null)}>Cancel</Button>
                                </div>
                              </div>
                            )}

                            {/* Subtask Cards */}
                            {stageSubtasks.map((st, index) => (
                              <Draggable key={st.id} draggableId={st.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={cn(
                                      "rounded-lg border border-white/10 bg-black/30 p-3 space-y-2 transition-all hover:border-white/20 group",
                                      snapshot.isDragging && "rotate-2 scale-105 shadow-2xl"
                                    )}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <span className="text-xs font-medium leading-tight">{st.title}</span>
                                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-400"
                                          onClick={() => handleDeleteSubtask(st.id)}>
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                      {st.staff_profiles && (
                                        <div className="flex items-center gap-1.5">
                                          <Avatar className="h-5 w-5 border border-white/10">
                                            <AvatarImage src={st.staff_profiles.avatar_url} />
                                            <AvatarFallback className="text-[8px]">
                                              {st.staff_profiles.full_name?.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="text-[10px] text-muted-foreground">{st.staff_profiles.full_name}</span>
                                        </div>
                                      )}
                                      <Badge variant="outline" className={`text-[8px] h-4 px-1.5 ${
                                        st.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                          : st.status === 'in_progress' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                      }`}>
                                        {st.status === 'completed' ? 'DONE' : st.status === 'in_progress' ? 'IN PROGRESS' : 'PENDING'}
                                      </Badge>
                                    </div>

                                    {/* Status toggle */}
                                    <Select value={st.status} onValueChange={(v) => handleSubtaskStatusUpdate(st.id, v)}>
                                      <SelectTrigger className="h-6 text-[9px] bg-transparent border-white/5">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                                        <SelectItem value="in_progress" className="text-xs">In Progress</SelectItem>
                                        <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                                      </SelectContent>
                                    </Select>
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
                        )}
                      </Droppable>
                    );
                  })}
                </div>
              </DragDropContext>
            )}
          </div>

          {/* Handover History */}
          {task.comments && Array.isArray(task.comments) && task.comments.filter((c: any) => c.type === 'handover').length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-3">
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
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-5 sticky top-4">
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

            {/* Client */}
            {task.clients && (
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Client</Label>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {task.clients.company_name?.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{task.clients.company_name}</p>
                    <p className="text-[10px] text-muted-foreground">{task.clients.contact_person}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Project */}
            {task.staff_projects && (
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Project</Label>
                <div className="flex items-center gap-2 text-sm">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span className="font-medium">{task.staff_projects.title}</span>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Timeline</Label>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Due: {task.due_date ? format(new Date(task.due_date), 'MMM dd, yyyy') : 'No due date'}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Created: {format(new Date(task.created_at), 'MMM dd, yyyy')}</span>
                </div>
              </div>
            </div>

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
    </div>
  );
};

export default TaskDetailPage;
