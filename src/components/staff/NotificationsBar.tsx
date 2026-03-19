import { useState } from "react";
import { Bell, X, AlertTriangle, Info, CheckCircle, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";
import { useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";

interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'announcement' | 'task_assigned' | 'mood_alert' | 'achievement';
  is_urgent: boolean;
  created_at: string;
  read_by: string[];
  expires_at?: string;
}

interface NotificationsBarProps {
  userId: string;
}

const NotificationsBar = ({ userId }: NotificationsBarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const { data: notificationsData } = useRealtimeQuery<Notification[]>({
    queryKey: ['notifications', userId],
    table: 'staff_notifications',
    select: '*',
    order: { column: 'created_at', ascending: false },
    limit: 10,
    staleTime: 1 * 60 * 1000,
  });

  const notifications = (notificationsData || []).filter(notification =>
    !notification.expires_at || new Date(notification.expires_at) > new Date()
  );

  const unreadCount = notifications.filter(n => !n.read_by?.includes(userId)).length;

  const markAsRead = async (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) return;

    const updatedReadBy = [...(notification.read_by || []), userId];

    queryClient.setQueryData(['notifications', userId], (old: Notification[] | undefined) => {
      if (!old) return old;
      return old.map(n =>
        n.id === notificationId ? { ...n, read_by: updatedReadBy } : n
      );
    });

    try {
      const { error } = await supabase
        .from('staff_notifications')
        .update({ read_by: updatedReadBy })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    }
  };

  const getNotificationIcon = (type: string, isUrgent: boolean) => {
    switch (type) {
      case 'announcement':
        return <Megaphone className={`w-4 h-4 flex-shrink-0 ${isUrgent ? 'text-red-400' : 'text-blue-400'}`} />;
      case 'task_assigned':
        return <CheckCircle className="w-4 h-4 flex-shrink-0 text-green-400" />;
      case 'mood_alert':
        return <AlertTriangle className="w-4 h-4 flex-shrink-0 text-yellow-400" />;
      case 'achievement':
        return <CheckCircle className="w-4 h-4 flex-shrink-0 text-purple-400" />;
      default:
        return <Info className="w-4 h-4 flex-shrink-0 text-blue-400" />;
    }
  };

  const getNotificationColor = (type: string, isUrgent: boolean) => {
    if (isUrgent) return 'bg-red-500/20 border-red-500/30';
    switch (type) {
      case 'announcement': return 'bg-blue-500/20 border-blue-500/30';
      case 'task_assigned': return 'bg-green-500/20 border-green-500/30';
      case 'mood_alert': return 'bg-yellow-500/20 border-yellow-500/30';
      case 'achievement': return 'bg-purple-500/20 border-purple-500/30';
      default: return 'bg-muted/50 border-border';
    }
  };

  const notificationsList = (
    <div className="space-y-2">
      {notifications.length === 0 ? (
        <p className="text-muted-foreground text-center py-8 text-sm">No notifications yet</p>
      ) : (
        notifications.map((notification) => {
          const isUnread = !notification.read_by?.includes(userId);
          return (
            <Card
              key={notification.id}
              className={`${getNotificationColor(notification.type, notification.is_urgent)} ${isUnread ? 'ring-1 ring-blue-400/50' : ''} cursor-pointer transition-all hover:brightness-110`}
              onClick={() => isUnread && markAsRead(notification.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  {getNotificationIcon(notification.type, notification.is_urgent)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-foreground font-medium text-sm truncate">
                        {notification.title}
                      </h4>
                      {notification.is_urgent && (
                        <Badge variant="destructive" className="h-5 text-xs flex-shrink-0">
                          Urgent
                        </Badge>
                      )}
                      {isUnread && (
                        <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs mt-1 line-clamp-2">
                      {notification.content}
                    </p>
                    <p className="text-muted-foreground/60 text-xs mt-2">
                      {new Date(notification.created_at).toLocaleDateString()} at{' '}
                      {new Date(notification.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative text-white hover:bg-white/10"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-red-500 text-white text-xs flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Mobile: Bottom Sheet */}
      {isMobile ? (
        <Sheet open={isExpanded} onOpenChange={setIsExpanded}>
          <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh] bg-background/98 backdrop-blur-xl">
            <SheetHeader className="pb-2">
              <SheetTitle className="text-base font-semibold flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs">{unreadCount}</Badge>
                )}
              </SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto max-h-[55vh] pb-4">
              {notificationsList}
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        /* Desktop: Dropdown */
        isExpanded && (
          <div className="absolute top-12 right-0 w-80 max-h-96 overflow-y-auto bg-background/95 backdrop-blur-lg border border-border rounded-lg shadow-xl z-50">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-foreground font-semibold">Notifications</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="text-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-2">
              {notificationsList}
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default NotificationsBar;
