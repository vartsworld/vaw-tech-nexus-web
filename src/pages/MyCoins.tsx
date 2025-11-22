import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Coins, TrendingUp, Gift, Award } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import PointsBalance from "@/components/staff/PointsBalance";
import RewardCard from "@/components/staff/RewardCard";
import RedemptionHistory from "@/components/staff/RedemptionHistory";

interface Reward {
  id: string;
  title: string;
  description: string;
  category: string;
  points_cost: number;
  monetary_value: number | null;
  image_url: string | null;
  stock_quantity: number | null;
  redemption_limit: number | null;
  terms_conditions: string | null;
}

const MyCoins = () => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    fetchUserData();
    fetchRewards();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const { data: profile } = await supabase
        .from("staff_profiles")
        .select("total_points")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setUserPoints(profile.total_points || 0);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load user data");
    }
  };

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("rewards_catalog")
        .select("*")
        .eq("is_active", true)
        .order("points_cost", { ascending: true });

      if (error) throw error;
      setRewards(data || []);
    } catch (error) {
      console.error("Error fetching rewards:", error);
      toast.error("Failed to load rewards");
    } finally {
      setLoading(false);
    }
  };

  const handleRedemption = async (rewardId: string, pointsCost: number) => {
    if (userPoints < pointsCost) {
      toast.error("Insufficient points!");
      return;
    }

    try {
      // Create redemption request
      const { error: redemptionError } = await supabase
        .from("points_redemptions")
        .insert({
          user_id: userId,
          reward_id: rewardId,
          points_spent: pointsCost,
          status: "pending"
        });

      if (redemptionError) throw redemptionError;

      // Deduct points
      const { error: updateError } = await supabase
        .from("staff_profiles")
        .update({ total_points: userPoints - pointsCost })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      // Log transaction
      await supabase
        .from("user_points_log")
        .insert({
          user_id: userId,
          points: -pointsCost,
          reason: "Points redemption",
          category: "redemption"
        });

      toast.success("🎉 Redemption request submitted! Awaiting HR approval.");
      setUserPoints(userPoints - pointsCost);
    } catch (error) {
      console.error("Error redeeming reward:", error);
      toast.error("Failed to redeem reward");
    }
  };

  const filteredRewards = activeCategory === "all" 
    ? rewards 
    : rewards.filter(r => r.category === activeCategory);

  const categories = [
    { value: "all", label: "All Rewards", icon: Gift },
    { value: "salary_perk", label: "Salary Perks", icon: TrendingUp },
    { value: "bonus", label: "Bonuses", icon: Award },
    { value: "merchandise", label: "Merchandise", icon: Gift },
    { value: "benefits", label: "Benefits", icon: Award },
    { value: "other", label: "Other", icon: Gift }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Coins className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Coins</h1>
            <p className="text-muted-foreground">Redeem your hard-earned points for amazing rewards</p>
          </div>
        </div>

        {/* Points Balance */}
        <PointsBalance points={userPoints} userId={userId} />

        {/* Rewards Catalog */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Rewards Catalog
            </CardTitle>
            <CardDescription>Browse and redeem exciting rewards with your points</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeCategory} onValueChange={setActiveCategory}>
              <TabsList className="grid w-full grid-cols-6 mb-6">
                {categories.map(cat => (
                  <TabsTrigger key={cat.value} value={cat.value} className="gap-2">
                    <cat.icon className="w-4 h-4" />
                    {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={activeCategory} className="mt-6">
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="h-64 bg-muted/20 animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : filteredRewards.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Gift className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>No rewards available in this category</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRewards.map(reward => (
                      <RewardCard
                        key={reward.id}
                        reward={reward}
                        userPoints={userPoints}
                        onRedeem={handleRedemption}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Redemption History */}
        <RedemptionHistory userId={userId} />
      </div>
    </div>
  );
};

export default MyCoins;
