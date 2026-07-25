import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Briefcase,
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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format, isSameDay, parseISO } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TaskDetailDialog } from "./TaskDetailDialog";
import LeaveView from "@/components/staff/LeaveView";
import TeamHeadWorkspace from "./TeamHeadWorkspace";
import { QuickNotes } from "@/components/staff/QuickNotes";
import MiniChess from "@/components/staff/MiniChess";
import MeetingRoom from "./MeetingRoom";
import ClientOnboardingCreator from "./ClientOnboardingCreator";
import ToolsNexusView from "./ToolsNexusView";
import { ActivityLogPanel } from "./ActivityLogPanel";
import {
  Video,
  Activity,
  Compass,
  UserCheck
} from "lucide-react";

type MobileTab = 'home' | 'tasks' | 'planner' | 'tools' | 'profile';

interface TeamHeadMobileHomeProps {
  profile: any;
  onEnterDesktop: () => void;
  onEditProfile?: () => void;
  onUpdateEmojiPassword?: () => void;
  onManageBiometrics?: () => void;
  onOpenStreakCalendar?: () => void;
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

  // Task detailed look state
  const [selectedDetailedTask, setSelectedDetailedTask] = useState<any | null>(null);

  // Tools sub-view: null | 'leave' | 'notes' | 'chess' | 'onboarding' | 'meeting' | 'tools_nexus' | 'activity' | 'coin' | 'projects'
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // Department Staff for task assignment
  const [departmentStaff, setDepartmentStaff] = useState<any[]>([]);

