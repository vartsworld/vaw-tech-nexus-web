import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Clock, Package, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Redemption {
  id: string;
  user_id: string;
  points_spent: number;
  status: string;
  redemption_date: string;
  delivery_address: string | null;
  rejection_reason: string | null;
  reward: {
    title: string;
    category: string;
    image_url: string | null;
  };
  user: {
    full_name: string;
    email: string;
  };
}

const RedemptionApprovals = () => {
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [selectedRedemption, setSelectedRedemption] = useState<Redemption | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [action, setAction] = useState<"approve" | "reject" | "complete" | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRedemptions();
  }, []);

  const fetchRedemptions = async () => {
    const { data, error } = await supabase
      .from("points_redemptions")
      .select(`
        *,
        reward:rewards_catalog(title, category, image_url),
        user:staff_profiles!points_redemptions_user_id_fkey(full_name, email)
      `)
      .order("redemption_date", { ascending: false });

    if (error) {
      toast.error("Failed to load redemptions");
      return;
    }
    setRedemptions(data || []);
  };

  const handleAction = (redemption: Redemption, actionType: "approve" | "reject" | "complete") => {
    setSelectedRedemption(redemption);
    setAction(actionType);
    setNotes("");
    setDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedRedemption || !action) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updateData: any = {
        approved_by: user.id,
        approved_at: new Date().toISOString()
      };

      if (action === "approve") {
        updateData.status = "approved";
      } else if (action === "reject") {
        updateData.status = "rejected";
        updateData.rejection_reason = notes;

        // Refund points
        const { data: profile } = await supabase
          .from("staff_profiles")
          .select("total_points")
          .eq("user_id", selectedRedemption.user_id)
          .maybeSingle();

        if (profile) {
          await supabase
            .from("staff_profiles")
            .update({ total_points: profile.total_points + selectedRedemption.points_spent })
            .eq("user_id", selectedRedemption.user_id);

          // Log refund
          await supabase
            .from("user_points_log")
            .insert({
              user_id: selectedRedemption.user_id,
              points: selectedRedemption.points_spent,
              reason: "Redemption refund: " + notes,
              category: "refund"
            });
        }
      } else if (action === "complete") {
        updateData.status = "completed";
        updateData.completion_notes = notes;
      }

      const { error } = await supabase
        .from("points_redemptions")
        .update(updateData)
        .eq("id", selectedRedemption.id);

      if (error) throw error;

      toast.success(`Redemption ${action}d successfully`);
      fetchRedemptions();
      setDialogOpen(false);
    } catch (error) {
      console.error("Error processing redemption:", error);
      toast.error("Failed to process redemption");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-orange-500/10 text-orange-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="secondary" className="bg-green-500/10 text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case "completed":
        return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600"><Package className="w-3 h-3 mr-1" />Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const pendingCount = redemptions.filter(r => r.status === "pending").length;
  const approvedCount = redemptions.filter(r => r.status === "approved").length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Redemption Requests</h3>
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-orange-500/10 text-orange-600">
            {pendingCount} Pending
          </Badge>
          <Badge variant="secondary" className="bg-green-500/10 text-green-600">
            {approvedCount} Approved
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        {redemptions.map(redemption => (
          <Card key={redemption.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                {/* Reward Image */}
                <div className="w-16 h-16 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                  {redemption.reward.image_url ? (
                    <img src={redemption.reward.image_url} alt={redemption.reward.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-base break-words">{redemption.reward.title}</h4>
                      <div className="flex items-center flex-wrap gap-1.5 mt-1 text-xs text-muted-foreground">
                        <User className="w-3 h-3 flex-shrink-0" />
                        <span className="font-medium text-foreground">{redemption.user?.full_name || 'Staff Member'}</span>
                        <span>•</span>
                        <span className="truncate max-w-[200px]">{redemption.user?.email || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">{getStatusBadge(redemption.status)}</div>
                  </div>

                  <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm mt-2">
                    <span className="text-muted-foreground">
                      {format(new Date(redemption.redemption_date), "MMM dd, yyyy HH:mm")}
                    </span>
                    <span className="font-semibold text-primary">
                      {redemption.points_spent.toLocaleString()} points
                    </span>
                  </div>

                  {redemption.delivery_address && (
                    <div className="mt-2 text-xs sm:text-sm bg-muted/30 p-2 rounded border border-border/40 break-words">
                      <span className="text-muted-foreground font-medium">Delivery Address: </span>
                      <span className="break-words">{redemption.delivery_address}</span>
                    </div>
                  )}

                  {redemption.rejection_reason && (
                    <div className="mt-2 text-xs sm:text-sm text-destructive bg-destructive/10 p-2 rounded border border-destructive/20 break-words">
                      <span className="font-semibold">Rejection Reason: </span>
                      <span className="break-words">{redemption.rejection_reason}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col gap-2 flex-shrink-0 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 mt-2 sm:mt-0">
                  {redemption.status === "pending" && (
                    <>
                      <Button size="sm" variant="default" onClick={() => handleAction(redemption, "approve")} className="flex-1 sm:flex-initial">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleAction(redemption, "reject")} className="flex-1 sm:flex-initial">
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                  {redemption.status === "approved" && (
                    <Button size="sm" variant="default" onClick={() => handleAction(redemption, "complete")} className="w-full sm:w-auto">
                      <Package className="w-4 h-4 mr-1" />
                      Mark Complete
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {redemptions.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>No redemption requests yet</p>
          </div>
        )}
      </div>

      {/* Action Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "approve" && "Approve Redemption"}
              {action === "reject" && "Reject Redemption"}
              {action === "complete" && "Complete Redemption"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedRedemption && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="font-semibold">{selectedRedemption.reward.title}</p>
                <p className="text-sm text-muted-foreground">{selectedRedemption.user.full_name}</p>
                <p className="text-sm font-semibold text-primary mt-1">
                  {selectedRedemption.points_spent.toLocaleString()} points
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">
                {action === "reject" ? "Rejection Reason *" : "Notes (optional)"}
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={action === "reject" ? "Explain why this redemption is being rejected..." : "Add any additional notes..."}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={loading || (action === "reject" && !notes.trim())}
              variant={action === "reject" ? "destructive" : "default"}
            >
              {loading ? "Processing..." : `Confirm ${action}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RedemptionApprovals;
