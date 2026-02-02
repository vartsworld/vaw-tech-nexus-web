import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpRight, ArrowDownRight, History, Loader2 } from "lucide-react";
import { format } from "date-fns";

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
        .limit(50);

      if (error) {
        console.error("Error fetching transactions:", error);
        setTransactions([]);
      } else {
        setTransactions(data || []);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (coins: number) => {
    return coins > 0 ? (
      <ArrowUpRight className="w-4 h-4 text-green-500" />
    ) : (
      <ArrowDownRight className="w-4 h-4 text-red-500" />
    );
  };

  const getTransactionBadge = (type: string) => {
    const badgeStyles: Record<string, string> = {
      earning: "bg-green-500/10 text-green-600 border-green-500/20",
      redemption: "bg-red-500/10 text-red-600 border-red-500/20",
      bonus: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      task: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      attendance: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      game: "bg-pink-500/10 text-pink-600 border-pink-500/20",
    };

    return (
      <Badge variant="outline" className={badgeStyles[type] || "bg-muted"}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Coin Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-lg bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Coin Transaction History
        </CardTitle>
        <CardDescription>Track all your coin earnings and spending</CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <History className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>No transactions yet</p>
            <p className="text-sm mt-2">Complete tasks to start earning coins!</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 border border-border/50 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${tx.coins > 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    {getTransactionIcon(tx.coins)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {tx.description || tx.transaction_type}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(tx.created_at), "MMM dd, yyyy HH:mm")}
                      </span>
                      {tx.source_type && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          {getTransactionBadge(tx.source_type || tx.transaction_type)}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className={`font-bold text-lg ${tx.coins > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {tx.coins > 0 ? '+' : ''}{tx.coins.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CoinTransactionLog;