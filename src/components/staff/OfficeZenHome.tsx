import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Clock, Users, Plus, Trash2, Coins, TrendingUp, ArrowRight,
  Sparkles, Bell, Megaphone, AlertTriangle, Info, CheckCircle,
  ChevronRight, Zap, Shield, Bookmark, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  type: string;
  is_urgent: boolean;
  created_at: string;
  read_by: string[];
  expires_at?: string;
}

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  if (h < 21) return "Good Evening";
  return "Good Night";
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" },
  }),
};

export default function OfficeZenHome({ userId, userProfile, onEnterWorkspace }: OfficeZenHomeProps) {
  const [currentTasks, setCurrentTasks] = useState<any[]>([]);
  const [taskSummary, setTaskSummary] = useState({ todo: 0, inProgress: 0, completed: 0, total: 0 });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [personalNotes, setPersonalNotes] = useState<string[]>(() => {
    const saved = userId ? localStorage.getItem(`nexus_notes_${userId}`) : null;
    return saved ? JSON.parse(saved) : [
      "Review new client onboarding proposal",
      "Update workspace mockups by 5 PM",
      "Submit weekly status timesheet",
    ];
  });
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    if (userId) localStorage.setItem(`nexus_notes_${userId}`, JSON.stringify(personalNotes));
  }, [personalNotes, userId]);

  const fetchData = async () => {
    if (!userId) return;
    try {
      const { data: tasks } = await supabase.from("staff_tasks").select("*, staff_subtasks(*)").order("created_at", { ascending: false });
      if (tasks) {
        const mine = tasks.filter((t: any) => {
          let assigned = false;
          try {
            const p = typeof t.assigned_to === "string" ? JSON.parse(t.assigned_to) : t.assigned_to;
            if (Array.isArray(p) && p.includes(userId)) assigned = true;
          } catch { if (String(t.assigned_to).includes(userId)) assigned = true; }
          const subAssigned = (t.staff_subtasks || []).some((s: any) => s.assigned_to === userId);
          return assigned || subAssigned;
        });
        const active = mine.filter((t: any) => ["in_progress", "review_pending"].includes(t.status));
        const done = mine.filter((t: any) => t.status === "completed");
        const todo = mine.filter((t: any) => ["todo", "backlog"].includes(t.status));
        setCurrentTasks(active);
        setTaskSummary({ todo: todo.length, inProgress: active.length, completed: done.length, total: mine.length });
      }
      const { data: notifs } = await supabase.from("staff_notifications").select("*").order("created_at", { ascending: false }).limit(3);
      if (notifs) setNotifications(notifs.filter(n => !n.expires_at || new Date(n.expires_at) > new Date()));
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchData();
    const ch1 = supabase.channel("home_tasks_new").on("postgres_changes", { event: "*", schema: "public", table: "staff_tasks" }, fetchData).subscribe();
    const ch2 = supabase.channel("home_notifs_new").on("postgres_changes", { event: "*", schema: "public", table: "staff_notifications" }, fetchData).subscribe();
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
  }, [userId]);

  const addNote = () => {
    if (!newNote.trim()) return;
    setPersonalNotes([...personalNotes, newNote.trim()]);
    setNewNote("");
    toast.success("Note added");
  };

  const removeNote = (i: number) => setPersonalNotes(personalNotes.filter((_, idx) => idx !== i));

  const topTasks = [...currentTasks]
    .sort((a, b) => ({ high: 3, medium: 2, low: 1 }[b.priority as string] || 0) - ({ high: 3, medium: 2, low: 1 }[a.priority as string] || 0))
    .slice(0, 3);

  const pct = taskSummary.total > 0 ? Math.round((taskSummary.completed / taskSummary.total) * 100) : 0;
  const firstName = userProfile?.full_name?.split(" ")[0] || userProfile?.username || "there";

  const meetings = [
    { title: "Daily Standup", type: "All Team", time: "10:00 AM", urgent: true },
    { title: "Tech Sprint Review", type: "Project Review", time: "2:00 PM", urgent: false },
  ];

  const notifIcon = (type: string, urgent: boolean) => {
    if (type === "task_assigned") return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    if (type === "mood_alert") return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    if (type === "achievement") return <Sparkles className="w-4 h-4 text-violet-400" />;
    return <Megaphone className={`w-4 h-4 ${urgent ? "text-rose-400" : "text-cyan-400"}`} />;
  };

  return (
    <div className="max-w-[1240px] mx-auto pb-24 px-4 space-y-8 relative z-20">

      {/* TOP COMPACT BRAND LOGO & DYNAMIC GREETING */}
      <div className="flex flex-col items-center text-center space-y-2 pt-4">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <img src="/lovable-uploads/0d3e4545-c80e-401b-82f1-3319db5155b4.png" alt="VAW" className="w-12 h-12 rounded-2xl shadow-xl border border-white/20" />
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-2xl md:text-3xl font-extralight tracking-tight text-white"
        >
          {getGreeting()}, <span className="font-extrabold text-cyan-400 drop-shadow">{firstName}</span>
        </motion.h1>
        <p className="text-xs text-zinc-400 tracking-wider flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Command Center Active
        </p>
      </div>

      {/* ASYMMETRIC 3-COLUMN LAYOUT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

        {/* ================= LEFT COLUMN: DASHBOARD CONTROL & STATUS (Span 3) ================= */}
        <motion.div 
          variants={fadeUp} initial="hidden" animate="visible" custom={1}
          className="md:col-span-12 lg:col-span-3 space-y-6"
        >
          {/* PROFILE CONTROL BOARD */}
          <div className="p-5 rounded-3xl bg-zinc-950/80 backdrop-blur-xl border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-20">
              <Shield className="w-16 h-16 text-cyan-400" />
            </div>
            
            <div className="flex flex-col items-center text-center space-y-4">
              <Avatar className="h-20 w-20 border-2 border-cyan-400/50 shadow-lg">
                <AvatarImage src={userProfile?.profile_photo_url || userProfile?.avatar_url} />
                <AvatarFallback className="text-lg bg-zinc-800 text-white">
                  {userProfile?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <h3 className="text-white font-extrabold text-base tracking-tight">{userProfile?.full_name || 'Staff Member'}</h3>
                <Badge className="bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] uppercase font-black tracking-wider px-2 py-0.5">
                  {userProfile?.role || 'Staff'}
                </Badge>
              </div>

              <div className="w-full grid grid-cols-2 gap-3 pt-2">
                <div className="bg-white/5 border border-white/10 rounded-2xl py-3 px-2 text-center">
                  <span className="text-[10px] uppercase font-extrabold text-zinc-400 tracking-wider flex items-center justify-center gap-1.5 mb-1">
                    <Coins className="w-3.5 h-3.5 text-amber-400" /> Points
                  </span>
                  <span className="text-lg font-black text-white font-mono">{userProfile?.total_points || 0}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl py-3 px-2 text-center">
                  <span className="text-[10px] uppercase font-extrabold text-zinc-400 tracking-wider flex items-center justify-center gap-1.5 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> Streak
                  </span>
                  <span className="text-lg font-black text-white font-mono">{userProfile?.attendance_streak || 0}d</span>
                </div>
              </div>
            </div>
          </div>

          {/* STICKY REMINDERS (Yellow notes theme) */}
          <div className="p-5 rounded-3xl bg-zinc-950/80 backdrop-blur-xl border border-white/10 shadow-2xl space-y-4">
            <h2 className="text-xs tracking-[0.2em] uppercase text-cyan-400 font-black flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5" /> Sticky Reminders
            </h2>

            <div className="flex gap-2">
              <Input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addNote()}
                placeholder="Quick reminder..."
                className="h-9 text-xs bg-white/5 border-2 border-white/10 text-white placeholder:text-zinc-400 rounded-xl focus-visible:ring-1 focus-visible:ring-cyan-500"
              />
              <Button onClick={addNote} size="sm" className="h-9 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-zinc-950 font-bold shadow-md">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
              {personalNotes.map((note, i) => (
                <div key={i} className="p-2.5 bg-yellow-500/10 border border-yellow-400/20 rounded-xl flex items-start justify-between gap-2 group hover:bg-yellow-500/15 transition-all">
                  <p className="text-yellow-100 text-xs font-semibold leading-relaxed break-words flex-1 pr-1">{note}</p>
                  <button onClick={() => removeNote(i)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3.5 h-3.5 text-zinc-400 hover:text-red-400 transition-colors" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ================= CENTER COLUMN: THE CORE TASK ENGINE (Span 5) ================= */}
        <motion.div 
          variants={fadeUp} initial="hidden" animate="visible" custom={2}
          className="md:col-span-12 lg:col-span-5 space-y-6"
        >
          {/* THE METRIC PERFORMANCE BOARD */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-950 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.1),transparent)] pointer-events-none" />
            
            <div className="flex items-center justify-between mb-5">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-extrabold text-cyan-400 tracking-widest bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full">
                  Today's Mission
                </span>
                <div className="flex items-baseline gap-1 mt-2">
                  <h3 className="text-3xl font-black text-white leading-none font-mono">
                    {taskSummary.completed}
                  </h3>
                  <span className="text-zinc-300 text-xs font-bold uppercase tracking-wider">
                    /{taskSummary.total} Completed
                  </span>
                </div>
              </div>

              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-cyan-400 animate-pulse">
                <Sparkles className="w-5 h-5 text-cyan-300" />
              </div>
            </div>

            {/* Thicker progressive bar with border glow */}
            <div className="h-3 w-full bg-zinc-950 rounded-full overflow-hidden border border-white/5 relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-indigo-500 via-cyan-500 to-cyan-300 rounded-full shadow-lg"
              />
            </div>
            
            <div className="flex justify-between items-center text-xs font-black mt-2 tracking-wider">
              <span className="text-zinc-400 uppercase text-[10px]">Overall Progress</span>
              <span className="text-cyan-300 font-mono">{pct}%</span>
            </div>

            {/* Mini Count Indicator Board */}
            <div className="grid grid-cols-3 gap-2.5 mt-5 pt-4 border-t border-white/10">
              <div className="bg-zinc-950/60 p-2.5 rounded-xl text-center border border-white/5">
                <span className="block text-base font-black text-white font-mono">{taskSummary.todo}</span>
                <span className="text-[9px] uppercase font-extrabold text-zinc-400 tracking-wider">To Do</span>
              </div>
              <div className="bg-blue-950/40 p-2.5 rounded-xl text-center border border-blue-400/10">
                <span className="block text-base font-black text-cyan-300 font-mono">{taskSummary.inProgress}</span>
                <span className="text-[9px] uppercase font-extrabold text-cyan-400 tracking-wider">Active</span>
              </div>
              <div className="bg-emerald-950/40 p-2.5 rounded-xl text-center border border-emerald-400/10">
                <span className="block text-base font-black text-emerald-300 font-mono">{taskSummary.completed}</span>
                <span className="text-[9px] uppercase font-extrabold text-emerald-400 tracking-wider">Done</span>
              </div>
            </div>
          </div>

          {/* FOCUS TASKS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs tracking-[0.2em] uppercase text-cyan-400 font-black">
                Top 3 Critical Focus
              </h2>
              <Button
                variant="ghost"
                onClick={onEnterWorkspace}
                className="text-[10px] font-black uppercase text-cyan-400 hover:text-cyan-300 flex items-center gap-1 h-auto py-1 px-2"
              >
                Task Hub <ChevronRight className="w-3 h-3" />
              </Button>
            </div>

            <div className="space-y-3">
              {topTasks.map((task, i) => {
                const progress = task.progress || (task.priority === "high" ? 85 : task.priority === "medium" ? 60 : 40);
                const isHigh = task.priority === "high";
                return (
                  <div
                    key={task.id}
                    onClick={onEnterWorkspace}
                    className="p-4 rounded-2xl bg-zinc-950/80 border border-white/10 hover:border-cyan-400/30 hover:bg-zinc-900 transition-all duration-300 group cursor-pointer shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-extrabold text-white group-hover:text-cyan-300 transition-colors">
                            {task.title}
                          </h3>
                          {isHigh && (
                            <Badge className="bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] uppercase tracking-wider font-extrabold px-2 py-0">
                              Urgent
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-zinc-300 line-clamp-1 leading-relaxed">
                          {task.description || "No description provided."}
                        </p>
                      </div>
                      <Badge className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[9px] uppercase tracking-widest px-2 py-0.5">
                        Active
                      </Badge>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">
                        <span>Task Completion</span>
                        <span className="text-cyan-300">{progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1, delay: 0.1 * i, ease: "easeOut" }}
                          className="h-full bg-cyan-400 rounded-full shadow-lg"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {topTasks.length === 0 && (
                <div className="text-center py-10 rounded-3xl border border-dashed border-white/20 bg-zinc-950/80 shadow-md">
                  <Zap className="w-6 h-6 mx-auto mb-2 text-zinc-500" />
                  <p className="text-xs text-zinc-300 font-extrabold">All focused items completed!</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ================= RIGHT COLUMN: STREAMS & GLOBAL CONTROLS (Span 4) ================= */}
        <motion.div 
          variants={fadeUp} initial="hidden" animate="visible" custom={3}
          className="md:col-span-12 lg:col-span-4 space-y-6"
        >
          {/* IMPORTANT NOTIFICATIONS */}
          <div className="space-y-3.5">
            <h2 className="text-xs tracking-[0.2em] uppercase text-cyan-400 font-black">
              Important Notifications
            </h2>
            
            <div className="space-y-2.5">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="p-3.5 bg-zinc-950/85 border border-white/10 rounded-2xl flex gap-3 hover:bg-zinc-900 transition-all duration-300 shadow-md"
                >
                  <div className="mt-0.5 p-1 rounded-lg bg-white/5 border border-white/10 flex-shrink-0">
                    {notifIcon(notif.type, notif.is_urgent)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-white font-extrabold text-xs truncate">
                        {notif.title}
                      </h4>
                      {notif.is_urgent && (
                        <Badge variant="destructive" className="h-4 text-[9px] uppercase font-black px-1.5 py-0 h-4">
                          Urgent
                        </Badge>
                      )}
                    </div>
                    <p className="text-zinc-300 text-[11px] font-medium mt-1 leading-relaxed line-clamp-2">
                      {notif.content}
                    </p>
                  </div>
                </div>
              ))}

              {notifications.length === 0 && (
                <div className="text-center py-6 text-zinc-400 text-xs border border-dashed border-white/10 rounded-2xl bg-zinc-950/80">
                  No notifications recorded.
                </div>
              )}
            </div>
          </div>

          {/* SCHEDULE */}
          <div className="space-y-3.5">
            <h2 className="text-xs tracking-[0.2em] uppercase text-cyan-400 font-black">
              Today's Schedule
            </h2>

            <div className="space-y-2.5">
              {meetings.map((meeting, idx) => {
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-zinc-950/85 border border-white/10 hover:border-white/20 transition-all duration-300 flex justify-between items-center gap-4 shadow-md"
                  >
                    <div className="space-y-1">
                      <h3 className="text-xs font-extrabold text-white">
                        {meeting.title}
                      </h3>
                      <p className="text-[10px] text-zinc-300 font-medium flex items-center gap-1">
                        <Users className="w-3 h-3 text-cyan-400" />
                        {meeting.type}
                      </p>
                    </div>
                    
                    <div className="text-right space-y-1 flex-shrink-0">
                      <p className="text-xs font-black text-white">
                        {meeting.time}
                      </p>
                      <Badge
                        variant="outline"
                        className={`text-[8px] font-extrabold border uppercase tracking-wider px-2 py-0.5 ${
                          meeting.urgent
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}
                      >
                        {meeting.urgent ? "Starting Soon" : "Scheduled"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FUTURISTIC PRIMARY CONTROL BUTTON */}
          <div className="pt-2">
            <Button
              onClick={onEnterWorkspace}
              className="w-full min-h-[3.5rem] rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-zinc-950 font-black text-xs tracking-widest uppercase transition-all shadow-xl shadow-cyan-500/15 hover:scale-[1.01] active:scale-95 border-none flex items-center justify-center gap-2"
            >
              Enter Workspace
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

      </div>

    </div>
  );
}
