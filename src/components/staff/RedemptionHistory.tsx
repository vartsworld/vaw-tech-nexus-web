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
      // Use points_redemptions with rewards_catalog as primary
      const { data, error } = await supabase
        .from("points_redemptions")
        .select(`
          id,
          points_spent,
          status,
          created_at,
          approved_at,
          rejection_reason,
          reward:rewards_catalog(title, category, image_url)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching redemptions:", error);
        setRedemptions([]);
      } else {
        // Map to expected format
        const mappedRedemptions = (data || []).map((r: any) => ({
          id: r.id,
          coins_spent: r.points_spent,
          status: r.status,
          created_at: r.created_at,
          approved_at: r.approved_at,
          rejection_reason: r.rejection_reason,
          reward: {
            name: r.reward?.title,
            title: r.reward?.title,
            category: r.reward?.category || 'other',
            image_url: r.reward?.image_url
          }
        }));
        setRedemptions(mappedRedemptions);
      }
    } catch (error) {
      console.error("Error fetching redemptions:", error);
      setRedemptions([]);
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
    <Card className="border-white/10 shadow-2xl bg-slate-900/40 backdrop-blur-2xl overflow-hidden rounded-[2.5rem] border">
      <CardHeader className="bg-gradient-to-br from-purple-500/10 to-transparent border-b border-white/5 p-6">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-3 text-xl font-black italic uppercase tracking-tighter text-white">
            <div className="p-2 bg-purple-500/20 rounded-2xl border border-purple-500/30">
              <History className="w-5 h-5 text-purple-400" />
            </div>
            Redemption History
          </CardTitle>
          <CardDescription className="text-white/40 font-medium text-[10px] uppercase tracking-widest">Tracking your reward acquisitions</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {redemptions.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-20 h-20 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-white/10" />
            </div>
            <p className="text-lg font-black uppercase tracking-tighter text-white/60">No Assets Claimed</p>
            <p className="text-xs text-white/20 font-medium max-w-[200px] mx-auto mt-1">Start converting your coins into high-value rewards.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {redemptions.map(redemption => (
              <div
                key={redemption.id}
                className="group flex items-center gap-4 p-5 bg-white/[0.02] border border-white/5 rounded-3xl hover:bg-white/[0.04] transition-all"
              >
                {/* Reward Image */}
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex-shrink-0 overflow-hidden border border-white/10 group-hover:border-purple-500/30 transition-colors">
                  {redemption.reward.image_url ? (
                    <img
                      src={redemption.reward.image_url}
                      alt={redemption.reward.name || redemption.reward.title || 'Reward'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-white/10" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-white/90 truncate text-sm uppercase tracking-tight">
                    {redemption.reward.name || redemption.reward.title || 'Reward'}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-[10px] text-white/30 font-black uppercase tracking-widest">
                      {format(new Date(redemption.created_at), "MMM dd")}
                    </span>
                    <span className="text-white/10 text-[10px]">•</span>
                    <span className="text-xs font-black text-emerald-400">
                      {redemption.coins_spent.toLocaleString()} <span className="text-[8px] opacity-60">COINS</span>
                    </span>
                  </div>
                  {redemption.rejection_reason && (
                    <div className="mt-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                      <p className="text-[10px] text-rose-400 font-bold">
                        Reason: {redemption.rejection_reason}
                      </p>
                    </div>
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
