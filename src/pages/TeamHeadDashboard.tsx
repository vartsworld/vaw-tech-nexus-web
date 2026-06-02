import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import TeamHeadMobileHome from "@/components/staff/TeamHeadMobileHome";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Settings,
  User,
  Layout,
  Settings2,
  Lock as LockIcon,
  LogOut,
  Coins,
  Loader2
} from "lucide-react";
import { CoinConfigDialog } from "@/components/staff/CoinConfigDialog";
import { BiometricSettingsDialog } from "@/components/staff/BiometricSettingsDialog";
import UpdateButton from "@/components/staff/UpdateButton";
import { Fingerprint } from "lucide-react";
import { toast } from "sonner";
import VirtualOfficeLayout from "@/components/staff/VirtualOfficeLayout";

import MeetingRoom from "@/components/staff/MeetingRoom";
import AttendanceChecker from "@/components/staff/AttendanceChecker";
import MoodQuoteChecker from "@/components/staff/MoodQuoteChecker";
import NotificationsBar from "@/components/staff/NotificationsBar";
import TeamHeadWorkspace from "@/components/staff/TeamHeadWorkspace";
import { UserStatusBadge } from "@/components/staff/UserStatusBadge";
import { ActivityLogPanel } from "@/components/staff/ActivityLogPanel";
import { ReactivationDialog } from "@/components/staff/ReactivationDialog";
import MiniChess from "@/components/staff/MiniChess";
import TeamChat from "@/components/staff/TeamChat";
import TeamStatusSidebar from "@/components/staff/TeamStatusSidebar";
import LeaveApplicationDialog from "@/components/staff/LeaveApplicationDialog";
import DepartmentStaffList from "@/components/staff/DepartmentStaffList";
import MyCoins from "@/pages/MyCoins";
import WidgetManager from "@/components/staff/WidgetManager";
import { QuickNotes } from "@/components/staff/QuickNotes";
import ClientOnboardingCreator from "@/components/staff/ClientOnboardingCreator";
import AnnouncementBanner from "@/components/staff/AnnouncementBanner";
import { useStaffData } from "@/hooks/useStaffData";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { useUserStatus } from "@/hooks/useUserStatus";
import { supabase } from "@/integrations/supabase/client";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import EmmaAssistant from "@/components/ai/EmmaAssistant";
import { Sparkles } from "lucide-react";
import OfficeZenHome from "@/components/staff/OfficeZenHome";

type RoomType = 'home' | 'workspace' | 'meeting' | 'breakroom';

const EMOJI_OPTIONS = [
  "😀", "😃", "😄", "😁", "😊", "🙂", "😎", "🤩", "🥳", "😇",
  "🤗", "🤔", "🤫", "🤭", "🧐", "🤓", "😏", "😌", "😴", "🤤",
  "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "🥲", "😋", "😛",
  "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🫢", "🫣", "🤫", "🤥",
  "🦊", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔",
  "🍎", "🍌", "🍇", "🍉", "🍓", "🍒", "🍑", "🥝", "🍍", "🥥",
  "⚽", "🏀", "🎾", "🏐", "🏈", "⚾", "🥎", "🎱", "🏓", "🏸",
  "🎮", "🎯", "🎲", "🎭", "🎨", "🎬", "🎪", "🎡", "🎢", "🎰",
  "🎵", "🎶", "🎤", "🎧", "🎸", "🎹", "🎺", "🎻", "🥁", "📱",
  "💻", "⌨️", "🖥️", "🖨️", "📷", "📺", "🕹️", "💡", "🔔", "🔕"
];

const TeamHeadDashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showMobileHome, setShowMobileHome] = useState(true);
  const { room: urlRoom } = useParams();
  
  // Resolve current room from URL or default to 'workspace' if on 'dashboard'
  const currentRoom = (urlRoom === 'dashboard' ? 'workspace' : (urlRoom || 'home')) as any;
  
  const setCurrentRoom = (newRoom: string) => {
    navigate(`/team-head/${newRoom === 'workspace' ? 'dashboard' : newRoom}`);
  };
  const [showAttendanceCheck, setShowAttendanceCheck] = useState(false);
  const [showMoodCheck, setShowMoodCheck] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, any>>({});
  const [departmentName, setDepartmentName] = useState<string>("");
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showEmojiDialog, setShowEmojiDialog] = useState(false);
  const [newEmojiPassword, setNewEmojiPassword] = useState<string[]>([]);
  const [confirmEmojiPassword, setConfirmEmojiPassword] = useState<string[]>([]);
  const [profileForm, setProfileForm] = useState({ full_name: "", about_me: "" });
  const [showCoinConfigDialog, setShowCoinConfigDialog] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [showBiometricDialog, setShowBiometricDialog] = useState(false);
  const [showEmma, setShowEmma] = useState(false);

  // Widgets state
  const [widgets, setWidgets] = useState(() => {
    const saved = localStorage.getItem('th_widgets_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved widgets", e);
      }
    }
    return [
      { id: 'chess', name: 'Mini Chess', description: 'Play chess with colleagues', isVisible: true },
      { id: 'activity', name: 'Activity Log', description: 'Track your daily activities', isVisible: false },
    ];
  });

  // Save widgets to localStorage
  useEffect(() => {
    localStorage.setItem('th_widgets_v1', JSON.stringify(widgets));
  }, [widgets]);

  const { profile } = useStaffData();

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

  const isShowingMobileHome = isMobile && showMobileHome;

  const location = useLocation();

  useEffect(() => {
    if (urlRoom === 'mycoins' || urlRoom === 'coin') {
      setCurrentRoom('coin');
    }
  }, [urlRoom]);

  useEffect(() => {
    if (isShowingMobileHome) return;
    checkDailyRequirements();
    fetchDepartment();
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || "",
        about_me: (profile as any).about_me || "",
      });
    }
  }, [profile?.user_id, profile?.full_name, profile?.department_id, isShowingMobileHome]);

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

  // Set up presence tracking for online users
  useEffect(() => {
    if (!profile?.user_id || !profile?.full_name || isShowingMobileHome) return;

    const channel = supabase.channel('team-presence');

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineUsers(state);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: profile.user_id,
            full_name: profile.full_name,
            username: profile.username || 'user',
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.user_id, profile?.full_name, profile?.username, isShowingMobileHome]);

  const checkDailyRequirements = async () => {
    if (!profile?.user_id) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      // Check if user has marked attendance today
      const { data: attendanceData } = await supabase
        .from('staff_attendance')
        .select('*')
        .eq('user_id', profile.user_id)
        .eq('date', today)
        .single();

      // Check if user has submitted mood today
      const { data: moodData } = await supabase
        .from('user_mood_entries')
        .select('*')
        .eq('user_id', profile.user_id)
        .eq('date', today)
        .single();

      if (!attendanceData) {
        setShowAttendanceCheck(true);
        setShowMoodCheck(false);
      } else if (!moodData) {
        setShowAttendanceCheck(false);
        setShowMoodCheck(true);
      } else {
        setShowAttendanceCheck(false);
        setShowMoodCheck(false);
      }
    } catch (error) {
      console.error('Error checking daily requirements:', error);
      setShowAttendanceCheck(true);
      setShowMoodCheck(false);
    }
  };

  const handleAttendanceMarked = () => {
    setShowAttendanceCheck(false);
    setShowMoodCheck(true);
  };


  const handleMoodSubmitted = () => {
    setShowMoodCheck(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/staff/login");
    toast.success("Logged out successfully");
  };

  const handleUpdateProfile = async () => {
    try {
      const { error } = await supabase
        .from("staff_profiles")
        .update({
          full_name: profileForm.full_name,
          about_me: profileForm.about_me,
        })
        .eq("user_id", profile?.user_id);

      if (error) throw error;
      toast.success("Profile updated successfully");
      setShowProfileDialog(false);
      window.location.reload();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  const addEmojiToPassword = (emoji: string, isConfirm: boolean) => {
    if (isConfirm) {
      if (confirmEmojiPassword.length < 6) {
        setConfirmEmojiPassword([...confirmEmojiPassword, emoji]);
      }
    } else {
      if (newEmojiPassword.length < 6) {
        setNewEmojiPassword([...newEmojiPassword, emoji]);
      }
    }
  };

  const handleSetEmojiPassword = async () => {
    if (newEmojiPassword.length !== 6) {
      toast.error("Please select exactly 6 emojis");
      return;
    }

    if (JSON.stringify(newEmojiPassword) !== JSON.stringify(confirmEmojiPassword)) {
      toast.error("Emoji passwords don't match");
      return;
    }

    try {
      const emojiPasswordString = newEmojiPassword.join("");

      const { error: updateError } = await supabase
        .from('staff_profiles')
        .update({
          emoji_password: emojiPasswordString,
          is_emoji_password: true,
        })
        .eq('user_id', profile?.user_id);

      if (updateError) throw updateError;

      const { error: authError } = await supabase.auth.updateUser({
        password: emojiPasswordString
      });

      if (authError) throw authError;

      toast.success("Emoji password updated successfully");
      setShowEmojiDialog(false);
      setNewEmojiPassword([]);
      setConfirmEmojiPassword([]);
    } catch (error) {
      console.error('Error setting emoji password:', error);
      toast.error("Failed to update emoji password");
    }
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

  // Don't render until profile is fully loaded to prevent 400 errors in sub-components
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

  // Show mobile home on small screens
  if (isMobile && showMobileHome && profile?.user_id) {
    return (
      <TeamHeadMobileHome
        profile={profile}
        onEnterDesktop={() => setShowMobileHome(false)}
      />
    );
  }

  const toggleWidget = (widgetId: string) => {
    setWidgets(prev => prev.map(w =>
      w.id === widgetId ? { ...w, isVisible: !w.isVisible } : w
    ));
  };

  const showAllWidgets = () => {
    setWidgets(prev => prev.map(w => ({ ...w, isVisible: true })));
  };

  const hideAllWidgets = () => {
    setWidgets(prev => prev.map(w => ({ ...w, isVisible: false })));
  };

  const roomComponents = {
    home: (
      <OfficeZenHome 
        userId={profile?.user_id || ''}
        userProfile={profile}
        onEnterWorkspace={() => setCurrentRoom('workspace')}
      />
    ),
    workspace: (
      <div className="flex flex-col space-y-6 pb-8">
        <div className="w-full relative z-10">
          <TeamHeadWorkspace
            userId={profile?.user_id || ''}
            userProfile={profile}
            widgetManager={
              <WidgetManager
                widgets={widgets}
                onToggleWidget={toggleWidget}
                onShowAll={showAllWidgets}
                onHideAll={hideAllWidgets}
              />
            }
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start relative z-10">
          <div className="h-full">
            <QuickNotes userId={profile?.user_id || ''} />
          </div>

          <div className="h-full bg-black/40 backdrop-blur-md rounded-xl border border-white/10 p-4">
            <ClientOnboardingCreator userId={profile?.user_id || ''} />
          </div>
        </div>

        {widgets.find(w => w.id === 'activity')?.isVisible && (
          <div className="w-full relative z-10">
            <ActivityLogPanel userId={profile?.user_id || ''} className="bg-black/40 backdrop-blur-lg border-white/10 h-[600px]" />
          </div>
        )}

        {widgets.find(w => w.id === 'chess')?.isVisible && (
          <div className="w-full flex justify-center py-4 relative z-10">
            <div className="w-full max-w-2xl">
              <MiniChess userId={profile?.user_id || ''} userProfile={profile} />
            </div>
          </div>
        )}
      </div>
    ),
    meeting: <MeetingRoom />,
    breakroom: null,
    game: (
      <div className="w-full p-2 sm:p-6">
         <h2 className="text-3xl font-bold text-white mb-4">Games Arena</h2>
         <div className="w-full max-w-4xl bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl">
           <MiniChess userId={profile?.user_id || ''} userProfile={profile} />
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

  return (
    <div className="min-h-screen h-screen flex flex-col relative overflow-hidden bg-zinc-950">
      {/* Background Layer - Fixed to viewport */}
      {currentRoom !== 'home' && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-black/60 z-10"></div>
          <img
            src="/lovable-uploads/472162b9-c883-43ff-b81c-428cd163ffd8.png"
            alt="Modern office background"
            className="w-full h-full object-cover scale-105 opacity-100"
          />
        </div>
      )}

      {/* Office Header */}
      {currentRoom !== 'home' && (
        <header className="relative z-30 bg-black/40 backdrop-blur-3xl border-b border-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              
              {/* Left: Branding & User */}
              <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 flex items-center justify-center p-1">
                    <img 
                      src="/lovable-uploads/0d3e4545-c80e-401b-82f1-3319db5155b4.png" 
                      alt="VAW" 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                  <div className="flex flex-col">
                    <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                      VAW <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">TECHNOLOGIES</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="h-7 w-7 ml-3 rounded-full bg-white/5 hover:bg-white/20 text-white/70 hover:text-white border border-white/10"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`}>
                          <path d="M15 18l-6-6 6-6"/>
                        </svg>
                      </Button>
                    </h1>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30 text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full">
                        Team Head
                      </Badge>
                      <p className="text-white/60 text-xs font-semibold flex items-center">
                        <span className="w-1 h-1 rounded-full bg-white/40 mr-1.5"></span>
                        {profile?.full_name || profile?.username || 'Team Leader'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Actions & Badges */}
              <div className="flex items-center gap-3 md:gap-4 flex-wrap justify-end">
                
                {/* Status Badge without unnecessary wrapping background */}
                <div className="flex items-center shadow-inner rounded-full p-0.5 border border-white/5 bg-black/20">
                  <UserStatusBadge status={status} isBreakActive={false} breakTimeRemaining={0} />
                </div>

                {/* Glassmorphic Coins Badge */}
                <div
                  onClick={() => setCurrentRoom('coin')}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 hover:from-amber-500/20 hover:to-yellow-500/20 border border-amber-500/20 rounded-full px-3 py-1.5 cursor-pointer transition-all shadow-[0_0_10px_rgba(245,158,11,0.1)] hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] active:scale-95"
                >
                  <div className="bg-amber-500/20 p-1 rounded-full">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <span className="text-amber-300 text-xs font-bold tracking-wide">
                    {(profile?.total_points || 0).toLocaleString()} Coins
                  </span>
                </div>

                <div className="hidden sm:block">
                  <NotificationsBar userId={profile?.user_id || ''} />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 ring-2 ring-white/10 hover:ring-white/30 transition-all p-0 overflow-hidden shadow-lg ml-1">
                      <Avatar className="h-full w-full">
                        <AvatarImage src={profile?.profile_photo_url} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-sm">
                          {profile?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 bg-zinc-950/95 backdrop-blur-2xl border-white/10 text-white shadow-2xl rounded-2xl p-1">
                    <div className="px-4 py-3 mb-1 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-sm font-bold truncate text-white">{profile?.full_name || 'Team Head'}</p>
                    </div>
                    
                    <DropdownMenuItem onClick={() => navigate("/sales/dashboard")} className="cursor-pointer hover:bg-blue-500/10 focus:bg-blue-500/10 text-blue-400 py-2.5 rounded-lg my-0.5 transition-colors">
                      <Briefcase className="mr-3 h-4 w-4" />
                      <span className="font-medium">Sales Hub (Client Entry)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowProfileDialog(true)} className="cursor-pointer hover:bg-white/10 focus:bg-white/10 py-2.5 rounded-lg my-0.5 transition-colors">
                      <User className="mr-3 h-4 w-4 text-purple-400" />
                      <span className="font-medium">View/Edit Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowEmojiDialog(true)} className="cursor-pointer hover:bg-white/10 focus:bg-white/10 py-2.5 rounded-lg my-0.5 transition-colors">
                      <LockIcon className="mr-3 h-4 w-4 text-emerald-400" />
                      <span className="font-medium">Update Emoji Password</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowBiometricDialog(true)} className="cursor-pointer hover:bg-white/10 focus:bg-white/10 py-2.5 rounded-lg my-0.5 transition-colors">
                      <Fingerprint className="mr-3 h-4 w-4 text-teal-400" />
                      <span className="font-medium">Fingerprint Login</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowCoinConfigDialog(true)} className="cursor-pointer hover:bg-amber-500/10 focus:bg-amber-500/10 text-amber-400 py-2.5 rounded-lg my-0.5 transition-colors">
                      <Settings2 className="mr-3 h-4 w-4" />
                      <span className="font-medium">Coin Rewards Config</span>
                    </DropdownMenuItem>
                    
                    <div className="h-px bg-white/10 my-1"></div>
                    
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 hover:text-red-300 py-2.5 rounded-lg my-0.5 transition-colors">
                      <LogOut className="mr-3 h-4 w-4" />
                      <span className="font-medium">Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="hidden md:block">
                  <UpdateButton variant="dark" />
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Announcement Banner */}
      {currentRoom !== 'home' && (
        <AnnouncementBanner userId={profile?.user_id || ''} departmentId={profile?.department_id} />
      )}

      <div className="flex-1 overflow-hidden relative z-10">
        <VirtualOfficeLayout
          currentRoom={currentRoom}
          onRoomChange={setCurrentRoom}
          onlineUsers={onlineUsers}
          userId={profile?.user_id}
          userProfile={profile}
          onOpenCoins={() => setCurrentRoom('coin')}
          className="h-full w-full"
          isSidebarCollapsed={isSidebarCollapsed}
          onSidebarCollapse={setIsSidebarCollapsed}
        >
          {roomComponents[currentRoom]}
        </VirtualOfficeLayout>
      </div>

      {/* Profile Edit Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your profile information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.profile_photo_url} />
                <AvatarFallback className="text-2xl">{profile?.full_name?.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={(profile as any)?.email || ''} disabled className="opacity-60" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="about_me">About Me</Label>
              <Textarea
                id="about_me"
                rows={3}
                value={profileForm.about_me}
                onChange={(e) => setProfileForm({ ...profileForm, about_me: e.target.value })}
                placeholder="Tell us about yourself..."
              />
            </div>
            <Button onClick={handleUpdateProfile} className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Emoji Password Dialog */}
      <Dialog open={showEmojiDialog} onOpenChange={setShowEmojiDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Update Emoji Password</DialogTitle>
            <DialogDescription>Select 6 emojis for your new password</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Emoji Password (6 emojis)</Label>
              <div className="flex gap-2 p-4 bg-muted rounded-lg min-h-[60px] items-center justify-center">
                {newEmojiPassword.map((emoji, idx) => (
                  <span key={idx} className="text-3xl">{emoji}</span>
                ))}
                {newEmojiPassword.length < 6 && (
                  <span className="text-muted-foreground">Select {6 - newEmojiPassword.length} more</span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNewEmojiPassword([])}
                disabled={newEmojiPassword.length === 0}
              >
                Clear
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Confirm Emoji Password</Label>
              <div className="flex gap-2 p-4 bg-muted rounded-lg min-h-[60px] items-center justify-center">
                {confirmEmojiPassword.map((emoji, idx) => (
                  <span key={idx} className="text-3xl">{emoji}</span>
                ))}
                {confirmEmojiPassword.length < 6 && newEmojiPassword.length === 6 && (
                  <span className="text-muted-foreground">Confirm {6 - confirmEmojiPassword.length} more</span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmEmojiPassword([])}
                disabled={confirmEmojiPassword.length === 0}
              >
                Clear
              </Button>
            </div>

            <div className="grid grid-cols-10 gap-2 max-h-[200px] overflow-y-auto p-2 border rounded-lg">
              {EMOJI_OPTIONS.map((emoji, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (newEmojiPassword.length < 6) {
                      addEmojiToPassword(emoji, false);
                    } else if (confirmEmojiPassword.length < 6) {
                      addEmojiToPassword(emoji, true);
                    }
                  }}
                  className="text-2xl hover:bg-accent p-2 rounded transition-colors"
                  disabled={newEmojiPassword.length >= 6 && confirmEmojiPassword.length >= 6}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <Button
              onClick={handleSetEmojiPassword}
              className="w-full"
              disabled={newEmojiPassword.length !== 6 || confirmEmojiPassword.length !== 6}
            >
              Update Emoji Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reactivation Dialog */}
      {showReactivationDialog && reactivationCode && (
        <ReactivationDialog
          open={showReactivationDialog}
          reactivationCode={reactivationCode}
          status={status}
          onReactivate={handleReactivate}
        />
      )}

      <CoinConfigDialog
        open={showCoinConfigDialog}
        onOpenChange={setShowCoinConfigDialog}
      />

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
        <Sparkles className="w-6 h-6" />
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

export default TeamHeadDashboard;