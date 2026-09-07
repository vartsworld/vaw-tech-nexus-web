import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Coins,
  Bell,
  Clock,
  Briefcase,
  User,
  LogOut,
  Home,
  Flame,
  CheckCircle,
  Calendar,
  Plus,
  Play,
  Settings,
  Shield,
  Fingerprint,
  Smile,
  Check,
  ChevronRight,
  ClipboardList,
  AlertCircle,
  UserCheck,
  Video,
  Activity,
  Search,
  X,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isSameDay, parseISO } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Helper to format a Date as YYYY-MM-DD in local time
const getLocalDateKey = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to format an ISO string date as YYYY-MM-DD in local time
const getIsoDateKey = (isoStr: string | null | undefined) => {
  if (!isoStr) return '';
  try {
    if (isoStr.includes('T')) {
      const d = parseISO(isoStr);
      return getLocalDateKey(d);
    }
    return isoStr.substring(0, 10);
  } catch {
    return '';
  }
};

// Reusable Sub-views
import LeaveView from "@/components/staff/LeaveView";
import TasksManager from "./TasksManager";
import { QuickNotes } from "@/components/staff/QuickNotes";
import MiniChess from "@/components/staff/MiniChess";
import MeetingRoom from "./MeetingRoom";
import ClientOnboardingCreator from "./ClientOnboardingCreator";
import ToolsNexusView from "./ToolsNexusView";
import { ActivityLogPanel } from "./ActivityLogPanel";
import ProjectMonitor from "@/pages/ProjectMonitor";

type RoomType = 'home' | 'workspace' | 'breakroom' | 'meeting';

interface StaffMobileHomeProps {
  profile: any;
  currentRoom: string;
  onRoomChange: (room: string) => void;
  onOpenChat?: () => void;
  onOpenCoins?: () => void;
  onOpenStreakCalendar?: () => void;
  onEnterWorkspace: () => void;
  onEditProfile?: () => void;
  onUpdateEmojiPassword?: () => void;
  onManageBiometrics?: () => void;
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
  client_project_id?: string;
  project_title?: string;
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

const fadeUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" }
};

