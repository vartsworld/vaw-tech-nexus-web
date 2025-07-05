
import { useState } from "react";
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
import { useStaffData } from "@/hooks/useStaffData";

type RoomType = 'workspace' | 'breakroom' | 'meeting';

const StaffDashboard = () => {
  const [currentRoom, setCurrentRoom] = useState<RoomType>('workspace');
  const { profile } = useStaffData();

  const roomComponents = {
    workspace: <WorkspaceRoom />,
    breakroom: <BreakRoom />,
    meeting: <MeetingRoom />
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800">
      {/* Office Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Virtual Office</h1>
                <p className="text-purple-300">Welcome back, {profile?.full_name || profile?.username || 'Staff Member'}!</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300 text-sm">Online</span>
              </div>
              
              <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg px-3 py-1">
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
