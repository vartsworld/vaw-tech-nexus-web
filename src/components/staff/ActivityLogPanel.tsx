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
  AlertCircle,
  Loader2,
  Coins,
  CheckCircle2,
  Award,
  Smile,
  Gift
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityLog {
  id: string;
  activity_type: string;
  created_at: string;
  duration_minutes: number | null;
  metadata: any;
  logType?: 'activity' | 'coin';
  coins?: number;
  reason?: string;
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
      setLoading(true);
      try {
        const results = await Promise.allSettled([
          supabase.from('user_activity_log').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
          supabase.from('user_coin_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
          supabase.from('user_points_log').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50)
        ]);

        const combinedLogs: any[] = [];

        // activity log
        if (results[0].status === 'fulfilled' && !results[0].value.error) {
          combinedLogs.push(...(results[0].value.data || []).map(log => ({ ...log, logType: 'activity' })));
        }

        // coin transactions
        if (results[1].status === 'fulfilled' && !results[1].value.error) {
          combinedLogs.push(...(results[1].value.data || []).map(coin => ({
            ...coin, 
            logType: 'coin',
            activity_type: 'coin_transaction',
            metadata: { 
              reason: coin.reason || coin.description,
              amount: coin.coins ?? (coin as any).amount,
              type: coin.transaction_type 
            }
          })));
        }

        // points log
        if (results[2].status === 'fulfilled' && !results[2].value.error) {
          combinedLogs.push(...(results[2].value.data || []).map(p => ({
            ...p,
            logType: 'coin',
            activity_type: 'coin_transaction',
            metadata: {
              reason: p.reason,
              amount: p.points,
              type: 'earning'
            }
          })));
        }

        const sorted = combinedLogs.sort((a, b) => {
          const dateA = new Date(a.created_at || a.timestamp || 0).getTime();
          const dateB = new Date(b.created_at || b.timestamp || 0).getTime();
          return dateB - dateA;
        });

        setLogs(sorted.slice(0, 100));
      } catch (err) {
        console.error("Error fetching logs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();

    // Subscribe to both
    const channelName = `unified_logs_${userId}_${Date.now()}`;
    const channel = supabase.channel(channelName);
    
    channel
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_activity_log', filter: `user_id=eq.${userId}` },
        () => fetchLogs()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_coin_transactions', filter: `user_id=eq.${userId}` },
        () => fetchLogs()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const getActivityConfig = (type: string, log?: any) => {
    if (log?.logType === 'coin') {
      const isPositive = log.coins > 0;
      return { 
        icon: Coins, 
        label: log.reason || 'Coin Transaction',
        color: isPositive ? 'text-amber-400' : 'text-red-400',
        detail: `${isPositive ? '+' : ''}${log.coins} Coins`
      };
    }

    const configs: Record<string, { icon: any; label: string; color: string; detail?: string }> = {
      attendance_marked: { icon: LogIn, label: 'Attendance Marked', color: 'text-emerald-500' },
      attendance: { icon: LogIn, label: 'Attendance Marked', color: 'text-emerald-500' },
      task_completed: { icon: CheckCircle2, label: 'Task Completed', color: 'text-blue-500' },
      coin_earned: { icon: Coins, label: 'Coins Earned', color: 'text-amber-400' },
      coin_spent: { icon: Gift, label: 'Coins Spent', color: 'text-red-400' },
      quest_completed: { icon: Award, label: 'Quest Completed', color: 'text-purple-500' },
      mood_submitted: { icon: Smile, label: 'Mood Submitted', color: 'text-pink-500' },
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
      <Card className={`bg-black/40 border-white/10 ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-white/70">Activity Route</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-black/40 backdrop-blur-xl border-white/10 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-white/70 flex items-center justify-between">
          Activity & Coin Ledger
          <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full font-normal">Recent</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <ScrollArea className="h-[400px] px-4">
          <div className="space-y-4 pb-4">
            {logs.length === 0 ? (
              <div className="text-center py-10 opacity-30">
                <Clock className="w-8 h-8 mx-auto mb-2" />
                <p className="text-xs">No activity tracked yet</p>
              </div>
            ) : (
              logs.map((log) => {
                const config = getActivityConfig(log.activity_type, log);
                const Icon = config.icon;
                
                return (
                  <div key={log.id} className="flex gap-3 group">
                    <div className="flex flex-col items-center">
                      <div className={`p-2 rounded-full bg-white/5 border border-white/10 ${config.color} group-hover:scale-110 transition-transform`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="w-0.5 h-full bg-white/5 group-last:hidden mt-2" />
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium text-white/90">{config.label}</span>
                        <span className="text-[10px] text-white/30 font-mono">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      {config.detail && (
                        <p className={`text-sm font-bold ${config.color}`}>{config.detail}</p>
                      )}
                      {log.duration_minutes && (
                        <p className="text-[11px] text-white/50">Duration: {log.duration_minutes} mins</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
