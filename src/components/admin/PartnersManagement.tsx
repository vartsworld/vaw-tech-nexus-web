
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Trash, Upload, PenSquare, Link as LinkIcon, ExternalLink } from "lucide-react";

interface Partner {
  id: string;
  name: string;
  logo_url: string;
  website_url: string | null;
  display_order: number;
}

const PartnersManagement = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPartner, setCurrentPartner] = useState<Partial<Partner>>({
    name: "",
    logo_url: "",
    website_url: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Image too large",
          description: "Image size should be less than 2MB",
          variant: "destructive",
        });
        return;
      }

      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const uploadLogo = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `partners/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("media")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading logo:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate form
      if (!currentPartner.name) {
        toast({
          title: "Partner name is required",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      let logoUrl = currentPartner.logo_url;

      if (logoFile) {
        logoUrl = await uploadLogo(logoFile);
      }

      if (!logoUrl) {
        toast({
          title: "Partner logo is required",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      const partnerData = {
        ...currentPartner,
        logo_url: logoUrl,
      };

      let response;

      if (isEditing && currentPartner.id) {
        // Update existing partner
        response = await supabase
          .from("partners")
          .update({
            name: partnerData.name,
            logo_url: partnerData.logo_url,
            website_url: partnerData.website_url || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentPartner.id);
      } else {
        // Create new partner
        response = await supabase
          .from("partners")
          .insert({
            name: partnerData.name!,
            logo_url: partnerData.logo_url!,
            website_url: partnerData.website_url || null,
            display_order: partners.length,
          });
      }

      if (response.error) throw response.error;

      toast({
        title: isEditing ? "Partner updated" : "Partner added",
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
        description: `Failed to ${isEditing ? "update" : "add"} partner.`,
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
    setLogoPreview(partner.logo_url);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setCurrentPartner({
      name: "",
      logo_url: "",
      website_url: "",
    });
    setIsEditing(false);
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleNewPartner = () => {
    resetForm();
    setDialogOpen(true);
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
        <DialogContent className="max-w-md overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Partner" : "Add New Partner"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Partner Name*</Label>
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
              <Label htmlFor="website_url">Website URL</Label>
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

            <div className="space-y-2">
              <Label htmlFor="logo">Partner Logo*</Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("logo-upload")?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {logoPreview ? "Change Logo" : "Upload Logo"}
                </Button>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </div>

              {(logoPreview || currentPartner.logo_url) && (
                <div className="mt-4 border rounded-lg p-4 flex justify-center">
                  <img
                    src={logoPreview || currentPartner.logo_url!}
                    alt="Logo Preview"
                    className="max-h-32 object-contain"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
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
                {submitting ? "Saving..." : isEditing ? "Update" : "Add"}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {partners.map((partner, index) => (
            <Card key={partner.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{partner.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center py-4">
                <img
                  src={partner.logo_url}
                  alt={partner.name}
                  className="max-h-24 object-contain"
                />
              </CardContent>
              <CardFooter className="pt-2 flex justify-between">
                <div className="flex gap-2">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveUp(partner)}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveDown(partner)}
                      disabled={index === partners.length - 1}
                    >
                      ↓
                    </Button>
                  </div>
                  {partner.website_url && (
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      title={partner.website_url}
                    >
                      <a 
                        href={partner.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
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
