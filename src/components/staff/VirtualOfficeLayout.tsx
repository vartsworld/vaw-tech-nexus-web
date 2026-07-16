import { ReactNode, useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Monitor,
  Coffee,
  Users,
  MessageCircle,
  Calendar,
  X,
  Coins,
  ChevronDown,
  ChevronRight,
  PlaneTakeoff,
  Trophy,
  Compass,
  Laptop,
  Folder,
  Brain,
  LayoutDashboard,
  Inbox,
  CheckSquare,
  FileText,
  Activity,
  MessageSquare,
  ChevronLeft,
  Circle,
  Swords,
  ClipboardList
} from "lucide-react";
import TeamStatusSidebar from "./TeamStatusSidebar";
import TeamChat from "./TeamChat";
import MobileBottomNav from "./MobileBottomNav";
import LeaveApplicationDialog from "./LeaveApplicationDialog";
import { CompletedTasksDialog } from "./CompletedTasksDialog";
import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [mobileSidebarTab, setMobileSidebarTab] = useState<'status' | 'chat'>('status');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(currentRoom === 'meeting' || currentRoom === 'planner');
  const [openSections, setOpenSections] = useState<string[]>(['Folders', 'Space']);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showCompletedTasksDialog, setShowCompletedTasksDialog] = useState(false);
  const [celebrationTask, setCelebrationTask] = useState<any | null>(null);

  // Custom Overhauls states
  const [isTeamStatusExpanded, setIsTeamStatusExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notepadContent, setNotepadContent] = useState("");
  const [isNotepadOpen, setIsNotepadOpen] = useState(false);
  const [isNotepadPinned, setIsNotepadPinned] = useState(false);
  const [savedNotes, setSavedNotes] = useState<any[]>([]);
  const [isSavingNotepad, setIsSavingNotepad] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Fetch Scratchpad Notes for the popup dropdown
  const fetchNotepadNotes = async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('staff_notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (!error && data) {
        setSavedNotes(data);
      }
    } catch {}
  };

  const handleSaveNotepad = async () => {
    if (!notepadContent.trim() || !userId) return;
    setIsSavingNotepad(true);
    try {
      const { data, error } = await supabase
        .from('staff_notes')
        .insert({
          user_id: userId,
          content: notepadContent.trim()
        })
        .select()
        .single();
      if (!error && data) {
        setSavedNotes(prev => [data, ...prev]);
        setNotepadContent("");
        toast.success("Note saved successfully!");
      }
    } catch {
      toast.error("Failed to save note");
    } finally {
      setIsSavingNotepad(false);
    }
  };

  // Real-time unread counter subscription
  useEffect(() => {
    if (!userId) return;

    // Load unread count from localStorage
    const countStr = localStorage.getItem(`vaw_unread_inbox_count_${userId}`) || "0";
    setUnreadCount(parseInt(countStr, 10));

    const channelName = `sidebar-unread-${userId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, () => {
        // If the user is currently on the Inbox page or currentRoom is inbox, reset and don't count
        if (window.location.pathname === '/staff/inbox' || currentRoom === 'inbox') {
          setUnreadCount(0);
          localStorage.setItem(`vaw_unread_inbox_count_${userId}`, "0");
          return;
        }
        setUnreadCount(prev => {
          const next = prev + 1;
          localStorage.setItem(`vaw_unread_inbox_count_${userId}`, String(next));
          return next;
        });
      })
      .subscribe();

    fetchNotepadNotes();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Reset unread count if route matches InboxPage or currentRoom is inbox
  useEffect(() => {
    if ((window.location.pathname === '/staff/inbox' || currentRoom === 'inbox') && userId) {
      setUnreadCount(0);
      localStorage.setItem(`vaw_unread_inbox_count_${userId}`, "0");
    }
  }, [location.pathname, currentRoom, userId]);

  // Check for completed tasks to trigger celebration (Triple Confetti!)
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

          const hasUserSubtasks = (task.staff_subtasks || []).some(
            (st: any) => st.assigned_to === userId
          );

          if (isDirectlyAssigned || hasUserSubtasks) {
            unseenCompleted.push(task);
          }
        });

        if (unseenCompleted.length > 0) {
          const taskToCelebrate = unseenCompleted[0];
          
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

          const allFoundIds = unseenCompleted.map(t => t.id);
          const newSeenList = Array.from(new Set([...seenTasks, ...allFoundIds]));
          localStorage.setItem(`seen_completed_tasks_${userId}`, JSON.stringify(newSeenList));
        }
      } catch (err) {
        console.error("Error checking completed tasks celebration:", err);
      }
    };

    const timer = setTimeout(checkNewCompletions, 1200);
    return () => clearTimeout(timer);
  }, [userId, currentRoom]);

  // Real-time task completion trigger for online updates
  useEffect(() => {
    if (!userId) return;

    const channelName = `task-celebration-${userId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
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

  // Restructured Sidebar Configuration (Removed Tags, Space contains chess, onboarding, notes, leave, tools)
  const sidebarLinks = [
    {
      title: "Folders",
      icon: Folder,
      items: [
        { id: 'workspace' as const, name: 'Dashboard', icon: LayoutDashboard, path: '/staff/dashboard' },
        { id: 'planner' as const, name: 'Calendar', icon: Calendar, path: '/monthlyplanner' },
        { id: 'inbox', name: 'Inbox', icon: Inbox, path: '/staff/inbox' },
      ]
    },
    {
      title: "Space",
      icon: Brain,
      items: [
        { id: 'leave', name: 'Leave Application', icon: PlaneTakeoff, path: '/staff/leave' },
        { id: 'tools', name: 'Tools Nexus', icon: Compass, path: '/staff/tools-nexus' },
        { id: 'chess', name: 'Chess Arena', icon: Swords, path: '/staff/chess' },
        { id: 'onboarding', name: 'Onboarding', icon: Compass, path: '/staff/onboarding' },
        { id: 'notes', name: 'Personal Notes', icon: ClipboardList, path: '/staff/notes' },
        { id: 'meeting' as const, name: 'Meeting Room', icon: Users, path: '#' },
        { id: 'notepad', name: 'Quick Notepad', icon: ClipboardList, path: '#' },
        { id: 'activity', name: 'Activity', icon: Activity, path: '/staff/activity' },
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
    if (item.id === 'notepad') {
      setIsNotepadOpen(true);
      fetchNotepadNotes();
      return;
    }

    const isDashboardPath = location.pathname === '/staff/dashboard' || location.pathname === '/team-head/dashboard';
    if (isDashboardPath) {
      onRoomChange(item.id);
    } else {
      const isTeamHead = location.pathname.startsWith('/team-head') || (userProfile?.role === 'team_head');
      const targetDashboard = isTeamHead ? '/team-head/dashboard' : '/staff/dashboard';
      navigate(targetDashboard, { state: { currentRoom: item.id } });
    }
  };

  return (
    <div className={`flex flex-col lg:flex-row h-full w-full overflow-hidden bg-transparent ${className || ""}`}>
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
              <MessageSquare className="w-4 h-4" />
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
            "hidden lg:flex lg:flex-col border-r border-white/5 transition-all duration-300 ease-in-out relative z-30 group overflow-hidden bg-cover bg-center bg-no-repeat",
            isSidebarCollapsed ? "w-20" : "w-72"
          )}
          style={{ backgroundImage: "url('/lovable-uploads/472162b9-c883-43ff-b81c-428cd163ffd8.png')" }}
        >
          {/* Transparent masking color and blur overlay */}
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xl z-0 pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full w-full">
          {/* Top Header Logo (VAW Technologies) */}
          <div className={cn("p-6 flex items-center", isSidebarCollapsed ? "justify-center" : "justify-between border-b border-white/5")}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0 shadow-lg">
                <img
                  src="/lovable-uploads/0d3e4545-c80e-401b-82f1-3319db5155b4.png"
                  alt="VAW Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              {!isSidebarCollapsed && (
                <span className="font-black text-white uppercase italic tracking-tighter text-sm">VAW Technologies</span>
              )}
            </div>
            {!isSidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white/20 hover:text-white hover:bg-white/5 transition-all"
                onClick={() => setIsSidebarCollapsed(true)}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
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
                        const isActive = currentRoom === item.id || location.pathname === item.path;

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

                            {/* Render Inbox notification bubble */}
                            {item.id === 'inbox' && unreadCount > 0 && (
                              <Badge className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 hover:bg-red-600 text-[10px] font-black h-5 w-5 flex items-center justify-center p-0 rounded-full animate-pulse border-none">
                                {unreadCount}
                              </Badge>
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

          {/* Team Status Collapsible Area - Collapsed by default */}
          <div className="border-t border-white/5 p-4 flex flex-col min-h-0">
            <button
              onClick={() => setIsTeamStatusExpanded(!isTeamStatusExpanded)}
              className="flex items-center justify-between w-full text-[10px] font-black uppercase tracking-[0.2em] text-white/30 hover:text-white/60 transition-colors px-2 mb-2"
            >
              <span className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5" />
                Team Status
              </span>
              {isTeamStatusExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {isTeamStatusExpanded && !isSidebarCollapsed && (
              <div className="max-h-48 overflow-y-auto mt-2 pr-1 custom-scrollbar">
                <TeamStatusSidebar onlineUsers={onlineUsers} currentUserId={userId} />
              </div>
            )}
          </div>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main ref={mainContentRef} className="flex-1 overflow-y-auto p-4 lg:p-6 pb-24 lg:pb-6 relative bg-transparent">
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

      {/* Floating pinnable Notepad leaflet */}
      {(isNotepadOpen || isNotepadPinned) && (
        <div
          className={cn(
            "fixed bottom-24 right-8 z-[200] w-72 bg-gradient-to-br from-amber-100 via-amber-200 to-yellow-300 text-amber-950 p-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.4)] border border-amber-100/30 flex flex-col space-y-3 animate-in fade-in slide-in-from-bottom-5 duration-300",
            isNotepadPinned && "border-2 border-amber-400 shadow-[0_10px_50px_rgba(245,158,11,0.4)]"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-950/15 pb-2">
            <span className="text-xs font-black uppercase tracking-widest flex items-center gap-1.5 text-amber-900">
              <ClipboardList className="w-4 h-4 text-amber-800" />
              Scratchpad
            </span>
            <div className="flex items-center gap-1.5">
              {/* Pin Button */}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-6 w-6 text-amber-900/60 hover:text-amber-900 hover:bg-amber-950/5 rounded-lg",
                  isNotepadPinned && "text-blue-700 bg-blue-500/15 hover:bg-blue-500/20"
                )}
                onClick={() => setIsNotepadPinned(!isNotepadPinned)}
                title={isNotepadPinned ? "Unpin from screen" : "Pin to screen"}
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2z" />
                </svg>
              </Button>
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-amber-900/60 hover:text-amber-900 hover:bg-amber-950/5 rounded-lg"
                onClick={() => {
                  setIsNotepadOpen(false);
                  setIsNotepadPinned(false);
                }}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Content Area */}
          <textarea
            className="w-full h-32 bg-transparent border-none resize-none focus:ring-0 focus:outline-none text-xs font-bold leading-relaxed text-amber-950 placeholder-amber-950/40"
            placeholder="Jot down quick thoughts... click Save Note below!"
            value={notepadContent}
            onChange={(e) => setNotepadContent(e.target.value)}
          />

          {/* Footer & Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-amber-950/15">
            {/* View saved notes dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-black tracking-wider text-amber-950/70 hover:text-amber-900 p-0 hover:bg-transparent">
                  Recent Notes
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-amber-50 text-amber-950 border-amber-200 rounded-xl p-2 max-h-48 overflow-y-auto">
                <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-wider text-amber-900/60 pb-1">
                  Saved Scratchpads
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-amber-900/10" />
                {savedNotes.length === 0 ? (
                  <p className="text-[10px] text-center text-amber-900/40 py-2">No notes saved</p>
                ) : (
                  savedNotes.map((note) => (
                    <DropdownMenuItem
                      key={note.id}
                      className="text-xs hover:bg-amber-100 cursor-pointer p-2 rounded-lg truncate text-amber-900"
                      onClick={() => {
                        setNotepadContent(note.content);
                        const isDashboardPath = location.pathname === '/staff/dashboard' || location.pathname === '/team-head/dashboard';
                        if (isDashboardPath) {
                          onRoomChange('notes');
                        } else {
                          const isTeamHead = location.pathname.startsWith('/team-head') || (userProfile?.role === 'team_head');
                          const targetDashboard = isTeamHead ? '/team-head/dashboard' : '/staff/dashboard';
                          navigate(targetDashboard, { state: { currentRoom: 'notes' } });
                        }
                        setIsNotepadOpen(false);
                        setIsNotepadPinned(false);
                      }}
                    >
                      {note.content}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="sm"
              className="bg-amber-950 hover:bg-amber-900 text-yellow-100 font-bold text-[10px] h-7 px-3 rounded-lg border-none"
              onClick={handleSaveNotepad}
              disabled={isSavingNotepad || !notepadContent.trim()}
            >
              {isSavingNotepad ? "Saving..." : "Save Note"}
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        currentRoom={currentRoom}
        onRoomChange={onRoomChange}
        onOpenChat={() => setShowMobileChat(true)}
        onOpenCoins={onOpenCoins}
      />

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