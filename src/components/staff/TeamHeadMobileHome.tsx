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
  LogOut
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type MobileTab = 'home' | 'projects' | 'tasks' | 'profile';

interface TeamHeadMobileHomeProps {
  profile: any;
  onEnterDesktop: () => void;
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
  if (hour < 21) return "Good Evening";
  return "Good Night";
};

const getGreetingEmoji = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "☀️";
  if (hour < 17) return "🌤️";
  if (hour < 21) return "🌅";
  return "🌙";
};

const PROJECT_COLORS = [
  "from-violet-500 to-purple-600",
  "from-pink-500 to-rose-600",
  "from-cyan-500 to-blue-600",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-teal-600",
  "from-indigo-500 to-blue-700",
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
  })
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

const TeamHeadMobileHome = ({ profile, onEnterDesktop }: TeamHeadMobileHomeProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MobileTab>('home');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ProjectGroup | null>(null);

  const firstName = profile?.full_name?.split(' ')[0] || 'Leader';

  // Fetch department tasks
  useEffect(() => {
    if (!profile?.user_id || !profile?.department_id) return;
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('staff_tasks')
          .select('id, title, description, status, priority, points, assigned_by, created_at, due_date, client_project_id, current_stage')
          .eq('department_id', profile.department_id)
          .order('created_at', { ascending: false });

        if (data && !error) {
          // Fetch project titles for tasks with client_project_id
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
    };
    fetchTasks();
  }, [profile?.user_id, profile?.department_id]);

  const todoTasks = useMemo(() => tasks.filter(t => t.status === 'pending'), [tasks]);
  const inProgressTasks = useMemo(() => tasks.filter(t => t.status === 'in_progress'), [tasks]);
  const completedTasks = useMemo(() => tasks.filter(t => t.status === 'completed'), [tasks]);
  const totalTasks = tasks.length;

  // Group tasks by project
  const projectGroups = useMemo(() => {
    const groups: Record<string, ProjectGroup> = {};
    tasks.forEach((task, idx) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'in_progress': return <Play className="w-4 h-4 text-blue-400" />;
      case 'pending_approval': return <Clock className="w-4 h-4 text-orange-400" />;
      default: return <Target className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
      case 'in_progress': return 'bg-blue-500/15 text-blue-400 border-blue-500/25';
      case 'pending_approval': return 'bg-orange-500/15 text-orange-400 border-orange-500/25';
      case 'pending': return 'bg-slate-500/15 text-slate-400 border-slate-500/25';
      default: return 'bg-slate-500/15 text-slate-400 border-slate-500/25';
    }
  };

  // ──────────────────────── HOME TAB ────────────────────────
  const HomeView = () => (
    <motion.div
      className="px-5 pt-6 pb-28 space-y-6 overflow-y-auto"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {/* Greeting */}
      <motion.div variants={fadeUp} custom={0} className="space-y-1">
        <motion.p
          className="text-white/50 text-sm font-medium"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          {getGreetingEmoji()} {getGreeting()}
        </motion.p>
        <motion.h1
          className="text-3xl font-bold text-white tracking-tight"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          Hi, {firstName}
        </motion.h1>
        <motion.div
          className="flex items-center gap-2 mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px]">
            Team Head
          </Badge>
          <span className="text-white/40 text-xs flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-400" />
            {profile?.attendance_streak || 0} day streak
          </span>
        </motion.div>
      </motion.div>

      {/* Stats Card */}
      <motion.div
        variants={fadeUp}
        custom={1}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 p-5 shadow-xl shadow-violet-500/20"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-8 -translate-x-8" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Today</p>
              <p className="text-white text-3xl font-bold mt-1">
                {completedTasks.length}<span className="text-white/50 text-lg">/{totalTasks}</span> <span className="text-sm font-normal text-white/60">tasks</span>
              </p>
            </div>
            <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <motion.div
              className="bg-white rounded-full h-2"
              initial={{ width: 0 }}
              animate={{ width: totalTasks > 0 ? `${(completedTasks.length / totalTasks) * 100}%` : '0%' }}
              transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>

      {/* Quick Stats Row */}
      <motion.div variants={fadeUp} custom={2} className="grid grid-cols-3 gap-3">
        {[
          { label: 'To do', count: todoTasks.length, color: 'text-slate-300', bg: 'bg-white/5' },
          { label: 'In Progress', count: inProgressTasks.length, color: 'text-blue-300', bg: 'bg-blue-500/10' },
          { label: 'Done', count: completedTasks.length, color: 'text-emerald-300', bg: 'bg-emerald-500/10' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className={cn("rounded-xl p-3 text-center border border-white/5", stat.bg)}
            whileTap={{ scale: 0.97 }}
          >
            <p className={cn("text-2xl font-bold", stat.color)}>{stat.count}</p>
            <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Todays Tasks To Do */}
      <motion.div variants={fadeUp} custom={3}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white/80 flex items-center gap-2">
            <Target className="w-4 h-4 text-violet-400" />
            Today's Tasks to do
            <Badge variant="outline" className="text-[10px] border-white/10 text-white/50 ml-1">
              {todoTasks.length}
            </Badge>
          </h2>
        </div>
        <div className="space-y-2">
          {todoTasks.slice(0, 4).map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.05, duration: 0.4 }}
              className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform"
            >
              <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{task.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  {task.project_title && (
                    <span className="text-white/30 text-[10px] truncate max-w-[120px]">{task.project_title}</span>
                  )}
                  <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0", getPriorityColor(task.priority))}>
                    {task.priority}
                  </Badge>
                </div>
              </div>
              <div className="text-white/20">
                <ChevronRight className="w-4 h-4" />
              </div>
            </motion.div>
          ))}
          {todoTasks.length === 0 && (
            <div className="text-center py-6 text-white/30 text-sm">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500/40" />
              All tasks assigned! 🎉
            </div>
          )}
        </div>
      </motion.div>

      {/* In Progress */}
      <motion.div variants={fadeUp} custom={4}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white/80 flex items-center gap-2">
            <Play className="w-4 h-4 text-blue-400" />
            In progress
            <Badge variant="outline" className="text-[10px] border-white/10 text-white/50 ml-1">
              {inProgressTasks.length}
            </Badge>
          </h2>
        </div>
        <div className="space-y-2">
          {inProgressTasks.slice(0, 4).map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.05, duration: 0.4 }}
              className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3.5 flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0 relative">
                <Play className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{task.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  {task.project_title && (
                    <span className="text-white/30 text-[10px] truncate max-w-[120px]">{task.project_title}</span>
                  )}
                </div>
              </div>
              <div className="w-10 h-10 relative">
                <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke="rgb(96,165,250)" strokeWidth="3" strokeDasharray="94" strokeDashoffset={94 - (94 * 0.5)} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-blue-300">50%</span>
              </div>
            </motion.div>
          ))}
          {inProgressTasks.length === 0 && (
            <div className="text-center py-6 text-white/30 text-sm">
              No tasks in progress
            </div>
          )}
        </div>
      </motion.div>

      {/* Enter Desktop Button */}
      <motion.div variants={fadeUp} custom={5}>
        <motion.button
          onClick={onEnterDesktop}
          className="w-full py-3.5 rounded-xl bg-white/[0.06] border border-white/10 text-white/60 text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          whileTap={{ scale: 0.97 }}
        >
          <TrendingUp className="w-4 h-4" />
          Open Full Workspace
        </motion.button>
      </motion.div>
    </motion.div>
  );

  // ──────────────────────── PROJECTS TAB ────────────────────────
  const ProjectsView = () => (
    <AnimatePresence mode="wait">
      {selectedProject ? (
        <ProjectDetailView project={selectedProject} onBack={() => setSelectedProject(null)} />
      ) : (
        <motion.div
          key="project-list"
          className="px-5 pt-6 pb-28 space-y-5"
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0 }}
          variants={staggerContainer}
        >
          <motion.div variants={fadeUp} custom={0} className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Projects</h1>
            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
              <Search className="w-4 h-4 text-white/40" />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 gap-4">
            {projectGroups.map((project, i) => (
              <motion.div
                key={project.id}
                variants={fadeUp}
                custom={i + 1}
                className={cn(
                  "relative overflow-hidden rounded-2xl p-5 cursor-pointer active:scale-[0.97] transition-transform",
                  "bg-gradient-to-br", project.color
                )}
                onClick={() => setSelectedProject(project)}
                whileTap={{ scale: 0.97 }}
              >
                <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-white/80 text-xs font-medium">
                      {project.completedTasks}/{project.totalTasks} tasks • {project.progress}%
                    </span>
                  </div>
                  <h3 className="text-white font-bold text-lg leading-snug line-clamp-2">{project.title}</h3>
                  <div className="mt-4 w-full bg-white/20 rounded-full h-1.5">
                    <motion.div
                      className="bg-white rounded-full h-1.5"
                      initial={{ width: 0 }}
                      animate={{ width: `${project.progress}%` }}
                      transition={{ delay: 0.3, duration: 0.6 }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
            {projectGroups.length === 0 && (
              <div className="text-center py-12 text-white/30 text-sm">
                <FolderKanban className="w-10 h-10 mx-auto mb-3 text-white/15" />
                No projects yet
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ──────────────────────── PROJECT DETAIL VIEW ────────────────────────
  const ProjectDetailView = ({ project, onBack }: { project: ProjectGroup; onBack: () => void }) => {
    const [filter, setFilter] = useState<string>('all');
    const filters = [
      { key: 'all', label: 'All', count: project.tasks.length },
      { key: 'pending', label: 'To do', count: project.tasks.filter(t => t.status === 'pending').length },
      { key: 'in_progress', label: 'In progress', count: project.tasks.filter(t => t.status === 'in_progress').length },
      { key: 'completed', label: 'Done', count: project.tasks.filter(t => t.status === 'completed').length },
    ];
    const filteredTasks = filter === 'all' ? project.tasks : project.tasks.filter(t => t.status === filter);

    return (
      <motion.div
        key="project-detail"
        className="px-5 pt-6 pb-28 space-y-5"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <motion.button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center"
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft className="w-4 h-4 text-white/60" />
          </motion.button>
          <h1 className="text-lg font-bold text-white flex-1 truncate">{project.title}</h1>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {filters.map(f => (
            <motion.button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                filter === f.key
                  ? "bg-violet-500 text-white shadow-lg shadow-violet-500/30"
                  : "bg-white/5 text-white/50"
              )}
              whileTap={{ scale: 0.95 }}
            >
              {f.label}
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0 rounded-full",
                filter === f.key ? "bg-white/20" : "bg-white/5"
              )}>
                {f.count}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Task List */}
        <motion.div className="space-y-2" variants={staggerContainer} initial="hidden" animate="visible">
          {filteredTasks.map((task, i) => (
            <motion.div
              key={task.id}
              variants={fadeUp}
              custom={i}
              className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium leading-snug">{task.title}</p>
                  {task.due_date && (
                    <p className="text-white/30 text-[10px] mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0.5 flex-shrink-0", getStatusColor(task.status))}>
                  {task.status === 'in_progress' ? 'In Progress' : task.status === 'pending_approval' ? 'Review' : task.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0", getPriorityColor(task.priority))}>
                  {task.priority}
                </Badge>
                {task.points > 0 && (
                  <span className="text-amber-400/60 text-[10px] flex items-center gap-0.5">
                    <Coins className="w-3 h-3" /> {task.points}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
          {filteredTasks.length === 0 && (
            <div className="text-center py-10 text-white/30 text-sm">
              No tasks found
            </div>
          )}
        </motion.div>
      </motion.div>
    );
  };

  // ──────────────────────── TASKS TAB ────────────────────────
  const TasksView = () => {
    const [filter, setFilter] = useState<string>('all');
    const filters = [
      { key: 'all', label: 'All', count: tasks.length },
      { key: 'pending', label: 'To do', count: todoTasks.length },
      { key: 'in_progress', label: 'In Progress', count: inProgressTasks.length },
      { key: 'completed', label: 'Done', count: completedTasks.length },
    ];
    const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

    return (
      <motion.div
        className="px-5 pt-6 pb-28 space-y-5"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <motion.div variants={fadeUp} custom={0}>
          <h1 className="text-2xl font-bold text-white">All Tasks</h1>
          <p className="text-white/40 text-xs mt-0.5">{tasks.length} total tasks</p>
        </motion.div>

        {/* Filter Chips */}
        <motion.div variants={fadeUp} custom={1} className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {filters.map(f => (
            <motion.button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                filter === f.key
                  ? "bg-violet-500 text-white shadow-lg shadow-violet-500/30"
                  : "bg-white/5 text-white/50"
              )}
              whileTap={{ scale: 0.95 }}
            >
              {f.label}
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0 rounded-full",
                filter === f.key ? "bg-white/20" : "bg-white/5"
              )}>
                {f.count}
              </span>
            </motion.button>
          ))}
        </motion.div>

        {/* Task Cards */}
        <motion.div className="space-y-2" variants={staggerContainer} initial="hidden" animate="visible">
          {filteredTasks.map((task, i) => (
            <motion.div
              key={task.id}
              variants={fadeUp}
              custom={i}
              className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 space-y-2.5 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getStatusIcon(task.status)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium leading-snug">{task.title}</p>
                  {task.project_title && (
                    <p className="text-white/25 text-[10px] mt-0.5">{task.project_title}</p>
                  )}
                </div>
                <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0.5 flex-shrink-0", getStatusColor(task.status))}>
                  {task.status === 'in_progress' ? 'Active' : task.status === 'pending_approval' ? 'Review' : task.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 pl-7">
                <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0", getPriorityColor(task.priority))}>
                  {task.priority}
                </Badge>
                {task.due_date && (
                  <span className="text-white/25 text-[10px] flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
                {task.points > 0 && (
                  <span className="text-amber-400/50 text-[10px] flex items-center gap-0.5 ml-auto">
                    <Coins className="w-3 h-3" /> {task.points}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    );
  };

  // ──────────────────────── PROFILE TAB ────────────────────────
  const ProfileView = () => (
    <motion.div
      className="px-5 pt-6 pb-28 space-y-6"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <motion.div variants={fadeUp} custom={0} className="flex flex-col items-center text-center pt-4">
        <Avatar className="w-20 h-20 mb-3 border-2 border-white/10">
          <AvatarImage src={profile?.profile_photo_url} />
          <AvatarFallback className="text-2xl bg-violet-500/20 text-violet-300">
            {profile?.full_name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-xl font-bold text-white">{profile?.full_name}</h2>
        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs mt-1">Team Head</Badge>
      </motion.div>

      <motion.div variants={fadeUp} custom={1} className="space-y-3">
        <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Coins className="w-5 h-5 text-amber-400" />
            <span className="text-white/80 text-sm">My Coins</span>
          </div>
          <span className="text-amber-300 font-bold text-sm">{(profile?.total_points || 0).toLocaleString()}</span>
        </div>

        <motion.button
          onClick={() => navigate('/mycoins')}
          className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform"
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-violet-400" />
            <span className="text-white/80 text-sm">Coin Dashboard</span>
          </div>
          <ChevronRight className="w-4 h-4 text-white/20" />
        </motion.button>

        <motion.button
          onClick={onEnterDesktop}
          className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform"
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <span className="text-white/80 text-sm">Full Workspace</span>
          </div>
          <ChevronRight className="w-4 h-4 text-white/20" />
        </motion.button>
      </motion.div>

      <motion.div variants={fadeUp} custom={2}>
        <motion.button
          onClick={handleLogout}
          className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center justify-center gap-2"
          whileTap={{ scale: 0.97 }}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </motion.button>
      </motion.div>
    </motion.div>
  );

  // ──────────────────────── BOTTOM NAV ────────────────────────
  const navItems = [
    { id: 'home' as MobileTab, label: 'Home', icon: Home },
    { id: 'projects' as MobileTab, label: 'Projects', icon: FolderKanban },
    { id: 'tasks' as MobileTab, label: 'Tasks', icon: ListChecks },
    { id: 'profile' as MobileTab, label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 -left-20 w-[300px] h-[300px] bg-blue-600/5 rounded-full blur-[80px]" />
      </div>

      {/* Page Content */}
      <div className="relative z-10 h-screen overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && <HomeView key="home" />}
          {activeTab === 'projects' && <ProjectsView key="projects" />}
          {activeTab === 'tasks' && <TasksView key="tasks" />}
          {activeTab === 'profile' && <ProfileView key="profile" />}
        </AnimatePresence>
      </div>

      {/* Curved Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        {/* Curved SVG top edge */}
        <svg viewBox="0 0 400 20" className="w-full h-5 block" preserveAspectRatio="none">
          <path
            d="M0,20 L0,8 Q200,-8 400,8 L400,20 Z"
            fill="rgba(15,15,25,0.95)"
          />
        </svg>
        <div className="bg-[rgba(15,15,25,0.95)] backdrop-blur-2xl pb-safe">
          <div className="flex items-center justify-around px-6 py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <motion.button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.id === 'projects') setSelectedProject(null);
                  }}
                  className="flex flex-col items-center gap-1 py-1.5 px-4 relative"
                  whileTap={{ scale: 0.9 }}
                >
                  <motion.div
                    animate={isActive ? { y: -4, scale: 1.15 } : { y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <Icon className={cn("w-5 h-5 transition-colors duration-200", isActive ? "text-violet-400" : "text-white/30")} />
                  </motion.div>
                  <span className={cn("text-[10px] font-medium transition-colors duration-200", isActive ? "text-violet-400" : "text-white/30")}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-1 w-1 h-1 bg-violet-400 rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamHeadMobileHome;
