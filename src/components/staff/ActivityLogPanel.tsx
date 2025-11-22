import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { 
  Clock, 
  Coffee, 
  LogIn, 
  LogOut, 
  Moon, 
  ZapOff, 
  Wifi,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityLog {
  id: string;
  activity_type: string;
  timestamp: string;
  duration_minutes: number | null;
  metadata: any;
}

interface ActivityLogPanelProps {
  userId: string;
  className?: string;
}

export const ActivityLogPanel = ({ userId, className = '' }: ActivityLogPanelProps) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchLogs = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('user_activity_log')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', today.toISOString())
        .order('timestamp', { ascending: false });

      if (data && !error) {
        setLogs(data);
      }
      setLoading(false);
    };

    fetchLogs();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`activity_log:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activity_log',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          setLogs(prev => [payload.new as ActivityLog, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const getActivityConfig = (type: string) => {
    const configs: Record<string, { icon: any; label: string; color: string }> = {
      attendance: { icon: LogIn, label: 'Attendance Marked', color: 'text-emerald-500' },
      break_start: { icon: Coffee, label: 'Break Started', color: 'text-orange-500' },
      break_end: { icon: Coffee, label: 'Returned from Break', color: 'text-emerald-500' },
      coffee_break: { icon: Coffee, label: 'Coffee Break', color: 'text-orange-500' },
      afk: { icon: Clock, label: 'Away From Keyboard', color: 'text-yellow-500' },
      resting: { icon: ZapOff, label: 'Resting', color: 'text-purple-500' },
      sleeping: { icon: Moon, label: 'Sleeping', color: 'text-blue-500' },
      reactivate: { icon: Wifi, label: 'Session Reactivated', color: 'text-emerald-500' },
      online: { icon: Wifi, label: 'Back Online', color: 'text-emerald-500' },
      logout: { icon: LogOut, label: 'Logged Out', color: 'text-gray-500' }
    };

    return configs[type] || { icon: AlertCircle, label: type, color: 'text-gray-500' };
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm">Today's Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Today's Activity Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No activity recorded today
            </p>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => {
                const config = getActivityConfig(log.activity_type);
                const Icon = config.icon;
                
                return (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-full p-2 bg-background border ${config.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{config.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                      </p>
                      {log.duration_minutes && (
                        <p className="text-xs text-muted-foreground">
                          Duration: {log.duration_minutes} minutes
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
