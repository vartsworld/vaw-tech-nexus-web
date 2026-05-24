import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Clock, 
  Users, 
  Plus, 
  Trash2, 
  Coins, 
  TrendingUp, 
  ArrowRight, 
  Sparkles,
  Bell,
  Megaphone,
  AlertTriangle,
  Info,
  CheckCircle,
  Calendar,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OfficeZenHomeProps {
  userId: string;
  userProfile: any;
  onEnterWorkspace?: () => void;
}

interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'announcement' | 'task_assigned' | 'mood_alert' | 'achievement';
  is_urgent: boolean;
  created_at: string;
  read_by: string[];
  expires_at?: string;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 21) return "Good Evening";
  return "Good Night";
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function OfficeZenHome({ userId, userProfile, onEnterWorkspace, onEnterBreakroom }: OfficeZenHomeProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Real-time task syncing
  const [currentTasks, setCurrentTasks] = useState<any[]>([]);
  const [taskSummary, setTaskSummary] = useState({ todo: 0, inProgress: 0, completed: 0, total: 0 });
  
  // Real-time notification syncing
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Localized interactive notes (saved to localStorage per user)
  const [personalNotes, setPersonalNotes] = useState<string[]>(() => {
    if (!userId) return [];
    const saved = localStorage.getItem(`nexus_personal_notes_${userId}`);
    return saved ? JSON.parse(saved) : [
      "📌 Review the new client onboarding proposal document.",
      "📌 Finish updating main workspace mockups by 5:00 PM today.",
      "📌 Submit weekly status timesheet before logging out."
    ];
  });
  const [newNoteText, setNewNoteText] = useState("");

  // Live ticking clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Persist personal notes
  useEffect(() => {
    if (userId) {
      localStorage.setItem(`nexus_personal_notes_${userId}`, JSON.stringify(personalNotes));
    }
  }, [personalNotes, userId]);

  // Fetch real-time assigned tasks and notifications from Database
  const fetchTasksAndNotifs = async () => {
    if (!userId) return;
    try {
      // 1. Fetch Tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from("staff_tasks")
        .select("*, staff_subtasks(*)")
        .order("created_at", { ascending: false });

      if (tasksError) throw tasksError;
      
      if (tasksData) {
        // Filter tasks directly assigned to user or through subtasks
        const myTasks = tasksData.filter((task: any) => {
          let isAssigned = false;
          if (task.assigned_to) {
            try {
              const parsed = typeof task.assigned_to === "string"
                ? JSON.parse(task.assigned_to)
                : task.assigned_to;
              if (Array.isArray(parsed) && parsed.includes(userId)) {
                isAssigned = true;
              }
            } catch (e) {
              if (typeof task.assigned_to === "string" && task.assigned_to.includes(userId)) {
                isAssigned = true;
              }
            }
          }
          
          const hasAssignedSubtask = (task.staff_subtasks || []).some(
            (sub: any) => sub.assigned_to === userId
          );

          return isAssigned || hasAssignedSubtask;
        });

        // Separate active vs upcoming vs completed for stats
        const active = myTasks.filter((t: any) => t.status === "in_progress" || t.status === "review_pending");
        const completed = myTasks.filter((t: any) => t.status === "completed");
        const todo = myTasks.filter((t: any) => t.status === "todo" || t.status === "backlog");

        setCurrentTasks(active);
        setTaskSummary({
          todo: todo.length,
          inProgress: active.length,
          completed: completed.length,
          total: myTasks.length
        });
      }

      // 2. Fetch Notifications
      const { data: notifsData, error: notifError } = await supabase
        .from("staff_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);

      if (notifError) throw notifError;
      if (notifsData) {
        setNotifications(notifsData.filter(n => 
          !n.expires_at || new Date(n.expires_at) > new Date()
        ));
      }

    } catch (err) {
      console.error("Error loading home dashboard details:", err);
    }
  };

  useEffect(() => {
    fetchTasksAndNotifs();

    // Subscribe to task updates
    const tasksChannel = supabase
      .channel("home_tasks_sync_refreshed")
      .on(
        "postgres_changes",
        { event: "*", filter: `assigned_to=eq.${userId}`, schema: "public", table: "staff_tasks" },
        () => fetchTasksAndNotifs()
      )
      .subscribe();

    // Subscribe to notifications updates
    const notifsChannel = supabase
      .channel("home_notifications_sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "staff_notifications" },
        () => fetchTasksAndNotifs()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(notifsChannel);
    };
  }, [userId]);

  // Handler for adding local sticky notes
  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    setPersonalNotes([...personalNotes, `📌 ${newNoteText.trim()}`]);
    setNewNoteText("");
    toast.success("Sticky note added!");
  };

  // Handler for deleting local sticky notes
  const handleRemoveNote = (indexToRemove: number) => {
    setPersonalNotes(personalNotes.filter((_, idx) => idx !== indexToRemove));
    toast.success("Note removed successfully.");
  };

  const getNotificationIcon = (type: string, isUrgent: boolean) => {
    switch (type) {
      case 'announcement':
        return <Megaphone className={`w-4 h-4 flex-shrink-0 ${isUrgent ? 'text-red-400' : 'text-blue-400'}`} />;
      case 'task_assigned':
        return <CheckCircle className="w-4 h-4 flex-shrink-0 text-green-400" />;
      case 'mood_alert':
        return <AlertTriangle className="w-4 h-4 flex-shrink-0 text-yellow-400" />;
      case 'achievement':
        return <Sparkles className="w-4 h-4 flex-shrink-0 text-purple-400 animate-pulse" />;
      default:
        return <Info className="w-4 h-4 flex-shrink-0 text-blue-400" />;
    }
  };

  // Static meetings list mimicking schedule (limited to top 2 items for focus)
  const upcomingMeetings = [
    {
      title: "Daily Standup Meeting",
      time: "10:00 AM",
      duration: "15 min",
      attendees: 6,
      status: "Starting Soon",
      type: "Team Standup"
    },
    {
      title: "Weekly Tech Sprint Review",
      time: "2:00 PM",
      duration: "45 min",
      status: "Scheduled",
      type: "Project Review"
    }
  ];

  // Filter and limit tasks to exactly the top 3 highest priority tasks
  const importantTasks = [...currentTasks]
    .sort((a, b) => {
      const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
      const weightA = priorityWeight[a.priority] || 0;
      const weightB = priorityWeight[b.priority] || 0;
      return weightB - weightA;
    })
    .slice(0, 3);

  const firstName = userProfile?.full_name?.split(" ")[0] || userProfile?.username || "there";
  
  // Daily percentage score
  const completionPercentage = taskSummary.total > 0 
    ? Math.round((taskSummary.completed / taskSummary.total) * 100) 
    : 0;

  return (
    <div className="max-w-4xl mx-auto pb-32 space-y-12 select-none relative z-20">
      
      {/* 1. BRAND LOGO CENTERED */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex justify-center pt-4"
      >
        <img
          src="/lovable-uploads/0d3e4545-c80e-401b-82f1-3319db5155b4.png"
          alt="VAW Logo"
          className="w-14 h-14 rounded-2xl opacity-95 shadow-2xl border border-white/20"
        />
      </motion.div>

      {/* 2. DYNAMIC CENTERED PORTAL GREETING - WRAPPED IN HIGHER VISIBILITY SHIELD */}
      <div className="bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 text-center space-y-3 max-w-2xl mx-auto shadow-2xl">
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-xs md:text-sm tracking-[0.25em] uppercase text-yellow-400 font-bold"
        >
          {getGreeting()}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl md:text-4xl font-extralight tracking-tight text-white"
        >
          Hi <span className="font-extrabold text-yellow-400 drop-shadow">{firstName}</span>, welcome back
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-xs md:text-sm text-zinc-300 font-medium tracking-wide flex items-center justify-center gap-2"
        >
          <Clock className="w-4 h-4 text-yellow-400 animate-spin-slow" />
          Everything is running smoothly
        </motion.p>
      </div>

      {/* 3. MODULAR 2-COLUMN FOCUS LAYOUT GRID */}
      <motion.div 
        initial="hidden" 
        animate="visible" 
        variants={stagger}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      >
        
        {/* ================= LEFT COLUMN: FOCUS CONTROLLER & TOP CRITICAL OBJECTIVES (Span 7) ================= */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* DAILY PROGRESS HEADER CARD (High contrast purple progress card) */}
          <motion.div 
            variants={fadeUp} 
            custom={1}
            className="p-6 rounded-3xl bg-gradient-to-r from-violet-700 via-indigo-700 to-indigo-800 border-2 border-indigo-400/30 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.12),transparent)] pointer-events-none" />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs uppercase font-extrabold text-white tracking-widest bg-black/30 px-2.5 py-0.5 rounded-full">
                  Today
                </span>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <h3 className="text-4xl font-black text-white leading-none drop-shadow">
                    {taskSummary.completed}
                  </h3>
                  <span className="text-white text-base font-bold">
                    /{taskSummary.total} tasks completed
                  </span>
                </div>
              </div>

              {/* Glowing sparkles emblem */}
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border-2 border-white/30 text-white shadow-xl">
                <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
              </div>
            </div>

            {/* Thicker white loading bar with drop shadow */}
            <div className="h-3 w-full bg-black/30 rounded-full overflow-hidden mt-6 border border-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="h-full bg-white rounded-full shadow-lg"
              />
            </div>
            <div className="flex justify-between text-xs text-white font-extrabold mt-2 tracking-wider">
              <span>PROGRESS</span>
              <span>{completionPercentage}%</span>
            </div>
          </motion.div>

          {/* THREE MINI COUNT INDICATOR BOARDS - REMASTERED FOR SOLID CONTRAST */}
          <motion.div 
            variants={fadeUp} 
            custom={2}
            className="grid grid-cols-3 gap-3"
          >
            <div className="bg-zinc-950 border border-white/20 p-4 rounded-2xl text-center shadow-lg">
              <span className="block text-2xl font-black text-white font-mono leading-none">{taskSummary.todo}</span>
              <span className="text-[10px] uppercase font-black text-zinc-400 tracking-wider mt-1.5 block">To Do</span>
            </div>
            
            <div className="bg-blue-950/80 border-2 border-blue-400/40 p-4 rounded-2xl text-center shadow-lg">
              <span className="block text-2xl font-black text-blue-300 font-mono leading-none">{taskSummary.inProgress}</span>
              <span className="text-[10px] uppercase font-black text-blue-300 tracking-wider mt-1.5 block">In Progress</span>
            </div>

            <div className="bg-emerald-950/80 border-2 border-emerald-400/40 p-4 rounded-2xl text-center shadow-lg">
              <span className="block text-2xl font-black text-emerald-300 font-mono leading-none">{taskSummary.completed}</span>
              <span className="text-[10px] uppercase font-black text-emerald-300 tracking-wider mt-1.5 block">Done</span>
            </div>
          </motion.div>

          {/* CRITICAL ACTIONS: TOP 3 OBJECTIVES TO COMPLETE - SOLID HIGH-CONTRAST GLASS */}
          <motion.section variants={fadeUp} custom={3} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h2 className="text-xs tracking-[0.2em] uppercase text-yellow-400 font-black">
                  Top 3 Critical Focus Tasks
                </h2>
                <p className="text-xs text-zinc-300 font-medium">Laser focus on getting these done today.</p>
              </div>
              <Button
                variant="default"
                className="bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black text-[10px] tracking-widest uppercase px-3 py-1.5 h-auto rounded-xl shadow-md border-none"
                onClick={onEnterWorkspace}
              >
                View Hub
              </Button>
            </div>

            <div className="space-y-3">
              {importantTasks.map((task, idx) => {
                const progress = task.progress || (task.priority === "high" ? 85 : task.priority === "medium" ? 60 : 40);
                return (
                  <div 
                    key={task.id}
                    className="p-5 rounded-2xl bg-zinc-950/90 border-2 border-white/10 hover:border-yellow-400/40 hover:bg-zinc-900 transition-all duration-300 group cursor-pointer shadow-xl"
                    onClick={onEnterWorkspace}
                  >
                    <div className="flex items-start justify-between mb-4 gap-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm md:text-base font-extrabold text-white group-hover:text-yellow-400 transition-colors duration-300">
                            {task.title}
                          </h3>
                          {task.priority === 'high' && (
                            <Badge className="bg-red-500/20 border-2 border-red-500/30 text-red-400 text-[9px] uppercase tracking-wider font-extrabold px-2 py-0 h-5 flex-shrink-0">
                              Urgent
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs md:text-sm text-zinc-300 font-normal leading-relaxed line-clamp-2">
                          {task.description || "No description provided."}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-extrabold border-2 bg-yellow-400/20 text-yellow-300 border-yellow-400/30 uppercase tracking-widest px-2.5 py-0.5 flex-shrink-0"
                      >
                        In Progress
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-zinc-300 font-extrabold uppercase tracking-wider">
                        <span>Task Completion</span>
                        <span className="text-yellow-400">{progress}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1.2, delay: 0.3 + idx * 0.1, ease: "easeOut" }}
                          className="h-full bg-yellow-400 rounded-full shadow-lg"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {importantTasks.length === 0 && (
                <div className="text-center py-10 rounded-2xl border-2 border-dashed border-white/20 bg-zinc-950/90 shadow-md">
                  <p className="text-sm text-zinc-300 font-extrabold">Clear of any active tasks today!</p>
                </div>
              )}
            </div>
          </motion.section>

        </div>

        {/* ================= RIGHT COLUMN: SCHEDULE, DYNAMIC NOTIFICATIONS, STICKY NOTES (Span 5) ================= */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* IMPORTANT RECENT NOTIFICATIONS CONTAINER - CRISP LIGHTING */}
          <motion.section variants={fadeUp} custom={4} className="space-y-4">
            <h2 className="text-xs tracking-[0.2em] uppercase text-yellow-400 font-black">
              Important Notifications
            </h2>
            
            <div className="space-y-3">
              {notifications.map((notif) => {
                return (
                  <div 
                    key={notif.id}
                    className="p-4 bg-zinc-950/90 border-2 border-white/10 rounded-2xl flex gap-3 hover:bg-zinc-900 transition-all duration-300 shadow-lg"
                  >
                    <div className="mt-0.5 p-1 rounded-lg bg-white/5 border border-white/10">
                      {getNotificationIcon(notif.type, notif.is_urgent)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-white font-extrabold text-xs md:text-sm truncate">
                          {notif.title}
                        </h4>
                        {notif.is_urgent && (
                          <Badge variant="destructive" className="h-4 text-[9px] uppercase tracking-wider font-extrabold px-1.5">
                            Urgent
                          </Badge>
                        )}
                      </div>
                      <p className="text-zinc-300 text-xs font-normal mt-1 leading-relaxed line-clamp-2">
                        {notif.content}
                      </p>
                    </div>
                  </div>
                );
              })}

              {notifications.length === 0 && (
                <div className="text-center py-6 text-zinc-400 text-xs border border-dashed border-white/10 rounded-2xl bg-zinc-950/90">
                  No notifications recorded.
                </div>
              )}
            </div>
          </motion.section>

          {/* SCHEDULE MEETING LIST (High visibility meetings) */}
          <motion.section variants={fadeUp} custom={5} className="space-y-4">
            <h2 className="text-xs tracking-[0.2em] uppercase text-yellow-400 font-black">
              Today's Schedule
            </h2>

            <div className="space-y-3">
              {upcomingMeetings.map((meeting, idx) => {
                const isUrgent = meeting.status === "Starting Soon";
                return (
                  <div 
                    key={idx}
                    className="p-4 rounded-2xl bg-zinc-950/90 border-2 border-white/10 hover:border-white/20 transition-all duration-300 flex justify-between items-center gap-4 shadow-lg"
                  >
                    <div className="space-y-1">
                      <h3 className="text-xs md:text-sm font-extrabold text-white">
                        {meeting.title}
                      </h3>
                      <p className="text-[10px] md:text-xs text-zinc-300 font-medium flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-yellow-400" />
                        {meeting.type}
                      </p>
                    </div>
                    
                    <div className="text-right space-y-1 flex-shrink-0">
                      <p className="text-xs md:text-sm font-black text-white">
                        {meeting.time}
                      </p>
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-extrabold border-2 uppercase tracking-wider px-2 py-0.5 ${
                          isUrgent 
                            ? "bg-red-500/20 text-red-400 border-red-500/30" 
                            : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        }`}
                      >
                        {meeting.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>

          {/* PERSONAL STICKY REMINDERS */}
          <motion.section variants={fadeUp} custom={6} className="space-y-4">
            <h2 className="text-xs tracking-[0.2em] uppercase text-yellow-400 font-black">
              Sticky Reminders
            </h2>

            <div className="p-4 rounded-2xl bg-zinc-950/90 border-2 border-white/10 space-y-4 shadow-lg">
              <div className="flex gap-2">
                <Input 
                  type="text" 
                  placeholder="Type a quick reminder..." 
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                  className="bg-white/5 border-2 border-white/15 text-white rounded-xl placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-yellow-400 text-xs md:text-sm h-10 px-3"
                />
                <Button 
                  onClick={handleAddNote}
                  className="bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black h-10 px-4 rounded-xl flex items-center justify-center border-none shadow-md"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                {personalNotes.map((note, index) => (
                  <div 
                    key={index} 
                    className="p-3 bg-yellow-450/10 border-2 border-yellow-400/20 rounded-xl flex items-start justify-between gap-3 group/note hover:bg-yellow-400/20 transition-all duration-300"
                  >
                    <p className="text-yellow-100 text-xs md:text-sm font-semibold leading-relaxed break-words flex-1 pr-1">
                      {note}
                    </p>
                    <button 
                      onClick={() => handleRemoveNote(index)}
                      className="text-zinc-400 hover:text-red-400 transition-colors opacity-100 flex-shrink-0 mt-0.5"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

        </div>

      </motion.div>

      {/* 4. REWARDS SCOREBOARD & NAVIGATION CONTROLLERS */}
      <motion.div 
        variants={fadeUp} 
        custom={7}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch"
      >
        <div className="bg-zinc-950/90 border-2 border-white/10 backdrop-blur-xl rounded-2xl p-5 flex flex-row items-center justify-around gap-4 hover:border-yellow-400/30 transition-colors shadow-lg">
          <div className="text-center">
            <span className="text-[10px] uppercase font-extrabold text-zinc-400 tracking-widest flex items-center justify-center gap-1.5 mb-1.5">
              <Coins className="w-4 h-4 text-yellow-400" />
              Total Coins
            </span>
            <span className="text-2xl font-black text-white font-mono drop-shadow">
              {userProfile?.total_points?.toLocaleString() || "0"}
            </span>
          </div>

          <div className="w-[1.5px] h-10 bg-white/20" />

          <div className="text-center">
            <span className="text-[10px] uppercase font-extrabold text-zinc-400 tracking-widest flex items-center justify-center gap-1.5 mb-1.5">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Flow Streak
            </span>
            <span className="text-2xl font-black text-white font-mono drop-shadow">
              {userProfile?.attendance_streak || "0"}d
            </span>
          </div>
        </div>

        <div className="flex justify-stretch">
          <Button
            onClick={onEnterWorkspace}
            className="w-full h-full min-h-[3.5rem] rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black text-sm tracking-widest uppercase transition-all shadow-xl shadow-yellow-500/10 hover:scale-[1.02] active:scale-95 border-none"
          >
            Enter Workspace
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </motion.div>

    </div>
  );
}
