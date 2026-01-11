import { useState, useEffect } from "react";
import { useNavigate, Routes, Route, Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Briefcase,
    CreditCard,
    MessageSquare,
    Settings,
    LogOut,
    Menu,
    X,
    Bell,
    ChevronRight,
    User,
    Shield,
    Clock,
    ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Sub-components (to be implemented)
import DashboardOverview from "./DashboardOverview";
import ProjectExplorer from "./ProjectExplorer";
import FinancialHub from "./FinancialHub";
import SupportNexus from "./SupportNexus";
import ClientSettings from "./ClientSettings";
import ClientNotificationCenter from "@/components/client/NotificationCenter";

const ClientDashboard = () => {
    // Sidebar closed by default on mobile (< 1024px), open on desktop
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        checkUser();

        // Handle window resize
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };

        window.addEventListener('resize', handleResize);

        // Auto-refresh every 5 minutes as per requirement
        const interval = setInterval(() => {
            checkUser();
            toast.info("Data synchronized.", { duration: 2000 });
        }, 5 * 60 * 1000);

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', handleResize);
        }
    }, []);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate("/client/login");
            return;
        }

        const { data: profile, error } = await supabase
            .from("client_profiles")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

        if (error) {
            console.error("Error fetching profile:", error);
        }

        if (!profile) {
            const newProfile = {
                user_id: user.id,
                email: user.email,
                contact_person: user.user_metadata?.full_name || user.email?.split('@')[0] || "Valued Client",
                company_name: user.user_metadata?.company_name || "New Client Account",
            };

            const { data: insertedProfile, error: insertError } = await supabase
                .from("client_profiles")
                .insert(newProfile)
                .select()
                .single();

            if (insertError) {
                console.error("Error creating profile:", insertError);
                setProfile({ ...newProfile, id: "temp" });
                toast.error("Limited access: Could not initialize permanent profile.");
            } else {
                setProfile(insertedProfile);
            }
        } else {
            setProfile(profile);
        }
        setLoading(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        toast.success("Logged out successfully");
        navigate("/client/login");
    };

    const menuItems = [
        { icon: LayoutDashboard, label: "Overview", path: "/client/dashboard" },
        { icon: Briefcase, label: "Projects", path: "/client/dashboard/projects" },
        { icon: CreditCard, label: "Financials", path: "/client/dashboard/financials" },
        { icon: MessageSquare, label: "Support", path: "/client/dashboard/support" },
        { icon: Settings, label: "Settings", path: "/client/dashboard/settings" },
    ];

    if (loading) {
        return (
            <div className="h-screen w-full bg-black flex items-center justify-center">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-tech-gold/20 border-t-tech-gold rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 bg-tech-gold rounded-full animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-[#050505] text-white flex overflow-hidden">
            {/* Sidebar */}
            <AnimatePresence mode="wait">
                {isSidebarOpen && (
                    <motion.aside
                        initial={{ x: -300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed inset-y-0 left-0 z-50 w-72 bg-black/80 backdrop-blur-2xl border-r border-tech-gold/10 flex flex-col lg:relative"
                    >
                        <div className="p-6 border-b border-tech-gold/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-tech-gold rounded-xl shadow-lg shadow-tech-gold/20">
                                    <img
                                        src="/lovable-uploads/0d3e4545-c80e-401b-82f1-3319db5155b4.png"
                                        alt="Logo"
                                        className="w-8 h-8 rounded-lg object-cover"
                                    />
                                </div>
                                <div>
                                    <h2 className="font-black tracking-tighter text-lg leading-none">CLIENT <span className="text-tech-gold">PORTAL</span></h2>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-1 font-bold">Client Access</p>
                                </div>
                            </div>
                            {/* Mobile Close Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="lg:hidden text-gray-400 hover:text-white"
                                onClick={() => setIsSidebarOpen(false)}
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <nav className="flex-1 p-4 space-y-2 mt-4">
                            {menuItems.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => window.innerWidth < 1024 && setIsSidebarOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative",
                                            isActive
                                                ? "bg-tech-gold/10 text-tech-gold border border-tech-gold/20"
                                                : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                                        )}
                                    >
                                        <item.icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", isActive && "text-tech-gold")} />
                                        <span className="font-semibold">{item.label}</span>
                                        {isActive && (
                                            <motion.div
                                                layoutId="sidebar-active"
                                                className="absolute right-2 w-1.5 h-1.5 rounded-full bg-tech-gold shadow-[0_0_10px_#FFD700]"
                                            />
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="p-4 mt-auto border-t border-tech-gold/10">
                            <div className="bg-tech-gold/5 border border-tech-gold/10 rounded-2xl p-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-tech-gold/20 flex items-center justify-center border border-tech-gold/30">
                                        <User className="w-5 h-5 text-tech-gold" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold truncate">{profile?.contact_person}</p>
                                        <p className="text-[10px] text-gray-500 truncate">{profile?.company_name}</p>
                                    </div>
                                    <Badge variant="outline" className="border-tech-gold/30 text-[10px] h-5 bg-tech-gold/10 text-tech-gold px-1">VIP</Badge>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                onClick={handleLogout}
                                className="w-full justify-start gap-3 text-gray-400 hover:text-tech-red hover:bg-tech-red/5 rounded-xl transition-all h-12"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="font-bold">Logout</span>
                            </Button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative overflow-hidden">
                {/* Header */}
                <header className="h-20 border-b border-tech-gold/10 flex items-center justify-between px-6 bg-black/40 backdrop-blur-xl sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="text-tech-gold hover:bg-tech-gold/10"
                        >
                            {isSidebarOpen ? <X className="w-6 h-6 lg:hidden" /> : <Menu className="w-6 h-6" />}
                        </Button>
                        <div className="hidden sm:block">
                            <h1 className="text-xl font-bold tracking-tight">
                                {menuItems.find(i => i.path === location.pathname)?.label || "Dashboard"}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-4 mr-4 px-4 py-1.5 bg-tech-gold/5 border border-tech-gold/10 rounded-full">
                            <Clock className="w-4 h-4 text-tech-gold" />
                            <span className="text-xs font-bold text-tech-gold/80 uppercase tracking-widest">System Online</span>
                        </div>
                        <ClientNotificationCenter clientId={profile?.id} />
                        <div className="h-8 w-px bg-tech-gold/10 mx-2" />
                        <div className="flex items-center gap-3 pl-2">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-bold text-white">{profile?.company_name}</p>
                                <p className="text-[10px] text-tech-gold">Enterprise Tier</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl overflow-hidden border border-tech-gold/30 bg-tech-gold/10 flex items-center justify-center group cursor-pointer transition-all hover:border-tech-gold hover:shadow-[0_0_15px_rgba(255,215,0,0.3)]">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-5 h-5 text-tech-gold" />
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-8 relative custom-scrollbar">
                    {/* Subtle background glow */}
                    <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-tech-gold/5 blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-tech-red/5 blur-[100px] pointer-events-none" />

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="relative z-10"
                        >
                            <Routes>
                                <Route index element={<DashboardOverview profile={profile} />} />
                                <Route path="projects" element={<ProjectExplorer profile={profile} />} />
                                <Route path="financials" element={<FinancialHub profile={profile} />} />
                                <Route path="support" element={<SupportNexus profile={profile} />} />
                                <Route path="settings" element={<ClientSettings profile={profile} onProfileUpdate={checkUser} />} />
                            </Routes>
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

export default ClientDashboard;
