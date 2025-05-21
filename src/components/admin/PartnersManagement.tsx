
import { useState, useEffect, FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Check, Trash, PenSquare } from "lucide-react";
import { type Partner } from "@/types/partners";
import ImageUploadField from "./ImageUploadField";

const PartnersManagement = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPartner, setCurrentPartner] = useState<Partial<Partner>>({
    name: "",
    website_url: "",
    logo_url: "",
    display_order: 0,
    featured: false,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error("Error fetching partners:", error);
      toast({
        title: "Failed to load partners",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let response;

      if (isEditing && currentPartner.id) {
        // Update existing partner
        response = await supabase
          .from("partners")
          .update({
            name: currentPartner.name!,
            website_url: currentPartner.website_url || null,
            logo_url: currentPartner.logo_url || null,
            featured: currentPartner.featured || false,
            display_order: currentPartner.display_order || 0,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentPartner.id);
      } else {
        // Create new partner
        response = await supabase
          .from("partners")
          .insert({
            name: currentPartner.name!,
            website_url: currentPartner.website_url || null,
            logo_url: currentPartner.logo_url || null,
            featured: currentPartner.featured || false,
            display_order: partners.length,
          });
      }

      if (response.error) throw response.error;

      toast({
        title: isEditing ? "Partner updated" : "Partner created",
        description: isEditing
          ? "The partner has been updated successfully."
          : "A new partner has been added.",
      });

      // Reset form and fetch updated data
      setDialogOpen(false);
      resetForm();
      fetchPartners();
    } catch (error) {
      console.error("Error saving partner:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} partner.`,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePartner = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this partner?")) {
      return;
    }

    try {
      const { error } = await supabase.from("partners").delete().eq("id", id);

      if (error) throw error;

      setPartners((prev) => prev.filter((p) => p.id !== id));

      toast({
        title: "Partner deleted",
      });
    } catch (error) {
      console.error("Error deleting partner:", error);
      toast({
        title: "Failed to delete partner",
        variant: "destructive",
      });
    }
  };

  const handleEditPartner = (partner: Partner) => {
    setCurrentPartner(partner);
    setIsEditing(true);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setCurrentPartner({
      name: "",
      website_url: "",
      logo_url: "",
      featured: false,
      display_order: partners.length,
    });
    setIsEditing(false);
  };

  const handleNewPartner = () => {
    resetForm();
    setDialogOpen(true);
  };

  const toggleFeatured = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("partners")
        .update({ featured: !currentValue, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      setPartners((prev) =>
        prev.map((p) => (p.id === id ? { ...p, featured: !currentValue } : p))
      );
    } catch (error) {
      console.error("Error updating partner:", error);
      toast({
        title: "Failed to update partner",
        variant: "destructive",
      });
    }
  };

  const updateOrder = async (id: string, newOrder: number) => {
    try {
      const { error } = await supabase
        .from("partners")
        .update({ display_order: newOrder, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      fetchPartners(); // Refetch to ensure correct order
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Failed to update order",
        variant: "destructive",
      });
    }
  };

  const moveUp = (partner: Partner) => {
    const index = partners.findIndex((p) => p.id === partner.id);
    if (index > 0) {
      const prevItem = partners[index - 1];
      updateOrder(partner.id, prevItem.display_order);
      updateOrder(prevItem.id, partner.display_order);
    }
  };

  const moveDown = (partner: Partner) => {
    const index = partners.findIndex((p) => p.id === partner.id);
    if (index < partners.length - 1) {
      const nextItem = partners[index + 1];
      updateOrder(partner.id, nextItem.display_order);
      updateOrder(nextItem.id, partner.display_order);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p>Loading partners...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Partners Management</h2>
        <Button onClick={handleNewPartner}>Add New Partner</Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Partner" : "Add New Partner"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium">
                Partner Name*
              </label>
              <Input
                id="name"
                value={currentPartner.name || ""}
                onChange={(e) =>
                  setCurrentPartner({
                    ...currentPartner,
                    name: e.target.value,
                  })
                }
                placeholder="Company Name"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="website_url" className="block text-sm font-medium">
                Website URL
              </label>
              <Input
                id="website_url"
                value={currentPartner.website_url || ""}
                onChange={(e) =>
                  setCurrentPartner({
                    ...currentPartner,
                    website_url: e.target.value,
                  })
                }
                placeholder="https://example.com"
                type="url"
              />
            </div>

            <ImageUploadField
              initialImageUrl={currentPartner.logo_url || null}
              onImageChange={(url) => 
                setCurrentPartner({
                  ...currentPartner,
                  logo_url: url
                })
              }
              folderPath="partners"
              label="Partner Logo"
            />

            <div className="flex items-center gap-2">
              <label htmlFor="featured" className="text-sm font-medium">
                Featured Partner
              </label>
              <Switch
                id="featured"
                checked={currentPartner.featured || false}
                onCheckedChange={(checked) =>
                  setCurrentPartner({
                    ...currentPartner,
                    featured: checked,
                  })
                }
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : isEditing ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {partners.length === 0 ? (
        <div className="text-center py-8 bg-card border border-muted/20 rounded-lg">
          <p className="text-muted-foreground">No partners found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {partners.map((partner, index) => (
            <Card key={partner.id}>
              <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    {partner.name}
                    {partner.featured && (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                        Featured
                      </span>
                    )}
                  </CardTitle>
                  {partner.website_url && (
                    <a
                      href={partner.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline"
                    >
                      {partner.website_url}
                    </a>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveUp(partner)}
                    disabled={index === 0}
                    title="Move Up"
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveDown(partner)}
                    disabled={index === partners.length - 1}
                    title="Move Down"
                  >
                    ↓
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                {partner.logo_url && (
                  <img
                    src={partner.logo_url}
                    alt={partner.name}
                    className="h-16 object-contain"
                  />
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex items-center">
                  <Switch
                    id={`featured-${partner.id}`}
                    checked={partner.featured}
                    onCheckedChange={() =>
                      toggleFeatured(partner.id, partner.featured)
                    }
                  />
                  <label htmlFor={`featured-${partner.id}`} className="ml-2 text-sm">
                    Featured
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditPartner(partner)}
                  >
                    <PenSquare className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeletePartner(partner.id)}
                  >
                    <Trash className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PartnersManagement;
