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
  Compass
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isSameDay, parseISO } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

// Reusable Sub-views
import LeaveView from "@/components/staff/LeaveView";
import TasksManager from "./TasksManager";
import { QuickNotes } from "@/components/staff/QuickNotes";
import MiniChess from "@/components/staff/MiniChess";
import MeetingRoom from "./MeetingRoom";
import ClientOnboardingCreator from "./ClientOnboardingCreator";
import ToolsNexusView from "./ToolsNexusView";
import { ActivityLogPanel } from "./ActivityLogPanel";

type RoomType = 'home' | 'workspace' | 'breakroom' | 'meeting';

interface StaffMobileHomeProps {
  profile: any;
  currentRoom: RoomType;
  onRoomChange: (room: RoomType) => void;
  onOpenChat?: () => void;
  onOpenCoins?: () => void;
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
  const [plans, setPlans] = useState<any[]>([]);
  const [newPlanTitle, setNewPlanTitle] = useState("");
  const [plansLoading, setPlansLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>(['all']);
  const [newPlanClientId, setNewPlanClientId] = useState<string>("common");

  // Tools sub-view: null | 'leave' | 'notes' | 'chess'
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const coinsBalance = profile?.total_points || 0;
  const streak = profile?.attendance_streak || 0;

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

  // Fetch plans
  const fetchPlans = useCallback(async () => {
    if (!profile?.user_id) return;
    setPlansLoading(true);
    try {
      const { data, error } = await supabase
        .from('monthly_plans')
        .select('*');
      if (error) throw error;
      setPlans(data || []);

      // Fetch clients
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, company_name');
      setClients(clientsData || []);
    } catch (err) {
      console.error('Error fetching plans:', err);
    } finally {
      setPlansLoading(false);
    }
  }, [profile?.user_id]);

  useEffect(() => {
    fetchTasks();
    fetchPlans();
  }, [fetchTasks, fetchPlans]);

  // Task lists
  const currentTasks = useMemo(() => tasks.filter(t => t.status === "in_progress"), [tasks]);
  const overdueTasks = useMemo(() => tasks.filter(t => t.status === "overdue"), [tasks]);
  const completedTasks = useMemo(() => tasks.filter(t => t.status === "completed"), [tasks]);
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

  // Filter plans based on selected client filter
  const filteredPlans = useMemo(() => {
    return plans.filter(p => {
      if (selectedClientIds.includes('all')) return true;
      if (!p.client_id) return selectedClientIds.includes('common');
      return selectedClientIds.includes(p.client_id);
    });
  }, [plans, selectedClientIds]);

  // Filter plans for selected date
  const selectedDatePlans = useMemo(() => {
    if (!selectedDate) return [];
    return filteredPlans.filter(p => isSameDay(parseISO(p.date), selectedDate));
  }, [filteredPlans, selectedDate]);

  // Group plans for grouping in UI list
  const { commonPlans, clientGrouped } = useMemo(() => {
    const common = selectedDatePlans.filter(p => !p.client_id);
    const clientGroupedMap: Record<string, { name: string, plans: any[] }> = {};

    selectedDatePlans.filter(p => p.client_id).forEach(p => {
      const client = clients.find(c => c.id === p.client_id);
      const name = client?.company_name || 'Unknown Client';
      if (!clientGroupedMap[p.client_id!]) {
        clientGroupedMap[p.client_id!] = { name, plans: [] };
      }
      clientGroupedMap[p.client_id!].plans.push(p);
    });

    return { commonPlans: common, clientGrouped: clientGroupedMap };
  }, [selectedDatePlans, clients]);

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
                <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 flex items-center gap-3 shadow-2xl">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center border border-emerald-500/20">
                    <Coins className="w-5 h-5 text-emerald-400 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Coins</p>
                    <p className="text-base font-extrabold text-white">{coinsBalance.toLocaleString()}</p>
                  </div>
                </div>
                <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 flex items-center gap-3 shadow-2xl">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center border border-amber-500/20">
                    <Flame className="w-5 h-5 text-amber-400" />
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
              <div>
                <h1 className="text-xl font-bold tracking-tight">Your Schedule</h1>
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mt-1">Tap a day to view or add daily planner items</p>
              </div>

              {/* Shadcn Calendar Component */}
              <div className="flex justify-center bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-3 shadow-2xl w-full overflow-hidden">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="p-3 bg-transparent w-full"
                  components={{
                    DayContent: ({ date }) => {
                      const dayPlans = filteredPlans.filter(p => isSameDay(parseISO(p.date), date));
                      return (
                        <div className="relative flex flex-col items-center justify-center w-full h-full p-1">
                          <span className="text-xs">{date.getDate()}</span>
                          {dayPlans.length > 0 && (
                            <div className="absolute bottom-1 flex gap-0.5 justify-center w-full px-0.5 overflow-hidden">
                              {dayPlans.slice(0, 3).map((plan, idx) => (
                                <span
                                  key={idx}
                                  className="w-1 h-1 rounded-full"
                                  style={{ backgroundColor: plan.color || '#10b981' }}
                                />
                              ))}
                              {dayPlans.length > 3 && (
                                <span className="w-1 h-1 rounded-full bg-white opacity-50" />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }
                  }}
                />
              </div>

              {/* Day's plans */}
              <div className="space-y-4">
                <div className="border-t border-white/5 pt-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">
                      Plans for {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Selected Date"}
                    </h3>

                    {/* Client Filter Popover */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className="h-8 px-2.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white flex items-center gap-1 text-[10px] font-black uppercase tracking-wider"
                        >
                          <Briefcase className="w-3 h-3 text-blue-400" />
                          <span>Filter ({selectedClientIds.includes('all') ? 'All' : selectedClientIds.length})</span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 bg-zinc-950 border border-white/10 rounded-2xl p-3 shadow-2xl space-y-2 z-50">
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-white/40 px-2 pb-1 border-b border-white/5">
                          Filter by Client
                        </h4>
                        <ScrollArea className="h-48 pr-1">
                          <div className="space-y-1">
                            {/* All Option */}
                            <button
                              onClick={() => handleToggleClientFilter('all')}
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-left"
                            >
                              <Checkbox
                                checked={selectedClientIds.includes('all')}
                                onCheckedChange={() => handleToggleClientFilter('all')}
                                className="border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-black"
                              />
                              <span className="text-xs font-bold text-white uppercase">All Clients</span>
                            </button>

                            {/* Common / No Client Option */}
                            <button
                              onClick={() => handleToggleClientFilter('common')}
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-left"
                            >
                              <Checkbox
                                checked={selectedClientIds.includes('common')}
                                onCheckedChange={() => handleToggleClientFilter('common')}
                                className="border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-black"
                              />
                              <span className="text-xs font-bold text-white/70 uppercase">Common (No Client)</span>
                            </button>

                            {/* Client Options */}
                            {clients.map(client => (
                              <button
                                key={client.id}
                                onClick={() => handleToggleClientFilter(client.id)}
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-left"
                              >
                                <Checkbox
                                  checked={selectedClientIds.includes(client.id)}
                                  onCheckedChange={() => handleToggleClientFilter(client.id)}
                                  className="border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-black"
                                />
                                <span className="text-xs font-medium text-white/90 truncate">{client.company_name}</span>
                              </button>
                            ))}
                          </div>
                        </ScrollArea>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {plansLoading ? (
                    <div className="h-10 bg-zinc-900 rounded-xl animate-pulse" />
                  ) : selectedDatePlans.length === 0 ? (
                    <p className="text-xs text-zinc-500 py-3 text-center">No plans scheduled for this day.</p>
                  ) : (
                    <div className="space-y-4">
                      {/* Common Plans Section */}
                      {commonPlans.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 px-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Common Plans
                          </h4>
                          <div className="space-y-2">
                            {commonPlans.map(plan => (
                              <div
                                key={plan.id}
                                style={{
                                  borderLeft: `4px solid ${plan.color || '#10b981'}`,
                                  backgroundColor: `${plan.color || '#10b981'}15`
                                }}
                                className="flex items-center justify-between p-3.5 rounded-xl border-r border-t border-b border-white/5 transition-all"
                              >
                                <div className="flex-1 min-w-0 pr-3">
                                  <h4
                                    className={cn(
                                      "text-sm font-bold text-white",
                                      plan.is_completed && "line-through text-zinc-600"
                                    )}
                                    style={plan.is_completed ? {} : { color: plan.color || '#ffffff' }}
                                  >
                                    {plan.title}
                                  </h4>
                                  {plan.description && (
                                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{plan.description}</p>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleTogglePlanCompletion(plan.id, plan.is_completed)}
                                  className={cn(
                                    "w-7 h-7 rounded-full border flex items-center justify-center transition-all shrink-0",
                                    plan.is_completed
                                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                                      : "border-white/10 text-zinc-500 hover:border-white/20"
                                  )}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Client-specific Groups */}
                      {Object.entries(clientGrouped).map(([clientId, group]) => (
                        <div key={clientId} className="space-y-2">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 px-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            {group.name}
                          </h4>
                          <div className="space-y-2">
                            {group.plans.map(plan => (
                              <div
                                key={plan.id}
                                style={{
                                  borderLeft: `4px solid ${plan.color || '#10b981'}`,
                                  backgroundColor: `${plan.color || '#10b981'}15`
                                }}
                                className="flex items-center justify-between p-3.5 rounded-xl border-r border-t border-b border-white/5 transition-all"
                              >
                                <div className="flex-1 min-w-0 pr-3">
                                  <h4
                                    className={cn(
                                      "text-sm font-bold text-white",
                                      plan.is_completed && "line-through text-zinc-600"
                                    )}
                                    style={plan.is_completed ? {} : { color: plan.color || '#ffffff' }}
                                  >
                                    {plan.title}
                                  </h4>
                                  {plan.description && (
                                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{plan.description}</p>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleTogglePlanCompletion(plan.id, plan.is_completed)}
                                  className={cn(
                                    "w-7 h-7 rounded-full border flex items-center justify-center transition-all shrink-0",
                                    plan.is_completed
                                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                                      : "border-white/10 text-zinc-500 hover:border-white/20"
                                  )}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Inline Quick Add Plan */}
                <div className="flex flex-col gap-2 bg-white/[0.02] border border-white/5 rounded-2xl p-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPlanTitle}
                      onChange={e => setNewPlanTitle(e.target.value)}
                      placeholder="Enter short plan..."
                      className="flex-1 bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-500"
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
                      onClick={() => setActiveTool("chess")}
                      className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 flex flex-col items-center justify-center text-center space-y-3 hover:border-white/15 active:scale-95 transition-all shadow-xl"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/15 flex items-center justify-center text-purple-400 border border-purple-500/20">
                        <Smile className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Games</h4>
                        <p className="text-[10px] text-white/40 mt-1 uppercase font-bold tracking-widest">Play Chess Arena</p>
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
                  {activeTool === "chess" && (
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
    </div>
  );
};

export default StaffMobileHome;
