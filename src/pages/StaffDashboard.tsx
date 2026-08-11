import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, useParams, Navigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Flame,
  Fingerprint,
  Loader2,
  Sparkles,
  Cpu,
  ShieldAlert,
  Hash,
  Plus,
  Search,
  ThumbsUp,
  ExternalLink,
  Maximize2,
  Layout,
  MessageSquare,
  Compass,
  Activity,
  Settings,
  Lock as LockIcon,
  Eraser,
  Volume2,
  VolumeX,
  ChevronLeft
} from "lucide-react";
import { motion } from "framer-motion";
import { useUser } from "@/context/UserContext";
import { BiometricSettingsDialog } from "@/components/staff/BiometricSettingsDialog";
import UpdateButton from "@/components/staff/UpdateButton";
import VirtualOfficeLayout from "@/components/staff/VirtualOfficeLayout";
import StaffMobileHome from "@/components/staff/StaffMobileHome";
import { useIsMobile } from "@/hooks/use-mobile";

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
import CoinPopup from "@/components/staff/CoinPopup";
import StreakCalendarDialog from "@/components/staff/StreakCalendarDialog";
import OfficeZenHome from "@/components/staff/OfficeZenHome";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import EmmaAssistant from "@/components/ai/EmmaAssistant";

import LeaveApplicationDialog from "@/components/staff/LeaveApplicationDialog";
import DepartmentStaffList from "@/components/staff/DepartmentStaffList";
import MyCoins from "@/pages/MyCoins";
import MonthlyPlanner from "@/components/staff/MonthlyPlanner";

// Sidebar sub-views / dynamic tabs imports
import LeaveView from "@/components/staff/LeaveView";
import ToolsNexusView from "@/components/staff/ToolsNexusView";
import MiniChess from "@/components/staff/MiniChess";
import ClientOnboardingCreator from "@/components/staff/ClientOnboardingCreator";
import { QuickNotes } from "@/components/staff/QuickNotes";
import TeamChat from "@/components/staff/TeamChat";
import TeamStatusSidebar from "@/components/staff/TeamStatusSidebar";

type RoomType =
  | 'home'
  | 'workspace'
  | 'meeting'
  | 'breakroom'
  | 'planner'
  | 'leave'
  | 'tools'
  | 'chess'
  | 'onboarding'
  | 'notes'
  | 'operations'
  | 'docs'
  | 'activity'
  | 'channels'
  | 'inbox'
  | 'chat'
  | 'staff'
  | 'coin'
  | 'game';

const EMOJI_OPTIONS = [
  "😀", "😂", "🥰", "😍", "🤔", "😎", "🥳", "🤗", "😇", "🙃",
  "😴", "🤤", "😋", "🧐", "🤓", "😏", "🥺", "😢", "😭", "😤",
  "🤯", "🥴", "🤠", "🥶", "🥵", "😱", "🤗", "🤫", "🤭", "🙄",
  "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
  "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆",
  "❤️", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "💕",
  "🍎", "🍌", "🍊", "🍋", "🍉", "🍇", "🍓", "🥝", "🍒", "🥥",
  "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱", "🏓", "🏸",
  "🎵", "🎶", "🎤", "🎧", "🎸", "🎹", "🎺", "🎻", "🥁", "📱",
  "💻", "⌨️", "🖥️", "🖨️", "📷", "📺", "🕹️", "💡", "🔔", "🔕"
];

const paramToRoom = (param: string): RoomType | null => {
  if (param === 'dashboard' || param === 'workspace') return 'workspace';
  if (param === 'calendar' || param === 'planner') return 'planner';
  if (param === 'meetingroom') return 'meeting';

  const validRooms: RoomType[] = [
    'home', 'workspace', 'meeting', 'breakroom', 'planner', 'leave', 'tools',
    'chess', 'onboarding', 'notes', 'operations', 'docs', 'activity', 'channels', 'inbox',
    'chat', 'staff', 'coin', 'game'
  ];
  if (validRooms.includes(param as RoomType)) return param as RoomType;
  return null;
};

const StaffDashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { room } = useParams();
  const { interactionSoundsEnabled, setInteractionSoundsEnabled } = useUser();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const getInitialRoom = (): RoomType => {
    if (room) {
      const r = paramToRoom(room);
      if (r) return r;
    }
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      const r = paramToRoom(roomParam);
      if (r) return r;
    }
    const firstParam = window.location.search.replace('?', '').split('&')[0];
    if (firstParam) {
      const r = paramToRoom(firstParam);
      if (r) return r;
    }
    return 'planner'; // Default fallback
  };

  const [currentRoom, setCurrentRoom] = useState<RoomType>(getInitialRoom);
  const [showMobileHome, setShowMobileHome] = useState(true);
  const [workspaceControls, setWorkspaceControls] = useState<React.ReactNode>(null);
  const [showAttendanceCheck, setShowAttendanceCheck] = useState(false);
  const [showMoodCheck, setShowMoodCheck] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, any>>({});
  const [departmentName, setDepartmentName] = useState<string>("");
  const [showCoinPopup, setShowCoinPopup] = useState(false);
  const [showStreakCalendar, setShowStreakCalendar] = useState(false);
  const [showBiometricDialog, setShowBiometricDialog] = useState(false);
  const [showEmma, setShowEmma] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showEmojiDialog, setShowEmojiDialog] = useState(false);
  const [newEmojiPassword, setNewEmojiPassword] = useState<string[]>([]);
  const [confirmEmojiPassword, setConfirmEmojiPassword] = useState<string[]>([]);
  const [profileForm, setProfileForm] = useState({ full_name: "", about_me: "" });

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

  // Custom callback to transition between workspace rooms cleanly by changing the URL
  const handleRoomChange = useCallback((room: RoomType) => {
    let suffix = '';
    if (room === 'planner') {
      suffix = 'calendar';
    } else if (room === 'workspace') {
      suffix = 'dashboard';
    } else {
      suffix = room;
    }

    const params = new URLSearchParams(location.search);
    let finalSearch = suffix ? `?${suffix}` : '';
    if (params.has('ID')) {
      finalSearch += (finalSearch ? '&' : '?') + `ID=${params.get('ID')}`;
    }

    navigate({
      pathname: location.pathname,
      search: finalSearch,
    }, { replace: true });
  }, [navigate, location.pathname, location.search]);

  // Unified loop-free synchronization of URL query params and currentRoom
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    let roomFromUrl: RoomType | null = null;

    const roomParam = params.get('room');
    if (roomParam) {
      roomFromUrl = paramToRoom(roomParam);
    } else {
      const firstParam = location.search.replace('?', '').split('&')[0];
      if (firstParam) {
        roomFromUrl = paramToRoom(firstParam);
      }
    }

    if (roomFromUrl) {
      if (roomFromUrl !== currentRoom) {
        setCurrentRoom(roomFromUrl);
      }
    }
  }, [location.search, currentRoom, navigate, location.pathname]);

  useEffect(() => {
    if (location.state?.openCoins) {
      setShowCoinPopup(true);
    }
    if (location.state?.currentRoom) {
      setCurrentRoom(location.state.currentRoom as RoomType);
    }
    if (location.state) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
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

  const removeLastEmoji = () => {
    if (confirmEmojiPassword.length > 0) {
      setConfirmEmojiPassword(prev => prev.slice(0, -1));
    } else if (newEmojiPassword.length > 0) {
      setNewEmojiPassword(prev => prev.slice(0, -1));
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

      const { error: updateError } = await (supabase as any)
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

  // Set up presence tracking for online users
  useEffect(() => {
    if (!profile?.user_id || !profile?.full_name) return;

    const channel = supabase.channel('team-presence');

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
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
  }, [profile?.user_id, profile?.full_name]);

  useEffect(() => {
    checkDailyRequirements();
    fetchDepartment();
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || "",
        about_me: (profile as any).about_me || "",
      });
    }
  }, [profile?.user_id, profile?.full_name, profile?.department_id]);

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


  useEffect(() => {
    const roomTitleMap: Record<string, string> = {
      home: "Home",
      workspace: "Dashboard",
      meeting: "Meeting Room",
      breakroom: "Break Room",
      planner: "Calendar",
      leave: "Leave",
      tools: "Tools",
      chess: "Chess",
      onboarding: "Onboarding",
      notes: "Notes",
      operations: "Operations",
      docs: "Documents",
      activity: "Activity",
      channels: "Channels",
      inbox: "Inbox"
    };

    const roomTitle = roomTitleMap[currentRoom] || currentRoom.charAt(0).toUpperCase() + currentRoom.slice(1);
    document.title = `${roomTitle} | Staff`;
  }, [currentRoom]);

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
    if (!loading) {
      return <Navigate to="/staff/login" replace />;
    }
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
        onEnterWorkspace={() => handleRoomChange('workspace')}
      />
    ),
    workspace: <DraggableWorkspace userId={profile.user_id} userProfile={profile} />,
    meeting: <MeetingRoom />,
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
    ),
    planner: <MonthlyPlanner userId={profile.user_id} userProfile={profile} />,
    breakroom: null,
    leave: <LeaveView profile={profile} />,
    tools: <ToolsNexusView profile={profile} />,
    chess: (
      <div className="space-y-6 max-w-5xl mx-auto py-2">
        <div className="flex flex-col space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-500" />
            Chess Arena
          </h1>
          <p className="text-xs text-white/40 uppercase tracking-widest font-bold">
            Realtime multiplayer battles and strategic practice
          </p>
        </div>

        <div className="bg-black/30 border border-white/10 rounded-[2.5rem] p-4 lg:p-6 min-h-[600px] backdrop-blur-md">
          <MiniChess userId={profile?.user_id || ''} userProfile={profile} />
        </div>
      </div>
    ),
    onboarding: (
      <div className="space-y-6 max-w-4xl mx-auto py-2">
        <div className="flex flex-col space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Compass className="w-8 h-8 text-blue-400" />
            Client Onboarding Portal
          </h1>
          <p className="text-xs text-white/40 uppercase tracking-widest font-bold">
            Generate and manage direct client project initialization channels
          </p>
        </div>

        <div className="bg-zinc-900/40 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-6 lg:p-8 min-h-[500px]">
          <ClientOnboardingCreator userId={profile?.user_id || ''} />
        </div>
      </div>
    ),
    notes: (
      <div className="space-y-6 max-w-4xl mx-auto py-2">
        <div className="flex flex-col space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
            <StickyNote className="w-8 h-8 text-yellow-400" />
            Personal Notes
          </h1>
          <p className="text-xs text-white/40 uppercase tracking-widest font-bold">
            Organize thoughts, design parameters, and daily items securely
          </p>
        </div>

        <div className="bg-black/30 border border-white/10 rounded-[2.5rem] p-4 lg:p-6 min-h-[500px] backdrop-blur-md">
          <QuickNotes userId={profile?.user_id || ''} />
        </div>
      </div>
    ),
    operations: (
      <div className="space-y-6 max-w-5xl mx-auto py-2">
        <div className="flex flex-col space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Layout className="w-8 h-8 text-blue-500" />
            Operations Overview
          </h1>
          <p className="text-xs text-white/40 uppercase tracking-widest font-bold">
            Real-time tracking of department metrics and performance standards
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: "Pipeline Load", value: "84%", trend: "Optimal Capacity", icon: Cpu, color: "text-blue-400" },
            { label: "Service Availability", value: "99.98%", trend: "Excellent SLA", icon: TrendingUp, color: "text-emerald-400" },
            { label: "Active Escalations", value: "0 Cases", trend: "All Cleared", icon: ShieldAlert, color: "text-amber-400" },
            { label: "Redemption Pool", value: "₹4,25,000", trend: "Fully Funded", icon: Trophy, color: "text-purple-400" },
          ].map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <Card key={idx} className="bg-black/30 border-white/10 text-white rounded-[2rem] backdrop-blur-md">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-white/40">{metric.label}</span>
                    <Icon className={`w-5 h-5 ${metric.color}`} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">{metric.value}</h3>
                    <p className="text-[9px] font-bold text-white/30 uppercase mt-0.5">{metric.trend}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    ),
    docs: (
      <div className="space-y-6 max-w-5xl mx-auto py-2">
        <div className="flex flex-col space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
            <StickyNote className="w-8 h-8 text-blue-500" />
            Documents Nexus
          </h1>
          <p className="text-xs text-white/40 uppercase tracking-widest font-bold">
            Central repository of manuals, specifications, and code policies
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: "VAW Coin Economy Guidelines",
              desc: "Comprehensive manual explaining the correlation between VAW Coin productivity, INR redemption, and reward standards.",
              icon: Sparkles,
              color: "text-amber-400 bg-amber-500/10 border-amber-500/20"
            },
            {
              title: "Vite & React Development Best Practices",
              desc: "Code standards, state-management policies, Supabase client subscription cleanup requirements, and design protocols.",
              icon: Briefcase,
              color: "text-blue-400 bg-blue-500/10 border-blue-500/20"
            },
            {
              title: "Security & Credential Vault Access",
              desc: "Protocols on environment variables, private access credentials, and user data privacy standards inside Bondify.",
              icon: Target,
              color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
            },
            {
              title: "Escalation Matrix & Core Directives",
              desc: "Emergency contact protocols, departmental head reviews, and standard code review workflows.",
              icon: Clock,
              color: "text-red-400 bg-red-500/10 border-red-500/20"
            }
          ].map((doc, idx) => {
            const Icon = doc.icon;
            return (
              <Card key={idx} className="bg-black/30 border-white/10 text-white rounded-[2.5rem] hover:bg-white/[0.04] transition-all cursor-pointer group backdrop-blur-md">
                <CardContent className="p-6 space-y-4">
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${doc.color} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors leading-snug">{doc.title}</h3>
                    <p className="text-xs text-white/50 leading-relaxed">{doc.desc}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    ),
    activity: (
      <div className="space-y-6 max-w-4xl mx-auto py-2">
        <div className="flex flex-col space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-500" />
            Activity Log
          </h1>
          <p className="text-xs text-white/40 uppercase tracking-widest font-bold">
            Real-time synchronization of system achievements, attendance, and transactions
          </p>
        </div>

        <div className="bg-black/30 border border-white/10 rounded-[2.5rem] p-4 lg:p-6 min-h-[500px] backdrop-blur-md">
          <ActivityLogPanel userId={profile?.user_id || ''} className="border-none bg-transparent" />
        </div>
      </div>
    ),
    channels: (
      <div className="space-y-6 max-w-4xl mx-auto py-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-blue-500" />
              Chat Channels
            </h1>
            <p className="text-xs text-white/40 uppercase tracking-widest font-bold">
              Explore open channels and synchronized team chat topics
            </p>
          </div>

          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase h-11 px-5 gap-2 border-none">
            <Plus className="w-4 h-4" />
            Create Channel
          </Button>
        </div>

        <div className="bg-black/35 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-6 lg:p-8 min-h-[500px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { id: '1', name: 'general', description: 'General company-wide news, major accomplishments, and official announcements.', is_general: true },
              { id: '2', name: 'tech', description: 'Tech stacks, system architectures, API updates, design patterns, and deployment reviews.', is_general: false },
              { id: '3', name: 'random', description: 'Casual chitchat, memes, chess match schedules, break-time discussions, and zen logs.', is_general: false },
              { id: '4', name: 'design', description: 'Client layouts, glassmorphism templates, Tailwind parameters, and feedback approvals.', is_general: false }
            ].map((chan) => (
              <Card key={chan.id} className="bg-black/30 border-white/10 text-white rounded-[2rem] hover:bg-white/[0.04] transition-all cursor-pointer group backdrop-blur-md">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                    {chan.is_general ? <Sparkles className="w-6 h-6" /> : <Hash className="w-4 h-4" />}
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors truncate">#{chan.name}</h3>
                    <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">{chan.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    ),
    inbox: (
      <div className="space-y-6 max-w-5xl mx-auto py-2">
        <div className="flex flex-col space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-blue-500" />
            Inbox
          </h1>
          <p className="text-xs text-white/40 uppercase tracking-widest font-bold">
            Professional Team Communications & Direct Messages
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-black/30 border border-white/10 rounded-[2.5rem] p-4 lg:p-6 h-[600px] overflow-hidden backdrop-blur-md">
            <TeamChat userId={profile?.user_id || ''} userProfile={profile} />
          </div>
          <div className="bg-black/30 border border-white/10 rounded-[2.5rem] p-4 lg:p-6 h-[600px] overflow-y-auto backdrop-blur-md">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4 px-2">Team Directory</h3>
            <TeamStatusSidebar onlineUsers={onlineUsers} currentUserId={profile?.user_id || ''} />
          </div>
        </div>
      </div>
    )
  };

  return (
    <div className="min-h-screen h-screen flex flex-col relative overflow-hidden bg-zinc-950">
      {isMobile && showMobileHome ? (
        <StaffMobileHome
          profile={profile}
          currentRoom={currentRoom}
          onRoomChange={handleRoomChange}
          onOpenChat={() => {}}
          onOpenCoins={() => {}} // Disabled - Coming Soon
          onOpenStreakCalendar={() => setShowStreakCalendar(true)}
          onEnterWorkspace={() => setShowMobileHome(false)}
          onEditProfile={() => setShowProfileDialog(true)}
          onUpdateEmojiPassword={() => setShowEmojiDialog(true)}
          onManageBiometrics={() => setShowBiometricDialog(true)}
        />
      ) : (
        <>
          {/* Background Layer - Fixed to viewport */}
          {currentRoom !== 'home' && (
            <div className="fixed inset-0 z-0 pointer-events-none">
              <div className="absolute inset-0 bg-black/35 z-10"></div>
              <img
                src="/lovable-uploads/472162b9-c883-43ff-b81c-428cd163ffd8.png"
                alt="Modern office background"
                className="absolute inset-0 w-full h-full object-cover scale-100 opacity-100"
              />
            </div>
          )}
          <VirtualOfficeLayout
            currentRoom={currentRoom}
            onRoomChange={handleRoomChange}
            onlineUsers={onlineUsers}
            userId={profile.user_id}
            userProfile={profile}
            onOpenCoins={() => setCurrentRoom('coin')}
            isSidebarCollapsed={isSidebarCollapsed}
            onSidebarCollapse={setIsSidebarCollapsed}
            header={
              currentRoom !== 'home' ? (
                <>
                  <header className="relative z-30 bg-black/80 backdrop-blur-xl border-b border-white/20 shadow-2xl shrink-0">
                    <div className="container mx-auto px-4 py-3">
                      <div className="flex flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-blue-600 hover:bg-blue-700 text-white border-none text-[10px] uppercase font-bold px-2 py-0.5">
                                Staff Profile
                              </Badge>
                              <p className="text-white text-sm sm:text-base font-bold flex items-center">
                                <User className="inline w-4 h-4 mr-1.5 text-blue-400" />
                                {profile?.full_name || profile?.username || 'Staff'}
                              </p>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                className="h-7 w-7 ml-2 rounded-full bg-white/5 hover:bg-white/20 text-white/70 hover:text-white border border-white/10"
                                title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                              >
                                <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
                              </Button>
                            </div>
                            {departmentName && (
                              <p className="text-purple-300 text-xs font-semibold mt-0.5">{departmentName} Department</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div
                            className="hidden md:flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full text-amber-300 font-bold text-xs cursor-pointer hover:bg-amber-500/20 transition-all shadow-md shadow-amber-500/5 select-none"
                            onClick={() => setCurrentRoom('coin')}
                          >
                            <Coins className="w-4 h-4 text-amber-400" />
                            <span>{(profile?.total_points || 0).toLocaleString()} Coins</span>
                          </div>

                          {/* Desktop Only Streak Display in Header */}
                          <div
                            className="hidden md:flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full text-orange-400 font-bold text-xs cursor-pointer hover:bg-orange-500/20 transition-all shadow-md shadow-orange-500/5 select-none"
                            onClick={() => setShowStreakCalendar(true)}
                            title="View Streak Calendar"
                          >
                            <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                            <span>{profile?.attendance_streak || 0}d Streak</span>
                          </div>

                          <div>
                            <NotificationsBar userId={profile?.user_id || ''} />
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-full">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={profile?.profile_photo_url || profile?.avatar_url} />
                                  <AvatarFallback>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64 bg-zinc-950 text-white border-white/10 shadow-2xl">
                              <DropdownMenuLabel className="text-white/60 text-[10px] font-bold uppercase tracking-wider">My Account</DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-white/10" />

                              {/* Status Indicator inside Dropdown */}
                              <div className="px-2.5 py-1.5 flex items-center justify-between text-xs text-white/60">
                                <span>Status</span>
                                <UserStatusBadge
                                  status={status}
                                  isBreakActive={false}
                                  breakTimeRemaining={0}
                                />
                              </div>

                              {/* Coins Display inside Dropdown */}
                              <div className="px-2.5 py-1.5 flex items-center justify-between text-xs text-white/60">
                                <div className="flex items-center">
                                  <Coins className="mr-2 h-4 w-4 text-amber-500/50" />
                                  <span>Coins Balance</span>
                                </div>
                                <span className="text-amber-500/50 font-bold text-xs">Coming Soon</span>
                              </div>

                              {/* Streak Display inside Dropdown */}
                              <DropdownMenuItem onClick={() => setShowStreakCalendar(true)} className="flex items-center justify-between cursor-pointer py-1.5 focus:bg-white/5">
                                <div className="flex items-center">
                                  <Flame className="mr-2 h-4 w-4 text-orange-500" />
                                  <span>My Streak</span>
                                </div>
                                <span className="text-orange-400 font-bold text-xs">{profile?.attendance_streak || 0}d</span>
                              </DropdownMenuItem>

                              {/* App Update inside Dropdown */}
                              <div className="px-2.5 py-1.5 flex items-center justify-between text-xs text-white/60">
                                <span>System Version</span>
                                <UpdateButton variant="dark" compact={true} />
                              </div>

                              {/* Sound Toggle inside Dropdown */}
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.preventDefault();
                                  setInteractionSoundsEnabled(!interactionSoundsEnabled);
                                }}
                                className="py-1.5 focus:bg-white/5 flex items-center justify-between cursor-pointer text-xs"
                              >
                                <div className="flex items-center">
                                  {interactionSoundsEnabled ? (
                                    <Volume2 className="mr-2 h-4 w-4 text-green-400" />
                                  ) : (
                                    <VolumeX className="mr-2 h-4 w-4 text-zinc-400" />
                                  )}
                                  <span>Interaction Sounds</span>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                                  interactionSoundsEnabled ? "bg-green-500/10 text-green-400" : "bg-zinc-800 text-zinc-400"
                                }`}>
                                  {interactionSoundsEnabled ? "ON" : "OFF"}
                                </span>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator className="bg-white/10" />

                              <DropdownMenuItem onClick={() => navigate("/sales/dashboard")} className="text-blue-400 hover:text-blue-300 py-1.5 focus:bg-white/5">
                                <Briefcase className="mr-2 h-4 w-4" />
                                Sales Hub (Client Entry)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setShowProfileDialog(true)} className="py-1.5 focus:bg-white/5">
                                <User className="mr-2 h-4 w-4 text-zinc-400" />
                                View/Edit Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setShowEmojiDialog(true)} className="py-1.5 focus:bg-white/5">
                                <LockIcon className="mr-2 h-4 w-4 text-zinc-400" />
                                Update Emoji Password
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setShowBiometricDialog(true)} className="text-green-400 hover:text-green-300 py-1.5 focus:bg-white/5">
                                <Fingerprint className="mr-2 h-4 w-4" />
                                Fingerprint Login
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/10" />
                              <DropdownMenuItem onClick={handleLogout} className="text-red-400 hover:text-red-300 py-1.5 focus:bg-white/5">
                                <LogOut className="mr-2 h-4 w-4" />
                                Logout
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </header>
                  <AnnouncementBanner userId={profile.user_id} departmentId={profile.department_id} />
                </>
              ) : undefined
            }
          >
            {roomComponents[currentRoom] || roomComponents['workspace']}
          </VirtualOfficeLayout>
        </>
      )}



      {/* Reactivation Dialog */}
      {showReactivationDialog && reactivationCode && (
        <ReactivationDialog
          open={showReactivationDialog}
          reactivationCode={reactivationCode}
          status={status}
          onReactivate={handleReactivate}
        />
      )}

      {/* Coin Popup */}
      {profile?.user_id && (
        <CoinPopup
          isOpen={showCoinPopup}
          onOpenChange={setShowCoinPopup}
          userId={profile.user_id}
          userProfile={profile}
        />
      )}

      {/* Streak Calendar Dialog */}
      {profile?.user_id && (
        <StreakCalendarDialog
          isOpen={showStreakCalendar}
          onOpenChange={setShowStreakCalendar}
          userId={profile.user_id}
        />
      )}

      {/* Profile Edit Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] w-full rounded-2xl overflow-y-auto sm:max-w-[500px]">
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
        <DialogContent className="max-w-[90vw] max-h-[90vh] w-full overflow-y-auto sm:max-w-[500px] bg-zinc-950 border-white/10 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic tracking-tight text-white">Update Emoji Password</DialogTitle>
            <DialogDescription className="text-white/40 uppercase text-[10px] font-bold tracking-widest">Select 6 emojis for your new high-security passcode</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Sequence Input</Label>

              <div className="flex gap-2">
                <div className="flex-1 grid grid-cols-6 gap-2 p-4 bg-white/5 border border-white/10 rounded-xl min-h-[80px] items-center justify-items-center">
                  {(newEmojiPassword.length < 6 ? newEmojiPassword : confirmEmojiPassword).map((emoji, idx) => (
                    <motion.span initial={{ scale: 0.5 }} animate={{ scale: 1 }} key={idx} className="text-3xl">{emoji}</motion.span>
                  ))}
                  {(newEmojiPassword.length < 6 ? newEmojiPassword : confirmEmojiPassword).length === 0 && (
                    <div className="col-span-6 text-[10px] font-black uppercase tracking-widest text-white/10">
                      Start selecting...
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-auto w-16 bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10 shrink-0 rounded-xl"
                  onClick={removeLastEmoji}
                  disabled={newEmojiPassword.length === 0 && confirmEmojiPassword.length === 0}
                >
                  <Eraser className="h-5 w-5" />
                </Button>
              </div>

              <p className="text-[9px] font-bold text-center uppercase tracking-widest text-white/20">
                {newEmojiPassword.length < 6 ? "Enter your new 6-emoji pattern" : "Re-enter pattern to confirm"}
              </p>
            </div>

            <div className="grid grid-cols-6 gap-3 max-h-48 overflow-y-auto p-4 bg-white/5 border border-white/10 rounded-2xl">
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
                  className="text-2xl hover:bg-white/10 hover:scale-110 active:scale-95 p-2 rounded-xl transition-all duration-200 flex items-center justify-center h-10 w-10 mx-auto"
                  disabled={newEmojiPassword.length >= 6 && confirmEmojiPassword.length >= 6}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <Button
              onClick={handleSetEmojiPassword}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 disabled:opacity-20"
              disabled={newEmojiPassword.length !== 6 || confirmEmojiPassword.length !== 6}
            >
              Update Security Pattern
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BiometricSettingsDialog
        open={showBiometricDialog}
        onOpenChange={setShowBiometricDialog}
      />

      {/* EMMA AI floating button + dialog */}
      <Button
        onClick={() => setShowEmma(true)}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-2xl bg-gradient-to-br from-primary to-purple-500 hover:scale-105 transition-transform hidden md:flex"
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
