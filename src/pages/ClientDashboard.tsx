import { useState, useEffect } from "react";
import { useNavigate, Routes, Route, Link, useLocation } from "react-router-dom";
import {
    Home,
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
    ExternalLink,
    Sun,
    Moon
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Sub-components
import ClientHome from "./ClientHome";
import ProjectExplorer from "./ProjectExplorer";
import FinancialHub from "./FinancialHub";
import SupportNexus from "./SupportNexus";
import ClientSettings from "./ClientSettings";
import ClientNotificationCenter from "@/components/client/NotificationCenter";
import PaymentCenter from "./PaymentCenter";
import FeedbackHub from "@/components/client/FeedbackHub";
import ErrorLogger from "@/components/client/ErrorLogger";
import PWAInstallPrompt from "@/components/client/PWAInstallPrompt";
import MobileBottomNav from "@/components/client/MobileBottomNav";
import BrowserNotificationPrompt from "@/components/client/BrowserNotificationPrompt";
import ClientNotificationBanner from "@/components/client/ClientNotificationBanner";

const ClientDashboard = () => {
    // Sidebar closed by default on mobile (< 1024px), open on desktop
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, setTheme } = useTheme();

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
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate("/client/login");
                return;
            }

            // 1. Try to get profile by user_id first
            let { data: existingProfile, error } = await supabase
                .from("client_profiles")
                .select("*")
                .eq("user_id", user.id)
                .maybeSingle();

            if (error) {
                console.error("Error fetching profile by user_id:", error);
            }

            // 2. If not found by user_id, try by metadata client_profile_id
            if (!existingProfile && user.user_metadata?.client_profile_id) {
                const { data: metaProfile } = await supabase
                    .from("client_profiles")
                    .select("*")
                    .eq("id", user.user_metadata.client_profile_id)
                    .maybeSingle();
                if (metaProfile) existingProfile = metaProfile;
            }

            // 3. Fallback: try to find by email (common during first login)
            if (!existingProfile && user.email) {
                const { data: emailProfile } = await supabase
                    .from("client_profiles")
                    .select("*")
                    .eq("email", user.email)
                    .maybeSingle();

                if (emailProfile) {
                    // Profile exists by email but isn't linked to this user_id yet
                    // Only link if it doesn't have a user_id or it's the same
                    if (!emailProfile.user_id || emailProfile.user_id === user.id) {
                        const { data: updatedProfile, error: updateError } = await supabase
                            .from("client_profiles")
                            .update({ user_id: user.id })
                            .eq("id", emailProfile.id)
                            .select()
                            .single();

                        if (!updateError) {
                            existingProfile = updatedProfile;
                        }
                    }
                }
            }

            // 4. Fallback 2: Check the 'clients' table (CRM source of truth)
            if (!existingProfile && user.email) {
                const { data: crmClient } = await supabase
                    .from("clients")
                    .select("*")
                    .eq("email", user.email)
                    .maybeSingle();

                if (crmClient) {
                    // We found them in the CRM! Create a portal profile using this data
                    const newProfile = {
                        user_id: user.id,
                        email: crmClient.email,
                        contact_person: crmClient.contact_person,
                        company_name: crmClient.company_name,
                        phone: crmClient.phone,
                        address: crmClient.address,
                        billing_sync_id: crmClient.billing_sync_id
                    };

                    const { data: migratedProfile, error: migrateError } = await supabase
                        .from("client_profiles")
                        .insert(newProfile)
                        .select()
                        .single();

                    if (!migrateError) {
                        existingProfile = migratedProfile;
                    }
                }
            }

            // 5. Initialize profile if still not found at all
            if (!existingProfile) {
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
                    toast.error("Could not initialize profile. Please contact support.");
                    setProfile(null);
                } else {
                    setProfile(insertedProfile);
                }
            } else {
                setProfile(existingProfile);
            }
        } catch (err) {
            console.error("Unexpected error in checkUser:", err);
            toast.error("Session initialization failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        toast.success("Logged out successfully");
        navigate("/client/login");
    };

    const menuItems = [
        { icon: Home, label: "Home", path: "/client/dashboard" },
        { icon: Briefcase, label: "Projects", path: "/client/dashboard/projects" },
        { icon: CreditCard, label: "Financials", path: "/client/dashboard/financials" },
        { icon: MessageSquare, label: "Support", path: "/client/dashboard/support" },
        { icon: Settings, label: "Settings", path: "/client/dashboard/settings" },
    ];

    if (loading) {
        return (
            <div className="h-screen w-full bg-background flex items-center justify-center">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 bg-primary rounded-full animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="w-20 h-20 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center justify-center mb-6">
                    <User className="w-10 h-10 text-destructive" />
                </div>
                <h1 className="text-2xl font-black text-foreground mb-2">ACCESS DENIED</h1>
                <p className="text-muted-foreground text-center max-w-md mb-8">
                    We could not initialize your profile secure nexus. This usually happens if your account is pending authorization.
                </p>
                <div className="flex gap-4">
                    <Button variant="outline" className="border-primary/20 text-primary" onClick={() => navigate("/client/login")}>
                        Return to Entry
                    </Button>
                    <Button className="bg-primary text-primary-foreground font-bold" onClick={() => window.location.reload()}>
                        Retry Sync
                    </Button>
                </div>
            </div>
        );
    }
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const isHomePage = location.pathname === '/client/dashboard';
    return (
        <div className="h-screen bg-background text-foreground flex overflow-hidden">
            {/* Sidebar - hidden on Home page */}
            {!isHomePage && (
            <AnimatePresence mode="wait">
                {isSidebarOpen && (
                    <motion.aside
                        initial={{ x: -300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed inset-y-0 left-0 z-50 w-72 h-screen neu-elevated backdrop-blur-2xl flex flex-col lg:relative"
                    >
                        <div className="p-6 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary rounded-xl shadow-neu-sm">
                                    <img
                                        src="/lovable-uploads/0d3e4545-c80e-401b-82f1-3319db5155b4.png"
                                        alt="Logo"
                                        className="w-8 h-8 rounded-lg object-cover"
                                    />
                                </div>
                                <div>
                                    <h2 className="font-black tracking-tighter text-lg leading-none text-foreground">CLIENT <span className="text-primary">PORTAL</span></h2>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-1 font-bold">Client Access</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="lg:hidden text-muted-foreground hover:text-foreground"
                                onClick={() => setIsSidebarOpen(false)}
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto min-h-0 custom-scrollbar">
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
                                                ? "neu-card-pressed text-primary"
                                                : "text-muted-foreground hover:text-foreground hover:shadow-neu-sm"
                                        )}
                                    >
                                        <item.icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", isActive && "text-primary")} />
                                        <span className="font-semibold">{item.label}</span>
                                        {isActive && (
                                            <motion.div
                                                layoutId="sidebar-active"
                                                className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_hsl(43_100%_50%)]"
                                            />
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="p-4 mt-auto border-t border-border">
                            <div className="neu-card p-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shadow-neu-sm">
                                        <User className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold truncate text-foreground">{profile?.contact_person}</p>
                                        <p className="text-[10px] text-muted-foreground truncate">{profile?.company_name}</p>
                                    </div>
                                    <Badge variant="outline" className="border-primary/30 text-[10px] h-5 bg-primary/10 text-primary px-1">VIP</Badge>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                onClick={handleLogout}
                                className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all h-12"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="font-bold">Logout</span>
                            </Button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative overflow-hidden min-h-0">
                {/* Header - hidden on Home page */}
                {!isHomePage && (
                <header className="h-20 border-b border-border flex items-center justify-between px-6 neu-elevated backdrop-blur-xl sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="text-primary hover:bg-primary/10"
                        >
                            {isSidebarOpen ? <X className="w-6 h-6 lg:hidden" /> : <Menu className="w-6 h-6" />}
                        </Button>
                        <div className="hidden sm:block">
                            <h1 className="text-xl font-bold tracking-tight text-foreground">
                                {menuItems.find(i => i.path === location.pathname)?.label || "Dashboard"}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-4 mr-2 px-4 py-1.5 neu-card-pressed rounded-full">
                            <Clock className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold text-primary/80 uppercase tracking-widest">System Online</span>
                        </div>

                        {/* Theme Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(isDark ? 'light' : 'dark')}
                            className="w-10 h-10 rounded-xl shadow-neu-sm hover:shadow-neu transition-all bg-card"
                        >
                            {isDark ? (
                                <Sun className="w-4 h-4 text-primary" />
                            ) : (
                                <Moon className="w-4 h-4 text-primary" />
                            )}
                        </Button>

                        <ClientNotificationCenter clientId={profile?.id} />
                        <div className="h-8 w-px bg-border mx-1" />
                        <div className="flex items-center gap-3 pl-2">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-bold text-foreground">{profile?.company_name}</p>
                                <p className="text-[10px] text-primary">Enterprise Tier</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl overflow-hidden border border-primary/30 shadow-neu-sm flex items-center justify-center group cursor-pointer transition-all hover:shadow-neu">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-5 h-5 text-primary" />
                                )}
                            </div>
                        </div>
                    </div>
                </header>
                )}

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-8 relative custom-scrollbar">
                    {/* Subtle background glow */}
                    <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/5 blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-destructive/5 blur-[100px] pointer-events-none" />

                    {/* Prominent notification banners */}
                    <ClientNotificationBanner clientId={profile?.id} billingSyncId={profile?.billing_sync_id} />

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
                                <Route index element={<ClientHome profile={profile} />} />
                                <Route path="projects/*" element={<ProjectExplorer profile={profile} />} />
                                <Route path="financials" element={<PaymentCenter profile={profile} />} />
                                <Route path="support" element={<SupportNexus profile={profile} />} />
                                <Route path="settings" element={<ClientSettings profile={profile} onProfileUpdate={checkUser} />} />
                            </Routes>
                        </motion.div>
                    </AnimatePresence>
                </main>

                {/* Browser Notification Permission Prompt */}
                <BrowserNotificationPrompt />

                {/* PWA Install Prompt */}
                <PWAInstallPrompt />

                {/* Mobile Bottom Navigation */}
                <MobileBottomNav />
            </div>
        </div >
    );
};

export default ClientDashboard;