const StaffMobileHome = ({
  profile,
  currentRoom,
  onRoomChange,
  onOpenChat,
  onOpenCoins,
  onOpenStreakCalendar,
  onEnterWorkspace,
  onEditProfile,
  onUpdateEmojiPassword,
  onManageBiometrics,
}: StaffMobileHomeProps) => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [completedToday, setCompletedToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Navigation tabs: 'home' | 'tasks' | 'planner' | 'tools' | 'profile'
  const [activeTab, setActiveTab] = useState<string>("home");

  // Planner states
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());
  const [plans, setPlans] = useState<any[]>([]);
  const [plannerTasks, setPlannerTasks] = useState<any[]>([]);
  const [plannerSubtasks, setPlannerSubtasks] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [newPlanTitle, setNewPlanTitle] = useState("");
  const [plansLoading, setPlansLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>(['all']);
  const [clientFilterSearch, setClientFilterSearch] = useState('');
  const [newPlanClientId, setNewPlanClientId] = useState<string>("common");
  const [viewDetailTask, setViewDetailTask] = useState<{ type: 'task' | 'subtask'; data: any } | null>(null);

  // Tools sub-view: null | 'leave' | 'notes' | 'chess'
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const [actualCoinsBalance, setActualCoinsBalance] = useState(0);

  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const streak = profile?.attendance_streak || 0;

  useEffect(() => {
    const fetchActualCoins = async () => {
      if (!profile?.user_id) return;
      const { data } = await supabase
        .from('user_coin_transactions')
        .select('coins, amount')
        .eq('user_id', profile.user_id)
        .gte('created_at', '2026-08-01');

      const sum = data?.reduce((acc, curr) => acc + ((curr as any).coins ?? (curr as any).amount ?? 0), 0) || 0;
      setActualCoinsBalance(sum);
    };
    fetchActualCoins();
  }, [profile?.user_id]);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    if (!profile?.user_id) return;
    setLoading(true);
    try {
      const { data: subtasks, error } = await supabase
        .from("staff_subtasks")
        .select("*, staff_tasks(*)")
        .eq("assigned_to", profile.user_id);

      if (error) throw error;

      const subtaskItems = (subtasks as any[]) || [];
      const taskGroups: Record<string, any[]> = {};
      subtaskItems.forEach(st => {
        if (!st.task_id || !st.staff_tasks) return;
        if (!taskGroups[st.task_id]) taskGroups[st.task_id] = [];
        taskGroups[st.task_id].push(st);
      });

      const taskItems: TaskItem[] = Object.entries(taskGroups).map(([taskId, subs]) => {
        const parent = subs[0].staff_tasks;
        let effectiveStatus = "pending";
        if (subs.some(s => s.status === 'in_progress')) {
          effectiveStatus = 'in_progress';
        } else if (subs.every(s => ['completed', 'review_pending', 'pending_approval', 'handover'].includes(s.status || ''))) {
          effectiveStatus = 'completed';
        }

        const subtasksWithDates = subs.filter(s => s.due_date);
        const earliestDueDate = subtasksWithDates.length > 0 
          ? subtasksWithDates.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0].due_date 
          : parent.due_date;

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
          project_title: parent.title,
          current_stage: parent.current_stage,
        };
      });

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

  // Fetch plans, clients, staff members, and tasks/subtasks
  const fetchPlans = useCallback(async () => {
    if (!profile?.user_id) return;
    setPlansLoading(true);
    try {
      const [plansRes, clientsRes, staffRes, tasksRes, subtasksRes] = await Promise.all([
        supabase.from('monthly_plans').select('*'),
        supabase.from('clients').select('id, company_name'),
        supabase.from('staff_profiles').select('id, user_id, full_name, email, department_id, avatar_url'),
        supabase.from('staff_tasks').select('*'),
        supabase.from('staff_subtasks').select('*, staff_tasks(*)')
      ]);

      if (plansRes.error) throw plansRes.error;
      setPlans(plansRes.data || []);
      setClients(clientsRes.data || []);
      setStaffMembers(staffRes.data || []);
      setPlannerTasks(tasksRes.data || []);
      setPlannerSubtasks(subtasksRes.data || []);
    } catch (err) {
      console.error('Error fetching plans & tasks:', err);
    } finally {
      setPlansLoading(false);
    }
  }, [profile?.user_id]);

  useEffect(() => {
    fetchTasks();
    fetchPlans();
  }, [fetchTasks, fetchPlans]);

  // Task lists
  // ⚡ Bolt Performance Optimization: Replaced three separate O(N) .filter() array iterations
  // with a single O(N) pass to categorize current, overdue, and completed tasks
  const { currentTasks, overdueTasks, completedTasks } = useMemo(() => {
    const current: TaskItem[] = [];
    const overdue: TaskItem[] = [];
    const completed: TaskItem[] = [];

    for (const task of tasks) {
      if (task.status === "in_progress") current.push(task);
      else if (task.status === "overdue") overdue.push(task);
      else if (task.status === "completed") completed.push(task);
    }

    return { currentTasks: current, overdueTasks: overdue, completedTasks: completed };
  }, [tasks]);
  const totalTasks = tasks.length;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/staff/login");
  };

  // Toggle plan completion
  const handleTogglePlanCompletion = async (planId: string, currentCompleted: boolean | null) => {
    try {
      const { error } = await supabase
        .from('monthly_plans')
        .update({ is_completed: !currentCompleted })
        .eq('id', planId);

      if (error) throw error;

      setPlans(prev =>
        prev.map(p => p.id === planId ? { ...p, is_completed: !currentCompleted } : p)
      );
      toast.success("Plan updated successfully");
    } catch (err) {
      console.error('Error updating plan:', err);
      toast.error("Failed to update status");
    }
  };

  const handleToggleTaskCompletion = async (taskId: string, currentStatus: string) => {
    try {
      const isDone = currentStatus === 'completed';
      const nextStatus = isDone ? 'in_progress' : 'completed';
      const { error } = await supabase
        .from('staff_tasks')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) throw error;
      setPlannerTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: nextStatus } : t));
      toast.success(`Task marked as ${nextStatus === 'completed' ? 'completed' : 'in progress'}`);
    } catch (err) {
      toast.error('Failed to update task status');
    }
  };

  const handleToggleSubtaskCompletion = async (subtaskId: string, currentStatus: string) => {
    try {
      const isDone = currentStatus === 'completed';
      const nextStatus = isDone ? 'in_progress' : 'completed';
      const { error } = await supabase
        .from('staff_subtasks')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', subtaskId);

      if (error) throw error;
      setPlannerSubtasks(prev => prev.map(s => s.id === subtaskId ? { ...s, status: nextStatus } : s));
      toast.success(`Subtask marked as ${nextStatus === 'completed' ? 'completed' : 'in progress'}`);
    } catch (err) {
      toast.error('Failed to update subtask status');
    }
  };

  const handleToggleClientFilter = (clientId: string) => {
    if (clientId === 'all') {
      setSelectedClientIds(['all']);
      return;
    }

    let nextSelected = selectedClientIds.filter(id => id !== 'all');

    if (nextSelected.includes(clientId)) {
      nextSelected = nextSelected.filter(id => id !== clientId);
    } else {
      nextSelected.push(clientId);
    }

    if (nextSelected.length === 0) {
      nextSelected = ['all'];
    }

    setSelectedClientIds(nextSelected);
  };

  // Add a plan
  const handleAddPlan = async () => {
    if (!selectedDate || !newPlanTitle.trim()) return;
    try {
      const { data, error } = await supabase
        .from('monthly_plans')
        .insert({
          date: format(selectedDate, 'yyyy-MM-dd'),
          title: newPlanTitle.trim(),
          description: "",
          created_by: profile?.user_id,
          department_id: profile?.department_id,
          assigned_staff: [],
          color: '#10b981',
          client_id: newPlanClientId === 'common' ? null : newPlanClientId
        })
        .select()
        .single();

      if (error) throw error;

      setPlans(prev => [...prev, data]);
      setNewPlanTitle("");
      setNewPlanClientId("common");
      toast.success("Plan added");
    } catch (err) {
      console.error('Error adding plan:', err);
      toast.error("Failed to add plan");
    }
  };

  const isLead =
    profile?.role === 'team_head' ||
    profile?.role === 'lead' ||
    profile?.role === 'manager' ||
    profile?.role === 'admin' ||
    profile?.role === 'super_admin' ||
    profile?.is_department_head;

  // Filter plans, tasks, subtasks based on selected client filter
  const { filteredPlans, filteredPlannerTasks, filteredPlannerSubtasks } = useMemo(() => {
    // 1. If specific clients are selected in the filter
    if (!selectedClientIds.includes('all')) {
      const nextPlans = plans.filter(p => {
        if (!p.client_id || p.client_id === 'common') return selectedClientIds.includes('common');
        return selectedClientIds.includes(p.client_id);
      });

      const nextTasks = plannerTasks.filter(t => {
        if (!t.client_id || t.client_id === 'common' || t.client_id === 'no-client') return selectedClientIds.includes('common');
        return selectedClientIds.includes(t.client_id);
      });

      const nextSubtasks = plannerSubtasks.filter(s => {
        const parentTask = s.staff_tasks;
        const cId = parentTask?.client_id;
        if (!cId || cId === 'common' || cId === 'no-client') return selectedClientIds.includes('common');
        return selectedClientIds.includes(cId);
      });

      return {
        filteredPlans: nextPlans,
        filteredPlannerTasks: nextTasks,
        filteredPlannerSubtasks: nextSubtasks
      };
    }

    // 2. If 'all' is selected:
    if (isLead) {
      return {
        filteredPlans: plans,
        filteredPlannerTasks: plannerTasks,
        filteredPlannerSubtasks: plannerSubtasks
      };
    }

    // For regular staff members when 'all' is selected:
    const userDept = profile?.department_id;
    const userId = profile?.user_id;

    const nextTasks = plannerTasks.filter(task => {
      if (task.department_id && userDept && task.department_id === userDept) return true;
      const stageConfig = task.stage_config ? (typeof task.stage_config === 'string' ? JSON.parse(task.stage_config) : task.stage_config) : {};
      const targetDepts = (stageConfig as any)?.target_departments;
      if (Array.isArray(targetDepts) && userDept && targetDepts.includes(userDept)) return true;
      if (!task.client_id) return true;

      let isAssigned = false;
      if (task.assigned_to) {
        try {
          const parsed = typeof task.assigned_to === 'string' ? JSON.parse(task.assigned_to) : task.assigned_to;
          isAssigned = Array.isArray(parsed) ? parsed.includes(userId) : parsed === userId;
        } catch {
          isAssigned = String(task.assigned_to).includes(userId || '');
        }
      }
      const hasSubtask = plannerSubtasks.some((st: any) => st.task_id === task.id && st.assigned_to === userId);
      return isAssigned || hasSubtask;
    });

    const nextSubtasks = plannerSubtasks.filter((subtask: any) => {
      const parentTask = subtask.staff_tasks;
      if (!parentTask) return false;
      if (parentTask.department_id && userDept && parentTask.department_id === userDept) return true;

      let isAssignedParent = false;
      if (parentTask.assigned_to) {
        try {
          const parsed = typeof parentTask.assigned_to === 'string' ? JSON.parse(parentTask.assigned_to) : parentTask.assigned_to;
          isAssignedParent = Array.isArray(parsed) ? parsed.includes(userId) : parsed === userId;
        } catch {
          isAssignedParent = String(parentTask.assigned_to).includes(userId || '');
        }
      }
      return isAssignedParent || subtask.assigned_to === userId;
    });

    return {
      filteredPlans: plans,
      filteredPlannerTasks: nextTasks,
      filteredPlannerSubtasks: nextSubtasks
    };
  }, [plans, plannerTasks, plannerSubtasks, selectedClientIds, isLead, profile?.department_id, profile?.user_id]);

  // Group items by local date key YYYY-MM-DD
  const { plansByDate, tasksByDate, subtasksByDate } = useMemo(() => {
    const plansMap: Record<string, any[]> = {};
    const tasksMap: Record<string, any[]> = {};
    const subtasksMap: Record<string, any[]> = {};

    filteredPlans.forEach(p => {
      if (!p.date) return;
      const key = getIsoDateKey(p.date);
      if (key) {
        if (!plansMap[key]) plansMap[key] = [];
        plansMap[key].push(p);
      }
    });

    filteredPlannerTasks.forEach(t => {
      if (!t.due_date) return;
      const key = getIsoDateKey(t.due_date);
      if (key) {
        if (!tasksMap[key]) tasksMap[key] = [];
        tasksMap[key].push(t);
      }
    });

    filteredPlannerSubtasks.forEach(s => {
      if (!s.due_date) return;
      const key = getIsoDateKey(s.due_date);
      if (key) {
        if (!subtasksMap[key]) subtasksMap[key] = [];
        subtasksMap[key].push(s);
      }
    });

    return { plansByDate: plansMap, tasksByDate: tasksMap, subtasksByDate: subtasksMap };
  }, [filteredPlans, filteredPlannerTasks, filteredPlannerSubtasks]);

  const completedDateKeys = useMemo(() => {
    const greenDates = new Set<string>();
    const allDateKeys = new Set<string>([
      ...Object.keys(plansByDate),
      ...Object.keys(tasksByDate),
      ...Object.keys(subtasksByDate),
    ]);

    allDateKeys.forEach(dateKey => {
      const dayPlans = plansByDate[dateKey] || [];
      const dayTasks = tasksByDate[dateKey] || [];
      const daySubtasks = subtasksByDate[dateKey] || [];
      const total = dayPlans.length + dayTasks.length + daySubtasks.length;
      if (total === 0) return;

      const allPlansComplete = dayPlans.every(p => p.is_completed === true);
      const allTasksComplete = dayTasks.every(t => t.status === 'completed');
      const allSubtasksComplete = daySubtasks.every(s => s.status === 'completed');

      if (allPlansComplete && allTasksComplete && allSubtasksComplete) {
        greenDates.add(dateKey);
      }
    });

    return greenDates;
  }, [plansByDate, tasksByDate, subtasksByDate]);

  // Task filtering
  const [taskFilter, setTaskFilter] = useState<'all' | 'active' | 'overdue' | 'completed'>('all');
  const filteredTasks = useMemo(() => {
    if (taskFilter === 'active') return currentTasks;
    if (taskFilter === 'overdue') return overdueTasks;
    if (taskFilter === 'completed') return completedTasks;
    return tasks;
  }, [tasks, currentTasks, overdueTasks, completedTasks, taskFilter]);

  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "tasks", label: "Tasks", icon: ClipboardList },
    { id: "planner", label: "Planner", icon: Calendar },
    { id: "tools", label: "Tools", icon: Settings },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="lg:hidden min-h-screen bg-zinc-950 text-white flex flex-col relative pb-28">
      {/* Curved background lights */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />

      {/* Dynamic Tab Content */}
      <div className="flex-1 overflow-y-auto px-5 pt-8">
        <AnimatePresence mode="wait">
          {/* HOME TAB */}
          {activeTab === "home" && (
            <motion.div key="home" {...fadeUp} className="space-y-6">
              {/* Header Profile Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 border-2 border-emerald-500/20">
                    <AvatarImage src={profile?.profile_photo_url || profile?.avatar_url} />
                    <AvatarFallback className="bg-emerald-500/10 text-emerald-400 text-sm font-bold">
                      {profile?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                      {getGreeting()} {getGreetingEmoji()}
                    </p>
                    <h1 className="text-xl font-bold text-white tracking-tight leading-none">
                      {firstName}
                    </h1>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Status Counters */}
              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={onOpenCoins}
                  className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 flex items-center gap-3 shadow-2xl cursor-pointer active:scale-95 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center border border-emerald-500/30">
                    <Coins className="w-5 h-5 text-emerald-400 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Coins</p>
                    <p className="text-sm font-black text-amber-400 leading-none mt-1">{actualCoinsBalance.toLocaleString()}</p>
                  </div>
                </div>
                <div
                  onClick={onOpenStreakCalendar}
                  className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 flex items-center gap-3 shadow-2xl cursor-pointer active:scale-95 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center border border-orange-500/20">
                    <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Streak</p>
                    <p className="text-base font-extrabold text-white">{streak} Days</p>
                  </div>
                </div>
              </div>

              {/* Progress Summary Card */}
              <div className="bg-black/40 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 relative overflow-hidden shadow-2xl">
                <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-emerald-500/10 blur-3xl" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Task Progress</p>
                    <h2 className="text-2xl font-black text-white">
                      {completedTasks.length} / {totalTasks} Done
                    </h2>
                    <p className="text-white/60 text-xs mt-1">
                      {currentTasks.length} active · {overdueTasks.length} overdue
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-450 shadow-inner">
                    <CheckCircle className="w-6 h-6 text-emerald-400 animate-pulse" />
                  </div>
                </div>
                {totalTasks > 0 && (
                  <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div
                      style={{ width: `${(completedTasks.length / totalTasks) * 100}%` }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                    />
                  </div>
                )}
              </div>

              {/* Quick Tasks Summary */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Current Work</h3>
                  <button onClick={() => setActiveTab("tasks")} className="text-xs text-emerald-400 font-bold">
                    View All
                  </button>
                </div>
                {currentTasks.length === 0 ? (
                  <div className="p-6 bg-black/20 border border-dashed border-white/10 rounded-2xl text-center">
                    <p className="text-xs text-zinc-500">No active tasks. Tap 'Tasks' below to view all.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentTasks.slice(0, 2).map(task => (
                      <div
                        key={task.id}
                        onClick={() => navigate(`/staff/task/${task.id}`)}
                        className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 flex justify-between items-center cursor-pointer hover:border-white/15 active:scale-95 transition-all shadow-lg"
                      >
                        <div>
                          <p className="text-xs text-emerald-400 font-black uppercase tracking-tight">
                            {task.project_title || "Task"}
                          </p>
                          <h4 className="text-sm font-bold text-white mt-1">{task.title}</h4>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/50" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TASKS TAB */}
          {activeTab === "tasks" && (
            <motion.div key="tasks" {...fadeUp} className="space-y-6">
              <TasksManager userId={profile.user_id} userProfile={profile} />
            </motion.div>
          )}

          {/* PLANNER TAB */}
          {activeTab === "planner" && (
            <motion.div key="planner" {...fadeUp} className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold tracking-tight">Your Schedule</h1>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mt-1">
                    {format(calendarMonth, "MMMM yyyy")}
                  </p>
                </div>
                {(calendarMonth.getMonth() !== new Date().getMonth() || calendarMonth.getFullYear() !== new Date().getFullYear()) && (
                  <button
                    onClick={() => {
                      const today = new Date();
                      setSelectedDate(today);
                      setCalendarMonth(today);
                    }}
                    className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl hover:bg-emerald-500/20 transition-all"
                  >
                    Go to Today
                  </button>
                )}
              </div>

              {/* Shadcn Calendar Component */}
              <div className="flex justify-center bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-3 shadow-2xl w-full overflow-hidden">
                <CalendarComponent
                  mode="single"
                  month={calendarMonth}
                  onMonthChange={setCalendarMonth}
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    if (date) setCalendarMonth(date);
                  }}
                  className="p-3 bg-transparent w-full"
                  components={{
                    DayContent: ({ date }) => {
                      const dKey = getLocalDateKey(date);
                      const dayPlans = plansByDate[dKey] || [];
                      const dayTasks = tasksByDate[dKey] || [];
                      const daySubtasks = subtasksByDate[dKey] || [];
                      const total = dayPlans.length + dayTasks.length + daySubtasks.length;
                      const isAllComplete = completedDateKeys.has(dKey);

                      return (
                        <div className="relative flex flex-col items-center justify-center w-full h-full p-1">
                          <span className={cn("text-xs font-semibold", isAllComplete && "text-emerald-400 font-bold")}>
                            {date.getDate()}
                          </span>
                          {total > 0 && (
                            <div className="absolute bottom-1 flex gap-0.5 justify-center w-full px-0.5 overflow-hidden">
                              {dayPlans.slice(0, 2).map((p, idx) => (
                                <span
                                  key={`p-${idx}`}
                                  className="w-1 h-1 rounded-full shrink-0"
                                  style={{ backgroundColor: p.is_completed ? '#10b981' : (p.color || '#3b82f6') }}
                                />
                              ))}
                              {dayTasks.slice(0, 2).map((t, idx) => (
                                <span
                                  key={`t-${idx}`}
                                  className="w-1 h-1 rounded-full shrink-0"
                                  style={{ backgroundColor: t.status === 'completed' ? '#10b981' : '#8b5cf6' }}
                                />
                              ))}
                              {daySubtasks.slice(0, 1).map((s, idx) => (
                                <span
                                  key={`s-${idx}`}
                                  className="w-1 h-1 rounded-full shrink-0"
                                  style={{ backgroundColor: s.status === 'completed' ? '#10b981' : '#ec4899' }}
                                />
                              ))}
                              {total > 3 && (
                                <span className="w-1 h-1 rounded-full bg-white/60 shrink-0" />
                              )}
                            </div>
                          )}
                          {isAllComplete && (
                            <span className="absolute inset-0 rounded-xl border border-emerald-500/40 pointer-events-none" />
                          )}
                        </div>
                      );
                    }
                  }}
                />
              </div>

              {/* Day's plans & tasks */}
              <div className="space-y-4">
                <div className="border-t border-white/5 pt-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">
                        {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Selected Date"}
                      </h3>
                      <p className="text-[10px] text-zinc-500 font-bold mt-0.5">
                        {(() => {
                          const dKey = selectedDate ? getLocalDateKey(selectedDate) : '';
                          const count = (plansByDate[dKey] || []).length +
                            (tasksByDate[dKey] || []).length +
                            (subtasksByDate[dKey] || []).length;
                          return `${count} ${count === 1 ? 'Deliverable' : 'Deliverables'}`;
                        })()}
                      </p>
                    </div>

                    {/* Client Filter Popover */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className={cn(
                            "h-8 px-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider transition-all shadow-md",
                            !selectedClientIds.includes('all') && "border-blue-500/50 bg-blue-500/10 text-blue-300"
                          )}
                        >
                          <Briefcase className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="truncate max-w-[120px]">
                            {selectedClientIds.includes('all')
                              ? 'Filter'
                              : selectedClientIds.length === 1
                              ? (clients.find(c => c.id === selectedClientIds[0])?.company_name || (selectedClientIds[0] === 'common' ? 'Common' : '1 Client'))
                              : `${selectedClientIds.length} Selected`}
                          </span>
                          <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 max-w-[calc(100vw-32px)] bg-zinc-950 border border-white/10 text-white rounded-2xl p-3 shadow-2xl space-y-2 z-[99999]" align="end">
                        <div className="flex items-center justify-between px-1">
                          <p className="text-[10px] font-black uppercase text-white/40 tracking-wider">Filter Clients</p>
                          {!selectedClientIds.includes('all') && (
                            <button
                              onClick={() => handleToggleClientFilter('all')}
                              className="text-[10px] font-bold text-blue-400 hover:underline"
                            >
                              Clear All
                            </button>
                          )}
                        </div>

                        {/* Search Input Field */}
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
                          <Input
                            placeholder="Search clients..."
                            value={clientFilterSearch}
                            onChange={(e) => setClientFilterSearch(e.target.value)}
                            className="h-8 pl-8 pr-7 text-xs bg-white/5 border-white/10 rounded-xl focus:border-blue-500 text-white placeholder:text-white/30"
                          />
                          {clientFilterSearch && (
                            <X
                              className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
                              onClick={() => setClientFilterSearch('')}
                            />
                          )}
                        </div>

                        {/* Active Selected Chips */}
                        {!selectedClientIds.includes('all') && selectedClientIds.length > 0 && (
                          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-1 bg-white/[0.02] border border-white/5 rounded-xl">
                            {selectedClientIds.map(id => {
                              const label = id === 'common' ? 'Common' : clients.find(c => c.id === id)?.company_name || 'Client';
                              return (
                                <Badge
                                  key={id}
                                  variant="secondary"
                                  className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px] font-semibold py-0.5 px-2 rounded-lg flex items-center gap-1 cursor-pointer hover:bg-red-500/20 hover:text-red-300 transition-all"
                                  onClick={() => handleToggleClientFilter(id)}
                                >
                                  <span className="truncate max-w-[100px]">{label}</span>
                                  <X className="w-2.5 h-2.5 opacity-60" />
                                </Badge>
                              );
                            })}
                          </div>
                        )}

                        {/* Options List */}
                        <ScrollArea className="h-44 pr-1">
                          <div className="space-y-0.5">
                            {('all clients'.includes(clientFilterSearch.toLowerCase()) || !clientFilterSearch) && (
                              <div
                                role="button"
                                tabIndex={0}
                                onClick={() => handleToggleClientFilter('all')}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggleClientFilter('all'); }}
                                className={cn(
                                  "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-white/5 transition-colors text-left text-xs font-medium cursor-pointer select-none",
                                  selectedClientIds.includes('all') && "bg-blue-500/10 text-blue-300 font-bold"
                                )}
                              >
                                <Checkbox checked={selectedClientIds.includes('all')} className="pointer-events-none" />
                                <span className="uppercase">All Clients</span>
                              </div>
                            )}

                            {('common (internal)'.includes(clientFilterSearch.toLowerCase()) || !clientFilterSearch) && (
                              <div
                                role="button"
                                tabIndex={0}
                                onClick={() => handleToggleClientFilter('common')}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggleClientFilter('common'); }}
                                className={cn(
                                  "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-white/5 transition-colors text-left text-xs font-medium cursor-pointer select-none",
                                  selectedClientIds.includes('common') && "bg-blue-500/10 text-blue-300 font-bold"
                                )}
                              >
                                <Checkbox checked={selectedClientIds.includes('common')} className="pointer-events-none" />
                                <span>Common (No Client)</span>
                              </div>
                            )}

                            <div className="h-px bg-white/10 my-1" />

                            {clients
                              .filter(c => c.company_name?.toLowerCase().includes(clientFilterSearch.toLowerCase()))
                              .map(client => {
                                const isSelected = selectedClientIds.includes(client.id);
                                return (
                                  <div
                                    key={client.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => handleToggleClientFilter(client.id)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggleClientFilter(client.id); }}
                                    className={cn(
                                      "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-white/5 transition-colors text-left text-xs font-medium truncate cursor-pointer select-none",
                                      isSelected && "bg-blue-500/10 text-blue-300 font-bold"
                                    )}
                                  >
                                    <Checkbox checked={isSelected} className="pointer-events-none" />
                                    <span className="truncate">{client.company_name}</span>
                                  </div>
                                );
                              })}

                            {clients.filter(c => c.company_name?.toLowerCase().includes(clientFilterSearch.toLowerCase())).length === 0 && clientFilterSearch && (
                              <p className="text-[11px] text-white/40 text-center py-3">No matching clients</p>
                            )}
                          </div>
                        </ScrollArea>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {plansLoading ? (
                    <div className="h-14 bg-zinc-900 rounded-2xl animate-pulse" />
                  ) : (() => {
                    const dKey = selectedDate ? getLocalDateKey(selectedDate) : '';
                    const dayPlans = plansByDate[dKey] || [];
                    const dayTasks = tasksByDate[dKey] || [];
                    const daySubtasks = subtasksByDate[dKey] || [];
                    const total = dayPlans.length + dayTasks.length + daySubtasks.length;

                    if (total === 0) {
                      return <p className="text-xs text-zinc-500 py-4 text-center">No plans or tasks scheduled for this day.</p>;
                    }

                    return (
                      <div className="space-y-3">
                        {/* 1. Plans */}
                        {dayPlans.map(plan => {
                          const clientObj = clients.find(c => c.id === plan.client_id);
                          const clientName = clientObj ? clientObj.company_name : (plan.client_id && plan.client_id !== 'common' ? 'Client' : 'Common');
                          const assignedStaffList = staffMembers.filter(s => Array.isArray(plan.assigned_staff) && plan.assigned_staff.includes(s.user_id || s.id));

                          return (
                            <div
                              key={plan.id}
                              style={{
                                borderLeft: `4px solid ${plan.is_completed ? '#10b981' : (plan.color || '#3b82f6')}`,
                              }}
                              className={cn(
                                "flex items-start justify-between p-3.5 rounded-2xl border transition-all gap-3",
                                plan.is_completed ? "bg-emerald-950/20 border-emerald-500/20 opacity-75" : "bg-black/40 border-white/10"
                              )}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <Badge variant="outline" className="border-blue-500/40 bg-blue-500/15 text-blue-300 font-bold text-[9px] uppercase tracking-wider py-0 px-2 rounded-md">
                                    {clientName}
                                  </Badge>
                                </div>
                                <h4
                                  className={cn(
                                    "text-sm font-bold text-white leading-snug",
                                    plan.is_completed && "line-through text-zinc-500"
                                  )}
                                  style={plan.is_completed ? {} : { color: plan.color || '#ffffff' }}
                                >
                                  {plan.title}
                                </h4>
                                {plan.description && (
                                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{plan.description}</p>
                                )}
                                {assignedStaffList.length > 0 && (
                                  <div className="flex items-center gap-1 mt-2">
                                    <div className="flex -space-x-1.5 overflow-hidden">
                                      {assignedStaffList.slice(0, 3).map((m, i) => (
                                        <Avatar key={m.user_id || i} className="h-5 w-5 rounded-full ring-1 ring-zinc-950">
                                          <AvatarImage src={m.avatar_url} />
                                          <AvatarFallback className="bg-blue-600 text-[8px] text-white">
                                            {(m.full_name || 'S').slice(0, 2)}
                                          </AvatarFallback>
                                        </Avatar>
                                      ))}
                                    </div>
                                    <span className="text-[10px] text-zinc-400 font-medium ml-1 truncate max-w-[150px]">
                                      {assignedStaffList.map(s => s.full_name?.split(' ')[0]).filter(Boolean).join(', ')}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => handleTogglePlanCompletion(plan.id, plan.is_completed)}
                                className={cn(
                                  "w-7 h-7 rounded-full border flex items-center justify-center transition-all shrink-0 mt-0.5",
                                  plan.is_completed
                                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                                    : "border-white/10 text-zinc-500 hover:border-white/20"
                                )}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}

                        {/* 2. Tasks */}
                        {dayTasks.map(task => {
                          const isDone = task.status === 'completed';
                          const clientObj = clients.find(c => c.id === task.client_id);
                          const clientName = clientObj ? clientObj.company_name : (task.client_id && task.client_id !== 'common' && task.client_id !== 'no-client' ? 'Client' : 'Internal Task');

                          let assignedIds: string[] = [];
                          if (task.assigned_to) {
                            try {
                              const parsed = typeof task.assigned_to === 'string' ? JSON.parse(task.assigned_to) : task.assigned_to;
                              assignedIds = Array.isArray(parsed) ? parsed : [parsed];
                            } catch {
                              assignedIds = [String(task.assigned_to)];
                            }
                          }
                          const assignedStaffList = staffMembers.filter(s => assignedIds.includes(s.user_id || s.id));

                          return (
                            <div
                              key={task.id}
                              onClick={() => setViewDetailTask({ type: 'task', data: task })}
                              style={{
                                borderLeft: `4px solid ${isDone ? '#10b981' : '#8b5cf6'}`,
                              }}
                              className={cn(
                                "flex items-start justify-between p-3.5 rounded-2xl border transition-all gap-3 cursor-pointer",
                                isDone ? "bg-emerald-950/20 border-emerald-500/20 opacity-75" : "bg-purple-950/20 border-purple-500/20 hover:border-purple-500/40"
                              )}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                  <Badge variant="outline" className="border-purple-500/40 bg-purple-500/15 text-purple-300 font-bold text-[9px] uppercase tracking-wider py-0 px-2 rounded-md">
                                    {clientName}
                                  </Badge>
                                  {task.priority && (
                                    <Badge variant="outline" className={cn("text-[9px] font-black uppercase py-0 px-1.5 rounded-md",
                                      task.priority === 'urgent' ? "border-red-500/40 text-red-400 bg-red-500/10" :
                                      task.priority === 'high' ? "border-orange-500/40 text-orange-400 bg-orange-500/10" :
                                      "border-yellow-500/40 text-yellow-400 bg-yellow-500/10"
                                    )}>
                                      {task.priority}
                                    </Badge>
                                  )}
                                </div>
                                <h4
                                  className={cn(
                                    "text-sm font-bold text-white leading-snug flex items-center gap-1.5",
                                    isDone && "line-through text-zinc-500"
                                  )}
                                >
                                  <span>⚡</span> {task.title}
                                </h4>
                                {task.description && (
                                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{task.description}</p>
                                )}
                                {assignedStaffList.length > 0 && (
                                  <div className="flex items-center gap-1 mt-2">
                                    <div className="flex -space-x-1.5 overflow-hidden">
                                      {assignedStaffList.slice(0, 3).map((m, i) => (
                                        <Avatar key={m.user_id || i} className="h-5 w-5 rounded-full ring-1 ring-zinc-950">
                                          <AvatarImage src={m.avatar_url} />
                                          <AvatarFallback className="bg-purple-600 text-[8px] text-white">
                                            {(m.full_name || 'S').slice(0, 2)}
                                          </AvatarFallback>
                                        </Avatar>
                                      ))}
                                    </div>
                                    <span className="text-[10px] text-zinc-400 font-medium ml-1 truncate max-w-[150px]">
                                      {assignedStaffList.map(s => s.full_name?.split(' ')[0]).filter(Boolean).join(', ')}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleTaskCompletion(task.id, task.status);
                                }}
                                className={cn(
                                  "w-7 h-7 rounded-full border flex items-center justify-center transition-all shrink-0 mt-0.5",
                                  isDone
                                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                                    : "border-white/10 text-zinc-500 hover:border-white/20"
                                )}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}

                        {/* 3. Subtasks */}
                        {daySubtasks.map(subtask => {
                          const isDone = subtask.status === 'completed';
                          const assignedMember = staffMembers.find(s => s.user_id === subtask.assigned_to || s.id === subtask.assigned_to);

                          return (
                            <div
                              key={subtask.id}
                              onClick={() => setViewDetailTask({ type: 'subtask', data: subtask })}
                              style={{
                                borderLeft: `4px solid ${isDone ? '#10b981' : '#ec4899'}`,
                              }}
                              className={cn(
                                "flex items-start justify-between p-3.5 rounded-2xl border transition-all gap-3 cursor-pointer",
                                isDone ? "bg-emerald-950/20 border-emerald-500/20 opacity-75" : "bg-pink-950/20 border-pink-500/20 hover:border-pink-500/40"
                              )}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Badge variant="outline" className="border-pink-500/40 bg-pink-500/15 text-pink-300 font-bold text-[9px] uppercase tracking-wider py-0 px-2 rounded-md">
                                    Subtask
                                  </Badge>
                                </div>
                                <h4
                                  className={cn(
                                    "text-sm font-bold text-white leading-snug flex items-center gap-1.5",
                                    isDone && "line-through text-zinc-500"
                                  )}
                                >
                                  <span>📌</span> {subtask.title}
                                </h4>
                                {subtask.description && (
                                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{subtask.description}</p>
                                )}
                                {assignedMember && (
                                  <div className="flex items-center gap-1.5 mt-2">
                                    <Avatar className="h-5 w-5 rounded-full ring-1 ring-zinc-950">
                                      <AvatarImage src={assignedMember.avatar_url} />
                                      <AvatarFallback className="bg-pink-600 text-[8px] text-white">
                                        {(assignedMember.full_name || 'S').slice(0, 2)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-[10px] text-zinc-400 font-medium">
                                      {assignedMember.full_name}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleSubtaskCompletion(subtask.id, subtask.status);
                                }}
                                className={cn(
                                  "w-7 h-7 rounded-full border flex items-center justify-center transition-all shrink-0 mt-0.5",
                                  isDone
                                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                                    : "border-white/10 text-zinc-500 hover:border-white/20"
                                )}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Inline Quick Add Plan */}
                <div className="flex flex-col gap-2 bg-white/[0.02] border border-white/5 rounded-2xl p-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPlanTitle}
                      onChange={e => setNewPlanTitle(e.target.value)}
                      placeholder="Enter short plan..."
                      className="flex-1 bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-500 text-white"
                    />
                    <button
                      onClick={handleAddPlan}
                      className="bg-emerald-500 hover:bg-emerald-600 text-black px-4 rounded-xl text-xs font-black uppercase flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>
                  <div className="flex items-center gap-2 justify-between">
                    <span className="text-[10px] uppercase font-black tracking-widest text-white/40">Associate with Client:</span>
                    <select
                      value={newPlanClientId}
                      onChange={e => setNewPlanClientId(e.target.value)}
                      className="bg-zinc-900 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 min-w-[150px] max-w-[200px]"
                    >
                      <option value="common">Common (No Client)</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.company_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TOOLS TAB */}
          {activeTab === "tools" && (
            <motion.div key="tools" {...fadeUp} className="space-y-6">
              {!activeTool ? (
                <>
                  <div>
                    <h1 className="text-xl font-bold tracking-tight">Staff Tools</h1>
                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mt-1">Useful utilities for daily activities</p>
                  </div>

                  {/* Grid of Tools */}
                  <div className="grid grid-cols-2 gap-4 pb-12">
                    <button
                      onClick={() => setActiveTool("leave")}
                      className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 flex flex-col items-center justify-center text-center space-y-3 hover:border-white/15 active:scale-95 transition-all shadow-xl"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-sky-500/15 flex items-center justify-center text-sky-400 border border-sky-500/20">
                        <UserCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Leave</h4>
                        <p className="text-[10px] text-white/40 mt-1 uppercase font-bold tracking-widest">Request Time Off</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTool("notes")}
                      className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 flex flex-col items-center justify-center text-center space-y-3 hover:border-white/15 active:scale-95 transition-all shadow-xl"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-400 border border-amber-500/20">
                        <ClipboardList className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">My Notes</h4>
                        <p className="text-[10px] text-white/40 mt-1 uppercase font-bold tracking-widest">Quick Scribbles</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTool("arcade")}
                      className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 flex flex-col items-center justify-center text-center space-y-3 hover:border-white/15 active:scale-95 transition-all shadow-xl"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/15 flex items-center justify-center text-purple-400 border border-purple-500/20">
                        <Smile className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Arcade</h4>
                        <p className="text-[10px] text-white/40 mt-1 uppercase font-bold tracking-widest">Play Games</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTool("onboarding")}
                      className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 flex flex-col items-center justify-center text-center space-y-3 hover:border-white/15 active:scale-95 transition-all shadow-xl"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/15 flex items-center justify-center text-blue-400 border border-blue-500/20">
                        <Compass className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Onboarding</h4>
                        <p className="text-[10px] text-white/40 mt-1 uppercase font-bold tracking-widest">Client Portal</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTool("meeting")}
                      className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 flex flex-col items-center justify-center text-center space-y-3 hover:border-white/15 active:scale-95 transition-all shadow-xl"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-pink-500/15 flex items-center justify-center text-pink-400 border border-pink-500/20">
                        <Video className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Meeting Room</h4>
                        <p className="text-[10px] text-white/40 mt-1 uppercase font-bold tracking-widest">Video Conference</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTool("tools_nexus")}
                      className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 flex flex-col items-center justify-center text-center space-y-3 hover:border-white/15 active:scale-95 transition-all shadow-xl"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                        <Compass className="w-6 h-6 animate-spin-slow" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Tools</h4>
                        <p className="text-[10px] text-white/40 mt-1 uppercase font-bold tracking-widest">Tools Nexus</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTool("activity")}
                      className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 flex flex-col items-center justify-center text-center space-y-3 hover:border-white/15 active:scale-95 transition-all shadow-xl"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                        <Activity className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Activity Log</h4>
                        <p className="text-[10px] text-white/40 mt-1 uppercase font-bold tracking-widest">History & Ledger</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTool("project-monitor")}
                      className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 flex flex-col items-center justify-center text-center space-y-3 hover:border-white/15 active:scale-95 transition-all shadow-xl"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                        <Globe className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Project Monitor</h4>
                        <p className="text-[10px] text-white/40 mt-1 uppercase font-bold tracking-widest">Asset Tracking</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTool("coin")}
                      className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 flex flex-col items-center justify-center text-center space-y-3 hover:border-white/15 active:scale-95 transition-all shadow-xl"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-400 border border-amber-500/20">
                        <Coins className="w-6 h-6 animate-bounce" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">My Coins</h4>
                        <p className="text-[10px] text-white/40 mt-1 uppercase font-bold tracking-widest">Points Balance</p>
                      </div>
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4 pb-12">
                  {/* Back button */}
                  <button
                    onClick={() => setActiveTool(null)}
                    className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white"
                  >
                    ← Back to Tools
                  </button>

                  {/* Render active tool */}
                  {activeTool === "leave" && <LeaveView profile={profile} />}
                  {activeTool === "notes" && <QuickNotes userId={profile?.user_id} />}
                  {activeTool === "arcade" && (
                    <div className="bg-black/40 backdrop-blur-2xl p-4 rounded-3xl border border-white/10 shadow-2xl">
                      <MiniChess userId={profile?.user_id} userProfile={profile} />
                    </div>
                  )}
                  {activeTool === "onboarding" && (
                    <div className="bg-zinc-900/40 backdrop-blur-md border border-white/10 rounded-3xl p-4 min-h-[400px]">
                      <ClientOnboardingCreator userId={profile?.user_id || ''} />
                    </div>
                  )}
                  {activeTool === "meeting" && <MeetingRoom />}
                  {activeTool === "tools_nexus" && <ToolsNexusView profile={profile} />}
                  {activeTool === "activity" && <ActivityLogPanel userId={profile?.user_id || ''} className="border-none bg-transparent" />}
                  {activeTool === "project-monitor" && (
                    <div className="bg-black/40 backdrop-blur-2xl p-4 rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                      <ProjectMonitor standalone={true} />
                    </div>
                  )}
                  {activeTool === "coin" && (
                    <div className="space-y-4">
                      <div className="bg-black/40 backdrop-blur-2xl p-5 rounded-3xl border border-white/10 text-center">
                        <Coins className="w-10 h-10 text-amber-400 mx-auto mb-2 animate-bounce" />
                        <h3 className="text-lg font-black text-white">{(profile?.total_points || 0).toLocaleString()} Coins</h3>
                        <p className="text-xs text-white/40 uppercase font-bold mt-1 tracking-widest">Your VAW Coins Balance</p>
                      </div>
                      <ActivityLogPanel userId={profile?.user_id || ''} className="border-none bg-transparent" />
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <motion.div key="profile" {...fadeUp} className="space-y-6">
              <div>
                <h1 className="text-xl font-bold tracking-tight">Your Profile</h1>
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mt-1">Manage settings and identity</p>
              </div>

              {/* Profile Card */}
              <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl">
                <Avatar className="w-20 h-20 border-4 border-emerald-500/20 mb-3">
                  <AvatarImage src={profile?.profile_photo_url || profile?.avatar_url} />
                  <AvatarFallback className="bg-emerald-500/15 text-emerald-400 text-2xl font-black">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-lg font-bold text-white">{profile?.full_name || "Staff Member"}</h3>
                <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mt-1">{profile?.role} Role</p>
                <p className="text-xs text-white/40 mt-0.5">{profile?.email}</p>
              </div>

              {/* Coins & Streak Display in Mobile Profile */}
              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={onOpenCoins}
                  className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 flex items-center gap-3 shadow-2xl cursor-pointer active:scale-95 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center border border-amber-500/30">
                    <Coins className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Coins</p>
                    <p className="text-sm font-black text-amber-400 mt-1">{actualCoinsBalance.toLocaleString()}</p>
                  </div>
                </div>
                <div
                  onClick={onOpenStreakCalendar}
                  className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 flex items-center gap-3 shadow-2xl cursor-pointer active:scale-95 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center border border-orange-500/20">
                    <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Streak</p>
                    <p className="text-base font-extrabold text-white">{streak} Days</p>
                  </div>
                </div>
              </div>

              {/* Settings actions list */}
              <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl divide-y divide-white/10 overflow-hidden shadow-xl">
                <button
                  onClick={onEditProfile}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm font-bold">Edit Profile</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </button>

                <button
                  onClick={onUpdateEmojiPassword}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Smile className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm font-bold">Passcode (Emoji)</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </button>

                <button
                  onClick={onManageBiometrics}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Fingerprint className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm font-bold">Biometrics</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </button>
              </div>

              {/* Sign out button */}
              <button
                onClick={handleLogout}
                className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-sm font-black uppercase tracking-wider hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Unified Curved Bottom Navigation */}
      <nav className="fixed bottom-4 left-4 right-4 z-50">
        <div className="bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
          <div className="flex items-center justify-around px-2 py-3 safe-area-inset-bottom">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setActiveTool(null); // Reset tool detail if moving tab
                  }}
                  className="relative flex flex-col items-center gap-1 py-1 px-2.5 min-w-[56px] group"
                >
                  {isActive && (
                    <motion.div
                      layoutId="staffActiveNavGlow"
                      className="absolute inset-0 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    />
                  )}

                  <Icon
                    className={cn(
                      "w-5 h-5 transition-transform duration-200",
                      isActive ? "text-emerald-400 scale-110" : "text-zinc-500 group-hover:text-zinc-300"
                    )}
                  />
                  <span
                    className={cn(
                      "text-[9px] font-bold tracking-tight transition-all",
                      isActive ? "text-emerald-400 font-black" : "text-zinc-500 group-hover:text-zinc-300"
                    )}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Task / Subtask Detail Dialog */}
      <Dialog open={!!viewDetailTask} onOpenChange={(open) => !open && setViewDetailTask(null)}>
        <DialogContent className="max-w-[calc(100vw-32px)] w-full rounded-2xl bg-zinc-950 border-white/10 text-white p-5 z-[99999]">
          {viewDetailTask && (() => {
            const isTask = viewDetailTask.type === 'task';
            const item = viewDetailTask.data;
            const isDone = item.status === 'completed';
            const clientObj = isTask && item.client_id ? clients.find(c => c.id === item.client_id) : null;
            const clientName = clientObj ? clientObj.company_name : (item.client_id && item.client_id !== 'common' && item.client_id !== 'no-client' ? 'Client' : 'Internal');

            return (
              <div className="space-y-4">
                <DialogHeader className="space-y-2 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className={cn(
                      "font-bold text-[10px] uppercase tracking-wider py-0.5 px-2 rounded-md",
                      isTask ? "border-purple-500/40 bg-purple-500/15 text-purple-300" : "border-pink-500/40 bg-pink-500/15 text-pink-300"
                    )}>
                      {isTask ? '⚡ Task' : '📌 Subtask'} • {clientName}
                    </Badge>
                    {item.priority && (
                      <Badge variant="outline" className={cn("text-[9px] font-black uppercase py-0.5 px-1.5 rounded-md",
                        item.priority === 'urgent' ? "border-red-500/40 text-red-400 bg-red-500/10" :
                        item.priority === 'high' ? "border-orange-500/40 text-orange-400 bg-orange-500/10" :
                        "border-yellow-500/40 text-yellow-400 bg-yellow-500/10"
                      )}>
                        {item.priority}
                      </Badge>
                    )}
                  </div>
                  <DialogTitle className="text-base font-bold text-white leading-snug">
                    {item.title}
                  </DialogTitle>
                </DialogHeader>

                {item.description && (
                  <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
                    <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold block mb-1">Due Date</span>
                    <span className="text-zinc-200 font-medium">{item.due_date || 'No due date'}</span>
                  </div>
                  <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold block mb-1">Status</span>
                    <span className={cn("font-bold capitalize", isDone ? "text-emerald-400" : "text-amber-400")}>
                      {item.status || 'Pending'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-white/10 hover:bg-white/5 text-zinc-300 text-xs py-2 h-auto rounded-xl"
                    onClick={() => setViewDetailTask(null)}
                  >
                    Close
                  </Button>
                  <Button
                    className={cn(
                      "flex-1 text-xs py-2 h-auto rounded-xl font-bold transition-all",
                      isDone
                        ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                        : "bg-emerald-500 hover:bg-emerald-600 text-black"
                    )}
                    onClick={() => {
                      if (isTask) {
                        handleToggleTaskCompletion(item.id, item.status);
                      } else {
                        handleToggleSubtaskCompletion(item.id, item.status);
                      }
                      setViewDetailTask(null);
                    }}
                  >
                    {isDone ? 'Mark Incomplete' : 'Mark as Done'}
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffMobileHome;
