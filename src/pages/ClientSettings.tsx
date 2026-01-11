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

    useEffect(() => {
        if (profile) {
            setFormData({
                contact_person: profile.contact_person || "",
                company_name: profile.company_name || "",
                phone: profile.phone || "",
                address: profile.address || ""
            });
        }
    }, [profile]);

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
                .update(formData)
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
            <div>
                <h1 className="text-3xl font-black tracking-tight text-white mb-2">ACCOUNT <span className="text-tech-gold uppercase">SETTINGS</span></h1>
                <p className="text-gray-400 font-medium italic">Manage your profile, security, and notification preferences.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-black/40 backdrop-blur-xl border-tech-gold/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-tech-gold/5 blur-[40px]" />
                        <CardHeader>
                            <CardTitle className="text-xl font-black text-white flex items-center gap-2">
                                <User className="w-5 h-5 text-tech-gold" />
                                Profile Details
                            </CardTitle>
                            <CardDescription className="text-gray-400">Update your personal and company information.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black text-gray-500 uppercase tracking-widest">Full Name</Label>
                                        <Input
                                            value={formData.contact_person}
                                            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                                            className="bg-white/5 border-tech-gold/20 text-white rounded-xl h-12 focus:ring-tech-gold/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black text-gray-500 uppercase tracking-widest">Company Name</Label>
                                        <Input
                                            value={formData.company_name}
                                            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                            className="bg-white/5 border-tech-gold/20 text-white rounded-xl h-12 focus:ring-tech-gold/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black text-gray-500 uppercase tracking-widest">Email Address</Label>
                                        <Input value={profile.email} disabled className="bg-black/40 border-tech-gold/10 text-gray-500 rounded-xl h-12 cursor-not-allowed" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black text-gray-500 uppercase tracking-widest">Phone Number</Label>
                                        <Input
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="bg-white/5 border-tech-gold/20 text-white rounded-xl h-12 focus:ring-tech-gold/20"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-gray-500 uppercase tracking-widest">Address</Label>
                                    <Input
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="bg-white/5 border-tech-gold/20 text-white rounded-xl h-12 focus:ring-tech-gold/20"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="bg-tech-gold hover:bg-white text-black font-black h-12 px-8 rounded-xl transition-all shadow-lg shadow-tech-gold/10"
                                    disabled={loading}
                                >
                                    {loading ? "Saving..." : "Save Changes"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>


                    <Card className="bg-black/40 backdrop-blur-xl border-tech-red/10 overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-xl font-black text-white flex items-center gap-2">
                                <Shield className="w-5 h-5 text-tech-red" />
                                Security
                            </CardTitle>
                            <CardDescription className="text-gray-400">Security preferences and access control.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-500/10 rounded-xl">
                                        <Fingerprint className="w-6 h-6 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">Two-Factor Authentication</p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Secondary security layer</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-[10px] text-gray-500 border-gray-500/30 uppercase">Option Unavailable</Badge>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-tech-gold/10 rounded-xl">
                                        <Lock className="w-6 h-6 text-tech-gold" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">Advanced Encryption</p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">AES-256 Protocol active</p>
                                    </div>
                                </div>
                                <Badge className="bg-tech-gold/10 text-tech-gold border-tech-gold/20 uppercase font-black text-[8px]">Enforced</Badge>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-tech-red/5 border-t border-tech-red/10 p-6 flex flex-col items-start gap-4">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-tech-red" />
                                <p className="text-[10px] font-black text-tech-red uppercase tracking-widest">Safety Protocol Note</p>
                            </div>
                            <p className="text-xs text-gray-400 font-medium">
                                Account termination is disabled for Enterprise Clients via this portal. Contact Support for assistance.
                            </p>
                        </CardFooter>
                    </Card>
                </div>

                {/* Notifications & Misc Sidebar */}
                <div className="space-y-6">
                    <Card className="bg-black/40 backdrop-blur-xl border-tech-gold/10">
                        <CardHeader>
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-tech-gold">Notification Preferences</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-tech-gold/10 rounded-xl">
                                        <Bell className="w-6 h-6 text-tech-gold" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">Device Notifications</p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Browser alerts</p>
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
                                { label: "Critical Updates", desc: "Project phase mutations", icon: Activity, status: "Active" },
                                { label: "Financial Signals", desc: "Invoices and receipts", icon: CreditCard, status: "Active" },
                                { label: "Tech Advisories", desc: "Digital design changes", icon: Globe, status: "Subscribed" },
                                { label: "Milestone Node", desc: "Project completions", icon: Award, status: "Active" },
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

                    <Card className="bg-gradient-to-br from-tech-gold/20 to-tech-purple/20 border-tech-gold/30">
                        <CardContent className="p-6 text-center">
                            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-tech-gold animate-pulse-gentle">
                                <Award className="w-8 h-8 text-tech-gold" />
                            </div>
                            <h4 className="text-xl font-black text-white mb-1">ENTERPRISE TIER</h4>
                            <p className="text-xs text-tech-gold font-black uppercase tracking-widest mb-4">Nexus Authorized Participant</p>
                            <div className="h-px bg-white/10 my-4" />
                            <p className="text-[10px] text-gray-300 font-medium px-4">
                                Your account has prioritised access to all tech nodes and 48-hour hardware sync cycles.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ClientSettings;
