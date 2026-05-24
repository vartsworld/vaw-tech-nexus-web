import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Clock,
  Download,
  FileText,
  MessageSquare,
  Award,
  Calendar,
  X,
  Target,
  Trophy,
  Milestone,
  ArrowRight,
  TrendingUp,
  Layers,
  ChevronRight,
  Sparkles,
  Cpu,
  AlertCircle,
  Link as LinkIcon,
  Eye,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { format } from "date-fns";
import { TaskDetailDialog } from "./TaskDetailDialog";

interface CompletedTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userProfile: any;
}

export const CompletedTasksDialog = ({
  open,
  onOpenChange,
  userId,
  userProfile,
}: CompletedTasksDialogProps) => {
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [showFullDetail, setShowFullDetail] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<any | null>(null);

  // Fetch all tasks from staff_tasks
  const { data: tasksData, refetch: refetchTasks } = useRealtimeQuery<any[]>({
    queryKey: ["completed-tasks-direct", userId],
    table: "staff_tasks",
    select: "*",
    staleTime: 2 * 60 * 1000,
  });

  // Fetch all subtasks assigned to the user
  const { data: subtasksData, refetch: refetchSubtasks } = useRealtimeQuery<any[]>({
    queryKey: ["completed-subtasks-list", userId],
    table: "staff_subtasks",
    filter: `assigned_to=eq.${userId}`,
    select: "*",
    staleTime: 2 * 60 * 1000,
  });

  // Consolidated refetch
  const refetch = () => {
    refetchTasks();
    refetchSubtasks();
  };

  // Group tasks and subtasks for completed view, supporting both direct task assignments and subtasks
  const completedTasks = useMemo(() => {
    const rawTasks = (tasksData || []) as any[];
    const rawSubtasks = (subtasksData || []) as any[];

    // Group raw subtasks by task_id
    const subtaskGroups: Record<string, any[]> = {};
    rawSubtasks.forEach((st) => {
      if (!st.task_id) return;
      if (!subtaskGroups[st.task_id]) subtaskGroups[st.task_id] = [];
      subtaskGroups[st.task_id].push(st);
    });

    const list = rawTasks.map((task) => {
      const userSubtasks = subtaskGroups[task.id] || [];

      // Check if user is assigned directly to the task
      let isDirectlyAssigned = false;
      if (task.assigned_to) {
        try {
          const parsed = typeof task.assigned_to === "string"
            ? JSON.parse(task.assigned_to)
            : task.assigned_to;
          if (Array.isArray(parsed) && parsed.includes(userId)) {
            isDirectlyAssigned = true;
          }
        } catch (e) {
          if (typeof task.assigned_to === "string" && task.assigned_to.includes(userId)) {
            isDirectlyAssigned = true;
          }
        }
      }

      const hasUserSubtasks = userSubtasks.length > 0;

      // Skip task if user is not directly assigned and has no subtasks assigned
      if (!isDirectlyAssigned && !hasUserSubtasks) {
        return null;
      }

      // Determine effective status:
      // If directly assigned, we trust the parent task's main status.
      // If only assigned via subtask, we check the subtasks' effective statuses.
      let effectiveStatus = task.status;
      if (!isDirectlyAssigned && hasUserSubtasks) {
        if (userSubtasks.some((s) => s.status === "in_progress")) {
          effectiveStatus = "in_progress";
        } else if (
          userSubtasks.every((s) =>
            ["completed", "review_pending", "pending_approval", "handover"].includes(
              s.status || ""
            )
          )
        ) {
          effectiveStatus = "completed";
        } else {
          effectiveStatus = "pending";
        }
      }

      const subtasksWithDates = userSubtasks.filter((s) => s.due_date);
      const earliestDueDate =
        subtasksWithDates.length > 0
          ? subtasksWithDates.sort(
              (a, b) =>
                new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
            )[0].due_date
          : task.due_date;

      return {
        ...task,
        status: effectiveStatus,
        due_date: earliestDueDate,
        subtasks: userSubtasks,
      };
    })
    .filter((t) => t !== null && ["completed", "review_pending", "pending_approval"].includes(t.status));

    // Sort by updated_at or created_at desc (most recently completed first)
    return list.sort(
      (a, b) =>
        new Date(b.updated_at || b.created_at).getTime() -
        new Date(a.updated_at || a.created_at).getTime()
    );
  }, [tasksData, subtasksData, userId]);

  // Real-time updates subscription
  useRealtimeSubscription({
    table: "staff_tasks",
    onInsert: () => refetchTasks(),
    onUpdate: () => refetchTasks(),
  });

  useRealtimeSubscription({
    table: "staff_subtasks",
    onInsert: () => refetchSubtasks(),
    onUpdate: () => refetchSubtasks(),
  });

  const getFileUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const { data } = supabase.storage.from("task-attachments").getPublicUrl(path);
    return data.publicUrl;
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
    }
  };

  // Group subtasks of a completed task by stage
  const selectedTaskStages = useMemo(() => {
    if (!selectedTask) return [];
    
    const subtaskList = selectedTask.subtasks || [];
    
    // Fallback virtual stage for tasks without subtasks (directly assigned tasks)
    if (subtaskList.length === 0) {
      return [{
        stageNumber: 1,
        stageName: selectedTask.stage_names?.['1'] || "General Execution",
        subtasks: [{
          id: selectedTask.id,
          title: "Complete Task Objectives",
          status: "completed",
          stage: 1
        }]
      }];
    }

    const stages: Record<number, any[]> = {};
    subtaskList.forEach((st: any) => {
      const sNum = st.stage || 1;
      if (!stages[sNum]) stages[sNum] = [];
      stages[sNum].push(st);
    });

    const stageNames: Record<number, string> = {
      1: "Discovery",
      2: "Design",
      3: "Development",
      4: "Testing",
      5: "Review",
    };

    return Object.entries(stages)
      .map(([sNum, subs]) => ({
        stageNumber: Number(sNum),
        stageName: stageNames[Number(sNum)] || `Stage ${sNum}`,
        subtasks: subs,
      }))
      .sort((a, b) => a.stageNumber - b.stageNumber);
  }, [selectedTask]);

  // Aggregate files and links across both the main task and all subtasks
  const aggregatedFilesAndLinks = useMemo(() => {
    if (!selectedTask) return { files: [], links: [] };

    // Combine task level attachments with all subtask level attachments
    const allAttachments = [
      ...(Array.isArray(selectedTask.attachments) ? selectedTask.attachments : []),
      ...(selectedTask.subtasks || []).flatMap((st: any) =>
        Array.isArray(st.attachments) ? st.attachments : []
      ),
    ];

    const uniqueAttachments: any[] = [];
    const seenUrls = new Set<string>();

    allAttachments.forEach((att) => {
      const urlKey = att.url || att.file_url || att.publicUrl;
      const nameKey = att.name || att.file_name;
      const identifier = urlKey || nameKey;
      if (identifier && !seenUrls.has(identifier)) {
        seenUrls.add(identifier);
        uniqueAttachments.push(att);
      }
    });

    // Separate links (url-based attachments) from actual download files
    const links = uniqueAttachments.filter(
      (att: any) => att.type === "url" || att.url?.startsWith("http")
    );
    const files = uniqueAttachments.filter(
      (att: any) => att.type !== "url" && !att.url?.startsWith("http")
    );

    return { files, links };
  }, [selectedTask]);

  // Compute Task Efficiency, Late subtasks and custom AI performance audit
  const auditMetrics = useMemo(() => {
    if (!selectedTask) return null;

    const subtasksList = selectedTask.subtasks || [];
    const totalCount = subtasksList.length;

    // Check how many subtasks were completed past their individual due date
    const lateSubtasks = subtasksList.filter((st: any) => {
      if (!st.due_date) return false;
      const targetDate = new Date(st.due_date);
      const completionDate = st.completed_at
        ? new Date(st.completed_at)
        : st.updated_at
        ? new Date(st.updated_at)
        : new Date();
      return completionDate > targetDate;
    });

    // Check if the overall task itself was completed late
    const isTaskLate = selectedTask.due_date
      ? (() => {
          const targetDate = new Date(selectedTask.due_date);
          const completionDate = selectedTask.completed_at
            ? new Date(selectedTask.completed_at)
            : selectedTask.updated_at
            ? new Date(selectedTask.updated_at)
            : new Date();
          return completionDate > targetDate;
        })()
      : false;

    const lateCount = lateSubtasks.length;
    const punctualityRate =
      totalCount > 0 ? Math.round(((totalCount - lateCount) / totalCount) * 100) : 100;

    let tier = "S-Tier";
    let tierColor = "text-amber-400 border-amber-500/30 bg-amber-500/10";
    let ratingLabel = "Immaculate Execution";
    let narrative =
      "Incredible performance! Every milestone and subtask was carried out exactly on or before the due date, demonstrating superb focus and excellent operational speed. Standard procedures were strictly adhered to, resulting in peak timeline integrity.";
    let recommendation =
      "Establish this flow sequence as the standard golden template for future sprints in this category. Keep up this magnificent pace!";

    if (totalCount === 0) {
      tier = "S-Tier";
      tierColor = "text-amber-400 border-amber-500/30 bg-amber-500/10";
      ratingLabel = "Task Completed Successfully";
      narrative = "Perfect completion! This task was directly delivered without sub-dependency blocks, showing high individual efficiency and excellent work turnaround.";
      recommendation = "Maintain this swift operational momentum!";
    } else if (punctualityRate < 100 && punctualityRate >= 70) {
      tier = "A-Tier";
      tierColor = "text-purple-400 border-purple-500/30 bg-purple-500/10";
      ratingLabel = "High Operational Competence";
      narrative = `Excellent execution. Out of ${totalCount} assigned subtasks, only ${lateCount} minor scheduling delay was logged, but recovery response was near-instantaneous. The project requirements were delivered with fantastic final compliance and quality.`;
      recommendation =
        "For future missions, initiate stage handovers 12 hours earlier to insulate final review workflows from unexpected bottlenecks.";
    } else if (punctualityRate < 70) {
      tier = "B-Tier";
      tierColor = "text-blue-400 border-blue-500/30 bg-blue-500/10";
      ratingLabel = "Standard Milestone Delivery";
      narrative = `Task successfully brought to completion and verified. However, multiple sub-milestones (${lateCount} out of ${totalCount} subtasks) experienced scheduling offsets. Punctuality requires stabilization.`;
      recommendation =
        "Use intermediate milestones checklist locking to ensure blocking dependencies are unlocked sequentially and prevent bottleneck compression near the final deadline.";
    }

    return {
      totalCount,
      lateCount,
      isTaskLate,
      punctualityRate,
      tier,
      tierColor,
      ratingLabel,
      narrative,
      recommendation,
    };
  }, [selectedTask]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[960px] max-h-[92vh] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/90 border-purple-500/30 text-white p-0 overflow-hidden shadow-2xl flex flex-col">
          {/* Header */}
          <DialogHeader className="px-6 py-4 bg-gradient-to-r from-purple-600/20 via-indigo-600/15 to-blue-600/20 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/10">
                  <Trophy className="h-5 w-5 text-amber-300 animate-pulse" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    Mission Accomplished
                  </DialogTitle>
                  <p className="text-xs text-white/50">
                    Your roadmap of completed milestones and reward points
                  </p>
                </div>
              </div>
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10 rounded-lg">
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>

          {/* Dialog Main Content - Side-by-Side Panels */}
          <div className="flex-1 flex flex-col md:flex-row min-h-0">
            {/* Left Panel - Roadmap Timeline */}
            <div className="flex-1 border-r border-white/10 flex flex-col min-h-0 bg-black/10">
              <div className="p-4 bg-white/[0.02] border-b border-white/5 flex items-center justify-between shrink-0">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Milestone className="h-3.5 w-3.5" />
                  Missions Timeline
                </span>
                <span className="text-xs text-white/40 font-semibold">
                  {completedTasks.length} Completed
                </span>
              </div>

              <ScrollArea className="flex-1 p-6">
                {completedTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="p-4 bg-white/5 rounded-full border border-dashed border-white/10">
                      <Target className="w-12 h-12 text-white/20" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white/80">No completed tasks yet</h4>
                      <p className="text-xs text-white/40 max-w-[200px] mt-1">
                        Completed subtasks and missions will appear on this roadmap.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative pl-8 space-y-8 pb-4">
                    {/* Glowing vertical line connector */}
                    <div className="absolute left-[15px] top-2 bottom-6 w-0.5 bg-gradient-to-b from-purple-500 via-indigo-500 to-blue-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />

                    {completedTasks.map((task, idx) => {
                      const isSelected = selectedTask?.id === task.id;
                      const dateStr = task.updated_at || task.created_at
                        ? format(new Date(task.updated_at || task.created_at), "MMM dd, yyyy")
                        : "—";

                      return (
                        <div
                          key={task.id}
                          className="relative cursor-pointer group"
                          onClick={() => setSelectedTask(task)}
                        >
                          {/* Milestone node marker */}
                          <div
                            className={`absolute left-[-25px] top-1.5 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 z-10 ${
                              isSelected
                                ? "bg-amber-400 border-amber-300 scale-110 shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                                : "bg-slate-900 border-purple-500 group-hover:border-purple-300 shadow-[0_0_8px_rgba(139,92,246,0.3)]"
                            }`}
                          >
                            <CheckCircle2
                              className={`h-3.5 w-3.5 ${
                                isSelected ? "text-slate-950 font-bold" : "text-purple-400 group-hover:text-purple-300"
                              }`}
                            />
                          </div>

                          {/* Task summary card */}
                          <div
                            className={`p-4 rounded-xl border transition-all duration-300 ${
                              isSelected
                                ? "bg-purple-500/10 border-purple-500/40 shadow-lg shadow-purple-500/5 translate-x-1"
                                : "bg-white/5 border-white/10 group-hover:bg-white/[0.08] group-hover:border-white/20"
                            }`}
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div className="space-y-1">
                                <span className="text-[9px] font-bold text-purple-400 tracking-wider flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  COMPLETED {dateStr.toUpperCase()}
                                </span>
                                <h4 className="font-bold text-white group-hover:text-purple-300 transition-colors text-sm line-clamp-1">
                                  {task.title}
                                </h4>
                              </div>
                              <Badge
                                variant="outline"
                                className="bg-amber-500/10 border-amber-500/25 text-amber-400 text-[10px] shrink-0 font-bold px-2 py-0.5"
                              >
                                +{task.points} Coins
                              </Badge>
                            </div>
                            {task.description && (
                              <p className="text-white/50 text-xs mt-2 line-clamp-2 leading-relaxed">
                                {task.description}
                              </p>
                            )}

                            {/* Subtask count count */}
                            <div className="flex items-center gap-2 mt-3 text-[10px] text-white/40">
                              <Layers className="h-3.5 w-3.5 text-purple-500" />
                              <span>
                                {task.subtasks?.length || 0} Subtasks Accomplished
                              </span>
                              <ChevronRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Right Panel - Milestone Task Details */}
            <div className="w-full md:w-[500px] flex flex-col min-h-0 bg-slate-950/40 border-l border-white/5">
              {selectedTask ? (
                <div className="h-full flex flex-col min-h-0">
                  {/* Detailed Title */}
                  <div className="p-5 border-b border-white/10 bg-white/[0.01] shrink-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[9px] font-bold px-2 py-0.5">
                        COMPLETED
                      </Badge>
                      {selectedTask.trial_period && (
                        <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 text-[9px]">
                          Trial Mission
                        </Badge>
                      )}
                      <span className="text-[10px] text-white/40 ml-auto flex items-center gap-1 font-mono">
                        <TrendingUp className="h-3 w-3 text-purple-400" /> +{selectedTask.points} Points Assigned
                      </span>
                    </div>
                    <h3 className="font-extrabold text-white text-base leading-snug">
                      {selectedTask.title}
                    </h3>
                  </div>

                  <ScrollArea className="flex-1 p-5 space-y-6">
                    {/* AI Performance Audit & Summary */}
                    {auditMetrics && (
                      <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-600/10 via-indigo-950/20 to-blue-600/10 p-4 space-y-3 shadow-lg shadow-violet-500/5 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-violet-300 uppercase tracking-wider">
                            <Sparkles className="h-4 w-4 text-violet-400 animate-spin-slow" />
                            AI Performance Audit
                          </div>
                          <Badge
                            className={`text-[10px] font-extrabold px-2 py-0.5 border border-purple-500/20 ${auditMetrics.tierColor}`}
                          >
                            {auditMetrics.tier} Medal
                          </Badge>
                        </div>

                        {/* Audit Details */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] bg-black/40 p-2.5 rounded-lg border border-white/5">
                          <div className="space-y-0.5">
                            <span className="text-white/40 block">Timeline Audit</span>
                            <span
                              className={`font-semibold ${
                                auditMetrics.isTaskLate ? "text-orange-400" : "text-emerald-400"
                              }`}
                            >
                              {auditMetrics.isTaskLate ? "Completed Late" : "Completed On Time"}
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-white/40 block">Punctuality Rate</span>
                            <span className="font-semibold text-white">
                              {auditMetrics.punctualityRate}% On Time
                            </span>
                          </div>
                          <div className="col-span-2 border-t border-white/5 my-1.5" />
                          <div className="space-y-0.5">
                            <span className="text-white/40 block">Coins Awarded</span>
                            <span className="font-semibold text-amber-400 font-mono">
                              +{selectedTask.points} Coins
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-white/40 block">Delayed Subtasks</span>
                            <span
                              className={`font-semibold ${
                                auditMetrics.lateCount > 0 ? "text-orange-400" : "text-emerald-400"
                              }`}
                            >
                              {auditMetrics.lateCount} of {auditMetrics.totalCount} Late
                            </span>
                          </div>
                        </div>

                        {/* Narrative analysis */}
                        <div className="text-xs text-white/70 leading-relaxed italic border-l-2 border-violet-500/50 pl-3">
                          "{auditMetrics.narrative}"
                        </div>

                        {/* Recommendations */}
                        <div className="text-[10px] text-violet-200/60 bg-purple-500/5 p-2 rounded border border-purple-500/10 leading-relaxed">
                          <span className="font-bold text-violet-300 block mb-0.5">AI Recommendation:</span>
                          {auditMetrics.recommendation}
                        </div>
                      </div>
                    )}

                    {/* Description Card */}
                    {selectedTask.description && (
                      <div className="space-y-1.5">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-1.5">
                          <FileText className="h-3 w-3 text-purple-400" /> Description
                        </h4>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs text-white/80 leading-relaxed whitespace-pre-wrap">
                          {selectedTask.description}
                        </div>
                      </div>
                    )}

                    {/* Sequential Stages Roadmap - Milestone style */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-1.5">
                        <Milestone className="h-3 w-3 text-indigo-400" /> Task Milestone Roadmap
                      </h4>
                      <div className="space-y-4">
                        {selectedTaskStages.map((stageObj, sIdx) => (
                          <div
                            key={stageObj.stageNumber}
                            className="relative pl-6 space-y-2 border-l border-dashed border-white/15 pb-2 last:pb-0"
                          >
                            {/* Roadmap Node Dot */}
                            <div className="absolute left-[-5px] top-1 h-2.5 w-2.5 rounded-full bg-indigo-400 ring-4 ring-indigo-500/10" />

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-indigo-300 uppercase">
                                {stageObj.stageName}
                              </span>
                            </div>

                            {/* Subtasks inside this Stage */}
                            <div className="space-y-1.5">
                              {stageObj.subtasks.map((st: any) => {
                                const isStLate = st.due_date && (() => {
                                  const targetDate = new Date(st.due_date);
                                  const completionDate = st.completed_at
                                    ? new Date(st.completed_at)
                                    : st.updated_at
                                    ? new Date(st.updated_at)
                                    : new Date();
                                  return completionDate > targetDate;
                                })();

                                return (
                                  <div
                                    key={st.id}
                                    className="flex items-center justify-between p-2.5 bg-black/35 rounded-lg border border-white/5 text-xs"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                                      <span className="text-white/80 truncate font-medium">
                                        {st.title}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {isStLate && (
                                        <Badge className="bg-orange-500/10 text-orange-400 border-none text-[8px] font-semibold">
                                          Delayed
                                        </Badge>
                                      )}
                                      <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[8px] font-bold">
                                        Done
                                      </Badge>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Aggregated File Attachments Section */}
                    {aggregatedFilesAndLinks.files.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-blue-400" /> Aggregated File Attachments ({aggregatedFilesAndLinks.files.length})
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                          {aggregatedFilesAndLinks.files.map((file: any, i: number) => {
                            const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name || file.file_name);
                            const url = getFileUrl(file.url || file.file_url);
                            const fileName = file.name || file.file_name || "Attachment";

                            return (
                              <div
                                key={i}
                                className="flex items-center justify-between bg-black/20 rounded-lg p-2.5 border border-white/5 hover:border-blue-500/35 transition-colors group cursor-pointer"
                                onClick={() => isImg && setPreviewAttachment({ name: fileName, publicUrl: url })}
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  {isImg ? (
                                    <div className="h-8 w-8 rounded overflow-hidden border border-white/10 shrink-0">
                                      <img src={url} alt={fileName} className="h-full w-full object-cover group-hover:scale-110 transition-transform" />
                                    </div>
                                  ) : (
                                    <div className="p-1.5 bg-blue-500/10 rounded border border-blue-500/20 shrink-0">
                                      <FileText className="h-3.5 w-3.5 text-blue-400" />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <span className="text-xs text-white/80 font-medium truncate block">
                                      {fileName}
                                    </span>
                                    {file.size && (
                                      <span className="text-[9px] text-white/40">
                                        {(file.size / 1024).toFixed(0)} KB
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  {isImg && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-blue-300 hover:bg-blue-500/20 h-7 w-7 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewAttachment({ name: fileName, publicUrl: url });
                                      }}
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-blue-300 hover:bg-blue-500/20 h-7 w-7 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadAttachment(file);
                                    }}
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Aggregated Connected Links Section */}
                    {aggregatedFilesAndLinks.links.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-1.5">
                          <LinkIcon className="h-3.5 w-3.5 text-sky-400" /> Connected Links & Resources ({aggregatedFilesAndLinks.links.length})
                        </h4>
                        <div className="space-y-2">
                          {aggregatedFilesAndLinks.links.map((link: any, i: number) => (
                            <a
                              key={i}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 bg-sky-500/5 border border-sky-500/20 rounded-lg p-2.5 hover:bg-sky-500/10 hover:border-sky-500/30 transition-all group"
                            >
                              <div className="p-2 bg-sky-500/15 rounded-lg shrink-0">
                                <LinkIcon className="h-3.5 w-3.5 text-sky-400 group-hover:rotate-45 transition-transform" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-white/90 truncate group-hover:text-sky-300 transition-colors">
                                  {link.name || "Resource Link"}
                                </p>
                                <p className="text-[9px] text-white/40 truncate">
                                  {link.url}
                                </p>
                              </div>
                              <ArrowRight className="h-3.5 w-3.5 text-sky-400/40 group-hover:text-sky-300 shrink-0 transition-all group-hover:translate-x-0.5" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Comments Section */}
                    {selectedTask.comments &&
                      Array.isArray(selectedTask.comments) &&
                      selectedTask.comments.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-1.5">
                            <MessageSquare className="h-3.5 w-3.5 text-amber-400" /> Comments & Notes
                          </h4>
                          <div className="space-y-2">
                            {selectedTask.comments.map((c: any, i: number) => (
                              <div
                                key={i}
                                className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-white/80"
                              >
                                <div className="flex justify-between items-center mb-1 text-[10px] text-white/40">
                                  <span className="font-semibold text-white/60">
                                    {c.user_name || "Staff"}
                                  </span>
                                  <span>
                                    {c.created_at || c.timestamp
                                      ? format(new Date(c.created_at || c.timestamp), "MMM dd, HH:mm")
                                      : ""}
                                  </span>
                                </div>
                                <p className="leading-relaxed">{c.text || c.message}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </ScrollArea>

                  {/* Actions Footer */}
                  <div className="p-4 border-t border-white/10 bg-black/40 shrink-0">
                    <Button
                      onClick={() => setShowFullDetail(true)}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-lg shadow-purple-500/10 rounded-xl py-4 h-10 border-none"
                    >
                      <Award className="h-4 w-4 mr-2" />
                      OPEN IN WORKSPACE VIEW
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <Milestone className="h-10 w-10 text-white/20 animate-bounce" />
                  <div>
                    <h4 className="text-sm font-semibold text-white/80">Select a Milestone</h4>
                    <p className="text-xs text-white/40 max-w-[200px] mt-1">
                      Click any task node on the roadmap timeline to view the full sequential stages roadmap, AI performance summaries, files, and resources.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Details Dialog (Standard workspace view) */}
      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          open={showFullDetail}
          onOpenChange={setShowFullDetail}
          onStatusUpdate={() => refetch()}
          userId={userId}
          mode="dialog"
          isTeamHead={!!userProfile?.is_department_head}
        />
      )}

      {/* File Lightbox Dialog */}
      <Dialog open={!!previewAttachment} onOpenChange={() => setPreviewAttachment(null)}>
        <DialogContent className="max-w-4xl bg-black/95 border-white/10 p-0 overflow-hidden shadow-2xl z-[80] flex flex-col">
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
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/10 text-white hover:bg-white/10"
                  onClick={() => handleDownloadAttachment(previewAttachment)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white/50 hover:text-white"
                  onClick={() => setPreviewAttachment(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center p-4 min-h-[300px] max-h-[80vh] overflow-auto bg-black/40">
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
