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
    User,
    Bell,
    Layers,
    X
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
        completedProjects: 0,
        pendingReminders: 0,
        openErrors: 0,
        unreadNotifications: 0
    });
    const [ongoingTasks, setOngoingTasks] = useState<any[]>([]);
    const [recentProjects, setRecentProjects] = useState<any[]>([]);
    const [paymentReminders, setPaymentReminders] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, [profile]);

    const fetchStats = async () => {
        if (!profile?.id) return;
        setLoading(true);

        try {
            // 1. First, find if there's a record in the 'clients' table for this user
            // This is our source of truth for most project linkages
            const { data: crmClient } = await supabase
                .from("clients")
                .select("id")
                .eq("email", profile.email)
                .maybeSingle();

            const crmId = crmClient?.id;

            // 2. Fetch projects — Check by both potential client_id mapping
            const { data: projects } = await supabase
                .from("client_projects")
                .select("*")
                .or(`client_id.eq.${profile.id},client_id.eq.${crmId || profile.id}`);

            // 3. Fetch payment reminders
            const { data: reminders } = await supabase
                .from("payment_reminders")
                .select("*")
                .or(`client_id.eq.${profile.id},client_id.eq.${crmId || profile.id}`)
                .in("status", ["pending", "sent", "overdue"])
                .order("due_date", { ascending: true })
                .limit(3);

            // 4. Fetch error logs
            const { data: errors } = await supabase
                .from("client_error_logs")
                .select("*")
                .or(`client_id.eq.${profile.id},client_id.eq.${crmId || profile.id}`)
                .eq("status", "open");

            // 5. Fetch unread notifications — most recent 5
            const { data: notificationsData } = await supabase
                .from("client_notifications")
                .select("id, title, message, type, priority, created_at, is_read, action_url")
                .or(`client_id.eq.${profile.id},client_id.eq.${crmId || profile.id}`)
                .order("created_at", { ascending: false })
                .limit(5);

            setNotifications(notificationsData || []);

            // 6. Fetch ongoing tasks — dual-ID mapping then manually resolve departments
            const clientIdSet = [profile.id, crmId].filter(Boolean);
            const projectIdList = (projects || []).map((p: any) => p.id).filter(Boolean);

            let rawTasks: any[] = [];

            // Try by client_id first (direct link)
            if (clientIdSet.length > 0) {
                const { data: byClient } = await supabase
                    .from("staff_tasks")
                    .select("id, title, status, priority, current_stage, due_date, completed_at, department_id, client_project_id, client_id")
                    .or(clientIdSet.map((id: string) => `client_id.eq.${id}`).join(','))
                    .neq("status", "completed")
                    .order("created_at", { ascending: false })
                    .limit(5);
                rawTasks = byClient || [];
            }

            // Fallback: by client's project IDs
            if (rawTasks.length === 0 && projectIdList.length > 0) {
                const { data: byProject } = await supabase
                    .from("staff_tasks")
                    .select("id, title, status, priority, current_stage, due_date, completed_at, department_id, client_project_id, client_id")
                    .in("client_project_id", projectIdList)
                    .neq("status", "completed")
                    .order("created_at", { ascending: false })
                    .limit(5);
                rawTasks = byProject || [];
            }

            // Manually resolve department names
            if (rawTasks.length > 0) {
                const deptIds = [...new Set(rawTasks.map((t: any) => t.department_id).filter(Boolean))];
                const deptsMap: Record<string, string> = {};
                if (deptIds.length > 0) {
                    const { data: depts } = await supabase
                        .from("departments")
                        .select("id, name")
                        .in("id", deptIds);
                    (depts || []).forEach((d: any) => { deptsMap[d.id] = d.name; });
                }
                const enriched = rawTasks.map((t: any) => ({
                    ...t,
                    departments: t.department_id ? { name: deptsMap[t.department_id] || null } : null
                }));
                setOngoingTasks(enriched);
            } else {
                setOngoingTasks([]);
            }


            if (projects) {
                const active = projects.filter(p => !['completed', 'cancel'].includes(p.status)).length;
                const completed = projects.filter(p => p.status === 'completed').length;
                const paid = projects.reduce((acc, curr) => acc + Number(curr.amount_paid || 0), 0);

                setStats({
                    activeProjects: active,
                    totalPaid: paid,
                    pendingPaymentsCount: projects.filter(p => (Number(p.total_amount) || 0) > (Number(p.amount_paid) || 0)).length,
                    completedProjects: completed,
                    pendingReminders: reminders?.length || 0,
                    openErrors: errors?.length || 0,
                    unreadNotifications: notificationsData?.length || 0
                });
                setRecentProjects(projects.slice(0, 3));
                setPaymentReminders(reminders || []);
            }
        } catch (error) {
            console.error("Dashboard Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            label: "Active Projects",
            value: stats.activeProjects,
            icon: Briefcase,
            color: "text-tech-gold",
            bg: "bg-tech-gold/10",
            description: "Projects currently in progress"
        },
        {
            label: "Next Billing",
            value: paymentReminders.length > 0
                ? `₹${Number(paymentReminders[0]?.amount || 0).toLocaleString()}`
                : "—",
            icon: CreditCard,
            color: "text-tech-gold",
            bg: "bg-tech-gold/10",
            description: paymentReminders.length > 0
                ? `Due ${new Date(paymentReminders[0]?.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                : "No upcoming payments"
        },
        {
            label: "Pending Actions",
            value: stats.pendingPaymentsCount,
            icon: Clock,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            description: "Tasks that need your attention"
        },
        {
            label: "Completed",
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
                        All your projects are running smoothly.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button className="bg-tech-gold hover:bg-white text-black font-bold h-12 px-6 rounded-xl transition-all shadow-lg shadow-tech-gold/20">
                        New Message
                    </Button>
                    <Button variant="outline" className="border-tech-gold/20 hover:bg-tech-gold/5 text-white h-12 px-6 rounded-xl font-bold">
                        Our Roadmap
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

            {/* Payment Reminders Alert */}
            {paymentReminders.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Card className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/30 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.02)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] animate-[shimmer_60s_linear_infinite]" />
                        <CardHeader className="relative">
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-orange-500" />
                                        Payment Reminders
                                    </CardTitle>
                                    <CardDescription className="text-gray-300 font-medium mt-1">
                                        You have {stats.pendingReminders} pending payment{stats.pendingReminders !== 1 ? 's' : ''}
                                    </CardDescription>
                                </div>
                                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/40">Urgent</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="relative space-y-3">
                            {paymentReminders.slice(0, 2).map((reminder, idx) => {
                                const dueDate = new Date(reminder.due_date);
                                const today = new Date();
                                const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                const isOverdue = daysUntil < 0;

                                return (
                                    <div
                                        key={reminder.id}
                                        className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-4 flex items-center justify-between"
                                    >
                                        <div>
                                            <p className="text-sm font-bold text-white">{reminder.title}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Amount: <span className="text-tech-gold font-bold">₹{Number(reminder.amount).toLocaleString()}</span>
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <Badge
                                                variant={isOverdue ? "destructive" : "outline"}
                                                className={isOverdue ? "bg-red-500/20 text-red-400" : "bg-orange-500/10 text-orange-400"}
                                            >
                                                {isOverdue
                                                    ? `${Math.abs(daysUntil)} days overdue`
                                                    : daysUntil === 0
                                                        ? "Due today"
                                                        : `${daysUntil} days left`
                                                }
                                            </Badge>
                                            <p className="text-[10px] text-gray-500 mt-1">{dueDate.toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                );
                            })}
                            <Button
                                className="w-full bg-white/5 hover:bg-white/10 border border-white/20 text-white font-bold"
                                onClick={() => window.location.href = '/client/dashboard/financials'}
                            >
                                View All Payments
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            )}


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Projects */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-tech-gold" />
                            Active Projects
                        </h2>
                        <Button variant="ghost" className="text-tech-gold hover:text-white font-bold text-sm h-auto p-0" onClick={() => window.location.href = '/client/dashboard/projects'}>
                            View All <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>

                    <div className="grid gap-4">
                        {loading ? (
                            [1, 2].map(i => <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />)
                        ) : recentProjects.length > 0 ? (
                            recentProjects.map((project, idx) => {
                                // Derive current phase from project status
                                const phaseMap: Record<string, { label: string; sub: string; color: string }> = {
                                    planning: { label: 'PLANNING', sub: 'PHASE BLUEPRINT', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
                                    in_progress: { label: 'IN DEVELOPMENT', sub: 'ACTIVE BUILD', color: 'text-tech-gold bg-tech-gold/10 border-tech-gold/20' },
                                    review: { label: 'IN REVIEW', sub: 'QA & TESTING', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
                                    review_pending: { label: 'PENDING REVIEW', sub: 'AWAITING SIGN-OFF', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
                                    at_risk: { label: 'AT RISK', sub: 'ATTENTION NEEDED', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
                                    on_hold: { label: 'ON HOLD', sub: 'PAUSED', color: 'text-gray-400 bg-gray-500/10 border-gray-500/20' },
                                    completed: { label: 'COMPLETED', sub: 'DELIVERED', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
                                    cancel: { label: 'CANCELLED', sub: 'PROJECT CLOSED', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
                                };
                                const phase = phaseMap[project.status] || phaseMap.in_progress;

                                // Find an active task for this project to show stage
                                const activeTask = ongoingTasks.find((t: any) => t.client_project_id === project.id);

                                return (
                                    <motion.div
                                        key={project.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.4 + idx * 0.1 }}
                                    >
                                        <Card className="bg-black/40 backdrop-blur-xl border-tech-gold/10 hover:border-tech-gold/30 transition-all group overflow-hidden">
                                            <CardContent className="p-0">
                                                {/* Project Header */}
                                                <div className="p-5 space-y-3">
                                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                                        <div className="space-y-0.5">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <h3 className="text-base font-bold text-white group-hover:text-tech-gold transition-colors">{project.title}</h3>
                                                                <Badge className="bg-tech-gold/10 text-tech-gold border-tech-gold/20 text-[9px] uppercase font-black tracking-widest">
                                                                    {project.project_type}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-xs text-gray-400 line-clamp-1">{project.description || "Project parameters initialized and stable."}</p>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-gray-400 hover:text-tech-gold hover:bg-tech-gold/10 rounded-xl shrink-0"
                                                            onClick={() => window.location.href = `/client/dashboard/projects/${project.id}`}
                                                        >
                                                            <ArrowUpRight className="w-4 h-4" />
                                                        </Button>
                                                    </div>

                                                    {/* Current Phase + Stage Row */}
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider", phase.color)}>
                                                            <Layers className="w-3 h-3" />
                                                            <div>
                                                                <div className="leading-none">{phase.label}</div>
                                                                <div className="text-[8px] opacity-60 leading-none mt-0.5">{phase.sub}</div>
                                                            </div>
                                                        </div>
                                                        {activeTask?.current_stage && (
                                                            <Badge variant="outline" className="text-[9px] font-black border-tech-purple/30 text-tech-purple bg-tech-purple/5">
                                                                {activeTask?.stage_names?.[String(activeTask.current_stage)] || `STAGE ${activeTask.current_stage}`}
                                                            </Badge>
                                                        )}
                                                        {activeTask?.departments?.name && (
                                                            <Badge variant="outline" className="text-[9px] font-black border-white/10 text-gray-400">
                                                                {activeTask.departments.name}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {/* Progress bar */}
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                                                            <span className="text-gray-500">Progress</span>
                                                            <span className="text-tech-gold">{project.progress || 0}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${project.progress || 0}%` }}
                                                                transition={{ duration: 1, delay: 0.5 }}
                                                                className="h-full bg-gradient-to-r from-tech-gold to-tech-red shadow-[0_0_10px_#FFD700]"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })
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

                    {/* Ongoing Tasks Section */}
                    <div className="mt-12 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Activity className="w-5 h-5 text-tech-purple animate-pulse" />
                                Ongoing Task Evolution
                            </h2>
                            <Badge variant="outline" className="border-tech-purple/30 text-tech-purple bg-tech-purple/5">
                                Real-time Signals
                            </Badge>
                        </div>

                        <div className="grid gap-3">
                            {ongoingTasks.length > 0 ? (
                                ongoingTasks.map((task, idx) => (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.7 + idx * 0.1 }}
                                        className="group"
                                    >
                                        <div className="bg-black/40 backdrop-blur-xl border border-white/5 hover:border-tech-purple/30 rounded-2xl p-4 flex items-center justify-between transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-tech-purple/10 flex items-center justify-center border border-tech-purple/20 group-hover:bg-tech-purple/20 transition-colors">
                                                    <Clock className="w-5 h-5 text-tech-purple" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-white group-hover:text-tech-purple transition-colors">{task.title}</h4>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                                            <div className="w-1 h-1 rounded-full bg-tech-gold" />
                                                            {task.status.replace('_', ' ')}
                                                        </span>
                                                        <span className="text-[10px] text-gray-600 font-bold">|</span>
                                                        <span className="text-[10px] text-tech-gold/70 font-black italic">{task.stage_names?.[String(task.current_stage || 1)] || `Stage ${task.current_stage || 1}`}</span>
                                                        {task.departments?.name && (
                                                            <>
                                                                <span className="text-[10px] text-gray-600 font-bold">|</span>
                                                                <Badge variant="secondary" className="text-[9px] text-tech-purple h-auto p-0 px-1 bg-tech-purple/5 hover:bg-transparent border-none">
                                                                    {task.departments.name}
                                                                </Badge>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Badge className={cn(
                                                    "text-[9px] uppercase font-black px-2 py-0.5",
                                                    task.priority === 'urgent' ? "bg-red-500/20 text-red-400 border-red-500/30" :
                                                        task.priority === 'high' ? "bg-orange-500/20 text-orange-400 border-orange-500/30" :
                                                            "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                                )}>
                                                    {task.priority}
                                                </Badge>
                                                <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-tech-purple transition-all transform group-hover:translate-x-1" />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="text-center py-8 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                    <p className="text-xs text-gray-500 font-medium tracking-widest italic">Stable signal. No active task fluctuations detected.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Panel */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-tech-red" />
                        Actions
                    </h2>

                    <div className="grid gap-3">
                        <Button
                            className="w-full bg-white/5 border border-tech-gold/20 hover:bg-tech-gold/10 hover:border-tech-gold text-white font-bold h-12 justify-between px-5 rounded-xl group transition-all"
                            onClick={() => window.location.href = '/client/dashboard/financials'}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-tech-gold/10 rounded-lg group-hover:scale-110 transition-transform">
                                    <FileText className="w-4 h-4 text-tech-gold" />
                                </div>
                                <span className="text-sm">View Invoices</span>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                        </Button>

                        <Button
                            className="w-full bg-white/5 border border-tech-gold/20 hover:bg-tech-gold/10 hover:border-tech-gold text-white font-bold h-12 justify-between px-5 rounded-xl group transition-all"
                            onClick={() => window.location.href = '/client/dashboard/support'}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-blue-500/10 rounded-lg group-hover:scale-110 transition-transform">
                                    <Activity className="w-4 h-4 text-blue-500" />
                                </div>
                                <span className="text-sm">Request Update</span>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                        </Button>

                        <Button
                            className="w-full bg-white/5 border border-tech-gold/20 hover:bg-tech-gold/10 hover:border-tech-gold text-white font-bold h-12 justify-between px-5 rounded-xl group transition-all"
                            onClick={() => window.location.href = '/client/dashboard/support'}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-tech-red/10 rounded-lg group-hover:scale-110 transition-transform">
                                    <AlertCircle className="w-4 h-4 text-tech-red" />
                                </div>
                                <span className="text-sm">Get Support</span>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                        </Button>

                        <Button
                            className="w-full bg-white/5 border border-red-500/20 hover:bg-red-500/10 hover:border-red-500/40 text-white font-bold h-12 justify-between px-5 rounded-xl group transition-all"
                            onClick={() => window.location.href = '/client/dashboard/support?tab=error-log'}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-red-500/10 rounded-lg group-hover:scale-110 transition-transform">
                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                </div>
                                <span className="text-sm">Report an Issue</span>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                        </Button>
                    </div>

                    {/* Notifications Panel */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                                <Bell className="w-4 h-4 text-tech-gold" />
                                Notifications
                            </h3>
                            {stats.unreadNotifications > 0 && (
                                <Badge className="bg-tech-gold/20 text-tech-gold border-tech-gold/30 text-[9px] font-black">
                                    {stats.unreadNotifications} NEW
                                </Badge>
                            )}
                        </div>

                        <div className="space-y-2">
                            {notifications.length > 0 ? (
                                notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className={cn(
                                            "p-3 rounded-xl border transition-all cursor-pointer group",
                                            notif.is_read
                                                ? "bg-white/3 border-white/5 hover:border-white/10"
                                                : "bg-tech-gold/5 border-tech-gold/20 hover:border-tech-gold/40"
                                        )}
                                        onClick={async () => {
                                            await supabase.from("client_notifications").update({ is_read: true }).eq("id", notif.id);
                                            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
                                            if (notif.action_url) window.location.href = notif.action_url;
                                        }}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className={cn("text-xs font-bold truncate", notif.is_read ? "text-gray-400" : "text-white")}>
                                                    {notif.title}
                                                </p>
                                                <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                                                <p className="text-[9px] text-gray-600 mt-1 font-bold">
                                                    {new Date(notif.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            {!notif.is_read && (
                                                <div className="w-2 h-2 rounded-full bg-tech-gold shrink-0 mt-1 animate-pulse" />
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 text-gray-600 text-xs font-bold tracking-widest">
                                    NO NEW NOTIFICATIONS
                                </div>
                            )}
                        </div>
                    </div>

                    <Card className="bg-gradient-to-br from-tech-gold/20 to-tech-red/20 border-tech-gold/30 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-cyber-grid pointer-events-none opacity-20" />
                        <CardHeader className="relative z-10">
                            <CardTitle className="text-white flex items-center gap-2">
                                <Shield className="w-5 h-5 text-tech-gold" />
                                Your Support Team
                            </CardTitle>
                            <CardDescription className="text-gray-300 font-medium">
                                Your dedicated support team is online.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="relative z-10 pt-0">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                                    <User className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">VAW Support Team</p>
                                    <p className="text-xs text-tech-gold">Support Team</p>
                                </div>
                            </div>
                            <Button
                                className="w-full bg-black hover:bg-white hover:text-black text-white font-bold h-12 rounded-xl transition-all border border-tech-gold/30"
                                onClick={() => window.location.href = '/client/dashboard/support'}
                            >
                                Contact Support
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;
