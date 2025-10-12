
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { 
  Monitor, 
  Coffee, 
  Users, 
  Music,
  MessageCircle,
  Calendar,
  Bell
} from "lucide-react";

interface VirtualOfficeLayoutProps {
  children: ReactNode;
  currentRoom: 'workspace' | 'breakroom' | 'meeting';
  onRoomChange: (room: 'workspace' | 'breakroom' | 'meeting') => void;
  onlineUsers?: Record<string, any>;
}

const VirtualOfficeLayout = ({ children, currentRoom, onRoomChange, onlineUsers = {} }: VirtualOfficeLayoutProps) => {
  const rooms = [
    { id: 'workspace' as const, name: 'Workspace', icon: Monitor, color: 'from-blue-500 to-blue-600' },
    { id: 'breakroom' as const, name: 'Break Room', icon: Coffee, color: 'from-red-500 to-red-600' },
    { id: 'meeting' as const, name: 'Meeting Room', icon: Users, color: 'from-yellow-500 to-yellow-600' }
  ];

  return (
    <div className="flex flex-col lg:flex-row h-full relative">
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
                className={`flex-shrink-0 p-3 transition-all duration-300 ${
                  isActive 
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
      <aside className="hidden lg:block w-80 bg-black/20 backdrop-blur-lg border-r border-white/10 p-6">
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
                    className={`w-full justify-start p-4 h-auto transition-all duration-300 ${
                      isActive 
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
              <Button variant="outline" size="sm" className="bg-blue-500/20 border-blue-500/30 text-white hover:bg-blue-500/30">
                <Music className="w-4 h-4 mr-2" />
                Spotify
              </Button>
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
            </div>
          </div>

          {/* Team Status */}
          <div>
            <h3 className="text-white font-semibold mb-4">Team Online</h3>
            <div className="space-y-3">
              {(() => {
                // Extract all presences and deduplicate by user_id
                const uniqueUsers = new Map();
                Object.values(onlineUsers).forEach((presences: any) => {
                  const presenceArray = Array.isArray(presences) ? presences : [presences];
                  presenceArray.forEach((presence: any) => {
                    // Skip demo-user and invalid entries
                    if (presence.user_id && presence.user_id !== 'demo-user' && presence.full_name && presence.full_name !== 'Unknown') {
                      uniqueUsers.set(presence.user_id, presence);
                    }
                  });
                });

                if (uniqueUsers.size === 0) {
                  return (
                    <div className="text-center py-4 text-white/50 text-sm">
                      No team members online
                    </div>
                  );
                }

                return Array.from(uniqueUsers.values()).map((presence: any) => {
                  const initials = presence.full_name?.split(' ').map((n: string) => n[0]).join('') || '?';
                  
                  return (
                    <div key={presence.user_id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                        {initials}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{presence.full_name}</p>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <p className="text-green-300 text-xs">Available</p>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default VirtualOfficeLayout;
