import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Coins, Package, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Reward {
  id: string;
  name: string;
  description: string;
  category: string;
  coin_cost: number;
  monetary_value: number | null;
  terms_conditions: string | null;
}

interface RedemptionDialogProps {
  open: boolean;
  onClose: () => void;
  reward: Reward;
  userPoints: number;
  onConfirm: () => Promise<void>;
}

const RedemptionDialog = ({ open, onClose, reward, userPoints, onConfirm }: RedemptionDialogProps) => {
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const needsAddress = reward.category === "merchandise";
  const remainingPoints = userPoints - reward.coin_cost;

  const handleConfirm = async () => {
    if (needsAddress && !deliveryAddress.trim()) {
      toast.error("Please enter delivery address");
      return;
    }

    setLoading(true);
    try {
      await onConfirm();
      onClose();
      setDeliveryAddress("");
    } catch (error) {
      console.error("Redemption error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            Confirm Redemption
          </DialogTitle>
          <DialogDescription>
            Review your redemption details before confirming
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Reward Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{reward.name}</h4>
                <p className="text-sm text-muted-foreground mt-1">{reward.description}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-border/50 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Coins Cost:</span>
                <span className="font-bold text-primary flex items-center gap-1">
                  <Coins className="w-4 h-4" />
                  {reward.coin_cost.toLocaleString()}
                </span>
              </div>
              {reward.monetary_value && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Value:</span>
                  <span className="font-semibold">₹{reward.monetary_value.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Points Calculation */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Current Balance:</span>
              <span className="font-semibold">{userPoints.toLocaleString()} coins</span>
            </div>
            <div className="flex justify-between text-sm text-destructive">
              <span>Redemption Cost:</span>
              <span className="font-semibold">-{reward.coin_cost.toLocaleString()} coins</span>
            </div>
            <div className="pt-2 border-t border-primary/20 flex justify-between">
              <span className="font-semibold">Remaining Balance:</span>
              <span className="font-bold text-lg text-primary">
                {remainingPoints.toLocaleString()} coins
              </span>
            </div>
          </div>

          {/* Delivery Address for Merchandise */}
          {needsAddress && (
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Delivery Address *
              </Label>
              <Textarea
                id="address"
                placeholder="Enter your complete delivery address..."
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          )}

          {/* Terms & Conditions */}
          {reward.terms_conditions && (
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                <strong>Terms:</strong> {reward.terms_conditions}
              </p>
            </div>
          )}

          {/* Warning */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
            <span>
              Coins will be deducted immediately. Your redemption will be reviewed by HR and processed within 2-3 business days.
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? "Processing..." : "Confirm Redemption"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RedemptionDialog;
