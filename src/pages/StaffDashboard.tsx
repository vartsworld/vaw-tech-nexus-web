import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  Activity
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
import CoinPopup from "@/components/staff/CoinPopup";
import OfficeZenHome from "@/components/staff/OfficeZenHome";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import EmmaAssistant from "@/components/ai/EmmaAssistant";
import MonthlyPlanner from "@/components/staff/MonthlyPlanner";

// Sidebar sub-views / dynamic tabs imports
import LeaveView from "@/components/staff/LeaveView";
import ToolsNexusView from "@/components/staff/ToolsNexusView";
import RealChessEngine from "@/components/staff/RealChessEngine";
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
  | 'inbox';

const StaffDashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [currentRoom, setCurrentRoom] = useState<RoomType>('workspace');
  const [showMobileHome, setShowMobileHome] = useState(true);
  const [showAttendanceCheck, setShowAttendanceCheck] = useState(false);
  const [showMoodCheck, setShowMoodCheck] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, any>>({});
  const [departmentName, setDepartmentName] = useState<string>("");
  const [showCoinPopup, setShowCoinPopup] = useState(false);
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

  useEffect(() => {
    if (location.state?.openCoins) {
      setShowCoinPopup(true);
    }
    if (location.state?.currentRoom) {
      setCurrentRoom(location.state.currentRoom as RoomType);
    }
    // Clean up state to prevent re-opening on reload
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
          <RealChessEngine userId={profile?.user_id || ''} userProfile={profile} />
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

  // Show mobile home on small screens
  if (isMobile && showMobileHome) {
    return (
      <StaffMobileHome
        profile={profile}
        currentRoom={currentRoom}
        onRoomChange={setCurrentRoom}
        onOpenChat={() => {}}
        onOpenCoins={() => navigate("/mycoins")}
        onEnterWorkspace={() => setShowMobileHome(false)}
      />
    );
  }

  return (
    <div className="min-h-screen h-screen flex flex-col relative overflow-hidden bg-zinc-950">
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
      {/* Office Header */}
      {currentRoom !== 'home' && (
        <header className="relative z-30 bg-black/20 backdrop-blur-lg border-b border-white/10 flex-shrink-0">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col gap-3">
            {/* Top Row: User Info and Actions */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="min-w-0">
                  <p className="text-white text-sm sm:text-base font-bold truncate">Welcome, {profile?.full_name || profile?.username || 'Staff'}!</p>
                  {departmentName && (
                    <p className="text-purple-300 text-xs font-semibold truncate">{departmentName} Department</p>
                  )}
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
                  className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-lg px-2.5 py-1.5 shadow-lg shadow-amber-500/10 cursor-pointer hover:from-amber-500/30 hover:to-yellow-500/30 transition-all hover:scale-105 active:scale-95"
                  onClick={() => setShowCoinPopup(true)}
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
          onOpenCoins={() => setShowCoinPopup(true)}
        >
          {roomComponents[currentRoom]}
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

      {/* Coin Popup */}
      {profile?.user_id && (
        <CoinPopup
          isOpen={showCoinPopup}
          onOpenChange={setShowCoinPopup}
          userId={profile.user_id}
          userProfile={profile}
        />
      )}

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
