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
  created_at: string;
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
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

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
    <Card className={`bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-base flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-400" />
          Today's Activity Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-white/20 mx-auto mb-3" />
              <p className="text-sm text-white/50">No activity recorded today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const config = getActivityConfig(log.activity_type);
                const Icon = config.icon;

                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                  >
                    <div className={`mt-0.5 rounded-full p-2 bg-black/20 backdrop-blur-sm border border-white/10 ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{config.label}</p>
                      <p className="text-xs text-white/50">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </p>
                      {log.duration_minutes && (
                        <p className="text-xs text-blue-300/70">
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
