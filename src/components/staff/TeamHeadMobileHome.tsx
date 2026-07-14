import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Home,
  FolderKanban,
  ListChecks,
  User,
  Coins,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Target,
  TrendingUp,
  ArrowLeft,
  Search,
  Flame,
  Sparkles,
  LogOut,
  Fingerprint,
  Calendar,
  Plus,
  Check,
  ClipboardList,
  Smile
} from "lucide-react";
import BiometricSettingsDialog from "@/components/staff/BiometricSettingsDialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format, isSameDay, parseISO } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

type MobileTab = 'home' | 'projects' | 'tasks' | 'planner' | 'profile';

interface TeamHeadMobileHomeProps {
  profile: any;
  onEnterDesktop: () => void;
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
  client_project_id?: string;
  project_title?: string;
  current_stage?: number;
}

interface ProjectGroup {
  id: string;
  title: string;
  totalTasks: number;
  completedTasks: number;
  progress: number;
  color: string;
  tasks: TaskItem[];
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

const PROJECT_COLORS = [
  "from-violet-500 to-purple-600",
  "from-pink-500 to-rose-600",
  "from-cyan-500 to-blue-600",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-teal-600",
];

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const TeamHeadMobileHome = ({
  profile,
  onEnterDesktop,
  onEditProfile,
  onUpdateEmojiPassword,
  onManageBiometrics,
}: TeamHeadMobileHomeProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MobileTab>('home');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ProjectGroup | null>(null);
  const [showBiometricDialog, setShowBiometricDialog] = useState(false);
  const [tasksFilter, setTasksFilter] = useState<string>('all');

  // Planner states
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [plans, setPlans] = useState<any[]>([]);
  const [newPlanTitle, setNewPlanTitle] = useState("");
  const [plansLoading, setPlansLoading] = useState(false);

  const firstName = profile?.full_name?.split(' ')[0] || 'Leader';

  // Fetch department tasks
  const fetchTasks = useCallback(async () => {
    if (!profile?.user_id || !profile?.department_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('staff_tasks')
        .select('id, title, description, status, priority, points, assigned_by, created_at, due_date, client_project_id, current_stage')
        .eq('department_id', profile.department_id)
        .order('created_at', { ascending: false });

      if (data && !error) {
        const projectIds = [...new Set(data.filter(t => t.client_project_id).map(t => t.client_project_id))];
        let projectMap: Record<string, string> = {};
        if (projectIds.length > 0) {
          const { data: projects } = await supabase
            .from('client_projects')
            .select('id, title')
            .in('id', projectIds);
          if (projects) {
            projectMap = Object.fromEntries(projects.map(p => [p.id, p.title]));
          }
        }
        setTasks(data.map(t => ({
          ...t,
          project_title: t.client_project_id ? projectMap[t.client_project_id] || 'Unlinked Project' : undefined
        })));
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.user_id, profile?.department_id]);

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

  const todoTasks = useMemo(() => tasks.filter(t => t.status === 'pending'), [tasks]);
  const inProgressTasks = useMemo(() => tasks.filter(t => t.status === 'in_progress'), [tasks]);
  const completedTasks = useMemo(() => tasks.filter(t => t.status === 'completed'), [tasks]);
  const totalTasks = tasks.length;

  const projectGroups = useMemo(() => {
    const groups: Record<string, ProjectGroup> = {};
    tasks.forEach((task) => {
      const key = task.client_project_id || 'unlinked';
      if (!groups[key]) {
        groups[key] = {
          id: key,
          title: task.project_title || (key === 'unlinked' ? 'Internal Tasks' : 'Project'),
          totalTasks: 0,
          completedTasks: 0,
          progress: 0,
          color: PROJECT_COLORS[Object.keys(groups).length % PROJECT_COLORS.length],
          tasks: []
        };
      }
      groups[key].totalTasks++;
      if (task.status === 'completed') groups[key].completedTasks++;
      groups[key].tasks.push(task);
    });
    Object.values(groups).forEach(g => {
      g.progress = g.totalTasks > 0 ? Math.round((g.completedTasks / g.totalTasks) * 100) : 0;
    });
    return Object.values(groups);
  }, [tasks]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/staff/login");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
      case 'in_progress': return 'bg-blue-500/15 text-blue-400 border-blue-500/25';
      case 'pending_approval': return 'bg-orange-500/15 text-orange-400 border-orange-500/25';
      default: return 'bg-slate-500/15 text-slate-400 border-slate-500/25';
    }
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
          color: '#8b5cf6'
        })
        .select()
        .single();

      if (error) throw error;

      setPlans(prev => [...prev, data]);
      setNewPlanTitle("");
      toast.success("Plan added");
    } catch (err) {
      console.error('Error adding plan:', err);
      toast.error("Failed to add plan");
    }
  };

  const selectedDatePlans = useMemo(() => {
    if (!selectedDate) return [];
    return plans.filter(p => isSameDay(parseISO(p.date), selectedDate));
  }, [plans, selectedDate]);

  // Task filtering for team head tasks tab
  const filteredTasks = useMemo(() => {
    if (tasksFilter === 'todo') return todoTasks;
    if (tasksFilter === 'in_progress') return inProgressTasks;
    if (tasksFilter === 'completed') return completedTasks;
    return tasks;
  }, [tasks, todoTasks, inProgressTasks, completedTasks, tasksFilter]);

  // ──────────────────────── HOME TAB ────────────────────────
  const HomeView = () => (
    <motion.div
      className="px-5 pt-6 pb-28 space-y-6 overflow-y-auto"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <motion.div variants={fadeUp} className="space-y-1">
        <p className="text-white/50 text-sm font-medium">
          {getGreeting()} {getGreetingEmoji()}
        </p>
        <h1 className="text-2xl font-black text-white tracking-tight uppercase">
          {firstName}
        </h1>
      </motion.div>

      {/* Stats row */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4">
        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 flex items-center gap-3 shadow-2xl">
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center border border-violet-500/20">
            <ClipboardList className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Total Tasks</p>
            <p className="text-base font-extrabold text-white">{totalTasks}</p>
          </div>
        </div>
        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 flex items-center gap-3 shadow-2xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center border border-emerald-500/20">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Completed</p>
            <p className="text-base font-extrabold text-white">{completedTasks.length}</p>
          </div>
        </div>
      </motion.div>

      {/* Progress Card */}
      <motion.div
        variants={fadeUp}
        className="bg-black/40 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 relative overflow-hidden shadow-2xl"
      >
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Team Performance</p>
            <h2 className="text-2xl font-black text-white">
              {completedTasks.length} / {totalTasks} Done
            </h2>
            <p className="text-white/60 text-xs mt-1">
              {inProgressTasks.length} active · {todoTasks.length} pending
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-violet-400 shadow-inner">
            <Target className="w-6 h-6" />
          </div>
        </div>
        {totalTasks > 0 && (
          <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div
              style={{ width: `${(completedTasks.length / totalTasks) * 100}%` }}
              className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full"
            />
          </div>
        )}
      </motion.div>

      {/* Projects Quick Preview */}
      <motion.div variants={fadeUp} className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Team Projects</h3>
          <button onClick={() => setActiveTab('projects')} className="text-xs text-violet-400 font-bold">
            View All
          </button>
        </div>
        {projectGroups.length === 0 ? (
          <div className="p-6 bg-black/20 border border-dashed border-white/10 rounded-2xl text-center">
            <p className="text-xs text-zinc-500">No projects currently linked.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projectGroups.slice(0, 2).map(project => (
              <div
                key={project.id}
                onClick={() => {
                  setSelectedProject(project);
                  setActiveTab('projects');
                }}
                className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 hover:border-white/15 active:scale-[0.98] transition-all cursor-pointer shadow-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-white truncate max-w-[70%]">{project.title}</h4>
                  <span className="text-xs font-black text-violet-400">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-1 bg-white/5" />
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );

  // ──────────────────────── PROJECTS TAB ────────────────────────
  const ProjectsView = () => (
    <motion.div
      className="px-5 pt-6 pb-28 space-y-6 overflow-y-auto"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {selectedProject ? (
        <div className="space-y-5">
          <button
            onClick={() => setSelectedProject(null)}
            className="flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-wider"
          >
            ← Back to Projects
          </button>
          <div>
            <h2 className="text-lg font-black uppercase text-white">{selectedProject.title}</h2>
            <p className="text-xs text-zinc-500 mt-1">{selectedProject.tasks.length} tasks in this project</p>
          </div>
          <div className="space-y-3">
            {selectedProject.tasks.map(task => (
              <div key={task.id} className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 space-y-2 shadow-lg">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">{task.title}</h4>
                  <Badge className={cn("text-[8px] uppercase tracking-wider font-bold", getStatusColor(task.status))}>
                    {task.status.replace('_', ' ')}
                  </Badge>
                </div>
                {task.description && <p className="text-xs text-white/50 line-clamp-2">{task.description}</p>}
                <div className="flex justify-between items-center text-[10px] text-white/40 pt-1 border-t border-white/5 mt-2">
                  <span>Due: {task.due_date ? format(new Date(task.due_date), "MMM d") : "Ongoing"}</span>
                  <Badge variant="outline" className={cn("text-[8px] uppercase font-black", getPriorityColor(task.priority))}>
                    {task.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Team Projects</h1>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mt-1">Simple view of active department campaigns</p>
          </div>
          {projectGroups.length === 0 ? (
            <div className="p-8 text-center bg-black/20 border border-dashed border-white/10 rounded-3xl">
              <FolderKanban className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">No projects found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projectGroups.map(project => (
                <div
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 hover:border-white/15 active:scale-[0.98] transition-all cursor-pointer space-y-3 shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white truncate">{project.title}</h4>
                    <span className="text-xs font-black text-violet-400">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-1.5 bg-white/5" />
                  <div className="flex justify-between text-[10px] text-white/40">
                    <span>{project.completedTasks} / {project.totalTasks} Tasks Completed</span>
                    <span className="font-bold text-violet-400 flex items-center gap-0.5">Manage →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </motion.div>
  );

  // ──────────────────────── TASKS TAB ────────────────────────
  const TasksView = () => (
    <motion.div
      className="px-5 pt-6 pb-28 space-y-6 overflow-y-auto"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <div>
        <h1 className="text-xl font-bold tracking-tight">Department Tasks</h1>
        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mt-1">Review team assignments and progress</p>
      </div>

      {/* Simple filters */}
      <div className="flex bg-zinc-900 p-1 rounded-xl border border-white/5 gap-1">
        {[
          { id: 'all', label: 'All' },
          { id: 'todo', label: 'Todo' },
          { id: 'in_progress', label: 'Active' },
          { id: 'completed', label: 'Done' }
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setTasksFilter(f.id)}
            className={cn(
              "flex-1 py-2 text-xs font-black uppercase rounded-lg transition-all",
              tasksFilter === f.id ? "bg-violet-500 text-white shadow-lg" : "text-zinc-400 hover:text-white"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-16 bg-zinc-900 rounded-xl animate-pulse" />
          <div className="h-16 bg-zinc-900 rounded-xl animate-pulse" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="p-8 text-center bg-black/20 border border-dashed border-white/10 rounded-3xl">
          <AlertCircle className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-xs text-zinc-500">No tasks found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map(task => (
            <div key={task.id} className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-violet-400 font-black uppercase tracking-tight">
                  {task.project_title || "General"}
                </span>
                <Badge className={cn("text-[8px] uppercase tracking-wider font-bold", getStatusColor(task.status))}>
                  {task.status.replace('_', ' ')}
                </Badge>
              </div>
              <h4 className="text-sm font-bold text-white">{task.title}</h4>
              <div className="flex justify-between items-center text-[10px] text-white/40 pt-1 border-t border-white/5">
                <span>Due: {task.due_date ? format(new Date(task.due_date), "MMM d") : "Ongoing"}</span>
                <Badge variant="outline" className={cn("text-[8px] uppercase font-black", getPriorityColor(task.priority))}>
                  {task.priority}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );

  // ──────────────────────── PLANNER TAB ────────────────────────
  const PlannerView = () => (
    <motion.div
      className="px-5 pt-6 pb-28 space-y-6 overflow-y-auto"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <div>
        <h1 className="text-xl font-bold tracking-tight">Team Schedule</h1>
        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mt-1">Department planning calendar and strike-off tasks</p>
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
              const dayPlans = plans.filter(p => isSameDay(parseISO(p.date), date));
              return (
                <div className="relative flex flex-col items-center justify-center w-full h-full p-1">
                  <span className="text-xs">{date.getDate()}</span>
                  {dayPlans.length > 0 && (
                    <div className="absolute bottom-1 flex gap-0.5 justify-center w-full px-0.5 overflow-hidden">
                      {dayPlans.slice(0, 3).map((plan, idx) => (
                        <span
                          key={idx}
                          className="w-1 h-1 rounded-full"
                          style={{ backgroundColor: plan.color || '#8b5cf6' }}
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
        <div className="border-t border-white/5 pt-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">
            Plans for {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Selected Date"}
          </h3>

          {plansLoading ? (
            <div className="h-10 bg-zinc-900 rounded-xl animate-pulse" />
          ) : selectedDatePlans.length === 0 ? (
            <p className="text-xs text-zinc-500 py-3 text-center">No plans scheduled for this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedDatePlans.map(plan => (
                <div
                  key={plan.id}
                  style={{
                    borderLeft: `4px solid ${plan.color || '#8b5cf6'}`,
                    backgroundColor: `${plan.color || '#8b5cf6'}15`
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
                        ? "bg-violet-500/20 border-violet-500 text-violet-400"
                        : "border-white/10 text-zinc-500 hover:border-white/20"
                    )}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inline Quick Add Plan */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newPlanTitle}
            onChange={e => setNewPlanTitle(e.target.value)}
            placeholder="Enter department plan..."
            className="flex-1 bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-violet-500"
          />
          <button
            onClick={handleAddPlan}
            className="bg-violet-500 hover:bg-violet-600 text-white px-4 rounded-xl text-xs font-black uppercase flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>
    </motion.div>
  );

  // ──────────────────────── PROFILE TAB ────────────────────────
  const ProfileView = () => (
    <motion.div
      className="px-5 pt-6 pb-28 space-y-6 overflow-y-auto"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <div className="flex flex-col items-center text-center pt-4 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl">
        <Avatar className="w-20 h-20 mb-3 border-4 border-violet-500/20 shadow-2xl">
          <AvatarImage src={profile?.profile_photo_url} />
          <AvatarFallback className="text-2xl bg-violet-500/15 text-violet-400 font-bold">
            {profile?.full_name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-xl font-bold text-white leading-none">{profile?.full_name}</h2>
        <Badge className="bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs mt-2 uppercase tracking-wider font-bold">
          Team Head
        </Badge>
        <p className="text-xs text-white/40 mt-1">{profile?.email}</p>
      </div>

      <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl divide-y divide-white/10 overflow-hidden shadow-xl mt-6">
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

        <button
          onClick={onEnterDesktop}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-3">
            <FolderKanban className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-bold">Full Workspace</span>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-600" />
        </button>
      </div>

      <button
        onClick={handleLogout}
        className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-sm font-black uppercase tracking-wider hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" /> Log Out
      </button>
    </motion.div>
  );

  // ──────────────────────── BOTTOM NAV ────────────────────────
  const navItems = [
    { id: 'home' as MobileTab, label: 'Home', icon: Home },
    { id: 'projects' as MobileTab, label: 'Projects', icon: FolderKanban },
    { id: 'tasks' as MobileTab, label: 'Tasks', icon: ListChecks },
    { id: 'planner' as MobileTab, label: 'Planner', icon: Calendar },
    { id: 'profile' as MobileTab, label: 'Profile', icon: User },
  ];

  return (
    <div className="lg:hidden min-h-screen bg-zinc-950 text-white flex flex-col relative pb-28">
      {/* Ambient lighting background */}
      <div className="fixed inset-x-0 top-0 h-40 bg-gradient-to-b from-violet-500/10 to-transparent pointer-events-none" />

      {/* Page Content Area */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && <HomeView key="home" />}
          {activeTab === 'projects' && <ProjectsView key="projects" />}
          {activeTab === 'tasks' && <TasksView key="tasks" />}
          {activeTab === 'planner' && <PlannerView key="planner" />}
          {activeTab === 'profile' && <ProfileView key="profile" />}
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
                    if (item.id === 'projects') setSelectedProject(null);
                  }}
                  className="relative flex flex-col items-center gap-1 py-1 px-2.5 min-w-[56px] group"
                >
                  {isActive && (
                    <motion.div
                      layoutId="headActiveNavGlow"
                      className="absolute inset-0 rounded-xl bg-violet-500/10 border border-violet-500/20"
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    />
                  )}

                  <Icon
                    className={cn(
                      "w-5 h-5 transition-transform duration-200",
                      isActive ? "text-violet-400 scale-110" : "text-zinc-500 group-hover:text-zinc-300"
                    )}
                  />
                  <span
                    className={cn(
                      "text-[9px] font-bold tracking-tight transition-all",
                      isActive ? "text-violet-400 font-black" : "text-zinc-500 group-hover:text-zinc-300"
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

      <BiometricSettingsDialog open={showBiometricDialog} onOpenChange={setShowBiometricDialog} />
    </div>
  );
};

export default TeamHeadMobileHome;
export type { MobileTab };
