import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter
} from "@/components/ui/card";
import {
    User,
    Shield,
    Bell,
    Smartphone,
    Fingerprint,
    Key,
    Globe,
    Camera,
    RotateCcw,
    CheckCircle2,
    Lock,
    Eye,
    Activity,
    Award,
    AlertCircle,
    CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ClientSettings = ({ profile, onProfileUpdate }: { profile: any, onProfileUpdate?: () => void }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        contact_person: profile?.contact_person || "",
        company_name: profile?.company_name || "",
        phone: profile?.phone || "",
        address: profile?.address || ""
    });
    const [stats, setStats] = useState({
        projectCount: 0,
        supportCount: 0,
        joinedDate: profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "N/A"
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                contact_person: profile.contact_person || "",
                company_name: profile.company_name || "",
                phone: profile.phone || "",
                address: profile.address || ""
            });
            fetchExtraData();
        }
    }, [profile]);

    const fetchExtraData = async () => {
        if (!profile?.id) return;
        
        const { count: projectCount } = await supabase
            .from("client_projects")
            .select("*", { count: 'exact', head: true })
            .eq("client_id", profile.id);

        const { count: supportCount } = await supabase
            .from("client_feedback")
            .select("*", { count: 'exact', head: true })
            .eq("client_id", profile.id);

        setStats(prev => ({
            ...prev,
            projectCount: projectCount || 0,
            supportCount: supportCount || 0
        }));
    };

    const [permissions, setPermissions] = useState<any>({
        camera: 'prompt',
        microphone: 'prompt',
        notifications: 'prompt',
        geolocation: 'prompt'
    });

    const checkPermissions = async () => {
        const check = async (name: string) => {
            try {
                // @ts-ignore
                const result = await navigator.permissions.query({ name });
                return result.state;
            } catch (e) {
                return 'unknown';
            }
        };

        setPermissions({
            camera: await check('camera'),
            microphone: await check('microphone'),
            notifications: await check('notifications'),
            geolocation: await check('geolocation')
        });
    };

    const requestPermission = async (type: string) => {
        try {
            switch (type) {
                case 'camera':
                    await navigator.mediaDevices.getUserMedia({ video: true });
                    break;
                case 'microphone':
                    await navigator.mediaDevices.getUserMedia({ audio: true });
                    break;
                case 'geolocation':
                    navigator.geolocation.getCurrentPosition(() => { });
                    break;
                case 'notifications':
                    await Notification.requestPermission();
                    break;
            }
            toast.success(`${type.toUpperCase()} protocol authorized.`);
            checkPermissions();
            // Haptic feedback
            if ('vibrate' in navigator) navigator.vibrate(50);
        } catch (e) {
            toast.error(`Authorization failure for ${type}`);
        }
    };

    useState(() => {
        checkPermissions();
    });

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        // Haptic
        if ('vibrate' in navigator) navigator.vibrate([10, 30, 10]);
        setLoading(true);
        try {
            const { error } = await supabase
                .from("client_profiles")
                .update({
                    ...formData,
                    updated_at: new Date().toISOString()
                })
                .eq("id", profile.id);

            if (error) throw error;
            toast.success("Profile nexus synchronized.");
            if (onProfileUpdate) onProfileUpdate();
        } catch (error: any) {
            toast.error(`Update failure: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-black/40 backdrop-blur-xl border border-tech-gold/10 p-8 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-tech-gold/5 blur-[80px]" />
                <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-2xl bg-tech-gold/10 border border-tech-gold/20 flex items-center justify-center group overflow-hidden relative">
                             {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                            ) : (
                                <User className="w-8 h-8 text-tech-gold" />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                                <Camera className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-white m-0 leading-none">{profile?.contact_person}</h1>
                            <p className="text-tech-gold font-bold uppercase tracking-[0.2em] text-[10px] mt-2 italic flex items-center gap-2">
                                <Badge className="bg-tech-gold/10 text-tech-gold border-tech-gold/20 text-[8px] h-4">VIP</Badge>
                                Enterprise Tier Client
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 relative z-10 w-full md:w-auto">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Client Since</p>
                        <p className="text-sm font-bold text-white">{stats.joinedDate}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Active Solutions</p>
                        <p className="text-sm font-bold text-white">{stats.projectCount} Nodes</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Support Query</p>
                        <p className="text-sm font-bold text-white">{stats.supportCount} Records</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-black/40 backdrop-blur-xl border-tech-gold/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-tech-gold/5 blur-[40px]" />
                        <CardHeader>
                            <CardTitle className="text-xl font-black text-white flex items-center gap-2">
                                <Activity className="w-5 h-5 text-tech-gold" />
                                Nexus Profile Matrix
                            </CardTitle>
                            <CardDescription className="text-gray-400">Synchronize your identification parameters with the core database.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black text-gray-500 uppercase tracking-widest">Identity Designation</Label>
                                        <Input
                                            value={formData.contact_person}
                                            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                                            className="bg-white/5 border-tech-gold/20 text-white rounded-xl h-12 focus:ring-tech-gold/20"
                                            placeholder="Full Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black text-gray-500 uppercase tracking-widest">Corporate Entity</Label>
                                        <Input
                                            value={formData.company_name}
                                            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                            className="bg-white/5 border-tech-gold/20 text-white rounded-xl h-12 focus:ring-tech-gold/20"
                                            placeholder="Company Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black text-gray-500 uppercase tracking-widest">Comm Channel (Email)</Label>
                                        <Input value={profile.email} disabled className="bg-black/40 border-tech-gold/10 text-gray-500 rounded-xl h-12 cursor-not-allowed" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black text-gray-500 uppercase tracking-widest">Comm Channel (Phone)</Label>
                                        <Input
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="bg-white/5 border-tech-gold/20 text-white rounded-xl h-12 focus:ring-tech-gold/20"
                                            placeholder="Primary contact number"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-gray-500 uppercase tracking-widest">Physical Coordinate (Address)</Label>
                                    <Input
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="bg-white/5 border-tech-gold/20 text-white rounded-xl h-12 focus:ring-tech-gold/20"
                                        placeholder="Full business address"
                                    />
                                </div>
                                <div className="pt-4 border-t border-white/5">
                                    <Button
                                        type="submit"
                                        className="bg-tech-gold hover:bg-white text-black font-black h-12 px-12 rounded-xl transition-all shadow-lg shadow-tech-gold/10"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <div className="flex items-center gap-2">
                                                <RotateCcw className="w-4 h-4 animate-spin" />
                                                SYNCHRONIZING...
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4" />
                                                UPDATE MATRIX
                                            </div>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>


                    <Card className="bg-black/40 backdrop-blur-xl border-tech-red/10 overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-xl font-black text-white flex items-center gap-2">
                                <Shield className="w-5 h-5 text-tech-red" />
                                Security Protocol Alpha
                            </CardTitle>
                            <CardDescription className="text-gray-400">Manage encryption keys and access authorization.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-500/10 rounded-xl">
                                        <Fingerprint className="w-6 h-6 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">Biometric MFA</p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Secondary verification layer</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-[10px] text-gray-500 border-gray-500/30 uppercase">Not Initialized</Badge>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-tech-gold/10 rounded-xl">
                                        <Lock className="w-6 h-6 text-tech-gold" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">Full-Stream Encryption</p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">AES-256 data tunnel active</p>
                                    </div>
                                </div>
                                <Badge className="bg-tech-gold/10 text-tech-gold border-tech-gold/20 uppercase font-black text-[8px]">ENABLED</Badge>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-tech-red/5 border-t border-tech-red/10 p-6 flex flex-col items-start gap-4">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-tech-red" />
                                <p className="text-[10px] font-black text-tech-red uppercase tracking-widest">Safety Protocol Note</p>
                            </div>
                            <p className="text-xs text-gray-400 font-medium italic">
                                Termination of enterprise accounts is restricted. Please contact your dedicated account manager for node decommissioning.
                            </p>
                        </CardFooter>
                    </Card>
                </div>

                {/* Notifications & Misc Sidebar */}
                <div className="space-y-6">
                    <Card className="bg-black/40 backdrop-blur-xl border-tech-gold/10">
                        <CardHeader>
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-tech-gold">Transmission Filter</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-tech-gold/10 rounded-xl">
                                        <Bell className="w-6 h-6 text-tech-gold" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">Real-time Signals</p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Browser-level alerts</p>
                                    </div>
                                </div>
                                <Switch 
                                    checked={permissions.notifications === 'granted'}
                                    onCheckedChange={() => requestPermission('notifications')}
                                    disabled={permissions.notifications === 'denied'}
                                />
                            </div>

                            <div className="h-px bg-white/5 my-2" />
                            {[
                                { label: "Project Phase Shift", desc: "Phase completions", icon: Activity, status: "Subscribed" },
                                { label: "Financial Nodes", desc: "Payments/Invoices", icon: CreditCard, status: "Active" },
                                { label: "Global Advisories", desc: "Maintenance status", icon: Globe, status: "Active" },
                                { label: "Success Tokens", desc: "Milestone достижения", icon: Award, status: "Enabled" },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/5 rounded-lg group-hover:bg-tech-gold/10 transition-colors">
                                            <item.icon className="w-4 h-4 text-gray-400 group-hover:text-tech-gold transition-colors" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white">{item.label}</p>
                                            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black">{item.desc}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-tech-gold/70">{item.status}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-tech-gold/20 via-tech-purple/20 to-tech-blue/20 border-tech-gold/30 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-cyber-grid pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity" />
                        <CardContent className="p-8 text-center relative z-10">
                            <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border-2 border-tech-gold shadow-lg shadow-tech-gold/30 rotate-3 group-hover:rotate-0 transition-transform">
                                <Award className="w-10 h-10 text-tech-gold" />
                            </div>
                            <h4 className="text-2xl font-black text-white mb-2 tracking-tighter">NEXUS ELITE</h4>
                            <p className="text-[10px] text-tech-gold font-black uppercase tracking-[0.3em] mb-4">Enterprise Division</p>
                            <div className="h-px bg-white/10 my-6" />
                            <p className="text-xs text-gray-300 font-medium leading-relaxed px-2">
                                Your account is authorized for prioritized hardware sync cycles and 24/7 technical node access.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};


export default ClientSettings;
