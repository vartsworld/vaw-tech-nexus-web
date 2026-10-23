import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import CouponStats from "@/components/hr/CouponStats";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Plus, Edit, Trash2, Star, Tag, Globe, Zap, Shield, TrendingUp, Bot,
    Loader2, Eye, EyeOff, GripVertical, ChevronUp, ChevronDown, Package,
    DollarSign, Sparkles, ToggleLeft, ToggleRight, ExternalLink, Gift, Clock, CheckCircle
} from "lucide-react";

export interface PromotionalOffer {
    is_enabled: boolean;
    badge_text: string;
    title: string;
    discount_label: string;
    description: string;
    coupon_code: string;
    end_date: string;
    button_text: string;
    highlights: string[];
    discount_type?: "percent" | "flat" | "none";
    discount_value?: number;
    applies_to?: "all" | "package";
}

export const defaultOffer: PromotionalOffer = {
    is_enabled: true,
    badge_text: "Exclusive Limited Offer",
    title: "Launch & Grow Special: Up to 35% OFF All Packages",
    discount_label: "Save up to ₹50,000",
    description: "Launch your custom digital project this season with VAW Technologies. Includes free 1-year high-speed hosting, domain (.com/.in), SSL security, and complimentary 3-month maintenance.",
    coupon_code: "VAW35",
    end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    button_text: "Claim Your Offer",
    highlights: [
        "Free 1-Year Cloud Hosting",
        "Free Custom Domain (.com / .in)",
        "SSL Security & Malware Protection",
        "Dedicated Tech Lead & Priority Support"
    ],
    discount_type: "percent",
    discount_value: 35,
    applies_to: "all",
};

interface PricingPackage {
    id: string;
    name: string;
    slug: string;
    description: string;
    original_price: number;
    discount_price: number;
    icon_name: string;
    is_popular: boolean;
    is_enabled: boolean;
    sort_order: number;
    features: string[];
    created_at: string;
}

interface PricingAddon {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    is_enabled: boolean;
    sort_order: number;
}

const ICON_OPTIONS = [
    { value: "Globe", label: "Globe" },
    { value: "Zap", label: "Zap" },
    { value: "Shield", label: "Shield" },
    { value: "Star", label: "Star" },
    { value: "TrendingUp", label: "Trending Up" },
    { value: "Bot", label: "Bot / AI" },
    { value: "Package", label: "Package" },
    { value: "Sparkles", label: "Sparkles" },
];

const IconComponent = ({ name, className }: { name: string; className?: string }) => {
    const props = { className: className || "h-5 w-5" };
    switch (name) {
        case "Zap": return <Zap {...props} />;
        case "Shield": return <Shield {...props} />;
        case "Star": return <Star {...props} />;
        case "TrendingUp": return <TrendingUp {...props} />;
        case "Bot": return <Bot {...props} />;
        case "Package": return <Package {...props} />;
        case "Sparkles": return <Sparkles {...props} />;
        default: return <Globe {...props} />;
    }
};

const emptyPackage: Omit<PricingPackage, "id" | "created_at"> = {
    name: "",
    slug: "",
    description: "",
    original_price: 0,
    discount_price: 0,
    icon_name: "Globe",
    is_popular: false,
    is_enabled: true,
    sort_order: 0,
    features: [],
};

const emptyAddon: Omit<PricingAddon, "id"> = {
    name: "",
    slug: "",
    description: "",
    price: 0,
    is_enabled: true,
    sort_order: 0,
};

const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const slugify = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

