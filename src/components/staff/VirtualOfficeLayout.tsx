
import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import {
  Monitor,
  Coffee,
  Users,
  MessageCircle,
  Calendar,
  Bell,
  ClipboardList,
  X,
  Coins
} from "lucide-react";
import TeamStatusSidebar from "./TeamStatusSidebar";
import { ActivityLogPanel } from "./ActivityLogPanel";
import MusicPlayer from "./MusicPlayer";

interface VirtualOfficeLayoutProps {
  children: ReactNode;
  currentRoom: 'workspace' | 'breakroom' | 'meeting';
  onRoomChange: (room: 'workspace' | 'breakroom' | 'meeting') => void;
  onlineUsers?: Record<string, any>;
  userId?: string;
  className?: string;
}

const VirtualOfficeLayout = ({
  children,
  currentRoom,
  onRoomChange,
  onlineUsers = {},
  userId,
  className
}: VirtualOfficeLayoutProps) => {
  const [showActivityLog, setShowActivityLog] = useState(false);
  const navigate = useNavigate();

  const rooms = [
    { id: 'workspace' as const, name: 'Workspace', icon: Monitor, color: 'from-blue-500 to-blue-600' },
    { id: 'breakroom' as const, name: 'Break Room', icon: Coffee, color: 'from-red-500 to-red-600' },
    { id: 'meeting' as const, name: 'Meeting Room', icon: Users, color: 'from-yellow-500 to-yellow-600' }
  ];

  return (
    <div className={`flex flex-col lg:flex-row h-full w-full overflow-hidden ${className || ""}`}>
      {/* Mobile Navigation */}
      <div className="lg:hidden bg-black/20 backdrop-blur-lg border-b border-white/10 p-4">
        <div className="flex gap-2 overflow-x-auto">
          {rooms.map((room) => {
            const Icon = room.icon;
            const isActive = currentRoom === room.id;

            return (
              <Button
                key={room.id}
                variant="ghost"
                size="sm"
                className={`flex-shrink-0 p-3 transition-all duration-300 ${isActive
                  ? `bg-gradient-to-r ${room.color} text-white shadow-lg`
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                onClick={() => onRoomChange(room.id)}
              >
                <Icon className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">{room.name}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-80 bg-black/20 backdrop-blur-lg border-r border-white/10 p-6 overflow-y-auto flex-shrink-0">
        <div className="space-y-6">
          {/* Room Navigation */}
          <div>
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-green-500 rounded"></div>
              Office Rooms
            </h3>
            <div className="space-y-2">
              {rooms.map((room) => {
                const Icon = room.icon;
                const isActive = currentRoom === room.id;

                return (
                  <Button
                    key={room.id}
                    variant="ghost"
                    className={`w-full justify-start p-4 h-auto transition-all duration-300 ${isActive
                      ? `bg-gradient-to-r ${room.color} text-white shadow-lg shadow-blue-500/25`
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }`}
                    onClick={() => onRoomChange(room.id)}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <span className="font-medium">{room.name}</span>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2 mb-2">
                <MusicPlayer variant="sidebar" userId={userId} />
              </div>
              <Button variant="outline" size="sm" className="bg-red-500/20 border-red-500/30 text-white hover:bg-red-500/30">
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat
              </Button>
              <Button variant="outline" size="sm" className="bg-yellow-500/20 border-yellow-500/30 text-white hover:bg-yellow-500/30">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule
              </Button>
              <Button variant="outline" size="sm" className="bg-green-500/20 border-green-500/30 text-white hover:bg-green-500/30">
                <Bell className="w-4 h-4 mr-2" />
                Alerts
              </Button>

              {/* My Coins Button */}
              <Button
                variant="outline"
                size="sm"
                className="col-span-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/30 text-white hover:from-amber-500/30 hover:to-yellow-500/30"
                onClick={() => navigate('/mycoins')}
              >
                <Coins className="w-4 h-4 mr-2" />
                My Coins
              </Button>

              {/* Activity Log Dialog */}
              {userId && (
                <Dialog open={showActivityLog} onOpenChange={setShowActivityLog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="col-span-2 bg-purple-500/20 border-purple-500/30 text-white hover:bg-purple-500/30">
                      <ClipboardList className="w-4 h-4 mr-2" />
                      Today's Activity
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] max-h-[600px]">
                    <DialogHeader>
                      <div className="flex items-center justify-between">
                        <DialogTitle>Today's Activity Log</DialogTitle>
                        <DialogClose asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <X className="h-4 w-4" />
                          </Button>
                        </DialogClose>
                      </div>
                    </DialogHeader>
                    <div className="overflow-y-auto max-h-[500px]">
                      <ActivityLogPanel userId={userId} />
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Team Status */}
          <div>
            <h3 className="text-white font-semibold mb-4">Team Status</h3>
            <TeamStatusSidebar onlineUsers={onlineUsers} currentUserId={userId} />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        {children}
      </main>
    </div>
  );
};

export default VirtualOfficeLayout;