  // Task creation states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>("medium");
  const [newTaskPoints, setNewTaskPoints] = useState(50);
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // Planner states
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [plans, setPlans] = useState<any[]>([]);
  const [newPlanTitle, setNewPlanTitle] = useState("");
  const [plansLoading, setPlansLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>(['all']);
  const [newPlanClientId, setNewPlanClientId] = useState<string>("common");

  const firstName = profile?.full_name?.split(' ')[0] || 'Leader';

  const fetchDepartmentStaff = useCallback(async () => {
    if (!profile?.department_id) return;
    try {
      const { data, error } = await supabase
        .from('staff_profiles')
        .select('user_id, full_name, role')
        .eq('department_id', profile.department_id);
      if (data && !error) {
        setDepartmentStaff(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [profile?.department_id]);

  useEffect(() => {
    fetchDepartmentStaff();
  }, [fetchDepartmentStaff]);

  const handleStatusUpdate = async (taskId: string, newStatus: any) => {
    try {
      const { error } = await supabase
        .from('staff_tasks')
        .update({ status: newStatus })
        .eq('id', taskId);
      if (error) throw error;
      toast.success("Task status updated successfully");
      fetchTasks();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update task status");
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) {
      toast.error("Please enter a task title");
      return;
    }
    setIsCreatingTask(true);
    try {
      const { data: taskData, error: taskError } = await supabase
        .from('staff_tasks')
        .insert({
          title: newTaskTitle.trim(),
          description: newTaskDesc.trim() || null,
          priority: newTaskPriority,
          points: newTaskPoints,
          due_date: newTaskDueDate ? newTaskDueDate : null,
          department_id: profile?.department_id,
          assigned_by: profile?.user_id,
          status: 'pending'
        })
        .select('*')
        .single();

      if (taskError) throw taskError;

      if (newTaskAssignee && taskData) {
        // Create subtask for assignee
        const { error: subtaskError } = await supabase
          .from('staff_subtasks')
          .insert({
            task_id: taskData.id,
            title: newTaskTitle.trim(),
            assigned_to: newTaskAssignee,
            status: 'pending'
          });
        if (subtaskError) throw subtaskError;
      }

      toast.success("Task created successfully!");
      setIsCreateDialogOpen(false);
      // Reset form
      setNewTaskTitle("");
      setNewTaskDesc("");
      setNewTaskPriority("medium");
      setNewTaskPoints(50);
      setNewTaskDueDate("");
      setNewTaskAssignee("");
      fetchTasks();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create task");
    } finally {
      setIsCreatingTask(false);
    }
  };

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
          color: '#8b5cf6',
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

  // ──────────────────────── PROJECTS SUB-VIEW FOR TOOLS ────────────────────────
  const SubProjectsView = () => (
    <div className="space-y-5 pb-12">
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
            <h1 className="text-xl font-bold tracking-tight">Team Campaigns</h1>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mt-1">Simple view of active department campaigns</p>
          </div>
          {projectGroups.length === 0 ? (
            <div className="p-8 text-center bg-black/20 border border-dashed border-white/10 rounded-3xl">
              <FolderKanban className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">No campaigns found.</p>
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
    </div>
  );

  // ──────────────────────── TOOLS TAB ────────────────────────
  const ToolsView = () => (
    <motion.div
      className="px-5 pt-6 pb-28 space-y-6 overflow-y-auto"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {!activeTool ? (
        <>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Team Tools</h1>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mt-1">Daily leader & department utilities</p>
          </div>

          {/* Grid of Tools */}
          <div className="grid grid-cols-2 gap-4 pb-12">
            <button
              onClick={() => setActiveTool("projects")}
              className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 flex flex-col items-center justify-center text-center space-y-3 hover:border-white/15 active:scale-95 transition-all shadow-xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-violet-500/15 flex items-center justify-center text-violet-400 border border-violet-500/20">
                <FolderKanban className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Campaigns</h4>
                <p className="text-[10px] text-white/40 mt-1 uppercase font-bold tracking-widest">Projects list</p>
              </div>
            </button>

            <button
              onClick={() => setActiveTool("leave")}
              className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 flex flex-col items-center justify-center text-center space-y-3 hover:border-white/15 active:scale-95 transition-all shadow-xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-sky-500/15 flex items-center justify-center text-sky-400 border border-sky-500/20">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Leave</h4>
                <p className="text-[10px] text-white/40 mt-1 uppercase font-bold tracking-widest">Apply for Leave</p>
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
                <Compass className="w-6 h-6" />
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
                <p className="text-[10px] text-white/40 mt-1 uppercase font-bold tracking-widest">Ledger & History</p>
              </div>
            </button>

            <button
              onClick={() => setActiveTool("coin")}
              className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 flex flex-col items-center justify-center text-center space-y-3 hover:border-white/15 active:scale-95 transition-all shadow-xl col-span-2"
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
            onClick={() => { setActiveTool(null); setSelectedProject(null); }}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white"
          >
            ← Back to Tools
          </button>

          {/* Render active tool */}
          {activeTool === "projects" && <SubProjectsView />}
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
  );

  // ──────────────────────── TASKS TAB ────────────────────────
  const TasksView = () => (
    <motion.div
      className="px-5 pt-6 pb-28 space-y-6 overflow-y-auto"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Department Tasks</h1>
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mt-1">Review team assignments and progress</p>
        </div>
        <button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-violet-500 hover:bg-violet-600 text-white rounded-xl text-xs font-black uppercase px-3 py-2 shadow-lg flex items-center gap-1 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> New Task
        </button>
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
            <div
              key={task.id}
              onClick={() => setSelectedDetailedTask(task)}
              className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 space-y-2 shadow-lg active:scale-[0.98] transition-all cursor-pointer"
            >
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
                  <Briefcase className="w-3 h-3 text-purple-400" />
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
                        className="border-white/20 data-[state=checked]:bg-violet-500 data-[state=checked]:text-black"
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
                        className="border-white/20 data-[state=checked]:bg-violet-500 data-[state=checked]:text-black"
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
                          className="border-white/20 data-[state=checked]:bg-violet-500 data-[state=checked]:text-black"
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
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    Common Plans
                  </h4>
                  <div className="space-y-2">
                    {commonPlans.map(plan => (
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
              placeholder="Enter department plan..."
              className="flex-1 bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-violet-500"
            />
            <button
              onClick={handleAddPlan}
              className="bg-violet-500 hover:bg-violet-600 text-white px-4 rounded-xl text-xs font-black uppercase flex items-center gap-1 shrink-0"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          <div className="flex items-center gap-2 justify-between">
            <span className="text-[10px] uppercase font-black tracking-widest text-white/40">Associate with Client:</span>
            <select
              value={newPlanClientId}
              onChange={e => setNewPlanClientId(e.target.value)}
              className="bg-zinc-900 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500 min-w-[150px] max-w-[200px]"
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

      {/* Coins & Streak Display in Mobile Profile */}
      <div className="grid grid-cols-2 gap-4 mt-4 w-full">
        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 flex items-center gap-3 shadow-2xl justify-center sm:justify-start">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
            <Coins className="w-5 h-5 text-amber-500/60" />
          </div>
          <div className="text-left">
            <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Coins</p>
            <p className="text-xs font-bold text-amber-500/60 uppercase">Coming Soon</p>
          </div>
        </div>
        <div
          onClick={onOpenStreakCalendar}
          className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 flex items-center gap-3 shadow-2xl cursor-pointer active:scale-95 transition-all justify-center sm:justify-start"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center border border-orange-500/20 shrink-0">
            <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
          </div>
          <div className="text-left">
            <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Streak</p>
            <p className="text-base font-extrabold text-white">{profile?.attendance_streak || 0} Days</p>
          </div>
        </div>
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
    { id: 'tasks' as MobileTab, label: 'Tasks', icon: ListChecks },
    { id: 'planner' as MobileTab, label: 'Planner', icon: Calendar },
    { id: 'tools' as MobileTab, label: 'Tools', icon: Compass },
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
          {activeTab === 'tasks' && (
            <motion.div
              key="tasks"
              className="px-1 pt-6 pb-28 space-y-6 overflow-y-auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <TeamHeadWorkspace userId={profile.user_id} userProfile={profile} />
            </motion.div>
          )}
          {activeTab === 'planner' && <PlannerView key="planner" />}
          {activeTab === 'tools' && <ToolsView key="tools" />}
          {activeTab === 'profile' && <ProfileView key="profile" />}
        </AnimatePresence>
      </div>

      {/* Task Creation Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-zinc-950 text-white border-white/10 max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase text-violet-400">Create New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-white/50">Task Title</Label>
              <Input
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                placeholder="E.g., Design Campaign Assets"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-white/50">Description</Label>
              <Textarea
                value={newTaskDesc}
                onChange={e => setNewTaskDesc(e.target.value)}
                placeholder="Describe the tasks expectations..."
                rows={3}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-white/50">Priority</Label>
                <select
                  value={newTaskPriority}
                  onChange={e => setNewTaskPriority(e.target.value as any)}
                  className="w-full h-10 bg-white/5 border border-white/10 rounded-lg text-xs px-2 text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-white/50">Reward Coins</Label>
                <Input
                  type="number"
                  value={newTaskPoints}
                  onChange={e => setNewTaskPoints(Number(e.target.value))}
                  className="bg-white/5 border-white/10 text-white h-10"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-white/50">Due Date</Label>
                <Input
                  type="date"
                  value={newTaskDueDate}
                  onChange={e => setNewTaskDueDate(e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-10 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-white/50">Assign To</Label>
                <select
                  value={newTaskAssignee}
                  onChange={e => setNewTaskAssignee(e.target.value)}
                  className="w-full h-10 bg-white/5 border border-white/10 rounded-lg text-xs px-2 text-white"
                >
                  <option value="">Unassigned</option>
                  {departmentStaff.map(staff => (
                    <option key={staff.user_id} value={staff.user_id}>
                      {staff.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setIsCreateDialogOpen(false)}
                className="px-4 py-2 border border-white/10 rounded-xl text-xs font-bold uppercase hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTask}
                disabled={isCreatingTask}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold uppercase disabled:opacity-50"
              >
                {isCreatingTask ? "Creating..." : "Create Task"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Details Inline / Dialog View */}
      {selectedDetailedTask && (
        <TaskDetailDialog
          task={selectedDetailedTask}
          open={!!selectedDetailedTask}
          onOpenChange={open => !open && setSelectedDetailedTask(null)}
          onStatusUpdate={handleStatusUpdate}
          userId={profile?.user_id || ''}
          isTeamHead={true}
        />
      )}

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
                    if (item.id === 'tools') {
                      setActiveTool(null);
                      setSelectedProject(null);
                    }
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
