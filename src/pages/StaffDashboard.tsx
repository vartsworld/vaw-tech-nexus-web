import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Coffee,
  Users,
  Briefcase,
  Music,
  Wallet,
  Gamepad2,
  StickyNote,
  MessageCircle,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  LogOut,
  User,
  Trophy,
  Coins,
  Fingerprint,
  Loader2,
  Sparkles
} from "lucide-react";
import { BiometricSettingsDialog } from "@/components/staff/BiometricSettingsDialog";
import UpdateButton from "@/components/staff/UpdateButton";
import VirtualOfficeLayout from "@/components/staff/VirtualOfficeLayout";
import StaffMobileHome from "@/components/staff/StaffMobileHome";
import { useIsMobile } from "@/hooks/use-mobile";
import WorkspaceRoom from "@/components/staff/WorkspaceRoom";

import MeetingRoom from "@/components/staff/MeetingRoom";
import AttendanceChecker from "@/components/staff/AttendanceChecker";
import MoodQuoteChecker from "@/components/staff/MoodQuoteChecker";
import NotificationsBar from "@/components/staff/NotificationsBar";
import DraggableWorkspace from "@/components/staff/DraggableWorkspace";
import { UserStatusBadge } from "@/components/staff/UserStatusBadge";
import { ActivityLogPanel } from "@/components/staff/ActivityLogPanel";
import { ReactivationDialog } from "@/components/staff/ReactivationDialog";
import { useStaffData } from "@/hooks/useStaffData";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { useUserStatus } from "@/hooks/useUserStatus";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import AnnouncementBanner from "@/components/staff/AnnouncementBanner";
import OfficeZenHome from "@/components/staff/OfficeZenHome";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import EmmaAssistant from "@/components/ai/EmmaAssistant";
import MiniChess from "@/components/staff/MiniChess";
import TeamChat from "@/components/staff/TeamChat";
import LeaveApplicationDialog from "@/components/staff/LeaveApplicationDialog";
import DepartmentStaffList from "@/components/staff/DepartmentStaffList";
import MyCoins from "@/pages/MyCoins";

const StaffDashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { room } = useParams();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Resolve current room from URL or default to 'workspace' if on 'dashboard'
  const currentRoom = (room === 'dashboard' ? 'workspace' : (room || 'home')) as any;
  
  const setCurrentRoom = (newRoom: string) => {
    navigate(`/staff/${newRoom === 'workspace' ? 'dashboard' : newRoom}`);
  };
  const [showMobileHome, setShowMobileHome] = useState(true);
  const [showAttendanceCheck, setShowAttendanceCheck] = useState(false);
  const [showMoodCheck, setShowMoodCheck] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, any>>({});
  const [departmentName, setDepartmentName] = useState<string>("");
  const [showBiometricDialog, setShowBiometricDialog] = useState(false);
  const [showEmma, setShowEmma] = useState(false);

  const { profile, loading } = useStaffData();

  // Activity tracking and status
  const { status, reactivationCode, updateStatus, reactivate } = useUserStatus(profile?.user_id || '');
  const handleStatusChange = useCallback((newStatus: string) => {
    // Status change handled automatically
  }, []);
  useActivityTracker({
    userId: profile?.user_id || '',
    onStatusChange: handleStatusChange
  });

  const [showReactivationDialog, setShowReactivationDialog] = useState(false);

  useEffect(() => {
    // Show reactivation dialog for AFK/Resting/Sleeping states
    if (['afk', 'resting', 'sleeping'].includes(status) && reactivationCode) {
      setShowReactivationDialog(true);
    } else {
      setShowReactivationDialog(false);
    }
  }, [status, reactivationCode]);

  const handleReactivate = async (code: number) => {
    const success = await reactivate(code);
    if (success) {
      setShowReactivationDialog(false);
    }
    return success;
  };

  const location = useLocation();

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user && !loading) {
        navigate("/staff/login");
      }
    };
    checkAuth();
  }, [loading, navigate]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/staff/login");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  // Subscribe to real-time presence for online users
  useEffect(() => {
    if (!profile?.user_id) return;

    const presenceChannel = supabase.channel('online-users', {
      config: { presence: { key: profile.user_id } }
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        setOnlineUsers(state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        setOnlineUsers(prev => ({ ...prev, [key]: newPresences }));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => {
          const updated = { ...prev };
          delete updated[key];
          return updated;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: profile.user_id,
            full_name: profile.full_name,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [profile?.user_id, profile?.full_name]);

  useEffect(() => {
    checkDailyRequirements();
    fetchDepartment();
  }, [profile?.user_id, profile?.department_id]);

  const fetchDepartment = async () => {
    if (!profile?.department_id) return;

    try {
      const { data, error } = await supabase
        .from('departments')
        .select('name')
        .eq('id', profile.department_id)
        .single();

      if (data && !error) {
        setDepartmentName(data.name);
      }
    } catch (error) {
      console.error('Error fetching department:', error);
    }
  };

  const checkDailyRequirements = async () => {
    if (!profile?.user_id) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      // Check if user has marked attendance today
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('staff_attendance')
        .select('*')
        .eq('user_id', profile.user_id)
        .eq('date', today)
        .single();

      // Check if user has submitted mood today
      const { data: moodData, error: moodError } = await supabase
        .from('user_mood_entries')
        .select('*')
        .eq('user_id', profile.user_id)
        .eq('date', today)
        .single();

      console.log('Attendance today:', attendanceData);
      console.log('Mood today:', moodData);

      if (!attendanceData) {
        // No attendance marked - show attendance checker
        setShowAttendanceCheck(true);
        setShowMoodCheck(false);
      } else if (!moodData) {
        // Attendance marked but no mood - show mood checker
        setShowAttendanceCheck(false);
        setShowMoodCheck(true);
      } else {
        // Both completed - go to dashboard
        setShowAttendanceCheck(false);
        setShowMoodCheck(false);
      }
    } catch (error) {
      console.error('Error checking daily requirements:', error);
      // On error, just show attendance check
      setShowAttendanceCheck(true);
      setShowMoodCheck(false);
    }
  };

  const handleAttendanceMarked = () => {
    console.log('Attendance marked, now showing mood check');
    setShowAttendanceCheck(false);
    setShowMoodCheck(true);
  };


  const handleMoodSubmitted = () => {
    console.log('Mood submitted, going to dashboard');
    setShowMoodCheck(false);
  };

  // Show attendance check first
  if (showAttendanceCheck) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-zinc-950">
        <div className="relative z-20 flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-white mb-2">Step 1: Mark Attendance</h2>
              <p className="text-white/80">Please mark your attendance to continue</p>
            </div>
            {profile?.user_id && (
              <AttendanceChecker
                userId={profile.user_id}
                onAttendanceMarked={handleAttendanceMarked}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show mood check after attendance
  if (showMoodCheck) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-zinc-950">
        <div className="relative z-20 flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-lg space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-white mb-2">Step 2: Daily Mood & Quote</h2>
              <p className="text-white/80">Share how you're feeling today and get inspired!</p>
            </div>
            {profile?.user_id && (
              <MoodQuoteChecker
                userId={profile.user_id}
                onMoodSubmitted={handleMoodSubmitted}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Don't render dashboard until profile is loaded
  if (!profile?.user_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4 text-white">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-lg font-medium opacity-70">Initializing VAW Nexus...</p>
        </div>
      </div>
    );
  }

  const roomComponents = {
    home: (
      <OfficeZenHome 
        userId={profile.user_id}
        userProfile={profile}
        onEnterWorkspace={() => setCurrentRoom('workspace')}
      />
    ),
    workspace: <DraggableWorkspace userId={profile.user_id} userProfile={profile} />,
    meeting: <MeetingRoom />,
    breakroom: null,
    game: (
      <div className="w-full p-2 sm:p-6">
         <h2 className="text-3xl font-bold text-white mb-4">Games Arena</h2>
         <div className="w-full max-w-4xl bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl">
           <MiniChess userId={profile.user_id} userProfile={profile} />
         </div>
      </div>
    ),
    chat: (
       <div className="w-full h-[calc(100vh-100px)] flex flex-col p-4 bg-zinc-950/80 rounded-xl overflow-hidden border border-white/10">
         <TeamChat userId={profile?.user_id || ''} userProfile={profile} />
       </div>
    ),
    leave: (
       <div className="w-full h-[calc(100vh-100px)] p-6 flex justify-center text-white">
          <div className="bg-black/40 backdrop-blur-md p-8 rounded-2xl w-full max-w-4xl border border-white/10 h-fit">
             <h2 className="text-2xl font-bold mb-4">Leave Management</h2>
             <p className="opacity-70 mb-8">View leave requests and apply for a new leave here.</p>
             <LeaveApplicationDialog isInline={true} userId={profile?.user_id || ''} />
          </div>
       </div>
    ),
    staff: (
       <div className="w-full p-2 sm:p-6">
          <div className="bg-black/40 backdrop-blur-md p-6 sm:p-8 rounded-2xl w-full max-w-7xl mx-auto border border-white/10 text-white">
             <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Staff & Department Management</h2>
             <p className="opacity-70 mb-6 sm:mb-8 text-sm sm:text-base">View all staff in your department, their stats, and assigned work.</p>
             <DepartmentStaffList 
               departmentId={profile?.department_id} 
               currentUserId={profile?.user_id || ''} 
               onlineUsers={onlineUsers}
               onChatClick={() => setCurrentRoom('chat')}
             />
          </div>
       </div>
    ),
    coin: (
       <div className="w-full p-2 sm:p-4">
          <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 bg-black/40">
            <MyCoins isInline={true} />
          </div>
       </div>
    )
  };

  // Show mobile home on small screens
  if (isMobile && showMobileHome) {
    return (
      <StaffMobileHome
        profile={profile}
        currentRoom={currentRoom}
        onRoomChange={setCurrentRoom}
        onOpenChat={() => {}}
        onOpenCoins={() => setCurrentRoom('coin')}
        onEnterWorkspace={() => setShowMobileHome(false)}
      />
    );
  }

  return (
    <div className="min-h-screen h-screen flex flex-col relative overflow-hidden bg-zinc-950">
      {/* Background Layer - Fixed to viewport */}
      {currentRoom !== 'home' && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-black/60 z-10"></div>
          <img
            src="/lovable-uploads/472162b9-c883-43ff-b81c-428cd163ffd8.png"
            alt="Modern office background"
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
          <img
            src="/lovable-uploads/508d91e4-1f4c-42a4-9e98-bcb4df6e023d.png"
            alt="Office meeting space"
            className="absolute top-1/2 left-1/2 w-full h-full object-cover opacity-60 mix-blend-overlay"
          />
        </div>
      )}
      {/* Office Header */}
      {currentRoom !== 'home' && (
        <header className="relative z-30 bg-black/20 backdrop-blur-lg border-b border-white/10 flex-shrink-0">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col gap-3">
            {/* Top Row: Logo and Main Info */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center p-1.5 flex-shrink-0">
                  <img
                    src="/lovable-uploads/3268a3ac-c0c1-40de-8ba7-8f1b1099460e.png"
                    alt="VAW Technologies Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    VAW Technologies
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                      className="h-6 w-6 rounded-full bg-white/5 hover:bg-white/20 text-white/70 hover:text-white"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`}>
                        <path d="M15 18l-6-6 6-6"/>
                      </svg>
                    </Button>
                  </h1>
                  <p className="text-blue-300 text-xs sm:text-sm truncate">Welcome, {profile?.full_name || profile?.username || 'Staff'}!</p>
                </div>
              </div>

              {/* Actions: Profile & Logout */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 h-9 px-2 sm:px-3"
                  onClick={() => navigate("/staff/profile")}
                >
                  <Avatar className="w-6 h-6 sm:mr-2">
                    <AvatarImage src={profile?.profile_photo_url || profile?.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {profile?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline">Profile</span>
                </Button>
                
                <UpdateButton variant="dark" />

                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-green-500/10 hover:bg-green-500/20 text-green-300 border border-green-500/20 h-9 px-2 sm:px-3"
                  onClick={() => setShowBiometricDialog(true)}
                  title="Fingerprint Login Settings"
                >
                  <Fingerprint className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Fingerprint</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 h-9 px-2 sm:px-3"
                  onClick={() => navigate("/sales/dashboard")}
                >
                  <Briefcase className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Sales Hub</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 h-9 px-2 sm:px-3"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>

            {/* Bottom Row: Stats & Notifications */}
            <div className="flex items-center gap-2 flex-wrap justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-500/30 rounded-lg px-2.5 py-1.5">
                  <UserStatusBadge
                    status={status}
                    isBreakActive={false}
                    breakTimeRemaining={0}
                  />
                </div>

                <div 
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 hover:from-amber-500/20 hover:to-yellow-500/20 border border-amber-500/20 rounded-full px-3 py-1.5 cursor-pointer transition-all shadow-[0_0_10px_rgba(245,158,11,0.1)] hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] active:scale-95"
                  onClick={() => setCurrentRoom('coin')}
                >
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-200 text-xs font-bold tracking-tight">{(profile?.total_points || 0).toLocaleString()} Coins</span>
                </div>

                <div className="flex items-center gap-1.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-lg px-2.5 py-1.5 shadow-lg shadow-blue-500/10">
                  <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-cyan-200 text-xs font-bold tracking-tight">Streak: {profile?.attendance_streak || 0}d</span>
                </div>
              </div>

              <NotificationsBar userId={profile.user_id} />
            </div>
          </div>
        </div>
      </header>
      )}

      {/* Announcement Banner */}
      {currentRoom !== 'home' && (
        <AnnouncementBanner userId={profile.user_id} departmentId={profile.department_id} />
      )}

      <div className="flex-1 overflow-hidden relative z-10">
        <VirtualOfficeLayout
          currentRoom={currentRoom}
          onRoomChange={setCurrentRoom}
          onlineUsers={onlineUsers}
          userId={profile.user_id}
          userProfile={profile}
          onOpenCoins={() => setCurrentRoom('coin')}
        >
          {roomComponents[currentRoom] || roomComponents['workspace']}
        </VirtualOfficeLayout>
      </div>



      {/* Reactivation Dialog */}
      {showReactivationDialog && reactivationCode && (
        <ReactivationDialog
          open={showReactivationDialog}
          reactivationCode={reactivationCode}
          status={status}
          onReactivate={handleReactivate}
        />
      )}

      <BiometricSettingsDialog
        open={showBiometricDialog}
        onOpenChange={setShowBiometricDialog}
      />

      {/* EMMA AI floating button + dialog */}
      <Button
        onClick={() => setShowEmma(true)}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-2xl bg-gradient-to-br from-primary to-purple-500 hover:scale-105 transition-transform"
        size="icon"
        title="Ask EMMA"
      >
        <Sparkles className="w-6 h-6 text-white" />
      </Button>
      <Dialog open={showEmma} onOpenChange={setShowEmma}>
        <DialogContent className="max-w-3xl p-0 border-0 bg-transparent shadow-none">
          <EmmaAssistant role="team_head" />
        </DialogContent>
      </Dialog>

      <PWAInstallPrompt />
    </div>
  );
};

export default StaffDashboard;
