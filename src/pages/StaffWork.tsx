import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause, 
  Coffee, 
  Clock, 
  Target, 
  MessageSquare, 
  Plus, 
  CheckCircle, 
  TrendingUp, 
  Coins, 
  LayoutGrid, 
  List, 
  ArrowLeft,
  ChevronRight,
  Briefcase,
  StickyNote,
  Zap,
  Globe,
  Settings,
  User,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const StaffWork = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Timer State
  const [activeTask, setActiveTask] = useState<any>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakTimeRemaining, setBreakTimeRemaining] = useState(900); // 15 mins

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    let interval: any;
    if (isTimerRunning && !isOnBreak) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else if (isOnBreak && breakTimeRemaining > 0) {
      interval = setInterval(() => {
        setBreakTimeRemaining(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, isOnBreak, breakTimeRemaining]);

  const fetchInitialData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/staff/login");
        return;
      }

      const { data: profileData } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setProfile(profileData);

      const { data: tasksData } = await supabase
        .from('staff_tasks')
        .select('*, staff_subtasks(*)')
        .in('status', ['pending', 'in_progress', 'overdue'])
        .order('due_date', { ascending: true });

      // Sort tasks: Overdue first, then In Progress, then Pending
      const sortedTasks = (tasksData || []).sort((a, b) => {
        const statusOrder = { 'overdue': 0, 'in_progress': 1, 'pending': 2 };
        return (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
      });

      setTasks(sortedTasks);
      
      const inProg = sortedTasks.find(t => t.status === 'in_progress');
      if (inProg) {
         setActiveTask(inProg);
         if (inProg.timer_started_at) {
           const startTime = new Date(inProg.timer_started_at).getTime();
           setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
           setIsTimerRunning(true);
         }
      }

      const { data: notesData } = await supabase
        .from('staff_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      setNotes(notesData || []);

    } catch (error) {
      console.error("Error fetching work data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (task: any) => {
    const subs = task.staff_subtasks || [];
    if (subs.length === 0) return 0;
    const completed = subs.filter((s: any) => s.status === 'completed').length;
    return Math.round((completed / subs.length) * 100);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'overdue': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'in_progress': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'pending': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      default: return 'text-white/40 bg-white/5 border-white/10';
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('staff_notes')
        .insert({ user_id: user?.id, content: newNote.trim() })
        .select()
        .single();
      
      if (data) {
        setNotes([data, ...notes]);
        setNewNote("");
        toast({ title: "Note added" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to add note", variant: "destructive" });
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col pb-24 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-0 inset-x-0 h-[40vh] bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none" />
      <div className="absolute top-20 -right-20 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white/40">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest">Workspace</h1>
            <p className="text-[10px] text-white/40 font-medium">Focus Zone Active</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">Live Session</span>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="p-5 space-y-8">
          
          {/* Main Focus Timer Card */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-30 transition duration-1000" />
            <div className="relative bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 overflow-hidden shadow-2xl">
              {/* Internal Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px]" />
              
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="space-y-1">
                  <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-black">Current Session</p>
                  <h2 className="text-5xl font-mono font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">
                    {formatTime(elapsedSeconds)}
                  </h2>
                </div>

                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                    initial={{ width: 0 }}
                    animate={{ width: "65%" }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                  <Button 
                    variant={isOnBreak ? "secondary" : "outline"}
                    onClick={() => setIsOnBreak(!isOnBreak)}
                    className="h-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 font-black uppercase text-[10px] tracking-widest gap-2"
                  >
                    <Coffee className={cn("w-4 h-4", isOnBreak ? "text-orange-400" : "text-white/40")} />
                    {isOnBreak ? "End Break" : "Take Break"}
                  </Button>
                  <Button 
                    className="h-14 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl shadow-blue-500/20"
                  >
                    <Pause className="w-4 h-4" /> Stop Session
                  </Button>
                </div>
              </div>

              {isOnBreak && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-center"
                >
                  <p className="text-[10px] text-orange-400 uppercase font-black tracking-widest mb-1">On Break</p>
                  <p className="text-xl font-mono font-black text-orange-400">{formatTime(breakTimeRemaining)}</p>
                </motion.div>
              )}
            </div>
          </motion.section>

          {/* Quick Stats Grid */}
          <section className="grid grid-cols-2 gap-4">
            <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-5 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <Coins className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Today's Coins</p>
                <p className="text-2xl font-black text-white">+120 <span className="text-[10px] text-emerald-400/60 ml-1">COINS</span></p>
              </div>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-5 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Tasks Done</p>
                <p className="text-2xl font-black text-white">4 <span className="text-[10px] text-blue-400/60 ml-1">TASKS</span></p>
              </div>
            </div>
          </section>

          {/* Current Tasks List */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30">Active Assignments</h3>
              <Badge variant="outline" className="text-[8px] bg-white/5 border-white/10 uppercase">{tasks.length} Active</Badge>
            </div>
            
            <div className="space-y-4">
              {tasks.map((task) => {
                const progress = calculateProgress(task);
                const isOverdue = task.status === 'overdue';
                
                return (
                  <div 
                    key={task.id} 
                    onClick={() => navigate(`/staff/task/${task.id}`)} 
                    className={cn(
                      "bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 space-y-4 active:scale-95 transition-all relative overflow-hidden group",
                      isOverdue && "border-red-500/20 bg-red-500/[0.02]"
                    )}
                  >
                    {/* Urgency Indicator */}
                    {isOverdue && <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />}
                    
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                           <Badge variant="outline" className={cn("text-[8px] font-black uppercase px-2", getStatusColor(task.status))}>
                             {task.status.replace('_', ' ')}
                           </Badge>
                           {task.priority === 'urgent' && (
                             <Badge className="bg-red-500 text-white text-[8px] font-black uppercase px-2">Urgent</Badge>
                           )}
                        </div>
                        <h4 className="text-base font-black tracking-tight text-white/90 leading-tight">{task.title}</h4>
                      </div>
                      <div className="flex flex-col items-end">
                        <p className={cn("text-[10px] font-black uppercase tracking-widest", isOverdue ? "text-red-400" : "text-white/20")}>Deadline</p>
                        <p className={cn("text-xs font-bold", isOverdue ? "text-red-400" : "text-white/60")}>
                          {task.due_date ? format(new Date(task.due_date), 'MMM dd') : 'No Date'}
                        </p>
                      </div>
                    </div>

                    {/* Progress Section */}
                    <div className="space-y-2">
                       <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Completion Progress</p>
                          <p className="text-[10px] font-black text-blue-400 uppercase">{progress}%</p>
                       </div>
                       <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className={cn("h-full bg-gradient-to-r", isOverdue ? "from-red-500 to-orange-500" : "from-blue-500 to-cyan-500")}
                          />
                       </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                       <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                             <List className="w-3.5 h-3.5 text-white/20" />
                             <span className="text-[10px] font-bold text-white/40">{(task.staff_subtasks || []).length} Steps</span>
                          </div>
                          {task.points && (
                            <div className="flex items-center gap-1.5">
                               <Coins className="w-3.5 h-3.5 text-emerald-400/60" />
                               <span className="text-[10px] font-bold text-emerald-400/60">{task.points} Pts</span>
                            </div>
                          )}
                       </div>
                       <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                          <ChevronRight className="w-4 h-4" />
                       </div>
                    </div>
                  </div>
                );
              })}
              {tasks.length === 0 && (
                <div className="text-center py-10 bg-white/[0.02] rounded-3xl border border-dashed border-white/5">
                  <Briefcase className="w-8 h-8 text-white/10 mx-auto mb-2" />
                  <p className="text-xs text-white/30 font-medium">No active tasks in progress</p>
                </div>
              )}
            </div>
          </section>

          {/* Quick Notes Tool */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-yellow-400" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30">Quick Notes</h3>
            </div>
            
            <div className="bg-white/[0.03] border border-white/5 rounded-[2rem] p-5 space-y-4">
              <div className="flex gap-2">
                <Input 
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="Capture a thought..."
                  className="bg-white/5 border-white/10 rounded-2xl text-sm h-12"
                />
                <Button onClick={handleAddNote} size="icon" className="h-12 w-12 rounded-2xl bg-blue-500">
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="space-y-2">
                {notes.map((note) => (
                  <div key={note.id} className="bg-white/[0.02] rounded-2xl p-4 flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1.5 flex-shrink-0" />
                    <p className="text-xs text-white/70 font-medium leading-relaxed">{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>
      </ScrollArea>

      {/* Floating Bottom Nav for Work Mode */}
      <nav className="fixed bottom-6 inset-x-6 z-[100]">
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-2 shadow-2xl flex items-center justify-around">
          <Button variant="ghost" className="flex flex-col gap-1 items-center h-14 w-12 text-blue-400">
             <Briefcase className="w-5 h-5" />
             <span className="text-[7px] font-black uppercase">Work</span>
          </Button>
          <Button variant="ghost" onClick={() => navigate("/staff/dashboard")} className="flex flex-col gap-1 items-center h-14 w-12 text-white/40">
             <MessageSquare className="w-5 h-5" />
             <span className="text-[7px] font-black uppercase">Chat</span>
          </Button>
          
          <div onClick={() => navigate("/staff/dashboard")} className="w-16 h-16 -mt-10 rounded-full bg-slate-800 flex items-center justify-center shadow-xl border-4 border-slate-950 active:scale-90 transition-transform">
             <LayoutGrid className="w-8 h-8 text-white/40" />
          </div>

          <Button variant="ghost" onClick={() => navigate("/mycoins")} className="flex flex-col gap-1 items-center h-14 w-12 text-white/40">
             <Coins className="w-5 h-5" />
             <span className="text-[7px] font-black uppercase">Coins</span>
          </Button>
          <Button variant="ghost" onClick={() => navigate("/account")} className="flex flex-col gap-1 items-center h-14 w-12 text-white/40">
             <User className="w-5 h-5" />
             <span className="text-[7px] font-black uppercase">Profile</span>
          </Button>
        </div>
      </nav>
    </div>
  );
};

export default StaffWork;
