
import { ReactNode, useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";
import ChatPopout from "./ChatPopout";
import {
  Monitor,
  Coffee,
  Users,
  MessageCircle,
  Calendar,
  Bell,
  ClipboardList,
  X,
  Coins,
  Hash,
  Swords,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  PlaneTakeoff,
  Trophy,
  Compass,
  Laptop
} from "lucide-react";
import TeamStatusSidebar from "./TeamStatusSidebar";
import TeamChat from "./TeamChat";
import { ActivityLogPanel } from "./ActivityLogPanel";
import MobileBottomNav from "./MobileBottomNav";
import MiniChess from "./MiniChess";
import LeaveApplicationDialog from "./LeaveApplicationDialog";
import { CompletedTasksDialog } from "./CompletedTasksDialog";
import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";
import { Badge } from "@/components/ui/badge";


interface VirtualOfficeLayoutProps {
  children: ReactNode;
  currentRoom: 'home' | 'workspace' | 'breakroom' | 'meeting';
  onRoomChange: (room: 'home' | 'workspace' | 'breakroom' | 'meeting') => void;
  onlineUsers?: Record<string, any>;
  userId?: string;
  userProfile?: any;
  className?: string;
  onOpenCoins?: () => void;
}

const VirtualOfficeLayout = ({
  children,
  currentRoom,
  onRoomChange,
  onlineUsers = {},
  userId,
  userProfile,
  className,
  onOpenCoins
}: VirtualOfficeLayoutProps) => {
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'status' | 'chat'>('status');
  const [mobileSidebarTab, setMobileSidebarTab] = useState<'status' | 'chat'>('status');
  const [chessArenaMode, setChessArenaMode] = useState(false);
  const [roomsCollapsed, setRoomsCollapsed] = useState(false);
  const [actionsCollapsed, setActionsCollapsed] = useState(false);
  const [popoutChat, setPopoutChat] = useState(false);
  const [popoutDM, setPopoutDM] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showCompletedTasksDialog, setShowCompletedTasksDialog] = useState(false);
  const [celebrationTask, setCelebrationTask] = useState<any | null>(null);
  const navigate = useNavigate();
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Check for completed tasks to trigger confetti/celebration (supports offline-recovery)
  useEffect(() => {
    if (!userId || currentRoom !== 'workspace') return;

    const checkNewCompletions = async () => {
      try {
        const { data: tasksData, error: tasksError } = await supabase
          .from("staff_tasks")
          .select("*, staff_subtasks(*)")
          .eq("status", "completed");

        if (tasksError) throw tasksError;

        const rawTasks = tasksData || [];
        const unseenCompleted: any[] = [];

        const seenTasksStr = localStorage.getItem(`seen_completed_tasks_${userId}`) || "[]";
        let seenTasks: string[] = [];
        try {
          seenTasks = JSON.parse(seenTasksStr);
        } catch {
          seenTasks = [];
        }

        rawTasks.forEach((task) => {
          if (seenTasks.includes(task.id)) return;

          // Check if user is directly assigned
          let isDirectlyAssigned = false;
          if (task.assigned_to) {
            try {
              const parsed = typeof task.assigned_to === "string"
                ? JSON.parse(task.assigned_to)
                : task.assigned_to;
              if (Array.isArray(parsed) && parsed.includes(userId)) {
                isDirectlyAssigned = true;
              }
            } catch (e) {
              if (typeof task.assigned_to === "string" && task.assigned_to.includes(userId)) {
                isDirectlyAssigned = true;
              }
            }
          }

          // Check if user has assigned subtasks
          const hasUserSubtasks = (task.staff_subtasks || []).some(
            (st: any) => st.assigned_to === userId
          );

          if (isDirectlyAssigned || hasUserSubtasks) {
            unseenCompleted.push(task);
          }
        });

        if (unseenCompleted.length > 0) {
          const taskToCelebrate = unseenCompleted[0];
          
          // Fire gorgeous triple confetti bursts!
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.5 }
          });
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 100,
              origin: { y: 0.5, x: 0.3 }
            });
          }, 250);
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 100,
              origin: { y: 0.5, x: 0.7 }
            });
          }, 500);

          setCelebrationTask(taskToCelebrate);

          // Save all as seen so we don't duplicate on reload
          const allFoundIds = unseenCompleted.map(t => t.id);
          const newSeenList = Array.from(new Set([...seenTasks, ...allFoundIds]));
          localStorage.setItem(`seen_completed_tasks_${userId}`, JSON.stringify(newSeenList));
        }
      } catch (err) {
        console.error("Error checking completed tasks celebration:", err);
      }
    };

    // Tiny timeout to let workspace page load fully
    const timer = setTimeout(checkNewCompletions, 1200);
    return () => clearTimeout(timer);
  }, [userId, currentRoom]);

  // Real-time subscription to trigger confetti instantly for online users
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("completed-task-celebration-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "staff_tasks",
        },
        async (payload) => {
          const newTask = payload.new as any;
          if (newTask.status === "completed") {
            const seenTasksStr = localStorage.getItem(`seen_completed_tasks_${userId}`) || "[]";
            let seenTasks: string[] = [];
            try {
              seenTasks = JSON.parse(seenTasksStr);
            } catch {
              seenTasks = [];
            }

            if (seenTasks.includes(newTask.id)) return;

            // Check if user is directly assigned
            let isDirectlyAssigned = false;
            if (newTask.assigned_to) {
              try {
                const parsed = typeof newTask.assigned_to === "string"
                  ? JSON.parse(newTask.assigned_to)
                  : newTask.assigned_to;
                if (Array.isArray(parsed) && parsed.includes(userId)) {
                  isDirectlyAssigned = true;
                }
              } catch (e) {
                if (typeof newTask.assigned_to === "string" && newTask.assigned_to.includes(userId)) {
                  isDirectlyAssigned = true;
                }
              }
            }

            // Also check subtasks from database
            const { data: subtasks } = await supabase
              .from("staff_subtasks")
              .select("id")
              .eq("task_id", newTask.id)
              .eq("assigned_to", userId);

            const hasUserSubtasks = subtasks && subtasks.length > 0;

            if (isDirectlyAssigned || hasUserSubtasks) {
              confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.5 }
              });
              setTimeout(() => {
                confetti({
                  particleCount: 100,
                  spread: 100,
                  origin: { y: 0.5, x: 0.3 }
                });
              }, 250);
              setTimeout(() => {
                confetti({
                  particleCount: 100,
                  spread: 100,
                  origin: { y: 0.5, x: 0.7 }
                });
              }, 500);

              setCelebrationTask(newTask);

              // Mark as seen
              const newSeenList = Array.from(new Set([...seenTasks, newTask.id]));
              localStorage.setItem(`seen_completed_tasks_${userId}`, JSON.stringify(newSeenList));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [currentRoom]);

  const rooms = [
    { id: 'home' as const, name: 'Office', icon: Compass, color: 'from-emerald-500 to-teal-600' },
    { id: 'workspace' as const, name: 'Workspace', icon: Monitor, color: 'from-blue-500 to-blue-600' },
    { id: 'meeting' as const, name: 'Meeting Room', icon: Users, color: 'from-yellow-500 to-yellow-600' }
  ];

  return (
    <div className={`flex flex-col lg:flex-row h-full w-full overflow-hidden ${className || ""}`}>
      {/* Mobile Chat Sheet */}
      <Sheet open={showMobileChat} onOpenChange={setShowMobileChat}>
        <SheetContent side="right" className="w-full sm:w-[400px] p-0 bg-background/95 backdrop-blur-xl">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Team
            </SheetTitle>
          </SheetHeader>
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setMobileSidebarTab('status')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${mobileSidebarTab === 'status'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <Users className="w-4 h-4" />
              Status
            </button>
            <button
              onClick={() => setMobileSidebarTab('chat')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${mobileSidebarTab === 'chat'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <Hash className="w-4 h-4" />
              Team Chat
            </button>
          </div>
          <div className="h-[calc(100vh-140px)] overflow-hidden">
            {mobileSidebarTab === 'status' ? (
              <div className="h-full overflow-y-auto p-4">
                <TeamStatusSidebar onlineUsers={onlineUsers} currentUserId={userId} />
              </div>
            ) : (
              <div className="h-full overflow-hidden flex flex-col">
                <TeamChat userId={userId || ''} userProfile={userProfile} />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      {currentRoom !== 'home' && (
        <aside className="hidden lg:flex lg:flex-col w-80 bg-black/20 backdrop-blur-lg border-r border-white/10 overflow-hidden flex-shrink-0 z-20">
        <div className="p-6 pb-4 space-y-4 flex-shrink-0 overflow-y-auto">
          {/* Room Navigation - Collapsible */}
          <div>
            <button
              onClick={() => setRoomsCollapsed(!roomsCollapsed)}
              className="w-full flex items-center justify-between text-white font-semibold mb-2 hover:opacity-80 transition-opacity"
            >
              <span className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-green-500 rounded"></div>
                Office Rooms
              </span>
              {roomsCollapsed ? (
                <ChevronRight className="w-4 h-4 text-white/50" />
              ) : (
                <ChevronDown className="w-4 h-4 text-white/50" />
              )}
            </button>
            {!roomsCollapsed && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                {rooms.map((room) => {
                  const Icon = room.icon;
                  const isActive = currentRoom === room.id;

                  return (
                    <Button
                      key={room.id}
                      variant="ghost"
                      className={`w-full justify-start p-4 h-auto transition-all duration-300 ${isActive
                        ? `bg-gradient-to-r ${room.color} text-white shadow-lg shadow-blue-500/25`
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                        }`}
                      onClick={() => onRoomChange(room.id)}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      <span className="font-medium">{room.name}</span>
                      {isActive && (
                        <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      )}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions / Chess Arena Toggle */}
          <div className="relative">
            {chessArenaMode ? (
              /* ── Chess Arena Mode ── */
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Swords className="w-4 h-4 text-amber-400" />
                    Chess Arena
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative z-10 h-8 px-3 text-white/60 hover:text-white hover:bg-white/10"
                    onClick={(e) => { e.stopPropagation(); setChessArenaMode(false); }}
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                    Back
                  </Button>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-black/20 to-orange-500/5 overflow-hidden">
                  {userId && (
                    <MiniChess userId={userId} userProfile={userProfile} compact />
                  )}
                </div>
              </div>
            ) : (
              /* ── Normal Quick Actions ── */
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <button
                  onClick={() => setActionsCollapsed(!actionsCollapsed)}
                  className="w-full flex items-center justify-between text-white font-semibold mb-2 hover:opacity-80 transition-opacity"
                >
                  <span>Quick Actions</span>
                  {actionsCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-white/50" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/50" />
                  )}
                </button>
                {!actionsCollapsed && (
                <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  {/* Chess Arena Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="col-span-2 relative overflow-hidden bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-red-500/20 border-amber-500/30 text-amber-200 hover:from-amber-500/30 hover:via-orange-500/25 hover:to-red-500/30 group"
                    onClick={() => setChessArenaMode(true)}
                  >
                    <Swords className="w-4 h-4 mr-2 group-hover:rotate-45 transition-transform duration-300" />
                    Chess Arena
                    <span className="ml-auto text-[10px] bg-amber-500/30 px-1.5 py-0.5 rounded-full text-amber-200">
                      ♟
                    </span>
                  </Button>

                  <Button variant="outline" size="sm" className="bg-red-500/20 border-red-500/30 text-white hover:bg-red-500/30">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-orange-500/20 border-orange-500/30 text-white hover:bg-orange-500/30"
                    onClick={() => setShowLeaveDialog(true)}
                  >
                    <PlaneTakeoff className="w-4 h-4 mr-2" />
                    Leave
                  </Button>
                  <Button variant="outline" size="sm" className="bg-green-500/20 border-green-500/30 text-white hover:bg-green-500/30">
                    <Bell className="w-4 h-4 mr-2" />
                    Alerts
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="col-span-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/30 text-white hover:from-amber-500/30 hover:to-yellow-500/30"
                    onClick={() => onOpenCoins ? onOpenCoins() : navigate('/mycoins')}
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    My Coins
                  </Button>

                  {/* Completed Tasks Button */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="col-span-2 bg-emerald-500/20 border-emerald-500/30 text-emerald-200 hover:from-emerald-500/30 hover:to-teal-500/30 hover:bg-emerald-500/30"
                    onClick={() => setShowCompletedTasksDialog(true)}
                  >
                    <Trophy className="w-4 h-4 mr-2 text-amber-300 animate-pulse" />
                    Completed Tasks
                  </Button>

                  {/* VAW Tools Nexus Button */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="col-span-2 bg-gradient-to-r from-blue-600/35 to-cyan-500/35 border-blue-500/40 text-blue-200 hover:from-blue-600/45 hover:to-cyan-500/45 hover:text-white hover:scale-[1.02] active:scale-[0.98] transition-all"
                    onClick={() => navigate('/staff/tools-nexus')}
                  >
                    <Laptop className="w-4 h-4 mr-2 text-cyan-300 animate-pulse" />
                    Tools Nexus
                  </Button>

                  {/* Activity Log Dialog */}
                  {userId && (
                    <Dialog open={showActivityLog} onOpenChange={setShowActivityLog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="col-span-2 bg-purple-500/20 border-purple-500/30 text-white hover:bg-purple-500/30">
                          <ClipboardList className="w-4 h-4 mr-2" />
                          Today's Activity
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px] max-h-[600px]">
                        <DialogHeader>
                          <div className="flex items-center justify-between">
                            <DialogTitle>Today's Activity Log</DialogTitle>
                            <DialogClose asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <X className="h-4 w-4" />
                              </Button>
                            </DialogClose>
                          </div>
                        </DialogHeader>
                        <div className="overflow-y-auto max-h-[500px]">
                          <ActivityLogPanel userId={userId} />
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Team Status / Chat Toggle Section */}
        <div className="flex-1 flex flex-col min-h-0 border-t border-white/10">
          <div className="flex flex-shrink-0 items-center">
            <button
              onClick={() => setSidebarTab('status')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${sidebarTab === 'status'
                ? 'text-white border-b-2 border-blue-500 bg-white/5'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }`}
            >
              <Users className="w-4 h-4" />
              Team Status
            </button>
            <button
              onClick={() => setSidebarTab('chat')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${sidebarTab === 'chat'
                ? 'text-white border-b-2 border-blue-500 bg-white/5'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }`}
            >
              <Hash className="w-4 h-4" />
              Team Chat
            </button>
            {/* Pop-out button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 mx-1 text-white/40 hover:text-white hover:bg-white/10 flex-shrink-0"
              title={sidebarTab === 'chat' ? 'Pop out Team Chat' : 'Pop out DM Chat'}
              onClick={() => {
                if (sidebarTab === 'chat') {
                  setPopoutChat(true);
                } else {
                  setPopoutDM(true);
                }
              }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            {sidebarTab === 'status' ? (
              <div className="h-full overflow-y-auto p-4">
                <TeamStatusSidebar onlineUsers={onlineUsers} currentUserId={userId} />
              </div>
            ) : (
              <div className="h-full overflow-hidden flex flex-col">
                <TeamChat userId={userId || ''} userProfile={userProfile} />
              </div>
            )}
          </div>
        </div>
      </aside>
      )}

      {/* Main Content Area */}
      <main ref={mainContentRef} className="flex-1 overflow-y-auto p-4 lg:p-6 pb-24 lg:pb-6">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        currentRoom={currentRoom}
        onRoomChange={onRoomChange}
        onOpenChat={() => setShowMobileChat(true)}
        onOpenCoins={onOpenCoins}
      />

      {/* Pop-out Team Chat */}
      {popoutChat && userId && (
        <ChatPopout
          title="Team Chat"
          icon={<Hash className="w-4 h-4 text-blue-400" />}
          onClose={() => setPopoutChat(false)}
        >
          <TeamChat userId={userId} userProfile={userProfile} />
        </ChatPopout>
      )}

      {/* Pop-out DM / Team Status */}
      {popoutDM && (
        <ChatPopout
          title="Direct Messages"
          icon={<MessageCircle className="w-4 h-4 text-green-400" />}
          onClose={() => setPopoutDM(false)}
        >
          <div className="h-full overflow-y-auto p-4">
            <TeamStatusSidebar onlineUsers={onlineUsers} currentUserId={userId} />
          </div>
        </ChatPopout>
      )}

      {/* Leave Application Dialog */}
      {userId && (
        <LeaveApplicationDialog 
          open={showLeaveDialog} 
          onOpenChange={setShowLeaveDialog} 
          userId={userId} 
        />
      )}

      {/* Completed Tasks Dialog */}
      {userId && (
        <CompletedTasksDialog
          open={showCompletedTasksDialog}
          onOpenChange={setShowCompletedTasksDialog}
          userId={userId}
          userProfile={userProfile}
        />
      )}

      {/* Celebration Modal Overlay */}
      <Dialog open={!!celebrationTask} onOpenChange={() => setCelebrationTask(null)}>
        <DialogContent className="max-w-md bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 border-amber-500/40 text-white rounded-2xl p-6 text-center shadow-[0_0_50px_rgba(245,158,11,0.2)] border animate-in fade-in zoom-in-95 duration-300">
          <DialogHeader className="flex flex-col items-center space-y-4">
            <div className="relative">
              {/* Outer glowing halo */}
              <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl scale-125 animate-pulse" />
              <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 border border-amber-300/30 flex items-center justify-center shadow-2xl relative">
                <Trophy className="h-10 w-10 text-slate-950 animate-bounce" />
              </div>
            </div>
            <div>
              <DialogTitle className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-300 tracking-tight uppercase">
                Mission Accomplished!
              </DialogTitle>
              <p className="text-[10px] text-amber-400/70 mt-1 font-bold uppercase tracking-widest">
                Achievement Unlocked
              </p>
            </div>
          </DialogHeader>

          <div className="my-6 space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                COMPLETED TASK
              </span>
              <h4 className="font-extrabold text-white text-base leading-snug">
                {celebrationTask?.title}
              </h4>
              {celebrationTask?.points && (
                <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-2.5 py-0.5 mt-1 font-bold">
                  +{celebrationTask.points} Coins Earned
                </Badge>
              )}
            </div>
            
            <p className="text-xs text-white/60 leading-relaxed max-w-[280px] mx-auto">
              Your dedication and focus have finalized this objective. Your points balance has been updated successfully!
            </p>
          </div>

          <Button
            onClick={() => setCelebrationTask(null)}
            className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs rounded-xl py-5 shadow-lg shadow-amber-500/10 border-none"
          >
            CLAIM REWARD
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VirtualOfficeLayout;
