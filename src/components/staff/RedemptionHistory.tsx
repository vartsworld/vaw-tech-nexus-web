import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { History, Clock, CheckCircle, XCircle, Package } from "lucide-react";
import { format } from "date-fns";

interface Redemption {
  id: string;
  coins_spent: number;
  status: string;
  created_at: string;
  approved_at: string | null;
  rejection_reason: string | null;
  reward: {
    name?: string;
    title?: string;
    category: string;
    image_url: string | null;
  };
}

interface RedemptionHistoryProps {
  userId: string;
}

const RedemptionHistory = ({ userId }: RedemptionHistoryProps) => {
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchRedemptions();
    }
  }, [userId]);

  const fetchRedemptions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("reward_redemptions")
        .select(`
          *,
          reward:reward_catalog(name, category, image_url)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Retrying with legacy tables...");
        const { data: legacyData, error: legacyError } = await supabase
          .from("points_redemptions" as any)
          .select(`
            *,
            reward:rewards_catalog(title, category, image_url)
          `)
          .eq("user_id", userId)
          .order("redemption_date", { ascending: false });

        if (legacyError) throw legacyError;
        setRedemptions(legacyData || []);
      } else {
        setRedemptions(data || []);
      }
    } catch (error) {
      console.error("Error fetching redemptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
            <Package className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle>Redemption History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted/20 animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-lg bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Redemption History
        </CardTitle>
        <CardDescription>View your past redemption requests and their status</CardDescription>
      </CardHeader>
      <CardContent>
        {redemptions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <History className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>No redemptions yet</p>
            <p className="text-sm mt-2">Start redeeming your coins for exciting rewards!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {redemptions.map(redemption => (
              <div
                key={redemption.id}
                className="flex items-center gap-4 p-4 border border-border/50 rounded-xl hover:bg-muted/50 transition-colors bg-background/50"
              >
                {/* Reward Image */}
                <div className="w-16 h-16 bg-muted rounded-lg flex-shrink-0 overflow-hidden border border-border/50">
                  {redemption.reward.image_url ? (
                    <img
                      src={redemption.reward.image_url}
                      alt={redemption.reward.name || redemption.reward.title || 'Reward'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-foreground truncate">
                    {redemption.reward.name || redemption.reward.title || 'Reward'}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-muted-foreground font-medium">
                      {format(new Date(redemption.created_at), "MMM dd, yyyy")}
                    </span>
                    <span className="text-sm text-muted-foreground">•</span>
                    <span className="text-sm font-black text-primary">
                      {redemption.coins_spent.toLocaleString()} Coins
                    </span>
                  </div>
                  {redemption.rejection_reason && (
                    <p className="text-xs text-destructive mt-1">
                      Reason: {redemption.rejection_reason}
                    </p>
                  )}
                </div>

                {/* Status */}
                <div className="flex-shrink-0">
                  {getStatusBadge(redemption.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RedemptionHistory;
