
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
}

const VirtualOfficeLayout = ({ children, currentRoom, onRoomChange }: VirtualOfficeLayoutProps) => {
  const rooms = [
    { id: 'workspace' as const, name: 'Workspace', icon: Monitor, color: 'from-blue-500 to-cyan-500' },
    { id: 'breakroom' as const, name: 'Break Room', icon: Coffee, color: 'from-orange-500 to-red-500' },
    { id: 'meeting' as const, name: 'Meeting Room', icon: Users, color: 'from-purple-500 to-pink-500' }
  ];

  return (
    <div className="flex h-screen">
      {/* Virtual Office Navigation */}
      <aside className="w-80 bg-black/20 backdrop-blur-lg border-r border-white/10 p-6">
        <div className="space-y-6">
          {/* Room Navigation */}
          <div>
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded"></div>
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
                        ? `bg-gradient-to-r ${room.color} text-white shadow-lg shadow-purple-500/25` 
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
              <Button variant="outline" size="sm" className="bg-white/5 border-white/20 text-white hover:bg-white/10">
                <Music className="w-4 h-4 mr-2" />
                Spotify
              </Button>
              <Button variant="outline" size="sm" className="bg-white/5 border-white/20 text-white hover:bg-white/10">
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat
              </Button>
              <Button variant="outline" size="sm" className="bg-white/5 border-white/20 text-white hover:bg-white/10">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule
              </Button>
              <Button variant="outline" size="sm" className="bg-white/5 border-white/20 text-white hover:bg-white/10">
                <Bell className="w-4 h-4 mr-2" />
                Alerts
              </Button>
            </div>
          </div>

          {/* Team Status */}
          <div>
            <h3 className="text-white font-semibold mb-4">Team Online</h3>
            <div className="space-y-3">
              {['Sarah Chen', 'Mike Rodriguez', 'Emily Davis'].map((name, index) => (
                <div key={name} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${
                    index === 0 ? 'from-green-400 to-blue-500' :
                    index === 1 ? 'from-purple-400 to-pink-500' :
                    'from-yellow-400 to-red-500'
                  } flex items-center justify-center text-white text-sm font-medium`}>
                    {name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{name}</p>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <p className="text-green-300 text-xs">Available</p>
                    </div>
                  </div>
                </div>
              ))}
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
