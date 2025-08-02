
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
  TrendingUp
} from "lucide-react";
import VirtualOfficeLayout from "@/components/staff/VirtualOfficeLayout";
import WorkspaceRoom from "@/components/staff/WorkspaceRoom";
import BreakRoom from "@/components/staff/BreakRoom";
import MeetingRoom from "@/components/staff/MeetingRoom";
import AttendanceChecker from "@/components/staff/AttendanceChecker";
import MoodQuoteChecker from "@/components/staff/MoodQuoteChecker";
import NotificationsBar from "@/components/staff/NotificationsBar";
import TeamChat from "@/components/staff/TeamChat";
import TasksManager from "@/components/staff/TasksManager";
import MiniChess from "@/components/staff/MiniChess";
import SpotifyWidget from "@/components/staff/SpotifyWidget";
import { useStaffData } from "@/hooks/useStaffData";
import { supabase } from "@/integrations/supabase/client";

type RoomType = 'workspace' | 'breakroom' | 'meeting';

const StaffDashboard = () => {
  const [currentRoom, setCurrentRoom] = useState<RoomType>('workspace');
  const [showAttendanceCheck, setShowAttendanceCheck] = useState(false);
  const [showMoodCheck, setShowMoodCheck] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { profile } = useStaffData();

  useEffect(() => {
    checkDailyRequirements();
  }, []);

  const checkDailyRequirements = async () => {
    // This would check if user has marked attendance and mood for today
    // For demo, we'll show them briefly
    setShowAttendanceCheck(true);
  };

  const handleAttendanceMarked = () => {
    setShowAttendanceCheck(false);
    setShowMoodCheck(true);
  };

  const handleMoodSubmitted = () => {
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
          <div className="w-full max-w-md">
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
          <div className="w-full max-w-lg">
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
    workspace: (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        <div className="lg:col-span-2 space-y-6">
          <TasksManager userId={profile?.user_id || 'demo-user'} userProfile={profile} />
        </div>
        <div className="space-y-6">
          <TeamChat userId={profile?.user_id || 'demo-user'} userProfile={profile} />
          <MiniChess userId={profile?.user_id || 'demo-user'} userProfile={profile} />
          <SpotifyWidget userId={profile?.user_id || 'demo-user'} />
        </div>
      </div>
    ),
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
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center p-2">
                <img 
                  src="/lovable-uploads/3268a3ac-c0c1-40de-8ba7-8f1b1099460e.png" 
                  alt="VAW Technologies Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">VAW Technologies</h1>
                <p className="text-blue-300">Welcome back, {profile?.full_name || profile?.username || 'Staff Member'}!</p>
              </div>
            </div>
            
              <div className="flex items-center gap-4">
                <NotificationsBar userId={profile?.user_id || 'demo-user'} />
                
                <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-300 text-sm">Online</span>
                </div>
                
                <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-blue-500/20 border border-yellow-500/30 rounded-lg px-3 py-1">
                  <Wallet className="w-4 h-4 text-yellow-300" />
                  <span className="text-yellow-300 text-sm">${profile?.earnings || 0}</span>
                </div>
              </div>
          </div>
        </div>
      </header>

      <VirtualOfficeLayout currentRoom={currentRoom} onRoomChange={setCurrentRoom}>
        {roomComponents[currentRoom]}
      </VirtualOfficeLayout>
    </div>
  );
};

export default StaffDashboard;
