import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Coins, TrendingUp, TrendingDown, Award } from "lucide-react";

interface PointsBalanceProps {
  points: number;
  userId: string;
}

const PointsBalance = ({ points, userId }: PointsBalanceProps) => {
  const [lifetimeEarned, setLifetimeEarned] = useState(0);
  const [totalRedeemed, setTotalRedeemed] = useState(0);

  useEffect(() => {
    fetchPointsStats();
  }, [userId]);

  const fetchPointsStats = async () => {
    if (!userId) return;

    try {
      // Get lifetime earned (positive transactions)
      const { data: earnedData } = await supabase
        .from("user_points_log")
        .select("points")
        .eq("user_id", userId)
        .gt("points", 0);

      const earned = earnedData?.reduce((sum, log) => sum + log.points, 0) || 0;
      setLifetimeEarned(earned);

      // Get total redeemed (negative transactions)
      const { data: redeemedData } = await supabase
        .from("user_points_log")
        .select("points")
        .eq("user_id", userId)
        .lt("points", 0);

      const redeemed = Math.abs(redeemedData?.reduce((sum, log) => sum + log.points, 0) || 0);
      setTotalRedeemed(redeemed);
    } catch (error) {
      console.error("Error fetching points stats:", error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Current Balance */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-lg hover:shadow-xl transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Current Balance</p>
              <h3 className="text-4xl font-bold text-primary flex items-center gap-2">
                <Coins className="w-8 h-8" />
                {points.toLocaleString()}
              </h3>
              <p className="text-xs text-muted-foreground mt-2">Available for redemption</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lifetime Earned */}
      <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Lifetime Earned</p>
              <h3 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-green-500" />
                {lifetimeEarned.toLocaleString()}
              </h3>
              <p className="text-xs text-muted-foreground mt-2">Total points earned</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Redeemed */}
      <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Redeemed</p>
              <h3 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Award className="w-6 h-6 text-orange-500" />
                {totalRedeemed.toLocaleString()}
              </h3>
              <p className="text-xs text-muted-foreground mt-2">Points spent on rewards</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PointsBalance;
