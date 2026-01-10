import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Briefcase,
    CreditCard,
    Clock,
    TrendingUp,
    CheckCircle2,
    AlertCircle,
    ArrowUpRight,
    FileText,
    Activity,
    ChevronRight,
    Shield,
    User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const DashboardOverview = ({ profile }: { profile: any }) => {
    const [stats, setStats] = useState({
        activeProjects: 0,
        totalPaid: 0,
        pendingPaymentsCount: 0,
        completedProjects: 0
    });
    const [recentProjects, setRecentProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, [profile]);

    const fetchStats = async () => {
        if (!profile) return;

        // Fetch projects
        const { data: projects, error: projectsError } = await supabase
            .from("client_projects")
            .select("*")
            .eq("client_id", profile.id);

        if (projects) {
            const active = projects.filter(p => !['completed', 'cancel'].includes(p.status)).length;
            const completed = projects.filter(p => p.status === 'completed').length;
            const paid = projects.reduce((acc, curr) => acc + Number(curr.amount_paid || 0), 0);

            setStats({
                activeProjects: active,
                totalPaid: paid,
                pendingPaymentsCount: projects.filter(p => p.total_amount > p.amount_paid).length,
                completedProjects: completed
            });
            setRecentProjects(projects.slice(0, 3));
        }
        setLoading(false);
    };

    const statCards = [
        {
            label: "Active Projects",
            value: stats.activeProjects,
            icon: Briefcase,
            color: "text-tech-gold",
            bg: "bg-tech-gold/10",
            description: "Projects currently in Nexus"
        },
        {
            label: "Capital Deployed",
            value: `₹${stats.totalPaid.toLocaleString()}`,
            icon: CreditCard,
            color: "text-green-500",
            bg: "bg-green-500/10",
            description: "Total amount invested so far"
        },
        {
            label: "Pending Actions",
            value: stats.pendingPaymentsCount,
            icon: Clock,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            description: "Required attention or payments"
        },
        {
            label: "Nexus Completions",
            value: stats.completedProjects,
            icon: CheckCircle2,
            color: "text-tech-purple",
            bg: "bg-tech-purple/10",
            description: "Successfully delivered projects"
        }
    ];

    return (
        <div className="space-y-8 pb-12">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-2">
                        WELCOME BACK, <span className="text-tech-gold uppercase">{profile.contact_person.split(' ')[0]}</span>
                    </h1>
                    <p className="text-gray-400 font-medium flex items-center gap-2">
                        <Activity className="w-4 h-4 text-tech-gold animate-pulse" />
                        Your project ecosystem is performing within optimal parameters.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button className="bg-tech-gold hover:bg-white text-black font-bold h-12 px-6 rounded-xl transition-all shadow-lg shadow-tech-gold/20">
                        Rapid Inquiry
                    </Button>
                    <Button variant="outline" className="border-tech-gold/20 hover:bg-tech-gold/5 text-white h-12 px-6 rounded-xl font-bold">
                        Project Matrix
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <Card className="bg-black/40 backdrop-blur-xl border-tech-gold/10 hover:border-tech-gold/30 transition-all group cursor-default">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={cn("p-2.5 rounded-xl", stat.bg)}>
                                        <stat.icon className={cn("w-6 h-6", stat.color)} />
                                    </div>
                                    <TrendingUp className="w-4 h-4 text-gray-600 group-hover:text-tech-gold transition-colors" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black text-white">{stat.value}</h3>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                                </div>
                                <p className="text-[10px] text-gray-600 mt-4 leading-none font-bold italic">{stat.description}</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Projects */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-tech-gold" />
                            Active Project Matrix
                        </h2>
                        <Button variant="ghost" className="text-tech-gold hover:text-white font-bold text-sm h-auto p-0">
                            View Extended Matrix <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>

                    <div className="grid gap-4">
                        {loading ? (
                            [1, 2].map(i => <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />)
                        ) : recentProjects.length > 0 ? (
                            recentProjects.map((project, idx) => (
                                <motion.div
                                    key={project.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + idx * 0.1 }}
                                >
                                    <Card className="bg-black/40 backdrop-blur-xl border-tech-gold/10 hover:border-tech-gold/30 transition-all group overflow-hidden">
                                        <CardContent className="p-6">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-lg font-bold text-white group-hover:text-tech-gold transition-colors">{project.title}</h3>
                                                        <Badge className="bg-tech-gold/10 text-tech-gold border-tech-gold/20 text-[10px] uppercase font-black tracking-widest">
                                                            {project.project_type}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-gray-400 line-clamp-1">{project.description || "Project parameters initialized and stable."}</p>
                                                </div>
                                                <div className="flex items-center gap-8">
                                                    <div className="w-48 space-y-2">
                                                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                                                            <span className="text-gray-500">Deployment Progress</span>
                                                            <span className="text-tech-gold">{project.progress}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${project.progress}%` }}
                                                                transition={{ duration: 1, delay: 0.5 }}
                                                                className="h-full bg-gradient-to-r from-tech-gold to-tech-red shadow-[0_0_10px_#FFD700]"
                                                            />
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-tech-gold hover:bg-tech-gold/10 rounded-xl">
                                                        <ArrowUpRight className="w-5 h-5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))
                        ) : (
                            <Card className="bg-black/20 border-tech-gold/10 border-dashed border-2">
                                <CardContent className="p-12 text-center text-gray-500">
                                    <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p className="font-bold text-sm">No active project signals detected.</p>
                                    <Button variant="link" className="text-tech-gold underline mt-2">Initialize New Request</Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Action Panel */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-tech-red" />
                        Nexus Commands
                    </h2>

                    <div className="grid gap-4">
                        <Button className="w-full bg-white/5 border border-tech-gold/20 hover:bg-tech-gold/10 hover:border-tech-gold text-white font-bold h-16 justify-between px-6 rounded-2xl group transition-all">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-tech-gold/10 rounded-lg group-hover:scale-110 transition-transform">
                                    <FileText className="w-5 h-5 text-tech-gold" />
                                </div>
                                <span className="text-sm">Download Invoices</span>
                            </div>
                            <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0" />
                        </Button>

                        <Button className="w-full bg-white/5 border border-tech-gold/20 hover:bg-tech-gold/10 hover:border-tech-gold text-white font-bold h-16 justify-between px-6 rounded-2xl group transition-all">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-blue-500/10 rounded-lg group-hover:scale-110 transition-transform">
                                    <Activity className="w-5 h-5 text-blue-500" />
                                </div>
                                <span className="text-sm">Request Tech Update</span>
                            </div>
                            <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0" />
                        </Button>

                        <Button className="w-full bg-white/5 border border-tech-gold/20 hover:bg-tech-gold/10 hover:border-tech-gold text-white font-bold h-16 justify-between px-6 rounded-2xl group transition-all">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-tech-red/10 rounded-lg group-hover:scale-110 transition-transform">
                                    <AlertCircle className="w-5 h-5 text-tech-red" />
                                </div>
                                <span className="text-sm">Emergency Support</span>
                            </div>
                            <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0" />
                        </Button>
                    </div>

                    <Card className="bg-gradient-to-br from-tech-gold/20 to-tech-red/20 border-tech-gold/30 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-cyber-grid pointer-events-none opacity-20" />
                        <CardHeader className="relative z-10">
                            <CardTitle className="text-white flex items-center gap-2">
                                <Shield className="w-5 h-5 text-tech-gold" />
                                Client Success
                            </CardTitle>
                            <CardDescription className="text-gray-300 font-medium">
                                Your dedicated account strategist is online.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="relative z-10 pt-0">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                                    <User className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">Aryan Sharma</p>
                                    <p className="text-xs text-tech-gold">Technical Director</p>
                                </div>
                            </div>
                            <Button className="w-full bg-black hover:bg-white hover:text-black text-white font-bold h-12 rounded-xl transition-all border border-tech-gold/30">
                                Secure Channel
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;
