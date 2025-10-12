import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Settings
} from "lucide-react";
import VirtualOfficeLayout from "@/components/staff/VirtualOfficeLayout";
import BreakRoom from "@/components/staff/BreakRoom";
import MeetingRoom from "@/components/staff/MeetingRoom";
import AttendanceChecker from "@/components/staff/AttendanceChecker";
import MoodQuoteChecker from "@/components/staff/MoodQuoteChecker";
import NotificationsBar from "@/components/staff/NotificationsBar";
import TeamHeadWorkspace from "@/components/staff/TeamHeadWorkspace";
import { useStaffData } from "@/hooks/useStaffData";
import { supabase } from "@/integrations/supabase/client";

type RoomType = 'workspace' | 'breakroom' | 'meeting';

const TeamHeadDashboard = () => {
  const [currentRoom, setCurrentRoom] = useState<RoomType>('workspace');
  const [showAttendanceCheck, setShowAttendanceCheck] = useState(false);
  const [showMoodCheck, setShowMoodCheck] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, any>>({});
  const { profile } = useStaffData();

  useEffect(() => {
    checkDailyRequirements();
  }, [profile?.user_id]);

  // Set up presence tracking for online users
  useEffect(() => {
    if (!profile?.user_id) return;

    const channel = supabase.channel('team-presence');

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineUsers(state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: profile.user_id,
            full_name: profile.full_name || 'Unknown',
            username: profile.username || 'unknown',
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [profile?.user_id, profile?.full_name, profile?.username]);

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

  const roomComponents = {
    workspace: <TeamHeadWorkspace userId={profile?.user_id || 'demo-user'} userProfile={profile} />,
    breakroom: <BreakRoom />,
    meeting: <MeetingRoom />
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Images */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60 z-10"></div>
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
      <header className="relative z-20 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center p-2">
                <img 
                  src="/lovable-uploads/3268a3ac-c0c1-40de-8ba7-8f1b1099460e.png" 
                  alt="VAW Technologies Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">VAW Technologies</h1>
                <p className="text-blue-300 text-sm sm:text-base">
                  <Settings className="inline w-4 h-4 mr-1" />
                  Team Head: {profile?.full_name || profile?.username || 'Team Leader'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <div className="order-3 sm:order-1">
                <NotificationsBar userId={profile?.user_id || 'demo-user'} />
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2 bg-green-500/20 border border-green-500/30 rounded-lg px-2 sm:px-3 py-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300 text-xs sm:text-sm">Online</span>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-yellow-500/20 to-blue-500/20 border border-yellow-500/30 rounded-lg px-2 sm:px-3 py-1">
                <Wallet className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-300" />
                <span className="text-yellow-300 text-xs sm:text-sm">${profile?.earnings || 0}</span>
              </div>
              
              <Badge className="bg-purple-500/20 border-purple-500/30 text-purple-300">
                Team Head
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <VirtualOfficeLayout 
        currentRoom={currentRoom} 
        onRoomChange={setCurrentRoom}
        onlineUsers={onlineUsers}
      >
        {roomComponents[currentRoom]}
      </VirtualOfficeLayout>
    </div>
  );
};

export default TeamHeadDashboard;