import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Coins, TrendingUp, Gift, Award, ArrowLeft, Loader2, History, Package } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PointsBalance from "@/components/staff/PointsBalance";
import RewardCard from "@/components/staff/RewardCard";
import RedemptionHistory from "@/components/staff/RedemptionHistory";
import CoinTransactionLog from "@/components/staff/CoinTransactionLog";
import { Badge } from "@/components/ui/badge";

interface Reward {
  id: string;
  name: string;
  description: string;
  category: string;
  coin_cost: number;
  monetary_value: number | null;
  image_url: string | null;
  stock_quantity: number | null;
  redemption_limit: number | null;
  terms_conditions: string | null;
}

const MyCoins = () => {
  const navigate = useNavigate();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userCoins, setUserCoins] = useState(0);
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
      if (!user) {
        navigate("/staff/login");
        return;
      }

      setUserId(user.id);

      // Fetch user profile for coin balance
      const { data: profileData, error: profileError } = await supabase
        .from("staff_profiles")
        .select("total_points, full_name")
        .eq("user_id", user.id)
        .single();

      if (profileError) throw profileError;
      
      setUserCoins(profileData?.total_points || 0);

    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load user coin balance");
    } finally {
      setLoading(false);
    }
  };

  const fetchRewards = async () => {
    try {
      // Use rewards_catalog as the primary table (has proper data)
      const { data, error } = await supabase
        .from("rewards_catalog")
        .select("id, title, description, category, points_cost, monetary_value, image_url, stock_quantity, redemption_limit, terms_conditions, is_active")
        .eq("is_active", true)
        .order("points_cost", { ascending: true });

      if (error) {
        console.error("Error fetching rewards:", error);
        setRewards([]);
        return;
      }
      
      // Map to expected interface format
      const mappedRewards = (data || []).map(r => ({
        id: r.id,
        name: r.title,
        description: r.description || '',
        category: r.category,
        coin_cost: r.points_cost,
        monetary_value: r.monetary_value,
        image_url: r.image_url,
        stock_quantity: r.stock_quantity,
        redemption_limit: r.redemption_limit,
        terms_conditions: r.terms_conditions
      }));
      
      setRewards(mappedRewards);
    } catch (error) {
      console.error("Error fetching rewards:", error);
      setRewards([]);
    }
  };

  const handleRedeem = async (rewardId: string, coinsCost: number) => {
    if (!userId) return;

    try {
      // 1. Create redemption request using points_redemptions table
      const { error: redemptionError } = await supabase
        .from("points_redemptions")
        .insert({
          user_id: userId,
          reward_id: rewardId,
          points_spent: coinsCost,
          status: "pending"
        });

      if (redemptionError) throw redemptionError;

      // 2. Log transaction
      const { error: transactionError } = await supabase
        .from("user_coin_transactions")
        .insert({
          user_id: userId,
          coins: -coinsCost,
          transaction_type: "redemption",
          description: `Redeemed reward: ${rewards.find(r => r.id === rewardId)?.name || 'Reward'}`,
          source_type: "redemption"
        });

      if (transactionError) throw transactionError;

      // 3. Update staff profile
      const { error: profileUpdateError } = await supabase
        .from("staff_profiles")
        .update({ total_points: userCoins - coinsCost })
        .eq("user_id", userId);

      if (profileUpdateError) throw profileUpdateError;

      // 4. Update local state
      setUserCoins(prev => prev - coinsCost);

      toast.success("🎉 Redemption requested! Awaiting approval.");
      
      // Refresh data
      fetchUserData();
      fetchRewards();
    } catch (error: any) {
      console.error("Error during redemption:", error);
      toast.error(error.message || "Failed to process redemption");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => navigate("/staff/dashboard")}
              className="rounded-full hover:bg-primary/10 border-primary/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
                <Coins className="w-10 h-10 text-primary animate-pulse" />
                VAW Coin Economy
              </h1>
              <p className="text-muted-foreground font-medium">
                Your performance, rewarded. Redeem coins for exclusive perks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-muted/30 p-2 rounded-2xl border border-border/50 backdrop-blur-sm">
            <div className="px-6 py-2 bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl border border-primary/20">
              <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Your Balance</p>
              <p className="text-3xl font-black text-primary">{userCoins.toLocaleString()} <span className="text-sm font-bold opacity-70">Coins</span></p>
            </div>
          </div>
        </div>

        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <TabsList className="bg-muted/50 p-1 border border-border/50 h-auto flex-wrap">
              {categories.map(cat => (
                <TabsTrigger key={cat.value} value={cat.value} className="gap-2 py-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <cat.icon className="w-4 h-4" />
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="gap-2 text-muted-foreground" onClick={() => fetchRewards()}>
                <History className="w-4 h-4" />
                History
              </Button>
            </div>
          </div>

          <TabsContent value={activeCategory} className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Stats Cards */}
            <PointsBalance points={userCoins} userId={userId || ""} />

            {/* Catalog Grid */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Package className="w-6 h-6 text-primary" />
                  Available Rewards
                </h2>
                <Badge variant="outline" className="text-muted-foreground">
                  {filteredRewards.length} Items Found
                </Badge>
              </div>

              {filteredRewards.length === 0 ? (
                <div className="text-center py-24 bg-muted/10 border-4 border-dashed border-border/50 rounded-3xl">
                  <Gift className="w-20 h-20 mx-auto mb-4 opacity-10" />
                  <h3 className="text-2xl font-bold text-muted-foreground">No rewards found</h3>
                  <p className="text-muted-foreground">Check back later or try a different category.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {filteredRewards.map((reward) => (
                    <RewardCard
                      key={reward.id}
                      reward={reward}
                      userPoints={userCoins}
                      onRedeem={handleRedeem}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Coin Transaction Log Section */}
        <div className="pt-12 border-t border-border/50">
          <CoinTransactionLog userId={userId || ""} />
        </div>

        {/* Redemption History Section */}
        <div className="pt-12 border-t border-border/50">
          <RedemptionHistory userId={userId || ""} />
        </div>
      </div>
    </div>
  );
};

export default MyCoins;
