import { Monitor, Coffee, Users, MessageCircle, Coins, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const navItems = [
    { id: 'workspace' as const, label: 'Work', icon: Monitor, isRoom: true },
    { id: 'breakroom' as const, label: 'Break', icon: Coffee, isRoom: true },
    { id: 'meeting' as const, label: 'Meeting', icon: Users, isRoom: true },
    { id: 'chat', label: 'Chat', icon: MessageCircle, isRoom: false, action: onOpenChat },
    { id: 'coins', label: 'Coins', icon: Coins, isRoom: false, action: onOpenCoins },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-t border-white/10 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
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
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px]",
                isActive
                  ? "bg-gradient-to-t from-primary/30 to-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
