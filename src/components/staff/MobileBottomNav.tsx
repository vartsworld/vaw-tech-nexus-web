import { useState } from "react";
import { Monitor, Coffee, Users, MessageCircle, Coins, Menu, Swords, Calendar, Bell, ClipboardList, X, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

type RoomType = 'home' | 'workspace' | 'breakroom' | 'meeting' | 'planner';

interface MobileBottomNavProps {
  currentRoom: string;
  onRoomChange: (room: string) => void;
  onOpenChat?: () => void;
  onOpenActivity?: () => void;
  onOpenCoins?: () => void;
  customSidebarLinks?: any[];
  /** Replaces the default bottom tabs. Use id "menu" for the "More" sheet. */
  primaryItems?: { id: string; label: string; icon: any }[];
  /** Numeric badges keyed by room id, shown on tabs and menu items */
  badges?: Record<string, number>;
}

const MobileBottomNav = ({
  currentRoom,
  onRoomChange,
  onOpenChat,
  onOpenActivity,
  onOpenCoins,
  customSidebarLinks,
  primaryItems,
  badges = {},
}: MobileBottomNavProps) => {
  const [showMenu, setShowMenu] = useState(false);

  const defaultRooms = [
    { id: 'workspace', label: 'Workspace', icon: Monitor, color: 'from-blue-500 to-blue-600' },
    { id: 'planner', label: 'Planner', icon: Calendar, color: 'from-purple-500 to-purple-600' },
    { id: 'meeting', label: 'Meeting Room', icon: Users, color: 'from-yellow-500 to-yellow-600' },
  ];

  const menuBadge = Object.entries(badges).reduce(
    (t, [id, n]) => t + (primaryItems?.some((p) => p.id === id) ? 0 : n || 0),
    0,
  );

  const navItems: { id: string; label: string; icon: any; isRoom: boolean; action?: () => void }[] = primaryItems
    ? primaryItems.map((p) =>
        p.id === 'menu'
          ? { ...p, isRoom: false, action: () => setShowMenu(true) }
          : { ...p, isRoom: true },
      )
    : [
    { id: 'workspace' as const, label: 'Work', icon: Monitor, isRoom: true },
    { id: 'planner' as const, label: 'Plan', icon: Calendar, isRoom: true },
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
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-[56px] relative",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
                {(item.id === 'menu' ? menuBadge : badges[item.id] || 0) > 0 && (
                  <span className="absolute right-1.5 top-0.5 min-w-[16px] rounded-full bg-red-500 px-1 text-center text-[10px] font-bold leading-4 text-white">
                    {Math.min(item.id === 'menu' ? menuBadge : badges[item.id], 99)}
                  </span>
                )}
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
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] bg-background/98 backdrop-blur-xl border-t border-border">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-base font-semibold">{primaryItems ? "All pages" : "Quick Actions"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 pb-6 overflow-y-auto max-h-[70vh] px-1">
            {customSidebarLinks && customSidebarLinks.length > 0 ? (
              customSidebarLinks.map((section: any) => (
                <div key={section.title} className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    {section.icon && <section.icon className="w-3.5 h-3.5" />}
                    {section.title}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {section.items.map((item: any) => {
                      const Icon = item.icon;
                      const isActive = currentRoom === item.id;
                      return (
                        <Button
                          key={item.id}
                          variant={isActive ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "justify-start h-10 gap-2 truncate",
                            isActive && "bg-primary text-primary-foreground font-bold"
                          )}
                          onClick={() => {
                            onRoomChange(item.id);
                            setShowMenu(false);
                          }}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="text-xs truncate">{item.name}</span>
                          {(badges[item.id] || 0) > 0 && (
                            <span className="ml-auto rounded-full bg-red-500 px-1.5 text-[10px] font-bold leading-4 text-white">{badges[item.id]}</span>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">Office Rooms</p>
                <div className="grid grid-cols-3 gap-2">
                  {defaultRooms.map((room) => {
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
            )}

            {/* Quick Actions */}
            <div className="space-y-2 border-t border-border pt-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                {onOpenCoins && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start h-10"
                    onClick={() => { onOpenCoins?.(); setShowMenu(false); }}
                  >
                    <Coins className="w-4 h-4 mr-2 text-amber-500" />
                    My Coins
                  </Button>
                )}
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
