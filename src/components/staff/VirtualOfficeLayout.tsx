
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
  Laptop,
  Folder,
  Brain,
  Tag,
  LayoutDashboard,
  Inbox,
  CheckSquare,
  FileText,
  Activity,
  MessageSquare,
  Menu,
  ChevronLeft,
  Circle
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
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";


interface VirtualOfficeLayoutProps {
  children: ReactNode;
  currentRoom: 'home' | 'workspace' | 'breakroom' | 'meeting' | 'planner';
  onRoomChange: (room: 'home' | 'workspace' | 'breakroom' | 'meeting' | 'planner') => void;
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(currentRoom === 'meeting');
  const [openSections, setOpenSections] = useState<string[]>(['Folders', 'Neuralink Space', 'Tags']);
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
    if (currentRoom === 'meeting') {
      setIsSidebarCollapsed(true);
    } else {
      setIsSidebarCollapsed(false);
    }
  }, [currentRoom]);

  const sidebarLinks = [
    {
      title: "Folders",
      icon: Folder,
      items: [
        { id: 'workspace' as const, name: 'Dashboard', icon: LayoutDashboard, path: '/staff/dashboard' },
        { id: 'planner' as const, name: 'Calendar', icon: Calendar, path: '/monthlyplanner' },
        { id: 'inbox', name: 'Inbox', icon: Inbox, path: '#' },
        { id: 'tasks', name: 'My Tasks', icon: CheckSquare, path: '#' },
      ]
    },
    {
      title: "Neuralink Space",
      icon: Brain,
      items: [
        { id: 'operations', name: 'Operations', icon: LayoutDashboard, path: '#' },
        { id: 'docs', name: 'Docs', icon: FileText, path: '#' },
        { id: 'meeting' as const, name: 'Meeting Room', icon: Users, path: '#' },
        { id: 'activity', name: 'Activity', icon: Activity, path: '#' },
        { id: 'channels', name: 'Channels', icon: MessageSquare, path: '#' },
      ]
    },
    {
      title: "Tags",
      icon: Tag,
      items: [
        { id: 'important', name: 'Important', icon: Circle, color: 'text-red-500', path: '#' },
        { id: 'normal', name: 'Normal', icon: Circle, color: 'text-blue-500', path: '#' },
        { id: 'minor', name: 'Minor', icon: Circle, color: 'text-gray-500', path: '#' },
      ]
    }
  ];

  const toggleSection = (section: string) => {
    setOpenSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleLinkClick = (item: any) => {
    if (item.id === 'workspace' || item.id === 'planner' || item.id === 'meeting') {
      onRoomChange(item.id);
    }
    if (item.path !== '#') {
      navigate(item.path);
    }
  };

  return (
    <div className={`flex flex-col lg:flex-row h-full w-full overflow-hidden bg-zinc-950 ${className || ""}`}>
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
        <aside
          className={cn(
            "hidden lg:flex lg:flex-col bg-zinc-950 border-r border-white/5 transition-all duration-300 ease-in-out relative z-30 group",
            isSidebarCollapsed ? "w-20" : "w-72"
          )}
        >
          {/* Header/Logo Section */}
          <div className="p-6 flex items-center justify-between">
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white text-xs">V</div>
                <span className="font-black text-white uppercase italic tracking-tighter text-sm">VAW PRO</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "text-white/20 hover:text-white hover:bg-white/5 transition-all",
                isSidebarCollapsed && "mx-auto"
              )}
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
              {isSidebarCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </Button>
          </div>

          <ScrollArea className="flex-1 px-4">
            <div className="space-y-6 py-4">
              {sidebarLinks.map((section) => (
                <div key={section.title} className="space-y-2">
                  {!isSidebarCollapsed && (
                    <button
                      onClick={() => toggleSection(section.title)}
                      className="flex items-center justify-between w-full text-[10px] font-black uppercase tracking-[0.2em] text-white/30 hover:text-white/60 transition-colors px-2 mb-2"
                    >
                      <span className="flex items-center gap-2">
                        <section.icon className="w-3 h-3" />
                        {section.title}
                      </span>
                      {openSections.includes(section.title) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>
                  )}

                  {(isSidebarCollapsed || openSections.includes(section.title)) && (
                    <div className="space-y-1">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentRoom === item.id;

                        return (
                          <Button
                            key={item.id}
                            variant="ghost"
                            className={cn(
                              "w-full transition-all duration-200 group/btn relative",
                              isSidebarCollapsed ? "justify-center px-0 h-12" : "justify-start px-3 h-10",
                              isActive
                                ? "bg-white/5 text-white"
                                : "text-white/40 hover:text-white hover:bg-white/[0.02]"
                            )}
                            onClick={() => handleLinkClick(item)}
                            title={isSidebarCollapsed ? item.name : undefined}
                          >
                            <Icon className={cn(
                              "w-5 h-5 transition-transform group-hover/btn:scale-110",
                              !isSidebarCollapsed && "mr-3",
                              (item as any).color
                            )} />
                            {!isSidebarCollapsed && (
                              <span className="text-xs font-bold uppercase tracking-tight">{item.name}</span>
                            )}
                            {isActive && (
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                            )}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

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
      <main ref={mainContentRef} className="flex-1 overflow-y-auto p-4 lg:p-6 pb-24 lg:pb-6 relative">
        {isSidebarCollapsed && currentRoom !== 'home' && (
          <Button
            variant="outline"
            size="icon"
            title="Expand Sidebar"
            className="absolute top-4 left-4 z-50 bg-black/40 border-white/10 text-white hover:bg-white/10 backdrop-blur-md hidden lg:flex"
            onClick={() => setIsSidebarCollapsed(false)}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        )}
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
