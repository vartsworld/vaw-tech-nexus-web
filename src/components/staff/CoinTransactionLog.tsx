import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpRight, ArrowDownRight, History, Loader2, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  coins: number;
  transaction_type: string;
  description: string | null;
  source_type: string | null;
  created_at: string;
}

interface CoinTransactionLogProps {
  userId: string;
}

const CoinTransactionLog = ({ userId }: CoinTransactionLogProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchTransactions();
    }
  }, [userId]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        supabase.from("user_coin_transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(100),
        supabase.from("user_points_log").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(100),
        supabase.from("user_activity_log").select("*").eq("user_id", userId).not("points_earned", "is", null).neq("points_earned", 0).order("created_at", { ascending: false }).limit(100)
      ]);

      const allLogs: any[] = [];

      // user_coin_transactions
      if (results[0].status === 'fulfilled' && !results[0].value.error) {
        const data = results[0].value.data || [];
        allLogs.push(...data.map(tx => ({
          id: tx.id,
          coins: tx.coins ?? (tx as any).amount ?? 0,
          transaction_type: tx.transaction_type || 'earning',
          description: tx.reason || tx.description || 'Transaction',
          source_type: tx.source_type || 'coin',
          created_at: tx.created_at
        })));
      }

      // user_points_log
      if (results[1].status === 'fulfilled' && !results[1].value.error) {
        const data = results[1].value.data || [];
        allLogs.push(...data.map(pl => ({
          id: pl.id,
          coins: pl.points,
          transaction_type: 'earning',
          description: pl.reason || 'Points Earned',
          source_type: pl.category || 'points',
          created_at: pl.created_at
        })));
      }

      // user_activity_log
      if (results[2].status === 'fulfilled' && !results[2].value.error) {
        const data = results[2].value.data || [];
        allLogs.push(...data.map(al => {
          let metadata: any = {};
          try {
            metadata = typeof al.metadata === 'string' ? JSON.parse(al.metadata) : (al.metadata || {});
          } catch (e) { metadata = {}; }

          return {
            id: al.id,
            coins: al.points_earned,
            transaction_type: al.activity_type,
            description: metadata.reason || metadata.task_title || al.activity_type.replace(/_/g, ' '),
            source_type: al.activity_type,
            created_at: al.created_at || al.timestamp
          };
        }));
      }

      const combined = allLogs
        .sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        })
        .slice(0, 100);

      setTransactions(combined);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionBadge = (type: string) => {
    const badgeStyles: Record<string, string> = {
      earning: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      task_earned: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
      half_time_bonus: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      quest_reward: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      hr_grant: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      late_penalty: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      reward_spent: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      chess_reward: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      redemption: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      bonus: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      task: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
      attendance: "bg-sky-500/10 text-sky-500 border-sky-500/20",
      game: "bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20",
      chat_engagement: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
      mood_checkin: "bg-pink-500/10 text-pink-500 border-pink-500/20",
      sales: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    };

    return (
      <Badge variant="outline" className={cn("font-bold text-[10px] uppercase tracking-tighter whitespace-nowrap", badgeStyles[type] || "bg-muted")}>
        {type.replace(/_/g, " ")}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className="border-border/50 shadow-2xl bg-card/30 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-black italic uppercase tracking-widest text-primary">
            <History className="w-6 h-6 animate-spin" />
            Coin Transmission Ledger
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-24">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-white/10 shadow-2xl bg-slate-900/40 backdrop-blur-2xl overflow-hidden rounded-[2.5rem] border">
      <CardHeader className="bg-gradient-to-br from-blue-500/10 to-transparent border-b border-white/5 p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-3 text-xl font-black italic uppercase tracking-tighter text-white">
              <div className="p-2 bg-blue-500/20 rounded-2xl border border-blue-500/30">
                <History className="w-5 h-5 text-blue-400" />
              </div>
              Transaction Logs
            </CardTitle>
            <CardDescription className="text-white/40 font-medium text-[10px] uppercase tracking-widest">Audit trail of your digital assets</CardDescription>
          </div>
          <Badge className="bg-white/5 text-white/60 border-white/10 font-black px-3 py-1 rounded-full uppercase text-[10px]">
            {transactions.length} Logs
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="w-full">
          {transactions.length === 0 ? (
            <div className="py-24 text-center px-6">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-20 h-20 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center justify-center mb-2">
                   <History className="w-10 h-10 text-white/10" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-black uppercase tracking-tighter text-white/60">No Activity Detected</p>
                  <p className="text-xs text-white/20 font-medium">Your financial ledger is currently empty</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchTransactions} className="mt-4 rounded-full border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest h-10 px-6">
                  Refresh Ledger
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {/* Table Header - Desktop Only */}
              <div className="hidden md:grid grid-cols-5 bg-white/[0.02] border-b border-white/5 px-6 py-4">
                 <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Timestamp</span>
                 <span className="text-[10px] font-black uppercase tracking-widest text-white/30 col-span-2">Source / Reason</span>
                 <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Volume</span>
                 <span className="text-[10px] font-black uppercase tracking-widest text-white/30 text-right">Category</span>
              </div>

              {transactions.map((tx) => (
                <div key={tx.id} className="group hover:bg-white/[0.03] transition-all duration-300 px-6 py-5">
                  <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-4">
                    {/* Timestamp & Date */}
                    <div className="flex md:flex-col items-center md:items-start justify-between md:justify-start gap-2">
                       <div className="text-sm font-black text-white/90">
                         {format(new Date(tx.created_at), "MMM dd")}
                       </div>
                       <div className="flex items-center gap-1.5 text-[10px] text-white/30 font-bold uppercase tracking-tighter">
                         <Clock className="w-3 h-3" />
                         {format(new Date(tx.created_at), "HH:mm")}
                       </div>
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                       <p className="text-sm font-bold text-white/80 group-hover:text-blue-400 transition-colors">
                         {tx.description || tx.transaction_type}
                       </p>
                       <p className="text-[10px] text-white/20 font-medium uppercase tracking-widest mt-0.5">
                         Reference ID: {tx.id.slice(0, 8)}...
                       </p>
                    </div>

                    {/* Amount */}
                    <div className="flex items-center justify-between md:justify-start gap-4">
                       <div className={cn(
                         "text-xl font-black flex items-center gap-1.5",
                         tx.coins > 0 ? "text-emerald-400" : "text-rose-400"
                       )}>
                         {tx.coins > 0 ? "+" : ""}{tx.coins.toLocaleString()}
                         <span className="text-[10px] font-black opacity-40 uppercase tracking-tighter">Coins</span>
                       </div>
                       
                       {/* Mobile Type Indicator */}
                       <div className="md:hidden">
                         {getTransactionBadge(tx.source_type || tx.transaction_type)}
                       </div>
                    </div>

                    {/* Desktop Type Badge */}
                    <div className="hidden md:flex justify-end">
                       {getTransactionBadge(tx.source_type || tx.transaction_type)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CoinTransactionLog;