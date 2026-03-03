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
import {
    Plus, Edit, Trash2, Star, Tag, Globe, Zap, Shield, TrendingUp, Bot,
    Loader2, Eye, EyeOff, GripVertical, ChevronUp, ChevronDown, Package,
    DollarSign, Sparkles, ToggleLeft, ToggleRight, ExternalLink
} from "lucide-react";

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
            const [pkgRes, addonRes] = await Promise.all([
                supabase.from("pricing_packages").select("*").order("sort_order"),
                supabase.from("pricing_addons").select("*").order("sort_order"),
            ]);
            if (pkgRes.data) setPackages(pkgRes.data);
            if (addonRes.data) setAddons(addonRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
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
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const deletePkg = async (id: string) => {
        if (!confirm("Delete this package?")) return;
        await supabase.from("pricing_packages").delete().eq("id", id);
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
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const deleteAddon = async (id: string) => {
        if (!confirm("Delete this addon?")) return;
        await supabase.from("pricing_addons").delete().eq("id", id);
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
                <a
                    href="/pricing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors border border-indigo-500/20 bg-indigo-500/5 rounded-lg px-3 py-1.5"
                >
                    <ExternalLink className="h-3 w-3" />
                    View Public Page
                </a>
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
