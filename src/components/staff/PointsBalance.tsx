import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Coins, TrendingUp, Award, CheckCircle2, Calendar, Gamepad2, Gift, LayoutPanelLeft } from "lucide-react";

interface PointsBalanceProps {
  points: number;
  userId: string;
}

interface CategoryTotal {
  type: string;
  total: number;
  icon: any;
  color: string;
}

const PointsBalance = ({ points, userId }: PointsBalanceProps) => {
  const [lifetimeEarned, setLifetimeEarned] = useState(0);
  const [totalRedeemed, setTotalRedeemed] = useState(0);
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);

  useEffect(() => {
    fetchPointsStats();
  }, [userId]);

  const fetchPointsStats = async () => {
    if (!userId) return;

    try {
      // Get all transactions to calculate totals and breakdown
      const { data: txData, error: txError } = await supabase
        .from("user_coin_transactions")
        .select("coins, source_type")
        .eq("user_id", userId);

      if (txError) {
        console.error("Error fetching transactions:", txError);
        return;
      }

      let earned = 0;
      let redeemed = 0;
      const categories: Record<string, number> = {
        task: 0,
        attendance: 0,
        game: 0,
        bonus: 0,
        other: 0,
      };

      txData?.forEach(tx => {
        if (tx.coins > 0) {
          earned += tx.coins;
          const type = tx.source_type || 'other';
          if (categories[type] !== undefined) {
            categories[type] += tx.coins;
          } else {
            categories.other += tx.coins;
          }
        } else {
          redeemed += Math.abs(tx.coins);
        }
      });

      setLifetimeEarned(earned);
      setTotalRedeemed(redeemed);

      const formattedCategories: CategoryTotal[] = [
        { type: "Tasks", total: categories.task, icon: CheckCircle2, color: "text-blue-500" },
        { type: "Attendance", total: categories.attendance, icon: Calendar, color: "text-green-500" },
        { type: "Games", total: categories.game, icon: Gamepad2, color: "text-purple-500" },
        { type: "Bonuses", total: categories.bonus, icon: Gift, color: "text-amber-500" },
        { type: "Others", total: categories.other, icon: LayoutPanelLeft, color: "text-gray-500" },
      ].filter(cat => cat.total > 0);

      setCategoryTotals(formattedCategories);
    } catch (error) {
      console.error("Error fetching coin stats:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Balance */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/20 via-primary/5 to-background shadow-lg hover:shadow-xl transition-all duration-300 border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-primary/70 uppercase tracking-wider mb-1">Current Balance</p>
                <h3 className="text-4xl font-black text-primary flex items-center gap-2">
                  <Coins className="w-8 h-8 animate-pulse" />
                  {points.toLocaleString()}
                </h3>
                <p className="text-[10px] text-muted-foreground mt-2 font-medium">AVAILABLE FOR IMMEDIATE REDEMPTION</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lifetime Earned */}
        <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow bg-card/50 backdrop-blur-sm text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Lifetime Earned</p>
                <h3 className="text-3xl font-black text-white flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                  {lifetimeEarned.toLocaleString()}
                </h3>
                <p className="text-[10px] text-muted-foreground mt-2 font-medium">TOTAL WEALTH ACCUMULATED</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Redeemed */}
        <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow bg-card/50 backdrop-blur-sm text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Redeemed</p>
                <h3 className="text-3xl font-black text-white flex items-center gap-2">
                  <Award className="w-6 h-6 text-orange-500" />
                  {totalRedeemed.toLocaleString()}
                </h3>
                <p className="text-[10px] text-muted-foreground mt-2 font-medium">REWARDS UNLOCKED TO DATE</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Individual Points Breakdown */}
      {categoryTotals.length > 0 && (
        <Card className="border-border/50 shadow-lg bg-card/30 backdrop-blur-md overflow-hidden text-white">
          <CardHeader className="py-4 bg-muted/20">
            <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
              <LayoutPanelLeft className="w-4 h-4" />
              Individual Earnings Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 divide-x divide-y md:divide-y-0 border-t border-border/50">
              {categoryTotals.map((cat, idx) => (
                <div key={idx} className="p-4 flex flex-col items-center justify-center text-center hover:bg-muted/30 transition-colors">
                  <cat.icon className={`w-5 h-5 mb-2 ${cat.color}`} />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">{cat.type}</p>
                  <p className="text-lg font-black text-white">{cat.total.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PointsBalance;
