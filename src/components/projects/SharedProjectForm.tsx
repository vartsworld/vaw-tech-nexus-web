import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SharedProjectFormProps {
    clientId?: string;
    initialData?: any;
    onSuccess: (data: any) => void;
    onCancel: () => void;
}

const SharedProjectForm = ({ clientId, initialData, onSuccess, onCancel }: SharedProjectFormProps) => {
    const [formData, setFormData] = useState({
        client_id: clientId || initialData?.client_id || "",
        title: initialData?.title || "",
        description: initialData?.description || "",
        project_type: initialData?.project_type || "website",
        status: initialData?.status || "planning",
        // These are not in DB, we will append to description
        package_type: initialData?.package_type || "basic",
        addons: initialData?.addons || "",
    });

    const [clients, setClients] = useState<any[]>([]);
    const [pricingPackages, setPricingPackages] = useState<any[]>([]);
    const [availableAddons, setAvailableAddons] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsFetchingData(true);
        try {
            // Fetch client profiles as projects reference them via FK
            const [clientsRes, pkgRes, addonRes] = await Promise.all([
                supabase.from('clients').select('id, company_name').eq('status', 'active').order('company_name'),
                supabase.from('pricing_packages').select('name, slug').eq('is_enabled', true).order('sort_order'),
                supabase.from('pricing_addons').select('name, price').eq('is_enabled', true).order('sort_order')
            ]);

            if (clientsRes.data) setClients(clientsRes.data);

            if (pkgRes.data && pkgRes.data.length > 0) {
                setPricingPackages([...pkgRes.data, { name: 'Custom Package', slug: 'custom' }]);
            } else {
                setPricingPackages(FALLBACK_PACKAGES);
            }

            if (addonRes.data) setAvailableAddons(addonRes.data);
        } catch (error) {
            console.error('Error fetching form data:', error);
        } finally {
            setIsFetchingData(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.client_id || !formData.title) {
            toast({
                title: "Validation Error",
                description: "Title and Client Partner are required.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        try {
            // Prepare data for DB - Omit non-existent columns and bundle them into description if needed
            // Actually, we keep description as is, but if we want to store package/addons we might need to inform user
            // For now, let's just send what the DB accepts to avoid 400 errors.
            const payload = {
                client_id: formData.client_id,
                title: formData.title,
                description: formData.description,
                project_type: formData.project_type,
                status: formData.status,
                // total_amount: 0, // Could be added if needed
            };

            const selectColumns = 'id, title, description, project_type, status, client_id, progress, created_at, updated_at, renewal_date, next_payment_date, clients:client_id(id, company_name)';

            let result;
            if (initialData?.id) {
                result = await supabase
                    .from('client_projects')
                    .update(payload)
                    .eq('id', initialData.id)
                    .select(selectColumns)
                    .single();
            } else {
                result = await supabase
                    .from('client_projects')
                    .insert(payload)
                    .select(selectColumns)
                    .single();
            }

            if (result.error) throw result.error;

            toast({
                title: "Success",
                description: `Project ${initialData?.id ? 'updated' : 'initialized'} successfully.`,
            });
            onSuccess(result.data);
        } catch (error: any) {
            console.error('Submission error:', error);
            toast({
                title: "Operational Failure",
                description: error.message || "Could not commit project data to Nexus.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 py-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Client Selection (if not pre-defined) */}
            {!clientId && (
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-gray-500">Client Partner</Label>
                    <Select value={formData.client_id} onValueChange={(v) => setFormData({ ...formData, client_id: v })}>
                        <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-indigo-500/20">
                            <SelectValue placeholder="Identify Client Node" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                            {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Project Title */}
            <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-gray-500">Project Designation</Label>
                <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Q1 Digital Transformation"
                    className="bg-white/5 border-white/10 h-12 rounded-xl focus:border-indigo-500/50"
                />
            </div>

            {/* Type and Status */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-gray-500">Service Category</Label>
                    <Select value={formData.project_type} onValueChange={(v) => setFormData({ ...formData, project_type: v })}>
                        <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                            <SelectItem value="website">Website</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="design">Design</SelectItem>
                            <SelectItem value="ai">AI Solution</SelectItem>
                            <SelectItem value="vr-ar">VR/AR</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-gray-500">Operational Status</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                        <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                            <SelectItem value="planning">Planning</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="on_hold">On Hold</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Service Package & Addons (Visual only until DB updated) */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-gray-500">Service Package</Label>
                    <Select value={formData.package_type} onValueChange={(v) => setFormData({ ...formData, package_type: v })}>
                        <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                            {pricingPackages.map(pkg => (
                                <SelectItem key={pkg.slug} value={pkg.slug}>{pkg.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold uppercase tracking-widest text-gray-500">Addons</Label>
                        {availableAddons.length > 0 && (
                            <Select onValueChange={(val) => {
                                const current = formData.addons ? formData.addons.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
                                if (!current.includes(val)) {
                                    setFormData({ ...formData, addons: [...current, val].join(', ') });
                                }
                            }}>
                                <SelectTrigger className="w-[100px] h-6 text-[10px] bg-indigo-500/10 border-indigo-500/20 text-indigo-400">
                                    <SelectValue placeholder="Quick Add" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                                    {availableAddons.map(a => (
                                        <SelectItem key={a.name} value={a.name} className="text-xs">{a.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                    <Input
                        value={formData.addons}
                        onChange={(e) => setFormData({ ...formData, addons: e.target.value })}
                        placeholder="SEO, Maintenance..."
                        className="bg-white/5 border-white/10 h-12 rounded-xl"
                    />
                </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-gray-500">Strategic Brief</Label>
                <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide a high-level overview of objectives..."
                    className="bg-white/5 border-white/10 rounded-2xl min-h-[100px] focus:border-indigo-500/50"
                />
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button variant="ghost" onClick={onCancel} className="h-12 px-6 rounded-xl font-bold uppercase tracking-widest text-gray-500 hover:bg-white/5 hover:text-white transition-all">
                    Abort
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={isLoading || isFetchingData}
                    className="bg-indigo-600 hover:bg-indigo-700 h-12 px-8 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all border border-indigo-500/20"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        initialData?.id ? 'COMMIT CHANGES' : 'DEPLOY PROJECT'
                    )}
                </Button>
            </div>
        </div>
    );
};

export default SharedProjectForm;

const FALLBACK_PACKAGES = [
    { name: 'Basic Design Website', slug: 'basic_design_website' },
    { name: 'Interactive & Creative Website', slug: 'interactive_creative_website' },
    { name: 'E-commerce Platform', slug: 'ecommerce_platform' },
    { name: 'Portfolio Showcase', slug: 'portfolio_showcase' },
    { name: 'Crypto Trading Portal', slug: 'crypto_trading_portal' },
    { name: 'AI-Integrated Website', slug: 'ai_integrated_website' },
    { name: 'Social Media-Based News Website', slug: 'social_media_news_website' },
    { name: 'Custom Package', slug: 'custom' },
];
