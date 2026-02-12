
import { ReactNode, useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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
  Coins,
  Hash
} from "lucide-react";
import TeamStatusSidebar from "./TeamStatusSidebar";
import TeamChat from "./TeamChat";
import { ActivityLogPanel } from "./ActivityLogPanel";
import MobileBottomNav from "./MobileBottomNav";


interface VirtualOfficeLayoutProps {
  children: ReactNode;
  currentRoom: 'workspace' | 'breakroom' | 'meeting';
  onRoomChange: (room: 'workspace' | 'breakroom' | 'meeting') => void;
  onlineUsers?: Record<string, any>;
  userId?: string;
  userProfile?: any;
  className?: string;
}

const VirtualOfficeLayout = ({
  children,
  currentRoom,
  onRoomChange,
  onlineUsers = {},
  userId,
  userProfile,
  className
}: VirtualOfficeLayoutProps) => {
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'status' | 'chat'>('status');
  const [mobileSidebarTab, setMobileSidebarTab] = useState<'status' | 'chat'>('status');
  const navigate = useNavigate();
  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [currentRoom]);

  const rooms = [
    { id: 'workspace' as const, name: 'Workspace', icon: Monitor, color: 'from-blue-500 to-blue-600' },
    { id: 'breakroom' as const, name: 'Break Room', icon: Coffee, color: 'from-red-500 to-red-600' },
    { id: 'meeting' as const, name: 'Meeting Room', icon: Users, color: 'from-yellow-500 to-yellow-600' }
  ];

  return (
    <div className={`flex flex-col lg:flex-row h-full w-full overflow-hidden ${className || ""}`}>
      {/* Mobile Chat Sheet */}
      <Sheet open={showMobileChat} onOpenChange={setShowMobileChat}>
        <SheetContent side="right" className="w-full sm:w-[400px] p-0 bg-background/95 backdrop-blur-xl">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Team
            </SheetTitle>
          </SheetHeader>
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setMobileSidebarTab('status')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                mobileSidebarTab === 'status'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="w-4 h-4" />
              Status
            </button>
            <button
              onClick={() => setMobileSidebarTab('chat')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                mobileSidebarTab === 'chat'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Hash className="w-4 h-4" />
              Team Chat
            </button>
          </div>
          <div className="h-[calc(100vh-140px)] overflow-hidden">
            {mobileSidebarTab === 'status' ? (
              <div className="h-full overflow-y-auto p-4">
                <TeamStatusSidebar onlineUsers={onlineUsers} currentUserId={userId} />
              </div>
            ) : (
              <div className="h-full">
                <TeamChat userId={userId || ''} userProfile={userProfile} />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-80 bg-black/20 backdrop-blur-lg border-r border-white/10 overflow-hidden flex-shrink-0 z-20">
        <div className="p-6 pb-4 space-y-4 flex-shrink-0">
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
        </div>

        {/* Team Status / Chat Toggle Section */}
        <div className="flex-1 flex flex-col min-h-0 border-t border-white/10">
          <div className="flex flex-shrink-0">
            <button
              onClick={() => setSidebarTab('status')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                sidebarTab === 'status'
                  ? 'text-white border-b-2 border-blue-500 bg-white/5'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4" />
              Team Status
            </button>
            <button
              onClick={() => setSidebarTab('chat')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                sidebarTab === 'chat'
                  ? 'text-white border-b-2 border-blue-500 bg-white/5'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <Hash className="w-4 h-4" />
              Team Chat
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            {sidebarTab === 'status' ? (
              <div className="h-full overflow-y-auto p-4">
                <TeamStatusSidebar onlineUsers={onlineUsers} currentUserId={userId} />
              </div>
            ) : (
              <div className="h-full">
                <TeamChat userId={userId || ''} userProfile={userProfile} />
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main ref={mainContentRef} className="flex-1 overflow-y-auto p-4 lg:p-6 pb-24 lg:pb-6">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        currentRoom={currentRoom}
        onRoomChange={onRoomChange}
        onOpenChat={() => setShowMobileChat(true)}
        onOpenCoins={() => navigate('/mycoins')}
      />
    </div>
  );
};

export default VirtualOfficeLayout;
