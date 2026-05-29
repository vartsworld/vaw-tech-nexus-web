
import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins, History, TrendingUp, Award, Clock, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

interface Transaction {
  id: string;
  coins: number;
  transaction_type: string;
  reason: string | null;
  source_type: string | null;
  created_at: string;
}

interface CoinPopupProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userProfile?: any;
}

const CoinPopup = ({ isOpen, onOpenChange, userId, userProfile }: CoinPopupProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(userProfile?.total_points || 0);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && userId) {
      fetchData();
    }
  }, [isOpen, userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch latest profile points
      const { data: profile } = await supabase
        .from('staff_profiles')
        .select('total_points')
        .eq('user_id', userId)
        .single();
      
      if (profile) setTotalPoints(profile.total_points || 0);

      // Fetch latest 50 transactions for better tracking
      const { data: txData, error: txError } = await supabase
        .from("user_coin_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (txError) throw txError;
      setTransactions(txData || []);
    } catch (error) {
      console.error("Error fetching coin data:", error);
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
    };

    return (
      <Badge variant="outline" className={cn("text-[9px] uppercase font-bold px-1.5 py-0 whitespace-nowrap", badgeStyles[type] || "bg-muted")}>
        {type.replace(/_/g, " ")}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md h-[600px] p-0 flex flex-col overflow-hidden bg-zinc-950 border-white/10 backdrop-blur-2xl shadow-2xl">
        <DialogHeader className="p-6 bg-gradient-to-br from-primary/10 via-transparent to-transparent border-b border-white/5 shrink-0">
          <DialogTitle className="text-2xl font-black text-white flex items-center gap-3 italic tracking-tighter">
            <div className="p-2 bg-primary/20 rounded-xl border border-primary/30">
              <Coins className="w-6 h-6 text-primary" />
            </div>
            VAW COINS
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6 flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Total Balance Card */}
          <Card className="bg-gradient-to-br from-amber-500/20 via-amber-500/5 to-transparent border-amber-500/20 overflow-hidden shrink-0">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500/70">Available Coins</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white tracking-tighter">{totalPoints.toLocaleString()}</span>
                  <span className="text-xs font-bold text-amber-500/50 uppercase">Credits</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20">
                <Coins className="w-6 h-6 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 shrink-0">
              <History className="w-3 h-3" />
              Recent Activity
            </h3>

            <ScrollArea className="flex-1 pr-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Syncing...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 opacity-40 border-2 border-dashed border-white/5 rounded-2xl">
                  <History className="w-12 h-12 mb-2 text-muted-foreground" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">No Records Found</p>
                  <p className="text-[8px] font-medium text-muted-foreground/60 mt-1 uppercase tracking-tight">Transactions will appear here after your next activity</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/[0.08] transition-all group relative overflow-hidden">
                      <div className="relative z-10">
                        {/* Time & Date Header */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] text-muted-foreground font-black uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="w-2.5 h-2.5 text-primary/50" />
                            {format(new Date(tx.created_at), "hh:mm a EEEE dd/MM/yyyy")}
                          </span>
                          {getTransactionBadge(tx.source_type || tx.transaction_type)}
                        </div>

                        {/* Activity & Coin Route */}
                        <div className="flex items-baseline justify-between gap-4">
                          <p className="text-xs font-bold text-white group-hover:text-primary transition-colors leading-tight">
                            {tx.reason || tx.transaction_type}
                          </p>
                          <div className={cn(
                            "text-sm font-black italic shrink-0",
                            tx.coins > 0 ? "text-emerald-400" : tx.coins < 0 ? "text-rose-400" : "text-white/40"
                          )}>
                            {tx.coins > 0 ? "+" : ""}{tx.coins.toLocaleString()} COIN
                          </div>
                        </div>
                      </div>
                      
                      {/* Subtle background glow for transactions */}
                      <div className={cn(
                        "absolute -right-4 -top-4 w-12 h-12 blur-2xl opacity-10 rounded-full",
                        tx.coins > 0 ? "bg-emerald-500" : "bg-rose-500"
                      )} />
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <Button 
            onClick={() => {
              navigate('/mycoins');
              onOpenChange(false);
            }}
            className="w-full shrink-0 bg-white/5 hover:bg-white/10 text-white border border-white/10 h-11 font-black italic uppercase tracking-tighter group group mb-2"
          >
            Open Transaction Vault
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CoinPopup;
