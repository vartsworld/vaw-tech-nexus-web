import { useState, useEffect } from "react";
import { useNavigate, Routes, Route, Link, useLocation } from "react-router-dom";
import {
    ShieldAlert,
    Users,
    Briefcase,
    TrendingUp,
    Settings,
    Search,
    Bell,
    LogOut,
    Menu,
    X,
    Database,
    Globe,
    Lock,
    Cpu,
    Activity,
    UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Sub-components (to be developed)
import SuperAdminOverview from "@/components/admin/SuperAdminOverview";
import SuperAdminClientManager from "@/components/admin/SuperAdminClientManager";
import SuperAdminStaffManager from "@/components/admin/SuperAdminStaffManager";
import SuperAdminWorkflow from "@/components/admin/SuperAdminWorkflow";
import SuperAdminSystemMatrix from "@/components/admin/SuperAdminSystemMatrix";

const SuperAdminDashboard = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [adminProfile, setAdminProfile] = useState<any>(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        checkSuperAdmin();
    }, []);

    const checkSuperAdmin = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate("/admin/login");
            return;
        }

        const { data: admin, error } = await supabase
            .from("super_admins")
            .select("*")
            .eq("user_id", user.id)
            .single();

        if (error || !admin) {
            toast.error("UNAUTHORIZED: ACCESS DENIED. TERMINATING PROTOCOL.");
            navigate("/admin/login");
            return;
        }

        setAdminProfile(user);
        setLoading(false);
    };

    const navItems = [
        { icon: Activity, label: "Nexus Overview", path: "/super-admin/dashboard" },
        { icon: Users, label: "Client Management", path: "/super-admin/dashboard/clients" },
        { icon: Briefcase, label: "Staff Operations", path: "/super-admin/dashboard/staff" },
        { icon: TrendingUp, label: "Company Workflow", path: "/super-admin/dashboard/workflow" },
        { icon: Database, label: "System Matrix", path: "/super-admin/dashboard/system" },
    ];

    if (loading) {
        return (
            <div className="h-screen w-full bg-black flex items-center justify-center">
                <div className="relative">
                    <div className="w-24 h-24 border-2 border-tech-red/20 border-t-tech-red rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <ShieldAlert className="w-8 h-8 text-tech-red animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020202] text-white flex overflow-hidden font-sans">
            {/* Sidebar */}
            <AnimatePresence mode="wait">
                {isSidebarOpen && (
                    <motion.aside
                        initial={{ x: -300 }}
                        animate={{ x: 0 }}
                        exit={{ x: -300 }}
                        className="fixed inset-y-0 left-0 z-50 w-72 bg-black border-r border-white/5 flex flex-col lg:relative"
                    >
                        <div className="p-8">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2 bg-tech-red rounded-lg">
                                    <ShieldAlert className="w-6 h-6 text-white" />
                                </div>
                                <h2 className="text-xl font-black tracking-tighter uppercase underline decoration-tech-red decoration-2">SUPER <span className="text-tech-red">ADMIN</span></h2>
                            </div>

                            <nav className="space-y-2">
                                {navItems.map((item) => {
                                    const isActive = location.pathname === item.path;
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                                                isActive
                                                    ? "bg-tech-red/10 text-tech-red border border-tech-red/20"
                                                    : "text-gray-500 hover:text-white hover:bg-white/5 border border-transparent"
                                            )}
                                        >
                                            <item.icon className={cn("w-5 h-5", isActive ? "text-tech-red" : "group-hover:text-tech-red")} />
                                            <span className="font-bold tracking-tight">{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>

                        <div className="mt-auto p-8 space-y-4">
                            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                <p className="text-[10px] font-black uppercase tracking-widest text-tech-red mb-1">System Status</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <p className="text-xs font-bold">ALL SYSTEMS NOMINAL</p>
                                </div>
                            </div>
                            <Button variant="ghost" className="w-full justify-start gap-3 text-gray-500 hover:text-tech-red hover:bg-tech-red/5 rounded-xl">
                                <LogOut className="w-5 h-5" />
                                <span className="font-bold">Terminate Session</span>
                            </Button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative">
                {/* Header */}
                <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black/50 backdrop-blur-xl sticky top-0 z-40">
                    <div className="flex items-center gap-6">
                        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-400">
                            {isSidebarOpen ? <X /> : <Menu />}
                        </Button>
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <Input
                                placeholder="Search Global Nexus..."
                                className="bg-white/5 border-white/10 pl-10 w-80 rounded-xl focus:border-tech-red/50 focus:ring-tech-red/10"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                            <Activity className="w-4 h-4 text-tech-red" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Global Load: 12%</span>
                        </div>
                        <Button variant="ghost" size="icon" className="relative text-gray-400">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-tech-red rounded-full" />
                        </Button>
                        <div className="flex items-center gap-3 border-l border-white/10 pl-6">
                            <div className="text-right">
                                <p className="text-xs font-black uppercase text-white">Super User</p>
                                <p className="text-[10px] text-tech-red font-bold">Absolute Authority</p>
                            </div>
                            <div className="w-10 h-10 bg-tech-red rounded-xl flex items-center justify-center font-black text-white">SA</div>
                        </div>
                    </div>
                </header>

                {/* Sub-header Context */}
                <div className="bg-tech-red/5 border-b border-tech-red/10 px-8 py-2 flex items-center gap-4">
                    <Lock className="w-3 h-3 text-tech-red" />
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-tech-red/80">Encrypted Management Channel Active | Protocol 77-A</p>
                </div>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-8 relative">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-tech-red/5 blur-[120px] pointer-events-none" />

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="relative z-10"
                        >
                            <Routes>
                                <Route index element={<SuperAdminOverview />} />
                                <Route path="clients" element={<SuperAdminClientManager />} />
                                <Route path="staff" element={<SuperAdminStaffManager />} />
                                <Route path="workflow" element={<SuperAdminWorkflow />} />
                                <Route path="system" element={<SuperAdminSystemMatrix />} />
                            </Routes>
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
