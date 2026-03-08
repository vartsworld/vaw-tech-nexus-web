import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Monitor,
  Coffee,
  Users,
  MessageCircle,
  Coins,
  ClipboardList,
  Bell,
  ChevronRight,
  Clock,
  Briefcase,
  User
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

type RoomType = 'workspace' | 'breakroom' | 'meeting';

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
  status: string;
  progress?: number;
  project_name?: string;
  client_name?: string;
  created_at?: string;
  due_date?: string;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
});

const StaffMobileHome = ({
  profile,
  currentRoom,
  onRoomChange,
  onOpenChat,
  onOpenCoins,
  onEnterWorkspace,
}: StaffMobileHomeProps) => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  const firstName = profile?.full_name?.split(" ")[0] || "there";

  useEffect(() => {
    if (!profile?.user_id) return;
    const fetchTasks = async () => {
      const { data } = await supabase
        .from("staff_tasks")
        .select("id, title, status, created_at, due_date")
        .or(`assigned_to.eq.${profile.user_id},created_by.eq.${profile.user_id}`)
        .in("status", ["pending", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(20);
      setTasks((data as unknown as TaskItem[]) || []);
      setLoading(false);
    };
    fetchTasks();
  }, [profile?.user_id]);

  const todoTasks = useMemo(() => tasks.filter((t) => t.status === "pending" || t.status === "todo"), [tasks]);
  const inProgressTasks = useMemo(() => tasks.filter((t) => t.status === "in_progress"), [tasks]);
  const completedCount = 0; // Could be fetched separately
  const totalTasks = tasks.length;

  const navItems = [
    { id: "home", label: "Home", icon: Monitor, isActive: true },
    { id: "workspace", label: "Work", icon: Briefcase, action: onEnterWorkspace },
    { id: "chat", label: "Chat", icon: MessageCircle, action: onOpenChat },
    { id: "coins", label: "Coins", icon: Coins, action: onOpenCoins },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="lg:hidden min-h-screen bg-gradient-to-b from-background via-background to-muted/30 flex flex-col relative">
      {/* Top Section */}
      <div className="px-5 pt-12 pb-4">
        {/* Greeting */}
        <motion.div {...fadeUp(0.05)} className="flex items-center justify-between mb-1">
          <div>
            <motion.p
              {...fadeUp(0.1)}
              className="text-muted-foreground text-sm font-medium"
            >
              {getGreeting()} 👋
            </motion.p>
            <motion.h1
              {...fadeUp(0.18)}
              className="text-2xl font-bold text-foreground tracking-tight"
            >
              Hello, {firstName}
            </motion.h1>
          </div>
          <motion.button
            {...fadeUp(0.15)}
            className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center"
          >
            <Bell className="w-4.5 h-4.5 text-muted-foreground" />
          </motion.button>
        </motion.div>

        {/* Task Summary Card */}
        <motion.div
          {...fadeUp(0.25)}
          className="mt-5 rounded-2xl bg-gradient-to-br from-primary/90 to-primary/70 p-5 relative overflow-hidden shadow-lg shadow-primary/20"
        >
          {/* Decorative blob */}
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute right-4 bottom-3 w-16 h-16 rounded-full bg-white/5" />

          <p className="text-primary-foreground/70 text-xs font-semibold uppercase tracking-wider mb-1">
            Today
          </p>
          <div className="flex items-end gap-1">
            <span className="text-4xl font-extrabold text-primary-foreground leading-none">
              {inProgressTasks.length + todoTasks.length}
            </span>
            <span className="text-primary-foreground/60 text-lg font-semibold mb-0.5">
              /{totalTasks || "0"} tasks
            </span>
          </div>
          <p className="text-primary-foreground/50 text-xs mt-2">
            {inProgressTasks.length} in progress · {todoTasks.length} to do
          </p>
        </motion.div>
      </div>

      {/* Scrollable Task Sections */}
      <div className="flex-1 overflow-y-auto px-5 pb-28">
        {/* To Do Section */}
        <motion.div {...fadeUp(0.35)}>
          <div className="flex items-center gap-2 mb-3 mt-2">
            <h2 className="text-sm font-semibold text-foreground">To do</h2>
            <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-2 py-0.5 font-bold">
              {todoTasks.length}
            </span>
          </div>

          {todoTasks.length === 0 && !loading ? (
            <div className="text-center py-6 text-muted-foreground text-xs">
              No pending tasks 🎉
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {todoTasks.slice(0, 4).map((task, i) => (
                <motion.div
                  key={task.id}
                  {...fadeUp(0.4 + i * 0.06)}
                  className="bg-card border border-border rounded-2xl p-3.5 space-y-2 shadow-sm"
                >
                  <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider truncate block">
                    {task.project_name || "Task"}
                  </span>
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
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* In Progress Section */}
        <motion.div {...fadeUp(0.5)} className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold text-foreground">In progress</h2>
            <span className="text-[10px] bg-primary/15 text-primary rounded-full px-2 py-0.5 font-bold">
              {inProgressTasks.length}
            </span>
          </div>

          {inProgressTasks.length === 0 && !loading ? (
            <div className="text-center py-6 text-muted-foreground text-xs">
              No tasks in progress
            </div>
          ) : (
            <div className="space-y-3">
              {inProgressTasks.slice(0, 5).map((task, i) => (
                <motion.div
                  key={task.id}
                  {...fadeUp(0.55 + i * 0.06)}
                  className="bg-card border border-border rounded-2xl p-4 shadow-sm"
                >
                  <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    {task.project_name || "Project"}
                  </span>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground leading-snug flex-1 line-clamp-1">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[11px] font-bold text-primary">
                        {task.progress || 0}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-2.5">
                    <Progress value={task.progress || 0} className="h-1.5 bg-muted" />
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground mt-2">
                    <Clock className="w-3 h-3" />
                    <span className="text-[9px]">
                      {task.due_date
                        ? new Date(task.due_date).toLocaleDateString("en-US", { day: "numeric", month: "short" })
                        : "Ongoing"}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Curved Bottom Navigation */}
      <nav className="fixed bottom-3 left-3 right-3 z-50">
        <div className="bg-card/80 backdrop-blur-2xl border border-border/30 rounded-[1.75rem] overflow-hidden shadow-xl shadow-black/10">
          <div className="flex items-center justify-around px-1 py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.isActive;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.action) item.action();
                  }}
                  className="relative flex flex-col items-center gap-0.5 py-1 px-1.5 min-w-[48px] group"
                >
                  {active && (
                    <motion.div
                      layoutId="staffNavGlow"
                      className="absolute -top-1 w-8 h-8 rounded-full bg-primary/12 blur-xl"
                      transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    />
                  )}

                  <motion.div
                    animate={active ? { y: -3 } : { y: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={cn(
                      "relative w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300",
                      active ? "bg-primary/12" : "group-hover:bg-muted/50"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-[17px] h-[17px] transition-all duration-300",
                        active
                          ? "text-primary drop-shadow-[0_0_6px_hsl(var(--primary)/0.4)]"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                      strokeWidth={active ? 2.2 : 1.8}
                    />

                    {active && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary shadow-[0_0_4px_hsl(var(--primary)/0.5)]"
                      />
                    )}
                  </motion.div>

                  <motion.span
                    animate={active ? { opacity: 1 } : { opacity: 0.4 }}
                    className={cn(
                      "text-[8px] font-semibold tracking-[0.06em] uppercase transition-colors duration-300",
                      active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
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

      <style>{`
        .safe-area-inset-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </div>
  );
};

export default StaffMobileHome;
