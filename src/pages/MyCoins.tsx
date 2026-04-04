
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Coins, History, Gift, Award, ArrowLeft, Loader2, Package, TrendingUp, Filter } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("dashboard");

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

      // Fetch user profile for latest total_points
      const { data: profile } = await supabase
        .from("staff_profiles")
        .select("total_points")
        .eq("user_id", user.id)
        .single();
      
      if (profile) {
        setUserCoins(profile.total_points || 0);
      } else {
        // Fallback to transaction calculation only if profile fails
        const { data: txData } = await supabase
          .from("user_coin_transactions")
          .select("coins")
          .eq("user_id", user.id);
        
        const calculatedBalance = txData?.reduce((sum, tx) => sum + tx.coins, 0) || 0;
        setUserCoins(calculatedBalance);
      }

    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load user coin balance");
    } finally {
      setLoading(false);
    }
  };

  const fetchRewards = async () => {
    try {
      const { data, error } = await supabase
        .from("rewards_catalog")
        .select("*")
        .eq("is_active", true)
        .order("points_cost", { ascending: true });

      if (error) throw error;

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
    }
  };

  const handleRedeem = async (rewardId: string, coinsCost: number) => {
    if (!userId) return;

    try {
      // 1. Create redemption request
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
          transaction_type: "earning",
          reason: `Redeemed reward: ${rewards.find(r => r.id === rewardId)?.name || 'Reward'}`,
          source_type: "redemption"
        } as any);

      if (transactionError) throw transactionError;

      // Trigger will update profile points automatically
      setUserCoins(prev => prev - coinsCost);
      toast.success("🎉 Redemption requested! Awaiting approval.");
      fetchUserData();
    } catch (error: any) {
      console.error("Error during redemption:", error);
      toast.error(error.message || "Failed to process redemption");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8 selection:bg-primary/30">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
        {/* Navigation & Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/5 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 min-w-0">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-xl border-white/10 hover:bg-white/5 h-10 w-10 sm:h-12 sm:w-12 shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black italic tracking-tighter text-white uppercase flex flex-wrap items-center gap-x-3 gap-y-1 sm:gap-3 leading-none">
                <div className="p-1.5 sm:p-2 bg-primary/20 rounded-xl sm:rounded-2xl border border-primary/30 shrink-0">
                  <Coins className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                </div>
                <span>Vault Dashboard</span>
              </h1>
              <p className="text-muted-foreground font-bold text-[10px] sm:text-xs tracking-widest uppercase opacity-60 mt-2">
                Performance Assets & Legacy Rewards
              </p>
            </div>
          </div>

          <Card className="bg-gradient-to-br from-primary/20 via-transparent to-transparent border-primary/20 shadow-2xl backdrop-blur-xl shrink-0 w-full lg:w-auto">
            <CardContent className="p-4 flex items-center justify-between lg:justify-end gap-6 text-white text-white">
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Your Net Wealth</p>
                <div className="flex items-baseline gap-1 lg:justify-end">
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-white italic tracking-tighter">
                    {userCoins.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold opacity-30 not-italic uppercase">COINS</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-zinc-900/50 p-1 border border-white/5 h-auto grid grid-cols-2 mb-8 glass-effect rounded-2xl max-w-md mx-auto sm:mx-0">
            <TabsTrigger value="dashboard" className="gap-2 py-3 px-6 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black italic uppercase tracking-tighter transition-all">
              <TrendingUp className="w-4 h-4" />
              Vault Dashboard
            </TabsTrigger>
            <TabsTrigger value="rewards" className="gap-2 py-3 px-6 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black italic uppercase tracking-tighter transition-all">
              <Gift className="w-4 h-4" />
              Rewards Catalog
            </TabsTrigger>
          </TabsList>

          {/* DASHBOARD TAB */}
          <TabsContent value="dashboard" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <CoinTransactionLog userId={userId || ""} />
                <RedemptionHistory userId={userId || ""} />
              </div>
              <div className="space-y-8">
                <PointsBalance points={userCoins} userId={userId || ""} />
                <Card className="bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20">
                  <CardHeader>
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-indigo-400">Wealth Tip</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground font-medium italic">
                    "Earn more coins by completing tasks early. You get a +1 coin bonus for every mission finished before the deadline!"
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* REWARDS TAB */}
          <TabsContent value="rewards" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h2 className="text-2xl font-black italic flex items-center gap-2 text-white tracking-tight uppercase">
                  <Package className="w-6 h-6 text-primary" />
                  Inventory
                </h2>
                <Badge variant="outline" className="text-muted-foreground font-black tracking-widest bg-white/5 border-white/10 px-3 py-1">
                  {rewards.length} ITEMS AVAILABLE
                </Badge>
              </div>

              {rewards.length === 0 ? (
                <div className="text-center py-32 bg-white/5 border-2 border-dashed border-white/5 rounded-[2.5rem]">
                  <Gift className="w-20 h-20 mx-auto mb-6 opacity-5 animate-bounce" />
                  <h3 className="text-xl font-black text-muted-foreground uppercase italic tracking-tighter">Inventory Dry</h3>
                  <p className="text-muted-foreground font-medium text-sm">Check back later for new reward shipments.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {rewards.map((reward) => (
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
      </div>
    </div>
  );
};

export default MyCoins;
