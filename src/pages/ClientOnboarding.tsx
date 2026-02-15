import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Globe, Zap, Shield, Star, TrendingUp, Bot, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SEO from "@/components/SEO";

const iconMap: Record<string, React.ReactNode> = {
  Globe: <Globe className="h-6 w-6 text-primary" />,
  Zap: <Zap className="h-6 w-6 text-primary" />,
  Shield: <Shield className="h-6 w-6 text-primary" />,
  Star: <Star className="h-6 w-6 text-primary" />,
  TrendingUp: <TrendingUp className="h-6 w-6 text-primary" />,
  Bot: <Bot className="h-6 w-6 text-primary" />,
};

interface OnboardingLink {
  id: string;
  token: string;
  package_id: string;
  additional_info: string | null;
  custom_fields: any[];
  status: string;
  client_name: string | null;
  created_by: string;
}

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

const ClientOnboarding = () => {
  const { token } = useParams<{ token: string }>();
  const [link, setLink] = useState<OnboardingLink | null>(null);
  const [pkg, setPkg] = useState<PricingPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    contact_person: "",
    email: "",
    phone: "",
    company_name: "",
    company_address: "",
    website_url: "",
    desired_domain: "",
    notes: "",
  });

  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (token) fetchLink();
  }, [token]);

  const fetchLink = async () => {
    try {
      const { data: linkData, error: linkErr } = await supabase
        .from("client_onboarding_links")
        .select("*")
        .eq("token", token)
        .eq("status", "active")
        .single();

      if (linkErr || !linkData) {
        setError("This onboarding link is invalid or has expired.");
        return;
      }

      setLink(linkData as any);
      if (linkData.client_name) {
        setForm(prev => ({ ...prev, contact_person: linkData.client_name || "" }));
      }

      // Parse custom fields
      const fields = linkData.custom_fields as any;
      if (Array.isArray(fields)) {
        const initial: Record<string, string> = {};
        fields.forEach((f: any) => { initial[f.label] = ""; });
        setCustomFieldValues(initial);
      }

      if (linkData.package_id) {
        const { data: pkgData } = await supabase
          .from("pricing_packages")
          .select("*")
          .eq("id", linkData.package_id)
          .single();
        if (pkgData) setPkg(pkgData as any);
      }
    } catch (e) {
      setError("Something went wrong loading this form.");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);

  const handleSubmit = async () => {
    if (!form.contact_person || !form.email || !form.company_name) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create client in clients table
      const { data: clientData, error: clientErr } = await supabase
        .from("clients")
        .insert({
          company_name: form.company_name,
          contact_person: form.contact_person,
          email: form.email,
          phone: form.phone || null,
          address: form.company_address || null,
          notes: [
            form.website_url ? `Website: ${form.website_url}` : "",
            form.desired_domain ? `Desired Domain: ${form.desired_domain}` : "",
            form.notes || "",
            Object.entries(customFieldValues)
              .filter(([, v]) => v)
              .map(([k, v]) => `${k}: ${v}`)
              .join("\n"),
            link?.additional_info ? `Head Notes: ${link.additional_info}` : "",
          ].filter(Boolean).join("\n"),
          created_by: link?.created_by || "system",
          status: "active",
        })
        .select()
        .single();

      if (clientErr) throw clientErr;

      // 2. Create client profile
      const { data: profileData, error: profileErr } = await supabase
        .from("client_profiles")
        .insert({
          company_name: form.company_name,
          contact_person: form.contact_person,
          email: form.email,
          phone: form.phone || null,
          address: form.company_address || null,
        })
        .select()
        .single();

      if (profileErr) {
        console.error("Profile creation error (may already exist):", profileErr);
      }

      // 3. Create task for team head with package title
      const taskTitle = pkg
        ? `New Client: ${form.company_name} — ${pkg.name}`
        : `New Client Onboarding: ${form.company_name}`;

      const taskDescription = [
        `Client: ${form.contact_person} (${form.email})`,
        `Company: ${form.company_name}`,
        form.phone ? `Phone: ${form.phone}` : "",
        form.website_url ? `Website: ${form.website_url}` : "",
        form.desired_domain ? `Desired Domain: ${form.desired_domain}` : "",
        pkg ? `Package: ${pkg.name} — ${formatPrice(pkg.discount_price)}` : "",
        form.notes ? `Notes: ${form.notes}` : "",
      ].filter(Boolean).join("\n");

      await supabase.from("staff_tasks").insert({
        title: taskTitle,
        description: taskDescription,
        assigned_to: link?.created_by || "",
        assigned_by: link?.created_by || "",
        priority: "high",
        status: "pending",
        points: 10,
        client_id: clientData.id,
      });

      // 4. Mark link as completed
      await supabase
        .from("client_onboarding_links")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", link?.id);

      setSubmitted(true);
    } catch (e: any) {
      console.error("Onboarding submission error:", e);
      toast.error(e.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive text-lg font-medium">{error}</p>
            <p className="text-muted-foreground mt-2">Please contact your account manager for a new link.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <SEO title="Onboarding Complete - VAW Technologies" description="Your information has been submitted successfully." />
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">Thank You!</h2>
            <p className="text-muted-foreground">
              Your information has been submitted successfully. Our team will reach out to you shortly to get started on your project.
            </p>
            {pkg && (
              <Badge variant="secondary" className="text-sm">
                Package: {pkg.name}
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const customFields = Array.isArray(link?.custom_fields) ? link.custom_fields : [];

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <SEO title="Client Onboarding - VAW Technologies" description="Complete your onboarding with VAW Technologies." />
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <img src="/lovable-uploads/0d3e4545-c80e-401b-82f1-3319db5155b4.png" alt="VAW Technologies" className="h-12 mx-auto" />
          <h1 className="text-2xl md:text-3xl font-bold">Client Onboarding</h1>
          <p className="text-muted-foreground">Please fill in your details to get started</p>
        </div>

        {/* Selected Package Display */}
        {pkg && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                {iconMap[pkg.icon || "Globe"]}
                <div>
                  <CardTitle className="text-lg">{pkg.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{pkg.description}</p>
                </div>
                {pkg.is_popular && <Badge className="ml-auto">Popular</Badge>}
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                {pkg.original_price !== pkg.discount_price && (
                  <span className="text-muted-foreground line-through text-sm">{formatPrice(pkg.original_price)}</span>
                )}
                <span className="text-2xl font-bold text-primary">{formatPrice(pkg.discount_price)}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {pkg.features?.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Info from Head */}
        {link?.additional_info && (
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground font-medium mb-1">Note from your account manager:</p>
              <p className="text-sm">{link.additional_info}</p>
            </CardContent>
          </Card>
        )}

        {/* Client Form */}
        <Card>
          <CardHeader>
            <CardTitle>Your Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact_person">Full Name *</Label>
                <Input id="contact_person" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} placeholder="Your full name" maxLength={200} />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" maxLength={255} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" maxLength={20} />
              </div>
              <div>
                <Label htmlFor="company_name">Company Name *</Label>
                <Input id="company_name" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} placeholder="Your company name" maxLength={200} />
              </div>
            </div>
            <div>
              <Label htmlFor="company_address">Company Address</Label>
              <Textarea id="company_address" value={form.company_address} onChange={(e) => setForm({ ...form, company_address: e.target.value })} placeholder="Enter company address" rows={2} maxLength={500} />
            </div>

            <Separator />
            <p className="text-sm font-medium text-muted-foreground">Website Details</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="website_url">Existing Website URL</Label>
                <Input id="website_url" value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} placeholder="https://yourwebsite.com" maxLength={500} />
              </div>
              <div>
                <Label htmlFor="desired_domain">Desired Domain Name</Label>
                <Input id="desired_domain" value={form.desired_domain} onChange={(e) => setForm({ ...form, desired_domain: e.target.value })} placeholder="yourcompany.com" maxLength={200} />
              </div>
            </div>

            {/* Custom Fields from Head */}
            {customFields.length > 0 && (
              <>
                <Separator />
                <p className="text-sm font-medium text-muted-foreground">Additional Information</p>
                {customFields.map((field: any, idx: number) => (
                  <div key={idx}>
                    <Label>{field.label} {field.required && "*"}</Label>
                    {field.type === "textarea" ? (
                      <Textarea
                        value={customFieldValues[field.label] || ""}
                        onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.label]: e.target.value })}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        maxLength={1000}
                      />
                    ) : (
                      <Input
                        value={customFieldValues[field.label] || ""}
                        onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.label]: e.target.value })}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        maxLength={500}
                      />
                    )}
                  </div>
                ))}
              </>
            )}

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any other details you'd like to share..." rows={3} maxLength={2000} />
            </div>

            <Button className="w-full" size="lg" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {submitting ? "Submitting..." : "Submit Information"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientOnboarding;
