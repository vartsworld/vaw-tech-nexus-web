import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Monitor,
  Coffee,
  Users,
  MessageCircle,
  Coins,
  Bell,
  Clock,
  Briefcase,
  User,
  TrendingUp,
  ChevronRight,
  LogOut,
  Home,
  Flame,
  CheckCircle
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type RoomType = 'home' | 'workspace' | 'breakroom' | 'meeting';

interface StaffMobileHomeProps {
  profile: any;
  currentRoom: RoomType;
  onRoomChange: (room: RoomType) => void;
  onOpenChat?: () => void;
  onOpenCoins?: () => void;
  onEnterWorkspace: () => void;
}

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  points: number;
  assigned_by: string;
  created_at: string;
  due_date?: string;
  due_time?: string;
  trial_period?: boolean;
  comments?: any;
  attachments?: any;
  client_project_id?: string;
  project_title?: string;
  timer_started_at?: string;
  current_stage?: number;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

const getGreetingEmoji = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "☀️";
  if (hour < 17) return "🌤️";
  return "🌙";
};

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] },
});

const StaffMobileHome = ({
  profile,
  currentRoom,
  onRoomChange,
  onOpenChat,
  onOpenCoins,
  onEnterWorkspace,
}: StaffMobileHomeProps) => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [completedToday, setCompletedToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [activeNav, setActiveNav] = useState("home");
  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const coinsBalance = profile?.total_points || 0;
  const streak = profile?.attendance_streak || 0;

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    if (!profile?.user_id) return;
    setLoading(true);
    try {
      // 1. Fetch all subtasks assigned to this user with their parent tasks
      const { data: subtasks, error } = await supabase
        .from("staff_subtasks")
        .select("*, staff_tasks(*)")
        .eq("assigned_to", profile.user_id);

      if (error) throw error;

      const subtaskItems = (subtasks as any[]) || [];
      
      // 2. Group by task_id to find unique parent tasks
      const taskGroups: Record<string, any[]> = {};
      subtaskItems.forEach(st => {
        if (!st.task_id || !st.staff_tasks) return;
        if (!taskGroups[st.task_id]) taskGroups[st.task_id] = [];
        taskGroups[st.task_id].push(st);
      });

      // 3. Map to TaskItem interface, deriving status/dates from subtasks
      const taskItems: TaskItem[] = Object.entries(taskGroups).map(([taskId, subs]) => {
        const parent = subs[0].staff_tasks;
        
        // Determine "effective" status for this user's view
        // Priority: in_progress > pending > completed
        let effectiveStatus = "pending";
        if (subs.some(s => s.status === 'in_progress')) {
          effectiveStatus = 'in_progress';
        } else if (subs.every(s => ['completed', 'review_pending', 'pending_approval', 'handover'].includes(s.status || ''))) {
          effectiveStatus = 'completed';
        }

        // Use earliest due date from assigned subtasks
        const subtasksWithDates = subs.filter(s => s.due_date);
        const earliestDueDate = subtasksWithDates.length > 0 
          ? subtasksWithDates.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0].due_date 
          : parent.due_date;

        // Check for overdue (if not completed and date passed)
        const isPastDue = earliestDueDate && new Date(earliestDueDate) < new Date(new Date().setHours(0,0,0,0));
        if (effectiveStatus !== 'completed' && isPastDue) {
          effectiveStatus = 'overdue';
        }

        return {
          id: parent.id,
          title: parent.title,
          description: parent.description,
          status: effectiveStatus,
          priority: parent.priority,
          points: parent.points,
          assigned_by: parent.assigned_by,
          created_at: parent.created_at,
          due_date: earliestDueDate,
          due_time: parent.due_time,
          trial_period: parent.trial_period,
          client_project_id: parent.client_project_id,
          project_title: parent.title, // Default to parent title
          current_stage: parent.current_stage,
        };
      });

      // 4. Fetch project titles for context
      const projectIds = [...new Set(taskItems.filter(t => t.client_project_id).map(t => t.client_project_id!))];
      if (projectIds.length > 0) {
        const { data: projects } = await supabase
          .from("client_projects")
          .select("id, title")
          .in("id", projectIds);
        if (projects) {
          const projectMap = Object.fromEntries(projects.map(p => [p.id, p.title]));
          taskItems.forEach(t => {
            if (t.client_project_id) t.project_title = projectMap[t.client_project_id] || t.project_title;
          });
        }
      }

      setTasks(taskItems);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  }, [profile?.user_id]);

  // Fetch completed today count
  const fetchCompletedToday = useCallback(async () => {
    if (!profile?.user_id) return;
    const today = new Date().toISOString().split("T")[0];
    const { count } = await supabase
      .from("staff_subtasks")
      .select("id", { count: "exact", head: true })
      .eq("assigned_to", profile.user_id)
      .eq("status", "completed" as any)
      .gte("completed_at", today + "T00:00:00");
    setCompletedToday(count || 0);
  }, [profile?.user_id]);

  // Fetch unread notifications
  const fetchNotifications = useCallback(async () => {
    if (!profile?.user_id) return;
    const { data } = await supabase
      .from("staff_notifications")
      .select("id, read_by, expires_at")
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (data) {
      const activeNotifications = data.filter(n => 
        !n.expires_at || new Date(n.expires_at) > new Date()
      );
      const unreadCount = activeNotifications.filter(n => !n.read_by?.includes(profile.user_id)).length;
      setUnreadNotifications(unreadCount);
    }
  }, [profile?.user_id]);

  useEffect(() => {
    fetchTasks();
    fetchCompletedToday();
    fetchNotifications();
  }, [fetchTasks, fetchCompletedToday, fetchNotifications]);

  // Real-time subscription for task updates
  useEffect(() => {
    if (!profile?.user_id) return;
    const channel = supabase
      .channel("mobile-home-tasks")
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_tasks" }, () => {
        fetchTasks();
        fetchCompletedToday();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_notifications", filter: `user_id=eq.${profile.user_id}` }, () => {
        fetchNotifications();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.user_id, fetchTasks, fetchCompletedToday, fetchNotifications]);

  const overdueTasks = useMemo(() => tasks.filter((t) => t.status === "overdue"), [tasks]);
  const upcomingTasks = useMemo(() => tasks.filter((t) => t.status === "pending"), [tasks]);
  const currentTasks = useMemo(() => tasks.filter((t) => t.status === "in_progress"), [tasks]);
  const submittedTasks = useMemo(() => tasks.filter((t) => ["completed", "review_pending", "pending_approval", "handover"].includes(t.status)), [tasks]);
  
  const totalTasks = overdueTasks.length + upcomingTasks.length + currentTasks.length + completedToday;

  const handleTaskClick = (task: TaskItem) => {
    navigate(`/staff/task/${task.id}`);
  };

  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    await supabase.from("staff_tasks").update({ status: newStatus as any, updated_at: new Date().toISOString() }).eq("id", taskId);
    fetchTasks();
    fetchCompletedToday();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out");
    navigate("/staff/login");
  };

  const navItems = [
    { id: "workspace", label: "Work", icon: Briefcase, action: () => navigate("/staff/work") },
    { id: "chat", label: "Chat", icon: MessageCircle, action: onOpenChat },
    { id: "home", label: "Home", icon: Home },
    { id: "coins", label: "Coins", icon: Coins, action: () => navigate("/mycoins") },
    { id: "profile", label: "Profile", icon: User, action: () => navigate("/account") },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-destructive/15 text-destructive border-destructive/20";
      case "high": return "bg-orange-500/15 text-orange-400 border-orange-500/20";
      case "medium": return "bg-primary/15 text-primary border-primary/20";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  // Calculate subtask-based progress for in-progress tasks (only for subtasks assigned to me)
  const [taskProgress, setTaskProgress] = useState<Record<string, number>>({});
  useEffect(() => {
    const fetchProgress = async () => {
      const ipIds = currentTasks.map(t => t.id);
      if (ipIds.length === 0 || !profile?.user_id) return;
      const { data: subtasks } = await supabase
        .from("staff_subtasks")
        .select("task_id, status")
        .eq("assigned_to", profile.user_id)
        .in("task_id", ipIds);
      if (!subtasks) return;
      const map: Record<string, { total: number; done: number }> = {};
      subtasks.forEach(st => {
        if (!map[st.task_id]) map[st.task_id] = { total: 0, done: 0 };
        map[st.task_id].total++;
        if (["completed", "review_pending", "pending_approval", "handover"].includes(st.status)) map[st.task_id].done++;
      });
      const progress: Record<string, number> = {};
      Object.entries(map).forEach(([id, { total, done }]) => {
        progress[id] = total > 0 ? Math.round((done / total) * 100) : 0;
      });
      setTaskProgress(progress);
    };
    fetchProgress();
  }, [currentTasks, profile?.user_id]);

  return (
    <div className="lg:hidden min-h-screen bg-background flex flex-col relative">
      {/* Top Header */}
      <div className="px-5 pt-10 pb-2">
        {/* Profile Row */}
        <motion.div {...fadeUp(0.05)} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Avatar className="w-11 h-11 border-2 border-emerald-500/20">
              <AvatarImage src={profile?.profile_photo_url || profile?.avatar_url} />
              <AvatarFallback className="bg-emerald-500/10 text-emerald-400 text-sm font-bold">
                {profile?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <motion.p {...fadeUp(0.1)} className="text-muted-foreground text-xs font-medium">
                {getGreeting()} {getGreetingEmoji()}
              </motion.p>
              <motion.h1 {...fadeUp(0.15)} className="text-xl font-bold text-foreground tracking-tight leading-tight">
                {firstName}
              </motion.h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              {...fadeUp(0.12)}
              onClick={() => { /* could open notifications */ }}
              className="relative w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center"
            >
              <Bell className="w-4 h-4 text-muted-foreground" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive rounded-full text-[9px] font-bold text-destructive-foreground flex items-center justify-center">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              )}
            </motion.button>
            <motion.button
              {...fadeUp(0.14)}
              onClick={handleLogout}
              className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center"
            >
              <LogOut className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          </div>
        </motion.div>

        {/* Quick Stats Row */}
        <motion.div {...fadeUp(0.2)} className="flex items-center gap-2 mt-4">
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1.5">
            <Coins className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400">{coinsBalance.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-600/10 border border-emerald-600/20 rounded-full px-3 py-1.5">
            <Flame className="w-3.5 h-3.5 text-emerald-300" />
            <span className="text-xs font-bold text-emerald-300">{streak}d streak</span>
          </div>
        </motion.div>

        {/* Task Summary Card */}
        <motion.div
          {...fadeUp(0.25)}
          className="mt-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-5 relative overflow-hidden shadow-lg shadow-emerald-500/20"
        >
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/8 blur-2xl" />
          <div className="absolute right-3 bottom-2 w-20 h-20 rounded-full bg-white/5" />

          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest mb-1.5">
                Today's Tasks
              </p>
              <div className="flex items-end gap-1.5">
                <span className="text-4xl font-black text-white leading-none">
                  {completedToday}
                </span>
                <span className="text-white/50 text-lg font-semibold mb-0.5">
                  /{totalTasks}
                </span>
              </div>
              <p className="text-white/40 text-[10px] mt-1.5 font-medium">
                {currentTasks.length} current · {upcomingTasks.length} upcoming
              </p>
            </div>
            <div className="w-16 h-16 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <ClipboardIcon className="w-7 h-7 text-white/80" />
            </div>
          </div>

          {totalTasks > 0 && (
            <div className="mt-3 relative z-10">
              <div className="h-1.5 bg-white/15 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${totalTasks > 0 ? (completedToday / totalTasks) * 100 : 0}%` }}
                  transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                  className="h-full bg-white/40 rounded-full"
                />
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Scrollable Task Sections */}
      <div className="flex-1 overflow-y-auto px-5 pb-28 mt-2">
        {/* Overdue Section */}
        {overdueTasks.length > 0 && (
          <motion.div {...fadeUp(0.3)} className="mt-4 mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-red-400 flex items-center gap-1.5">
                  <Flame className="w-4 h-4" /> Overdue
                </h2>
                <span className="text-[10px] bg-red-500/20 text-red-400 rounded-full px-2 py-0.5 font-bold border border-red-500/20">
                  {overdueTasks.length}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              {overdueTasks.map((task, i) => (
                <motion.button
                  key={task.id}
                  {...fadeUp(0.35 + i * 0.05)}
                  onClick={() => handleTaskClick(task)}
                  className="w-full bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/20 rounded-[2rem] p-5 shadow-lg shadow-red-500/5 text-left active:scale-[0.98] transition-all relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Flame className="w-12 h-12 text-red-500" />
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20 uppercase tracking-tight">
                        {task.project_title || "Overdue"}
                      </span>
                    </div>
                    <Badge variant="destructive" className="text-[8px] font-black uppercase px-2 py-0.5 rounded-md animate-pulse">
                      Urgent
                    </Badge>
                  </div>
                  <p className="text-[15px] font-bold text-red-50/90 leading-snug line-clamp-1 tracking-tight mb-4">
                    {task.title}
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-red-500/10 mt-auto">
                    <div className="flex items-center gap-1.5 text-red-400 bg-red-500/10 px-2.5 py-1.5 rounded-xl">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">
                        Expired {task.due_date ? new Date(task.due_date).toLocaleDateString("en-US", { day: "numeric", month: "short" }) : ""}
                      </span>
                    </div>
                    {task.points > 0 && (
                      <div className="flex items-center gap-1.5 bg-red-500/10 px-3 py-1.5 rounded-xl border border-red-500/10">
                        <Coins className="w-3.5 h-3.5 text-red-400" />
                        <span className="text-[10px] font-black text-red-400 tracking-tight">{task.points} COINS</span>
                      </div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Current Section */}
        <motion.div {...fadeUp(0.35)}>
          <div className="flex items-center justify-between mb-3 mt-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">Current</h2>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-400 rounded-full px-2 py-0.5 font-bold">
                {currentTasks.length}
              </span>
            </div>
            {currentTasks.length > 5 && (
              <button onClick={onEnterWorkspace} className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                See all <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {currentTasks.length === 0 && !loading ? (
            <div className="text-center py-10 bg-card/30 rounded-3xl border border-dashed border-border/50">
              <div className="bg-emerald-500/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              </div>
              <p className="text-xs text-muted-foreground">All caught up! No active tasks.</p>
            </div>
          ) : loading ? (
            <div className="space-y-4">
              <div className="h-32 bg-card rounded-3xl animate-pulse" />
            </div>
          ) : (
            <div className="space-y-4">
              {currentTasks.slice(0, 6).map((task, i) => {
                const progress = taskProgress[task.id] || 0;
                return (
                  <motion.button
                    key={task.id}
                    {...fadeUp(0.4 + i * 0.05)}
                    onClick={() => handleTaskClick(task)}
                    className="w-full bg-gradient-to-br from-card to-card/50 border border-white/5 rounded-[2rem] p-5 shadow-lg shadow-black/5 text-left active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 uppercase tracking-tight">
                          {task.project_title || "Project"}
                        </span>
                        {task.current_stage && (
                          <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20 uppercase tracking-tight">
                            Stage {task.current_stage}
                          </span>
                        )}
                      </div>
                      {task.priority && (
                        <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded-md border shadow-sm", getPriorityColor(task.priority))}>
                          {task.priority}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="text-[15px] font-bold text-foreground leading-snug flex-1 line-clamp-1 tracking-tight">
                        {task.title}
                      </p>
                      <div className="text-right">
                        <span className="text-sm font-black text-emerald-400 tracking-tighter">
                          {progress}%
                        </span>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-white/5 mt-auto">
                      <div className="flex items-center gap-1.5 text-muted-foreground/80 bg-white/5 px-2.5 py-1.5 rounded-xl">
                        <Clock className="w-3.5 h-3.5 text-orange-400" />
                        <span className="text-[10px] font-medium">
                          {task.due_date
                            ? new Date(task.due_date).toLocaleDateString("en-US", { day: "numeric", month: "short" })
                            : "Ongoing"}
                        </span>
                      </div>
                      {task.points > 0 && (
                        <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/10">
                          <Coins className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[10px] font-black text-emerald-400 tracking-tight">{task.points} COINS</span>
                        </div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Upcoming Section */}
        <motion.div {...fadeUp(0.5)} className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">Upcoming</h2>
              <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-2 py-0.5 font-bold">
                {upcomingTasks.length}
              </span>
            </div>
            {upcomingTasks.length > 4 && (
              <button onClick={onEnterWorkspace} className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                See all <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {upcomingTasks.length === 0 && !loading ? (
            <div className="text-center py-8 text-muted-foreground text-xs bg-card/50 rounded-2xl border border-border/50">
              No upcoming tasks 🎉
            </div>
          ) : loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2].map(i => (
                <div key={i} className="bg-card border border-border rounded-2xl p-3.5 h-28 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {upcomingTasks.slice(0, 4).map((task, i) => (
                <motion.button
                  key={task.id}
                  {...fadeUp(0.55 + i * 0.05)}
                  onClick={() => handleTaskClick(task)}
                  className="bg-card border border-border rounded-2xl p-3.5 space-y-2 shadow-sm text-left active:scale-[0.97] transition-transform"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider truncate block flex-1">
                      {task.project_title || "Task"}
                    </span>
                    {task.priority && (
                      <span className={cn("text-[7px] font-bold uppercase px-1.5 py-0.5 rounded-full border", getPriorityColor(task.priority))}>
                        {task.priority}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2">
                    {task.title}
                  </p>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span className="text-[9px]">
                      {task.due_date
                        ? new Date(task.due_date).toLocaleDateString("en-US", { day: "numeric", month: "short" })
                        : "No due date"}
                    </span>
                  </div>
                  {task.points > 0 && (
                    <div className="flex items-center gap-1">
                      <Coins className="w-3 h-3 text-emerald-400" />
                      <span className="text-[9px] font-bold text-emerald-400">{task.points} pts</span>
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
        {/* Submitted Section */}
        <motion.div {...fadeUp(0.6)} className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">Submitted</h2>
              <span className="text-[10px] bg-blue-500/15 text-blue-400 rounded-full px-2 py-0.5 font-bold">
                {submittedTasks.length}
              </span>
            </div>
            {submittedTasks.length > 5 && (
              <button onClick={onEnterWorkspace} className="text-[10px] text-blue-400 font-semibold flex items-center gap-0.5">
                See all <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {submittedTasks.length === 0 && !loading ? (
            <div className="text-center py-8 text-muted-foreground text-xs bg-card/50 rounded-2xl border border-border/50">
              No submitted tasks
            </div>
          ) : loading ? (
            <div className="space-y-3">
              {[1].map(i => (
                <div key={i} className="bg-card border border-border rounded-2xl p-4 h-24 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3 opacity-80">
              {submittedTasks.slice(0, 6).map((task, i) => (
                <motion.button
                  key={task.id}
                  {...fadeUp(0.65 + i * 0.05)}
                  onClick={() => handleTaskClick(task)}
                  className="w-full bg-card/20 border border-white/5 rounded-2xl p-4 shadow-sm text-left active:scale-[0.98] transition-transform grayscale-[0.8]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest truncate flex-1">
                      {task.project_title || "Project"}
                    </span>
                    <Badge variant="outline" className="text-[7px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-500/5 text-blue-400/60 border-blue-500/10">
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-foreground/40 leading-snug flex-1 line-clamp-1 line-through decoration-muted-foreground/20">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-1 bg-emerald-500/5 px-2 py-1 rounded-lg">
                      <Coins className="w-2.5 h-2.5 text-emerald-400/40" />
                      <span className="text-[9px] font-black text-emerald-400/40">+{task.points}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/[0.03]">
                    <div className="flex items-center gap-1 text-muted-foreground/40">
                      <CheckCircle className="w-3 h-3" />
                      <span className="text-[9px] font-medium tracking-tight">
                        Archived
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Curved Bottom Navigation */}
      <nav className="fixed bottom-3 left-3 right-3 z-50">
        <div className="bg-card/80 backdrop-blur-2xl border border-border/30 rounded-[1.75rem] overflow-hidden shadow-xl shadow-black/10">
          <div className="flex items-center justify-around px-1 py-2 safe-area-inset-bottom">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeNav === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveNav(item.id);
                    if (item.action) item.action();
                  }}
                  className="relative flex flex-col items-center gap-0.5 py-1 px-1.5 min-w-[48px] group"
                >
                  {active && (
                    <motion.div
                      layoutId="staffNavGlow"
                      className="absolute -top-1 w-8 h-8 rounded-full bg-emerald-500/12 blur-xl"
                      transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    />
                  )}

                  <motion.div
                    animate={active ? { y: -3 } : { y: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={cn(
                      "relative w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300",
                      active ? "bg-emerald-500/12" : "group-hover:bg-muted/50"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-[17px] h-[17px] transition-all duration-300",
                        active
                          ? "text-emerald-400"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                      strokeWidth={active ? 2.2 : 1.8}
                    />

                    {active && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-emerald-400"
                      />
                    )}
                  </motion.div>

                  <motion.span
                    animate={active ? { opacity: 1 } : { opacity: 0.4 }}
                    className={cn(
                      "text-[8px] font-semibold tracking-[0.06em] uppercase transition-colors duration-300",
                      active ? "text-emerald-400" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </motion.span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
};

// Simple clipboard icon component
const ClipboardIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="M9 14l2 2 4-4" />
  </svg>
);

export default StaffMobileHome;
