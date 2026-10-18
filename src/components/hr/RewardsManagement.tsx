import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Gift } from "lucide-react";
import { toast } from "sonner";

interface Reward {
  id: string;
  title: string;
  description: string;
  category: string;
  points_cost: number;
  monetary_value: number | null;
  image_url: string | null;
  stock_quantity: number | null;
  is_active: boolean;
  redemption_limit: number | null;
  terms_conditions: string | null;
}

const RewardsManagement = () => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "merchandise",
    points_cost: 0,
    monetary_value: 0,
    image_url: "",
    stock_quantity: null as number | null,
    redemption_limit: null as number | null,
    terms_conditions: "",
    is_active: true
  });

  const [coinRate, setCoinRate] = useState<number>(0);
  const [isUpdatingRate, setIsUpdatingRate] = useState(false);

  useEffect(() => {
    fetchRewards();
    fetchCoinRate();
  }, []);

  const fetchCoinRate = async () => {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'vaw_coin_rate')
      .single();

    if (data?.value) {
      // @ts-ignore
      setCoinRate(data.value.inr_value || 0);
    }
  };

  const handleUpdateRate = async () => {
    setIsUpdatingRate(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'vaw_coin_rate',
          value: { inr_value: coinRate },
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        });

      if (error) throw error;
      toast.success("Coin exchange rate updated!");
    } catch (error) {
      console.error('Error updating rate:', error);
      toast.error("Failed to update exchange rate");
    } finally {
      setIsUpdatingRate(false);
    }
  };

  const fetchRewards = async () => {
    const { data, error } = await supabase
      .from("rewards_catalog")
      .select("*")
      .order("points_cost", { ascending: true });

    if (error) {
      toast.error("Failed to load rewards");
      return;
    }
    setRewards(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (editingReward) {
        const { error } = await supabase
          .from("rewards_catalog")
          .update(formData)
          .eq("id", editingReward.id);

        if (error) throw error;
        toast.success("Reward updated successfully");
      } else {
        const { error } = await supabase
          .from("rewards_catalog")
          .insert({ ...formData, created_by: user.id });

        if (error) throw error;
        toast.success("Reward created successfully");
      }

      fetchRewards();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving reward:", error);
      toast.error("Failed to save reward");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this reward?")) return;

    const { error } = await supabase
      .from("rewards_catalog")
      .delete()
      .eq("id", id);

    if (error) {
      console.warn("Delete error, trying soft-delete (inactive):", error);
      // If foreign key constraint or RLS blocks deletion, deactivate instead
      const { error: updateError } = await supabase
        .from("rewards_catalog")
        .update({ is_active: false })
        .eq("id", id);

      if (updateError) {
        toast.error("Failed to delete reward");
        return;
      }
      toast.success("Reward deactivated (has existing redemptions)");
      fetchRewards();
      return;
    }

    toast.success("Reward deleted");
    fetchRewards();
  };

  const handleEdit = (reward: Reward) => {
    setEditingReward(reward);
    setFormData({
      title: reward.title,
      description: reward.description,
      category: reward.category,
      points_cost: reward.points_cost,
      monetary_value: reward.monetary_value || 0,
      image_url: reward.image_url || "",
      stock_quantity: reward.stock_quantity,
      redemption_limit: reward.redemption_limit,
      terms_conditions: reward.terms_conditions || "",
      is_active: reward.is_active
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingReward(null);
    setFormData({
      title: "",
      description: "",
      category: "merchandise",
      points_cost: 0,
      monetary_value: 0,
      image_url: "",
      stock_quantity: null,
      redemption_limit: null,
      terms_conditions: "",
      is_active: true
    });
  };

  return (
    <div className="space-y-4">


      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Rewards Catalog Management</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Reward
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                {editingReward ? "Edit Reward" : "Add New Reward"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Premium Wireless Headphones"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salary_perk">Salary Perk</SelectItem>
                      <SelectItem value="bonus">Bonus</SelectItem>
                      <SelectItem value="merchandise">Merchandise</SelectItem>
                      <SelectItem value="benefits">Benefits</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide details about what staff will receive..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="points_cost">Points / Coins Cost <span className="text-red-500">*</span></Label>
                  <Input
                    id="points_cost"
                    type="number"
                    value={formData.points_cost}
                    onChange={(e) => setFormData({ ...formData, points_cost: parseInt(e.target.value) || 0 })}
                    min={0}
                    required
                  />
                  {coinRate > 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      Approx. ₹{(formData.points_cost * coinRate).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monetary_value">Monetary Value (₹)</Label>
                  <Input
                    id="monetary_value"
                    type="number"
                    value={formData.monetary_value}
                    onChange={(e) => setFormData({ ...formData, monetary_value: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock_quantity">Stock Quantity</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    value={formData.stock_quantity ?? ""}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="redemption_limit">Redemption Limit (per user)</Label>
                  <Input
                    id="redemption_limit"
                    type="number"
                    value={formData.redemption_limit ?? ""}
                    onChange={(e) => setFormData({ ...formData, redemption_limit: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="terms_conditions">Terms &amp; Conditions</Label>
                <Textarea
                  id="terms_conditions"
                  value={formData.terms_conditions}
                  onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
                  placeholder="Specify any restrictions or instructions..."
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300 h-4 w-4 text-primary focus:ring-primary"
                />
                <Label htmlFor="is_active" className="cursor-pointer font-medium">Active &amp; visible to staff in store</Label>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingReward ? "Update Reward" : "Create Reward"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map(reward => (
          <Card key={reward.id} className="relative">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <Badge variant={reward.is_active ? "default" : "secondary"}>
                  {reward.is_active ? "Active" : "Inactive"}
                </Badge>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(reward)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(reward.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <h4 className="font-semibold text-lg mb-1">{reward.title}</h4>
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{reward.description}</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Points:</span>
                  <span className="font-semibold text-primary">{reward.points_cost}</span>
                </div>
                {reward.monetary_value && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Value:</span>
                    <span>₹{reward.monetary_value}</span>
                  </div>
                )}
                {reward.stock_quantity !== null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stock:</span>
                    <span>{reward.stock_quantity}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {rewards.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Gift className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p>No rewards created yet</p>
        </div>
      )}
    </div>
  );
};

export default RewardsManagement;
