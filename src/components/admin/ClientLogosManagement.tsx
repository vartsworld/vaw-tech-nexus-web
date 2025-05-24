
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
import { Switch } from "@/components/ui/switch";
import { Trash, PenSquare } from "lucide-react";
import { ClientLogo } from "@/types/client-logos";
import ImageSelector from "./ImageSelector";

interface ClientLogoInput {
  id?: string;
  name: string;
  logo_url: string | null;
  display_order: number;
  is_active: boolean;
}

const ClientLogosManagement = () => {
  const [clientLogos, setClientLogos] = useState<ClientLogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentLogo, setCurrentLogo] = useState<ClientLogoInput>({
    name: "",
    logo_url: null,
    display_order: 0,
    is_active: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchClientLogos();
  }, []);

  const fetchClientLogos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("client_logos")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      setClientLogos(data || []);
    } catch (error) {
      console.error("Error fetching client logos:", error);
      toast({
        title: "Failed to load client logos",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (file: File | null) => {
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Image too large",
          description: "Image size should be less than 2MB",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setCurrentLogo({ ...currentLogo, logo_url: null });
    }
  };

  const handleImageUrlChange = (url: string | null) => {
    setImageFile(null);
    setImagePreview(url);
    setCurrentLogo({ ...currentLogo, logo_url: url });
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `client-logos/${fileName}`;

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
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validation
      if (!currentLogo.name.trim()) {
        toast({
          title: "Validation Error",
          description: "Client name is required",
          variant: "destructive",
        });
        return;
      }

      if (!currentLogo.logo_url && !imageFile) {
        toast({
          title: "Validation Error",
          description: "Logo image is required",
          variant: "destructive",
        });
        return;
      }

      let logoUrl = currentLogo.logo_url;

      if (imageFile) {
        logoUrl = await uploadImage(imageFile);
      }

      if (!logoUrl) {
        toast({
          title: "Error",
          description: "Failed to get logo URL",
          variant: "destructive",
        });
        return;
      }

      const logoData = {
        name: currentLogo.name.trim(),
        logo_url: logoUrl,
        display_order: isEditing ? currentLogo.display_order : clientLogos.length,
        is_active: currentLogo.is_active,
      };

      let result;

      if (isEditing && currentLogo.id) {
        result = await supabase
          .from("client_logos")
          .update({
            ...logoData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentLogo.id)
          .select();
      } else {
        result = await supabase
          .from("client_logos")
          .insert([logoData])
          .select();
      }

      if (result.error) {
        console.error("Supabase error:", result.error);
        throw result.error;
      }

      toast({
        title: isEditing ? "Client logo updated" : "Client logo created",
        description: isEditing
          ? "The client logo has been updated successfully."
          : "A new client logo has been added.",
      });

      setDialogOpen(false);
      resetForm();
      await fetchClientLogos();
    } catch (error) {
      console.error("Error saving client logo:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} client logo. ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLogo = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this client logo?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("client_logos")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setClientLogos((prev) => prev.filter((logo) => logo.id !== id));

      toast({
        title: "Client logo deleted",
      });
    } catch (error) {
      console.error("Error deleting client logo:", error);
      toast({
        title: "Failed to delete client logo",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleEditLogo = (logo: ClientLogo) => {
    setCurrentLogo({
      id: logo.id,
      name: logo.name,
      logo_url: logo.logo_url,
      display_order: logo.display_order,
      is_active: logo.is_active,
    });
    setIsEditing(true);
    setImagePreview(logo.logo_url);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setCurrentLogo({
      name: "",
      logo_url: null,
      display_order: clientLogos.length,
      is_active: true,
    });
    setIsEditing(false);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleNewLogo = () => {
    resetForm();
    setDialogOpen(true);
  };

  const toggleActive = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("client_logos")
        .update({ 
          is_active: !currentValue, 
          updated_at: new Date().toISOString() 
        })
        .eq("id", id);

      if (error) throw error;

      setClientLogos((prev) =>
        prev.map((logo) => (logo.id === id ? { ...logo, is_active: !currentValue } : logo))
      );

      toast({
        title: `Client logo ${!currentValue ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      console.error("Error updating client logo:", error);
      toast({
        title: "Failed to update client logo",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p>Loading client logos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Client Logos Management</h2>
        <Button onClick={handleNewLogo}>Add New Client Logo</Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Client Logo" : "Add New Client Logo"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Client Name*</Label>
              <Input
                id="name"
                value={currentLogo.name}
                onChange={(e) =>
                  setCurrentLogo({
                    ...currentLogo,
                    name: e.target.value,
                  })
                }
                placeholder="Client Name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Client Logo*</Label>
              <ImageSelector
                currentImageUrl={currentLogo.logo_url}
                onImageChange={handleImageChange}
                onImageUrlChange={handleImageUrlChange}
                previewUrl={imagePreview}
              />
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="is_active">Active</Label>
              <Switch
                id="is_active"
                checked={currentLogo.is_active}
                onCheckedChange={(checked) =>
                  setCurrentLogo({
                    ...currentLogo,
                    is_active: checked,
                  })
                }
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
                disabled={submitting}
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

      {clientLogos.length === 0 ? (
        <div className="text-center py-8 bg-card border border-muted/20 rounded-lg">
          <p className="text-muted-foreground">No client logos found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {clientLogos.map((logo) => (
            <Card key={logo.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {logo.logo_url && (
                      <img
                        src={logo.logo_url}
                        alt={logo.name}
                        className="h-12 w-auto object-contain"
                      />
                    )}
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {logo.name}
                        {logo.is_active && (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                            Active
                          </span>
                        )}
                      </CardTitle>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardFooter className="pt-2 flex justify-between">
                <div className="flex items-center">
                  <Switch
                    id={`active-${logo.id}`}
                    checked={logo.is_active}
                    onCheckedChange={() =>
                      toggleActive(logo.id, logo.is_active)
                    }
                  />
                  <Label htmlFor={`active-${logo.id}`} className="ml-2">
                    Active
                  </Label>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditLogo(logo)}
                  >
                    <PenSquare className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteLogo(logo.id)}
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

export default ClientLogosManagement;
