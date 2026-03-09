import { useState } from "react";
import { Monitor, Coffee, Users, MessageCircle, Coins, Menu, Swords, Calendar, Bell, ClipboardList, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

type RoomType = 'workspace' | 'breakroom' | 'meeting';

interface MobileBottomNavProps {
  currentRoom: RoomType;
  onRoomChange: (room: RoomType) => void;
  onOpenChat?: () => void;
  onOpenActivity?: () => void;
  onOpenCoins?: () => void;
}

const MobileBottomNav = ({
  currentRoom,
  onRoomChange,
  onOpenChat,
  onOpenActivity,
  onOpenCoins,
}: MobileBottomNavProps) => {
  const [showMenu, setShowMenu] = useState(false);

  const rooms = [
    { id: 'workspace' as const, label: 'Workspace', icon: Monitor, color: 'from-blue-500 to-blue-600' },
    { id: 'breakroom' as const, label: 'Break Room', icon: Coffee, color: 'from-red-500 to-red-600' },
    { id: 'meeting' as const, label: 'Meeting Room', icon: Users, color: 'from-yellow-500 to-yellow-600' },
  ];

  const navItems = [
    { id: 'workspace' as const, label: 'Work', icon: Monitor, isRoom: true },
    { id: 'breakroom' as const, label: 'Break', icon: Coffee, isRoom: true },
    { id: 'meeting' as const, label: 'Meet', icon: Users, isRoom: true },
    { id: 'chat', label: 'Chat', icon: MessageCircle, isRoom: false, action: onOpenChat },
    { id: 'menu', label: 'More', icon: Menu, isRoom: false, action: () => setShowMenu(true) },
  ];

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border safe-area-pb">
        <div className="flex items-center justify-around px-1 py-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.isRoom && currentRoom === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.isRoom) {
                    onRoomChange(item.id as RoomType);
                  } else if (item.action) {
                    item.action();
                  }
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-[56px] relative",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
                <span className="text-[10px] font-medium leading-tight">{item.label}</span>
                {isActive && (
                  <div className="absolute -bottom-0.5 w-4 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* More Menu Sheet */}
      <Sheet open={showMenu} onOpenChange={setShowMenu}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[60vh] bg-background/98 backdrop-blur-xl border-t border-border">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-base font-semibold">Quick Actions</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 pb-6">
            {/* Room Switcher */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">Office Rooms</p>
              <div className="grid grid-cols-3 gap-2">
                {rooms.map((room) => {
                  const Icon = room.icon;
                  const isActive = currentRoom === room.id;
                  return (
                    <Button
                      key={room.id}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "flex flex-col items-center gap-1 h-auto py-3",
                        isActive && `bg-gradient-to-r ${room.color} text-white border-none`
                      )}
                      onClick={() => {
                        onRoomChange(room.id);
                        setShowMenu(false);
                      }}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px]">{room.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">Actions</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start h-10"
                  onClick={() => { onOpenCoins?.(); setShowMenu(false); }}
                >
                  <Coins className="w-4 h-4 mr-2 text-amber-500" />
                  My Coins
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start h-10"
                  onClick={() => { onOpenChat?.(); setShowMenu(false); }}
                >
                  <MessageCircle className="w-4 h-4 mr-2 text-blue-500" />
                  Team Chat
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default MobileBottomNav;
