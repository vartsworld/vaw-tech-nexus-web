import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Trophy
} from "lucide-react";
import VirtualOfficeLayout from "@/components/staff/VirtualOfficeLayout";
import WorkspaceRoom from "@/components/staff/WorkspaceRoom";
import BreakRoom from "@/components/staff/BreakRoom";
import BreakRoomWidget from "@/components/staff/BreakRoomWidget";
import MeetingRoom from "@/components/staff/MeetingRoom";
import AttendanceChecker from "@/components/staff/AttendanceChecker";
import MoodQuoteChecker from "@/components/staff/MoodQuoteChecker";
import NotificationsBar from "@/components/staff/NotificationsBar";
import DraggableWorkspace from "@/components/staff/DraggableWorkspace";
import { useStaffData } from "@/hooks/useStaffData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type RoomType = 'workspace' | 'breakroom' | 'meeting';

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [currentRoom, setCurrentRoom] = useState<RoomType>('workspace');
  const [showAttendanceCheck, setShowAttendanceCheck] = useState(false);
  const [showMoodCheck, setShowMoodCheck] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [departmentName, setDepartmentName] = useState<string>("");
  const [isBreakRoomMinimized, setIsBreakRoomMinimized] = useState(false);
  
  // Break timer state
  const [breakTimeRemaining, setBreakTimeRemaining] = useState(900);
  const [isBreakActive, setIsBreakActive] = useState(false);
  const [breakDuration, setBreakDuration] = useState(15);
  
  const { profile, loading } = useStaffData();

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
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60 z-10"></div>
          <img 
            src="/lovable-uploads/472162b9-c883-43ff-b81c-428cd163ffd8.png" 
            alt="Modern office background" 
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
        </div>
        
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
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60 z-10"></div>
          <img 
            src="/lovable-uploads/472162b9-c883-43ff-b81c-428cd163ffd8.png" 
            alt="Modern office background" 
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
        </div>
        
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-white text-lg">Loading your workspace...</div>
      </div>
    );
  }

  const roomComponents = {
    workspace: <DraggableWorkspace userId={profile.user_id} userProfile={profile} />,
    breakroom: isBreakRoomMinimized ? null : (
      <BreakRoom 
        onMinimize={() => setIsBreakRoomMinimized(true)}
        breakTimeRemaining={breakTimeRemaining}
        setBreakTimeRemaining={setBreakTimeRemaining}
        isBreakActive={isBreakActive}
        setIsBreakActive={setIsBreakActive}
        breakDuration={breakDuration}
        setBreakDuration={setBreakDuration}
      />
    ),
    meeting: <MeetingRoom />
  };

  return (
    <div className="min-h-screen h-screen flex flex-col relative overflow-hidden">
      {/* Background Images */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60"></div>
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
      {/* Office Header */}
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
                  <h1 className="text-base sm:text-lg font-bold text-white truncate">VAW Technologies</h1>
                  <p className="text-blue-300 text-xs sm:text-sm truncate">Welcome, {profile?.full_name || profile?.username || 'Staff'}!</p>
                  {departmentName && (
                    <p className="text-purple-300 text-xs truncate">{departmentName} Department</p>
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
            <div className="flex items-center gap-2 flex-wrap">
              <NotificationsBar userId={profile.user_id} />
              
              <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-500/30 rounded-lg px-2.5 py-1.5">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300 text-xs font-medium">Online</span>
              </div>
              
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg px-2.5 py-1.5">
                <Trophy className="w-3.5 h-3.5 text-purple-300" />
                <span className="text-purple-300 text-xs font-medium">{profile?.total_points || 0} pts</span>
              </div>
              
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-500/20 to-blue-500/20 border border-yellow-500/30 rounded-lg px-2.5 py-1.5">
                <Wallet className="w-3.5 h-3.5 text-yellow-300" />
                <span className="text-yellow-300 text-xs font-medium">${profile?.earnings?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative z-10">
        <VirtualOfficeLayout currentRoom={currentRoom} onRoomChange={setCurrentRoom}>
          {roomComponents[currentRoom]}
        </VirtualOfficeLayout>
      </div>
      
      {/* Break Room Widget (when minimized) */}
      {isBreakRoomMinimized && (
        <BreakRoomWidget
          onMaximize={() => {
            setIsBreakRoomMinimized(false);
            setCurrentRoom('breakroom');
          }}
          isBreakActive={isBreakActive}
          breakTimeRemaining={breakTimeRemaining}
          unreadChatCount={0}
        />
      )}
    </div>
  );
};

export default StaffDashboard;
