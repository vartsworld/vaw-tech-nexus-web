import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      const { data, error } = await supabase
        .from("user_coin_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error fetching transactions:", error);
        setTransactions([]);
      } else {
        setTransactions((data || []).map((d: any) => ({ ...d, description: d.reason || d.description || null })));
      }
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
      redemption: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      bonus: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      task: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
      attendance: "bg-sky-500/10 text-sky-500 border-sky-500/20",
      game: "bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20",
    };

    return (
      <Badge variant="outline" className={cn("font-bold text-[10px] uppercase tracking-tighter", badgeStyles[type] || "bg-muted")}>
        {type.replace("_", " ")}
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
    <Card className="border-primary/20 shadow-2xl bg-black/40 backdrop-blur-2xl overflow-hidden border-2">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-transparent to-transparent border-b border-white/10 py-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 text-2xl font-black italic uppercase tracking-tighter text-white">
              <div className="p-2 bg-primary/20 rounded-xl border border-primary/30">
                <History className="w-6 h-6 text-primary" />
              </div>
              Transaction Logs
            </CardTitle>
            <CardDescription className="text-muted-foreground font-medium mt-1">Detailed audit trail of your digital assets</CardDescription>
          </div>
          <Badge className="bg-primary/20 text-primary border-primary/30 font-black">{transactions.length} ENTRIES</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Task / Description</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount Earned</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Time</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 opacity-20">
                      <History className="w-20 h-20" />
                      <p className="text-xl font-bold uppercase tracking-widest">No Records Found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="group hover:bg-primary/5 transition-all duration-300">
                    <td className="px-6 py-5">
                      <div className="text-sm font-bold text-white">
                        {format(new Date(tx.created_at), "MMM dd, yyyy")}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-medium uppercase mt-0.5">
                        {format(new Date(tx.created_at), "EEEE")}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {tx.description || tx.transaction_type}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <div className={cn(
                        "text-lg font-black flex items-center gap-1",
                        tx.coins > 0 ? "text-emerald-500" : "text-rose-500"
                      )}>
                        {tx.coins > 0 ? "+" : ""}{tx.coins.toLocaleString()}
                        <span className="text-[10px] opacity-70">COINS</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        {format(new Date(tx.created_at), "HH:mm:ss")}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {getTransactionBadge(tx.source_type || tx.transaction_type)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CoinTransactionLog;