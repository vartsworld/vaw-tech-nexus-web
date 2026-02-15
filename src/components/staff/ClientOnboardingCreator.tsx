import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Check, Plus, Link as LinkIcon, Copy, Trash2, Globe, Zap, Shield, Star, TrendingUp, Bot, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const iconMap: Record<string, React.ReactNode> = {
  Globe: <Globe className="h-5 w-5" />,
  Zap: <Zap className="h-5 w-5" />,
  Shield: <Shield className="h-5 w-5" />,
  Star: <Star className="h-5 w-5" />,
  TrendingUp: <TrendingUp className="h-5 w-5" />,
  Bot: <Bot className="h-5 w-5" />,
};

interface PricingPackage {
  id: string;
  name: string;
  description: string | null;
  original_price: number;
  discount_price: number;
  features: string[];
  icon: string | null;
  is_popular: boolean;
}

interface CustomField {
  label: string;
  type: "text" | "textarea";
  required: boolean;
}

interface OnboardingLink {
  id: string;
  token: string;
  status: string;
  client_name: string | null;
  created_at: string;
  package_id: string | null;
  pricing_packages?: PricingPackage;
}

interface ClientOnboardingCreatorProps {
  userId: string;
}

const ClientOnboardingCreator = ({ userId }: ClientOnboardingCreatorProps) => {
  const [open, setOpen] = useState(false);
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [links, setLinks] = useState<OnboardingLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [clientName, setClientName] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<"text" | "textarea">("text");

  useEffect(() => {
    fetchPackages();
    fetchLinks();
  }, []);

  const fetchPackages = async () => {
    const { data } = await supabase
      .from("pricing_packages")
      .select("*")
      .eq("is_active", true)
      .order("display_order");
    if (data) setPackages(data as any);
  };

  const fetchLinks = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("client_onboarding_links")
      .select("*, pricing_packages(name, discount_price, icon)")
      .eq("created_by", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setLinks(data as any);
    setLoading(false);
  };

  const selectedPackage = packages.find(p => p.id === selectedPackageId);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);

  const addCustomField = () => {
    if (!newFieldLabel.trim()) return;
    setCustomFields([...customFields, { label: newFieldLabel.trim(), type: newFieldType, required: false }]);
    setNewFieldLabel("");
  };

  const removeCustomField = (idx: number) => {
    setCustomFields(customFields.filter((_, i) => i !== idx));
  };

  const handleCreate = async () => {
    if (!selectedPackageId) {
      toast.error("Please select a package.");
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("client_onboarding_links")
        .insert({
          created_by: userId,
          package_id: selectedPackageId,
          client_name: clientName || null,
          additional_info: additionalInfo || null,
          custom_fields: customFields.length > 0 ? customFields : [],
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Onboarding link created!");
      setOpen(false);
      resetForm();
      fetchLinks();
    } catch (e: any) {
      toast.error(e.message || "Failed to create link.");
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setSelectedPackageId("");
    setClientName("");
    setAdditionalInfo("");
    setCustomFields([]);
  };

  const getFormUrl = (token: string) => {
    return `${window.location.origin}/onboard/${token}`;
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(getFormUrl(token));
    toast.success("Link copied to clipboard!");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <LinkIcon className="h-4 w-4" />
          Client Onboarding Links
        </h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-8">
              <Plus className="h-3 w-3 mr-1" />
              Create Link
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Client Onboarding Link</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Client Name (optional) */}
              <div>
                <Label>Client Name (optional pre-fill)</Label>
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. John Doe" maxLength={200} />
              </div>

              {/* Package Selection */}
              <div>
                <Label>Select Package *</Label>
                <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a pricing package" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map(pkg => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        <div className="flex items-center gap-2">
                          {iconMap[pkg.icon || "Globe"]}
                          <span>{pkg.name}</span>
                          <span className="text-muted-foreground ml-1">— {formatPrice(pkg.discount_price)}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Package Preview */}
              {selectedPackage && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{selectedPackage.name}</span>
                      <span className="text-lg font-bold text-primary">{formatPrice(selectedPackage.discount_price)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{selectedPackage.description}</p>
                    <div className="grid grid-cols-2 gap-1 mt-2">
                      {selectedPackage.features?.slice(0, 6).map((f, i) => (
                        <div key={i} className="flex items-center gap-1 text-xs">
                          <Check className="h-3 w-3 text-primary flex-shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                      {(selectedPackage.features?.length || 0) > 6 && (
                        <span className="text-xs text-muted-foreground">+{(selectedPackage.features?.length || 0) - 6} more features</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Additional Info */}
              <div>
                <Label>Additional Info for Client</Label>
                <Textarea value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)} placeholder="Any notes the client should see..." rows={2} maxLength={1000} />
              </div>

              {/* Custom Fields */}
              <div>
                <Label>Custom Form Fields</Label>
                <p className="text-xs text-muted-foreground mb-2">Add extra fields the client should fill in</p>
                {customFields.map((field, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">{field.type}</Badge>
                    <span className="text-sm flex-1">{field.label}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeCustomField(idx)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)} placeholder="Field name" className="flex-1" maxLength={100} />
                  <Select value={newFieldType} onValueChange={(v: "text" | "textarea") => setNewFieldType(v)}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="textarea">Textarea</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={addCustomField} disabled={!newFieldLabel.trim()}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={creating || !selectedPackageId}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LinkIcon className="h-4 w-4 mr-2" />}
                  Generate Link
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Existing Links */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : links.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No onboarding links created yet.</p>
      ) : (
        <ScrollArea className="max-h-48">
          <div className="space-y-2">
            {links.map((link) => (
              <div key={link.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-sm">
                <Badge variant={link.status === "completed" ? "default" : "secondary"} className="text-[10px]">
                  {link.status}
                </Badge>
                <span className="flex-1 truncate">
                  {link.client_name || (link as any).pricing_packages?.name || "Unnamed"}
                </span>
                {link.status === "active" && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyLink(link.token)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => window.open(getFormUrl(link.token), "_blank")}>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default ClientOnboardingCreator;
