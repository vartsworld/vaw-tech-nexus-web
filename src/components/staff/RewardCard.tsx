import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, Package, AlertCircle, Gift } from "lucide-react";
import RedemptionDialog from "./RedemptionDialog";

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

interface RewardCardProps {
  reward: Reward;
  userPoints: number;
  onRedeem: (rewardId: string, pointsCost: number) => Promise<void>;
}

const RewardCard = ({ reward, userPoints, onRedeem }: RewardCardProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const canAfford = userPoints >= reward.points_cost;
  const isOutOfStock = reward.stock_quantity !== null && reward.stock_quantity <= 0;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "salary_perk": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "bonus": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "merchandise": return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "benefits": return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      case "other": return "bg-pink-500/10 text-pink-600 border-pink-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <>
      <Card className="group overflow-hidden border-border/50 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <CardHeader className="p-0 relative">
          {/* Image */}
          <div className="h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center relative overflow-hidden">
            {reward.image_url ? (
              <img
                src={reward.image_url}
                alt={reward.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <Gift className="w-20 h-20 text-primary/30" />
            )}

            {/* Category Badge */}
            <Badge className={`absolute top-3 left-3 ${getCategoryColor(reward.category)}`}>
              {getCategoryLabel(reward.category)}
            </Badge>

            {/* Stock Badge */}
            {reward.stock_quantity !== null && (
              <Badge
                variant={isOutOfStock ? "destructive" : "secondary"}
                className="absolute top-3 right-3"
              >
                <Package className="w-3 h-3 mr-1" />
                {isOutOfStock ? "Out of Stock" : `${reward.stock_quantity} left`}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-bold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {reward.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {reward.description}
            </p>
          </div>

          {/* Coins Cost */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold text-primary">
                {reward.points_cost.toLocaleString()}
              </span>
            </div>
            {reward.monetary_value && (
              <span className="text-sm text-muted-foreground">
                ≈ ₹{reward.monetary_value.toLocaleString()}
              </span>
            )}
          </div>

          {/* Affordability Indicator */}
          {!canAfford && (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="w-3 h-3" />
              Need {(reward.points_cost - userPoints).toLocaleString()} more coins
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Button
            onClick={() => setShowDialog(true)}
            disabled={!canAfford || isOutOfStock}
            className="w-full font-bold"
            variant={canAfford && !isOutOfStock ? "default" : "outline"}
          >
            {isOutOfStock ? "Out of Stock" : canAfford ? "Redeem Now" : "Insufficient Coins"}
          </Button>
        </CardFooter>
      </Card>

      <RedemptionDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        reward={reward}
        userPoints={userPoints}
        onConfirm={() => onRedeem(reward.id, reward.points_cost)}
      />
    </>
  );
};

export default RewardCard;