export default function PricingManagement() {
    const { toast } = useToast();
    const [packages, setPackages] = useState<PricingPackage[]>([]);
    const [addons, setAddons] = useState<PricingAddon[]>([]);
    const [promotionalOffer, setPromotionalOffer] = useState<PromotionalOffer>(defaultOffer);
    const [highlightsText, setHighlightsText] = useState(defaultOffer.highlights.join("\n"));
    const [savingOffer, setSavingOffer] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Package dialog
    const [pkgDialogOpen, setPkgDialogOpen] = useState(false);
    const [editingPkg, setEditingPkg] = useState<PricingPackage | null>(null);
    const [pkgForm, setPkgForm] = useState({ ...emptyPackage });
    const [featuresText, setFeaturesText] = useState("");

    // Addon dialog
    const [addonDialogOpen, setAddonDialogOpen] = useState(false);
    const [editingAddon, setEditingAddon] = useState<PricingAddon | null>(null);
    const [addonForm, setAddonForm] = useState({ ...emptyAddon });

    useEffect(() => {
        fetchAll();
        // Real-time sync
        const channel = supabase
            .channel("pricing-realtime")
            .on("postgres_changes", { event: "*", schema: "public", table: "pricing_packages" }, fetchAll)
            .on("postgres_changes", { event: "*", schema: "public", table: "pricing_addons" }, fetchAll)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [pkgRes, addonRes, offerRes] = await Promise.all([
                supabase.from("pricing_packages").select("*").order("sort_order"),
                supabase.from("pricing_addons").select("*").order("sort_order"),
                supabase.from("app_settings").select("value").eq("key", "pricing_promotional_offer").maybeSingle(),
            ]);
            if (pkgRes.data) setPackages(pkgRes.data);
            if (addonRes.data) setAddons(addonRes.data);
            if (offerRes.data?.value) {
                const off = offerRes.data.value as unknown as PromotionalOffer;
                setPromotionalOffer(off);
                setHighlightsText((off.highlights || []).join("\n"));
            } else {
                const cached = localStorage.getItem("pricing_promotional_offer");
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached);
                        setPromotionalOffer(parsed);
                        setHighlightsText((parsed.highlights || []).join("\n"));
                    } catch {}
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const saveOffer = async () => {
        const highlights = highlightsText.split("\n").map(h => h.trim()).filter(Boolean);
        const type = promotionalOffer.discount_type ?? "none";
        const value = Number(promotionalOffer.discount_value ?? 0);
        const code = (promotionalOffer.coupon_code || "").trim().toUpperCase().replace(/\s+/g, "");

        if (promotionalOffer.is_enabled && !promotionalOffer.title.trim()) {
            return toast({ title: "Headline required", description: "Add a headline before publishing the offer.", variant: "destructive" });
        }
        if (type !== "none" && !code) {
            return toast({ title: "Coupon code required", description: "A discount needs a code customers can enter.", variant: "destructive" });
        }
        if (type !== "none" && !(value > 0)) {
            return toast({ title: "Enter a discount value", description: "Set how much the coupon takes off.", variant: "destructive" });
        }
        if (type === "percent" && value > 100) {
            return toast({ title: "Percentage too high", description: "A percentage discount can't be more than 100%.", variant: "destructive" });
        }

        setSavingOffer(true);
        const updatedOffer: PromotionalOffer = {
            ...promotionalOffer,
            coupon_code: code,
            discount_type: type,
            discount_value: type === "none" ? 0 : value,
            applies_to: promotionalOffer.applies_to ?? "all",
            highlights,
        };
        try {
            const { error } = await supabase.from("app_settings").upsert({
                key: "pricing_promotional_offer",
                value: updatedOffer as any,
                updated_at: new Date().toISOString()
            }, { onConflict: "key" });
            if (error) throw error;

            localStorage.setItem("pricing_promotional_offer", JSON.stringify(updatedOffer));
            setPromotionalOffer(updatedOffer);
            toast({
                title: "Promotional offer saved",
                description: updatedOffer.is_enabled
                    ? "The offer and coupon are now live on the public pricing page."
                    : "The offer is saved but hidden from the public pricing page.",
            });
        } catch (err) {
            console.error("Could not save the offer:", err);
            toast({
                title: "Offer not saved",
                description: "The change could not be written to the database, so visitors won't see it. Check your connection and permissions, then try again.",
                variant: "destructive",
            });
        } finally {
            setSavingOffer(false);
        }
    };

    // ── Packages ──────────────────────────────────────────────────────────────
    const openNewPkg = () => {
        setEditingPkg(null);
        setPkgForm({ ...emptyPackage, sort_order: packages.length + 1 });
        setFeaturesText("");
        setPkgDialogOpen(true);
    };

    const openEditPkg = (pkg: PricingPackage) => {
        setEditingPkg(pkg);
        setPkgForm({ ...pkg });
        setFeaturesText((pkg.features || []).join("\n"));
        setPkgDialogOpen(true);
    };

    const savePkg = async () => {
        if (!pkgForm.name.trim()) return toast({ title: "Name required", variant: "destructive" });
        setSaving(true);
        const slug = pkgForm.slug || slugify(pkgForm.name);
        const features = featuresText.split("\n").map(f => f.trim()).filter(Boolean);
        const payload = { ...pkgForm, slug, features };

        try {
            if (editingPkg) {
                const { error } = await supabase.from("pricing_packages").update(payload).eq("id", editingPkg.id);
                if (error) throw error;
                toast({ title: "Package updated" });
            } else {
                const { error } = await supabase.from("pricing_packages").insert(payload);
                if (error) throw error;
                toast({ title: "Package created" });
            }
            setPkgDialogOpen(false);
            fetchAll();
        } catch (err: any) {
            toast({ title: "Error", description: err?.message || "Failed to save package", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const deletePkg = async (id: string) => {
        if (!confirm("Delete this package?")) return;
        const { error } = await supabase.from("pricing_packages").delete().eq("id", id);
        if (error) {
            toast({ title: "Error", description: error.message || "Failed to delete package", variant: "destructive" });
            return;
        }
        fetchAll();
        toast({ title: "Package deleted" });
    };

    const togglePkg = async (pkg: PricingPackage) => {
        await supabase.from("pricing_packages").update({ is_enabled: !pkg.is_enabled }).eq("id", pkg.id);
        fetchAll();
    };

    const togglePopular = async (pkg: PricingPackage) => {
        // Only one can be popular
        await supabase.from("pricing_packages").update({ is_popular: false }).neq("id", pkg.id);
        await supabase.from("pricing_packages").update({ is_popular: !pkg.is_popular }).eq("id", pkg.id);
        fetchAll();
    };

    const movePkg = async (index: number, dir: -1 | 1) => {
        const newList = [...packages];
        const swapIdx = index + dir;
        if (swapIdx < 0 || swapIdx >= newList.length) return;
        [newList[index], newList[swapIdx]] = [newList[swapIdx], newList[index]];
        await Promise.all(newList.map((p, i) =>
            supabase.from("pricing_packages").update({ sort_order: i + 1 }).eq("id", p.id)
        ));
        fetchAll();
    };

    // ── Addons ────────────────────────────────────────────────────────────────
    const openNewAddon = () => {
        setEditingAddon(null);
        setAddonForm({ ...emptyAddon, sort_order: addons.length + 1 });
        setAddonDialogOpen(true);
    };

    const openEditAddon = (a: PricingAddon) => {
        setEditingAddon(a);
        setAddonForm({ ...a });
        setAddonDialogOpen(true);
    };

    const saveAddon = async () => {
        if (!addonForm.name.trim()) return toast({ title: "Name required", variant: "destructive" });
        setSaving(true);
        const slug = addonForm.slug || slugify(addonForm.name);
        const payload = { ...addonForm, slug };

        try {
            if (editingAddon) {
                const { error } = await supabase.from("pricing_addons").update(payload).eq("id", editingAddon.id);
                if (error) throw error;
                toast({ title: "Addon updated" });
            } else {
                const { error } = await supabase.from("pricing_addons").insert(payload);
                if (error) throw error;
                toast({ title: "Addon created" });
            }
            setAddonDialogOpen(false);
            fetchAll();
        } catch (err: any) {
            toast({ title: "Error", description: err?.message || "Failed to save addon", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const deleteAddon = async (id: string) => {
        if (!confirm("Delete this addon?")) return;
        const { error } = await supabase.from("pricing_addons").delete().eq("id", id);
        if (error) {
            toast({ title: "Error", description: error.message || "Failed to delete addon", variant: "destructive" });
            return;
        }
        fetchAll();
        toast({ title: "Addon deleted" });
    };

    const toggleAddon = async (a: PricingAddon) => {
        await supabase.from("pricing_addons").update({ is_enabled: !a.is_enabled }).eq("id", a.id);
        fetchAll();
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Pricing Management
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage service packages &amp; addons · Changes sync live to the public pricing page
                    </p>
                </div>
                <Link
                    to="/pricing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors border border-indigo-500/20 bg-indigo-500/5 rounded-lg px-3 py-1.5"
                >
                    <ExternalLink className="h-3 w-3" />
                    View Public Page
                </Link>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
            ) : (
                <Tabs defaultValue="packages" className="space-y-6">
                    <TabsList className="bg-white/5 border border-white/10">
                        <TabsTrigger value="packages" className="data-[state=active]:bg-indigo-600">
                            <Package className="h-4 w-4 mr-2" />
                            Packages ({packages.length})
                        </TabsTrigger>
                        <TabsTrigger value="addons" className="data-[state=active]:bg-indigo-600">
                            <Tag className="h-4 w-4 mr-2" />
                            Addon Services ({addons.length})
                        </TabsTrigger>
                        <TabsTrigger value="offer" className="data-[state=active]:bg-indigo-600 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-amber-400" />
                            Promotional Offer
                            {promotionalOffer.is_enabled ? (
                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            ) : (
                                <span className="text-[10px] text-gray-500 font-mono">(Disabled)</span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {/* ── PACKAGES TAB ── */}
                    <TabsContent value="packages" className="space-y-4">
                        <div className="flex justify-end">
                            <Button onClick={openNewPkg} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                                <Plus className="h-4 w-4" /> New Package
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {packages.map((pkg, idx) => (
                                <Card
                                    key={pkg.id}
                                    className={`bg-[#111] border transition-all ${pkg.is_enabled ? "border-white/10 hover:border-indigo-500/30" : "border-white/5 opacity-50"}`}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-4">
                                            {/* Sort Controls */}
                                            <div className="flex flex-col gap-1 shrink-0 mt-1">
                                                <Button size="icon" variant="ghost" className="h-5 w-5 p-0 text-gray-600 hover:text-white" onClick={() => movePkg(idx, -1)} disabled={idx === 0}>
                                                    <ChevronUp className="h-3 w-3" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-5 w-5 p-0 text-gray-600 hover:text-white" onClick={() => movePkg(idx, 1)} disabled={idx === packages.length - 1}>
                                                    <ChevronDown className="h-3 w-3" />
                                                </Button>
                                            </div>

                                            {/* Icon */}
                                            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shrink-0">
                                                <IconComponent name={pkg.icon_name} className="h-5 w-5 text-indigo-400" />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-semibold text-white">{pkg.name}</span>
                                                    {pkg.is_popular && (
                                                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
                                                            ⭐ Most Popular
                                                        </Badge>
                                                    )}
                                                    <Badge variant="outline" className="text-[10px] font-mono text-gray-500 border-white/10">
                                                        {pkg.slug}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-0.5 truncate">{pkg.description}</p>
                                                <div className="flex items-center gap-4 mt-2 flex-wrap">
                                                    {pkg.original_price !== pkg.discount_price && (
                                                        <span className="text-xs text-gray-500 line-through">{formatINR(pkg.original_price)}</span>
                                                    )}
                                                    <span className="text-sm font-bold text-green-400">{formatINR(pkg.discount_price)}</span>
                                                    <span className="text-[10px] text-gray-600">{pkg.features?.length || 0} features</span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                                                {/* Live toggle */}
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] text-gray-500">{pkg.is_enabled ? "Live" : "Hidden"}</span>
                                                    <Switch
                                                        checked={pkg.is_enabled}
                                                        onCheckedChange={() => togglePkg(pkg)}
                                                        className="data-[state=checked]:bg-green-600"
                                                    />
                                                </div>
                                                <Button
                                                    size="sm" variant="ghost"
                                                    className={`h-7 text-[10px] gap-1 ${pkg.is_popular ? "text-amber-400 hover:text-amber-300" : "text-gray-500 hover:text-amber-400"}`}
                                                    onClick={() => togglePopular(pkg)}
                                                    title="Toggle Most Popular"
                                                >
                                                    <Star className="h-3 w-3" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400 hover:text-white" onClick={() => openEditPkg(pkg)}>
                                                    <Edit className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/10" onClick={() => deletePkg(pkg.id)}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {packages.length === 0 && (
                                <div className="text-center py-16 text-gray-600">
                                    <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p>No pricing packages yet. Create one!</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* ── ADDONS TAB ── */}
                    <TabsContent value="addons" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                                Addons appear in the "Addons &amp; Extras" field suggestions in project forms.
                            </p>
                            <Button onClick={openNewAddon} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                                <Plus className="h-4 w-4" /> New Addon
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                            {addons.map(addon => (
                                <Card
                                    key={addon.id}
                                    className={`bg-[#111] border transition-all ${addon.is_enabled ? "border-white/10 hover:border-purple-500/30" : "border-white/5 opacity-50"}`}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <Tag className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                                                    <span className="text-sm font-semibold text-white truncate">{addon.name}</span>
                                                </div>
                                                {addon.description && (
                                                    <p className="text-[11px] text-gray-500 mt-1 truncate">{addon.description}</p>
                                                )}
                                                <span className="text-xs font-bold text-green-400 mt-1 inline-block">
                                                    {addon.price > 0 ? formatINR(addon.price) : "Pricing on request"}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5">
                                                <Switch
                                                    checked={addon.is_enabled}
                                                    onCheckedChange={() => toggleAddon(addon)}
                                                    className="data-[state=checked]:bg-green-600 scale-75"
                                                />
                                                <div className="flex gap-1">
                                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-gray-400 hover:text-white" onClick={() => openEditAddon(addon)}>
                                                        <Edit className="h-3 w-3" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-rose-500/40 hover:text-rose-500" onClick={() => deleteAddon(addon.id)}>
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {addons.length === 0 && (
                                <div className="col-span-full text-center py-16 text-gray-600">
                                    <Tag className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p>No addon services yet. Create one!</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* ── PROMOTIONAL OFFER TAB ── */}
                    <TabsContent value="offer" className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-transparent border border-amber-500/20">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-amber-400" />
                                    <h3 className="text-base font-semibold text-white">Public Promotional Offer Banner</h3>
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Configure the promotional campaign shown at the top of the public /pricing page. Changes take effect immediately.
                                </p>
                            </div>
                            <div className="flex items-center gap-3 bg-[#111] px-4 py-2 rounded-lg border border-white/10 shrink-0">
                                <Label htmlFor="offer-status-switch" className="text-xs font-medium cursor-pointer">
                                    {promotionalOffer.is_enabled ? (
                                        <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                            Offer Visible to Public
                                        </span>
                                    ) : (
                                        <span className="text-gray-400">Offer Hidden (Off)</span>
                                    )}
                                </Label>
                                <Switch
                                    id="offer-status-switch"
                                    checked={promotionalOffer.is_enabled}
                                    onCheckedChange={(checked) => setPromotionalOffer({ ...promotionalOffer, is_enabled: checked })}
                                    className="data-[state=checked]:bg-emerald-600"
                                />
                            </div>
                        </div>

                        <CouponStats code={(promotionalOffer.coupon_code || "").trim()} enabled={promotionalOffer.is_enabled} />

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Form Controls */}
                            <div className="lg:col-span-7 space-y-4">
                                <Card className="bg-[#111] border-white/10">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                                            <Gift className="h-4 w-4 text-indigo-400" />
                                            Campaign Configuration
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-gray-300">Badge Text</Label>
                                                <Input
                                                    value={promotionalOffer.badge_text}
                                                    onChange={(e) => setPromotionalOffer({ ...promotionalOffer, badge_text: e.target.value })}
                                                    placeholder="e.g. Exclusive Limited Offer"
                                                    className="bg-white/5 border-white/10 text-white text-xs"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-gray-300">Discount Callout</Label>
                                                <Input
                                                    value={promotionalOffer.discount_label}
                                                    onChange={(e) => setPromotionalOffer({ ...promotionalOffer, discount_label: e.target.value })}
                                                    placeholder="e.g. Save up to ₹50,000"
                                                    className="bg-white/5 border-white/10 text-white text-xs"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-gray-300">Headline / Title *</Label>
                                            <Input
                                                value={promotionalOffer.title}
                                                onChange={(e) => setPromotionalOffer({ ...promotionalOffer, title: e.target.value })}
                                                placeholder="e.g. Launch & Grow Special: Up to 35% OFF All Packages"
                                                className="bg-white/5 border-white/10 text-white text-xs font-semibold"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-gray-300">Description</Label>
                                            <Textarea
                                                rows={3}
                                                value={promotionalOffer.description}
                                                onChange={(e) => setPromotionalOffer({ ...promotionalOffer, description: e.target.value })}
                                                placeholder="Detailed description of what the offer includes..."
                                                className="bg-white/5 border-white/10 text-white text-xs resize-none"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-gray-300">Coupon Code</Label>
                                                <Input
                                                    value={promotionalOffer.coupon_code}
                                                    onChange={(e) => setPromotionalOffer({ ...promotionalOffer, coupon_code: e.target.value.toUpperCase() })}
                                                    placeholder="e.g. VAW35"
                                                    className="bg-white/5 border-white/10 text-amber-400 font-mono text-xs uppercase"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-gray-300">Offer Expiration Date</Label>
                                                <Input
                                                    type="date"
                                                    value={promotionalOffer.end_date}
                                                    onChange={(e) => setPromotionalOffer({ ...promotionalOffer, end_date: e.target.value })}
                                                    className="bg-white/5 border-white/10 text-white text-xs"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-gray-300">CTA Button Text</Label>
                                                <Input
                                                    value={promotionalOffer.button_text}
                                                    onChange={(e) => setPromotionalOffer({ ...promotionalOffer, button_text: e.target.value })}
                                                    placeholder="Claim Your Offer"
                                                    className="bg-white/5 border-white/10 text-white text-xs"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                                            <div>
                                                <p className="text-xs font-semibold text-amber-300">What does the coupon do?</p>
                                                <p className="text-[11px] text-gray-400">Visitors enter the code in their plan on /pricing. The discount is applied before 18% GST and recorded with their request.</p>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-gray-300">Discount type</Label>
                                                    <Select
                                                        value={promotionalOffer.discount_type ?? "none"}
                                                        onValueChange={(v) => setPromotionalOffer({ ...promotionalOffer, discount_type: v as PromotionalOffer["discount_type"] })}
                                                    >
                                                        <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="percent">Percentage off</SelectItem>
                                                            <SelectItem value="flat">Flat amount off (₹)</SelectItem>
                                                            <SelectItem value="none">No discount (record only)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-gray-300">
                                                        {promotionalOffer.discount_type === "flat" ? "Amount off (₹)" : "Percent off (%)"}
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        max={promotionalOffer.discount_type === "percent" ? 100 : undefined}
                                                        inputMode="decimal"
                                                        disabled={(promotionalOffer.discount_type ?? "none") === "none"}
                                                        value={promotionalOffer.discount_value ?? ""}
                                                        onChange={(e) => setPromotionalOffer({ ...promotionalOffer, discount_value: e.target.value === "" ? undefined : Number(e.target.value) })}
                                                        placeholder={promotionalOffer.discount_type === "flat" ? "e.g. 5000" : "e.g. 35"}
                                                        className="bg-white/5 border-white/10 text-white text-xs"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-gray-300">Applies to</Label>
                                                    <Select
                                                        value={promotionalOffer.applies_to ?? "all"}
                                                        onValueChange={(v) => setPromotionalOffer({ ...promotionalOffer, applies_to: v as PromotionalOffer["applies_to"] })}
                                                        disabled={(promotionalOffer.discount_type ?? "none") === "none"}
                                                    >
                                                        <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">Package + add-ons</SelectItem>
                                                            <SelectItem value="package">Package only</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            {(promotionalOffer.discount_type ?? "none") === "none" || !(Number(promotionalOffer.discount_value) > 0) ? (
                                                <p className="text-[11px] text-amber-300">
                                                    No discount value is set, so the code is only recorded on requests and customers see no price reduction.
                                                    {(() => {
                                                        const m = (promotionalOffer.title || "").match(/(\d{1,2})\s*%/);
                                                        return m ? (
                                                            <button
                                                                type="button"
                                                                className="ml-1 underline underline-offset-2 hover:text-white"
                                                                onClick={() => setPromotionalOffer({ ...promotionalOffer, discount_type: "percent", discount_value: Number(m[1]) })}
                                                            >
                                                                Use {m[1]}% from the headline
                                                            </button>
                                                        ) : null;
                                                    })()}
                                                </p>
                                            ) : null}
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs text-gray-300">Key Inclusions / Perks (One per line)</Label>
                                                <span className="text-[10px] text-gray-500">
                                                    {highlightsText.split("\n").filter(Boolean).length} bullet(s)
                                                </span>
                                            </div>
                                            <Textarea
                                                rows={4}
                                                value={highlightsText}
                                                onChange={(e) => setHighlightsText(e.target.value)}
                                                placeholder={"Free 1-Year Cloud Hosting\nFree Custom Domain (.com / .in)\nSSL Security & Malware Protection\nDedicated Tech Lead & Priority Support"}
                                                className="bg-white/5 border-white/10 text-white text-xs font-mono resize-none"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-xs text-gray-400 hover:text-white"
                                                onClick={() => {
                                                    setPromotionalOffer(defaultOffer);
                                                    setHighlightsText((defaultOffer.highlights || []).join("\n"));
                                                }}
                                            >
                                                Reset to Default
                                            </Button>
                                            <Button
                                                onClick={saveOffer}
                                                disabled={savingOffer}
                                                className="bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white gap-2 text-xs font-semibold"
                                            >
                                                {savingOffer ? (
                                                    <>
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="h-3.5 w-3.5" /> Save &amp; Publish Offer
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Live Public Preview */}
                            <div className="lg:col-span-5 space-y-3">
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                                        <Eye className="h-3.5 w-3.5 text-indigo-400" /> Live Preview on /pricing
                                    </span>
                                    {promotionalOffer.is_enabled ? (
                                        <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px] border-emerald-500/30">
                                            Previewing Active
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-gray-500 text-[10px] border-white/10">
                                            Hidden on Live Site
                                        </Badge>
                                    )}
                                </div>

                                <div className={`relative rounded-2xl p-6 border transition-all ${
                                    promotionalOffer.is_enabled
                                        ? "bg-gradient-to-br from-[#13111C] via-[#101018] to-[#0D1527] border-amber-500/30 shadow-xl shadow-amber-500/5"
                                        : "bg-[#111]/60 border-white/5 opacity-60"
                                }`}>
                                    {!promotionalOffer.is_enabled && (
                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center p-4 text-center z-10">
                                            <EyeOff className="h-8 w-8 text-gray-500 mb-2" />
                                            <p className="text-sm font-semibold text-gray-300">Offer is currently Disabled</p>
                                            <p className="text-xs text-gray-500 mt-1 max-w-xs">
                                                Enable the switch above to display this promotional banner on the public /pricing page.
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs px-2.5 py-0.5 font-medium flex items-center gap-1.5">
                                            <Sparkles className="h-3 w-3 text-amber-400" />
                                            {promotionalOffer.badge_text || "Special Offer"}
                                        </Badge>
                                        {promotionalOffer.discount_label && (
                                            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                                {promotionalOffer.discount_label}
                                            </span>
                                        )}
                                    </div>

                                    <h4 className="text-lg font-bold text-white mb-2 leading-snug">
                                        {promotionalOffer.title || "Limited Time Promotional Offer"}
                                    </h4>

                                    <p className="text-xs text-gray-400 mb-4 line-clamp-3">
                                        {promotionalOffer.description || "Take advantage of our limited period pricing discount."}
                                    </p>

                                    {/* Highlights list */}
                                    <div className="space-y-1.5 mb-4">
                                        {highlightsText.split("\n").filter(Boolean).map((highlight, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                                                <CheckCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                                                <span>{highlight}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Coupon & End Date */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 mb-4">
                                        <div>
                                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Use Coupon Code</span>
                                            <span className="text-sm font-mono font-bold text-amber-400">
                                                {promotionalOffer.coupon_code || "N/A"}
                                            </span>
                                        </div>
                                        {promotionalOffer.end_date && (
                                            <div className="text-right">
                                                <span className="text-[10px] text-gray-400 uppercase tracking-wider block flex items-center gap-1 justify-end">
                                                    <Clock className="h-3 w-3 text-gray-400" /> Expires On
                                                </span>
                                                <span className="text-xs font-medium text-white">
                                                    {promotionalOffer.end_date}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <Button className="w-full bg-gradient-to-r from-amber-500 to-indigo-600 text-white text-xs font-semibold h-9 shadow-md pointer-events-none">
                                        {promotionalOffer.button_text || "Claim Offer"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            )}

            {/* ── Package Dialog ── */}
            <Dialog open={pkgDialogOpen} onOpenChange={setPkgDialogOpen}>
                <DialogContent className="bg-[#0f0f0f] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingPkg ? "Edit Package" : "New Pricing Package"}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-1.5">
                                <Label>Package Name *</Label>
                                <Input
                                    value={pkgForm.name}
                                    onChange={e => setPkgForm({ ...pkgForm, name: e.target.value, slug: slugify(e.target.value) })}
                                    placeholder="e.g. E-commerce Platform"
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label>Slug (auto)</Label>
                                <Input
                                    value={pkgForm.slug}
                                    onChange={e => setPkgForm({ ...pkgForm, slug: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white font-mono text-xs"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label>Icon</Label>
                                <select
                                    value={pkgForm.icon_name}
                                    onChange={e => setPkgForm({ ...pkgForm, icon_name: e.target.value })}
                                    className="w-full h-9 rounded-md bg-white/5 border border-white/10 text-white px-3 text-sm"
                                >
                                    {ICON_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-span-2 space-y-1.5">
                                <Label>Description</Label>
                                <Input
                                    value={pkgForm.description}
                                    onChange={e => setPkgForm({ ...pkgForm, description: e.target.value })}
                                    placeholder="Brief description for pricing page"
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label>Original Price (₹)</Label>
                                <Input
                                    type="number"
                                    value={pkgForm.original_price}
                                    onChange={e => setPkgForm({ ...pkgForm, original_price: parseFloat(e.target.value) || 0 })}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label>Discount Price (₹)</Label>
                                <Input
                                    type="number"
                                    value={pkgForm.discount_price}
                                    onChange={e => setPkgForm({ ...pkgForm, discount_price: parseFloat(e.target.value) || 0 })}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>

                            <div className="col-span-2 space-y-1.5">
                                <Label>Features (one per line)</Label>
                                <Textarea
                                    value={featuresText}
                                    onChange={e => setFeaturesText(e.target.value)}
                                    rows={6}
                                    placeholder={"Professional Website Design\nFree Domain for 1 Year\nSSL Certificate"}
                                    className="bg-white/5 border-white/10 text-white resize-none font-mono text-xs"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <Switch
                                    checked={pkgForm.is_enabled}
                                    onCheckedChange={v => setPkgForm({ ...pkgForm, is_enabled: v })}
                                    className="data-[state=checked]:bg-green-600"
                                />
                                <Label>{pkgForm.is_enabled ? "Live on pricing page" : "Hidden"}</Label>
                            </div>

                            <div className="flex items-center gap-3">
                                <Switch
                                    checked={pkgForm.is_popular}
                                    onCheckedChange={v => setPkgForm({ ...pkgForm, is_popular: v })}
                                    className="data-[state=checked]:bg-amber-500"
                                />
                                <Label>Most Popular badge</Label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" onClick={() => setPkgDialogOpen(false)}>Cancel</Button>
                            <Button onClick={savePkg} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                {editingPkg ? "Save Changes" : "Create Package"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Addon Dialog ── */}
            <Dialog open={addonDialogOpen} onOpenChange={setAddonDialogOpen}>
                <DialogContent className="bg-[#0f0f0f] border-white/10 text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingAddon ? "Edit Addon" : "New Addon Service"}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label>Addon Name *</Label>
                            <Input
                                value={addonForm.name}
                                onChange={e => setAddonForm({ ...addonForm, name: e.target.value, slug: slugify(e.target.value) })}
                                placeholder="e.g. SEO Optimization"
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Description</Label>
                            <Input
                                value={addonForm.description}
                                onChange={e => setAddonForm({ ...addonForm, description: e.target.value })}
                                placeholder="Short description"
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Price (₹) — 0 for "Pricing on request"</Label>
                            <Input
                                type="number"
                                value={addonForm.price}
                                onChange={e => setAddonForm({ ...addonForm, price: parseFloat(e.target.value) || 0 })}
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <Switch
                                checked={addonForm.is_enabled}
                                onCheckedChange={v => setAddonForm({ ...addonForm, is_enabled: v })}
                                className="data-[state=checked]:bg-green-600"
                            />
                            <Label>{addonForm.is_enabled ? "Enabled" : "Disabled"}</Label>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" onClick={() => setAddonDialogOpen(false)}>Cancel</Button>
                            <Button onClick={saveAddon} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                {editingAddon ? "Save Changes" : "Create Addon"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
