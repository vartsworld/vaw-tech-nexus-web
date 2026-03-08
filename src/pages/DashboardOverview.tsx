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
    const [nextBilling, setNextBilling] = useState<{ amount: number; date: string } | null>(null);

    useEffect(() => {
        fetchStats();
        fetchNextBilling();
    }, [profile]);

    const fetchNextBilling = async () => {
        if (!profile?.id) return;

        // Resolve billing_sync_id: from profile or CRM clients table
        let billingId = profile.billing_sync_id;
        if (!billingId && profile.email) {
            const { data: crmClient } = await supabase
                .from('clients')
                .select('billing_sync_id')
                .eq('email', profile.email)
                .maybeSingle();
            billingId = crmClient?.billing_sync_id;
        }
        if (!billingId) return;
        try {
            const { data: settings } = await supabase
                .from('app_settings')
                .select('key, value')
                .in('key', ['billing_api_url', 'billing_api_key', 'billing_api_secret']);

            const creds: any = {};
            if (settings) {
                settings.forEach((s: any) => {
                    const val = typeof s.value === 'string' ? s.value.replace(/^"|"$/g, '') : String(s.value);
                    if (s.key === 'billing_api_url') creds.url = val;
                    if (s.key === 'billing_api_key') creds.key = val;
                    if (s.key === 'billing_api_secret') creds.secret = val;
                });
            }
            const url = creds.url || 'https://ecexzlqjobqajfhxmiaa.supabase.co/functions/v1/external-api';
            const key = creds.key || '';
            const secret = creds.secret || '';
            if (!key || !secret) return;

            const res = await fetch(`${url}/recurring-invoices?limit=500`, {
                headers: { 'x-api-key': key, 'x-api-secret': secret }
            });
            if (!res.ok) return;
            const raw = await res.json();
            const all = Array.isArray(raw) ? raw : (raw?.data || []);

            const matchId = billingId.toLowerCase();
            const clientRecs = all.filter((r: any) => {
                const code = String(r.client_code || r.client_id || r.client_sync_id || r.customer_id || '').toLowerCase();
                return code === matchId && r.status?.toLowerCase() !== 'paused' && r.status?.toLowerCase() !== 'stopped';
            });

            const sorted = clientRecs.sort((a: any, b: any) =>
                new Date(a.next_issue_date || a.next_invoice_date || '9999').getTime() -
                new Date(b.next_issue_date || b.next_invoice_date || '9999').getTime()
            );

            if (sorted.length > 0) {
                const next = sorted[0];
                setNextBilling({
                    amount: Number(next.total) || 0,
                    date: next.next_issue_date || next.next_invoice_date
                });
            }
        } catch (err) {
            console.error('Failed to fetch next billing:', err);
        }
    };

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
            value: nextBilling
                ? `₹${nextBilling.amount.toLocaleString()}`
                : (paymentReminders.length > 0
                    ? `₹${Number(paymentReminders[0]?.amount || 0).toLocaleString()}`
                    : "—"),
            icon: CreditCard,
            color: "text-tech-gold",
            bg: "bg-tech-gold/10",
            description: nextBilling
                ? `Due ${new Date(nextBilling.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                : (paymentReminders.length > 0
                    ? `Due ${new Date(paymentReminders[0]?.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                    : "No upcoming payments")
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
                    <h1 className="text-3xl font-black tracking-tight text-foreground mb-2">
                        WELCOME BACK, <span className="text-primary uppercase">{profile.contact_person.split(' ')[0]}</span>
                    </h1>
                    <p className="text-muted-foreground font-medium flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary animate-pulse" />
                        All your projects are running smoothly.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 px-6 rounded-xl transition-all shadow-neu-sm">
                        New Message
                    </Button>
                    <Button variant="outline" className="border-border hover:bg-primary/5 text-foreground h-12 px-6 rounded-xl font-bold shadow-neu-sm">
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
                        <Card className="neu-card hover:shadow-neu transition-all group cursor-default">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={cn("p-2.5 rounded-xl shadow-neu-sm", stat.bg)}>
                                        <stat.icon className={cn("w-6 h-6", stat.color)} />
                                    </div>
                                    <TrendingUp className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black text-foreground">{stat.value}</h3>
                                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                                </div>
                                <p className="text-[10px] text-muted-foreground/60 mt-4 leading-none font-bold italic">{stat.description}</p>
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
                     <Card className="neu-card bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.02)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] animate-[shimmer_60s_linear_infinite]" />
                        <CardHeader className="relative">
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-foreground flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-orange-500" />
                                        Payment Reminders
                                    </CardTitle>
                                    <CardDescription className="text-muted-foreground font-medium mt-1">
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
                                        className="neu-card-pressed rounded-xl p-4 flex items-center justify-between"
                                    >
                                        <div>
                                            <p className="text-sm font-bold text-foreground">{reminder.title}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Amount: <span className="text-primary font-bold">₹{Number(reminder.amount).toLocaleString()}</span>
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
                                            <p className="text-[10px] text-muted-foreground mt-1">{dueDate.toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                );
                            })}
                            <Button
                                className="w-full neu-card hover:shadow-neu-sm border border-border text-foreground font-bold"
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
                        <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            Active Projects
                        </h2>
                        <Button variant="ghost" className="text-primary hover:text-foreground font-bold text-sm h-auto p-0" onClick={() => window.location.href = '/client/dashboard/projects'}>
                            View All <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>

                    <div className="grid gap-4">
                        {loading ? (
                            [1, 2].map(i => <div key={i} className="h-32 neu-card rounded-2xl animate-pulse" />)
                        ) : recentProjects.length > 0 ? (
                            recentProjects.map((project, idx) => {
                                const phaseMap: Record<string, { label: string; sub: string; color: string }> = {
                                    planning: { label: 'PLANNING', sub: 'PHASE BLUEPRINT', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
                                    in_progress: { label: 'IN DEVELOPMENT', sub: 'ACTIVE BUILD', color: 'text-primary bg-primary/10 border-primary/20' },
                                    review: { label: 'IN REVIEW', sub: 'QA & TESTING', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
                                    review_pending: { label: 'PENDING REVIEW', sub: 'AWAITING SIGN-OFF', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
                                    at_risk: { label: 'AT RISK', sub: 'ATTENTION NEEDED', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
                                    on_hold: { label: 'ON HOLD', sub: 'PAUSED', color: 'text-muted-foreground bg-muted border-border' },
                                    completed: { label: 'COMPLETED', sub: 'DELIVERED', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
                                    cancel: { label: 'CANCELLED', sub: 'PROJECT CLOSED', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
                                };
                                const phase = phaseMap[project.status] || phaseMap.in_progress;
                                const activeTask = ongoingTasks.find((t: any) => t.client_project_id === project.id);

                                return (
                                    <motion.div
                                        key={project.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.4 + idx * 0.1 }}
                                    >
                                        <Card className="neu-card hover:shadow-neu transition-all group overflow-hidden">
                                            <CardContent className="p-0">
                                                <div className="p-5 space-y-3">
                                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                                        <div className="space-y-0.5">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">{project.title}</h3>
                                                                <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] uppercase font-black tracking-widest">
                                                                    {project.project_type}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground line-clamp-1">{project.description || "Project parameters initialized and stable."}</p>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl shrink-0"
                                                            onClick={() => window.location.href = `/client/dashboard/projects/${project.id}`}
                                                        >
                                                            <ArrowUpRight className="w-4 h-4" />
                                                        </Button>
                                                    </div>

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
                                                            <Badge variant="outline" className="text-[9px] font-black border-border text-muted-foreground">
                                                                {activeTask.departments.name}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                                                            <span className="text-muted-foreground">Progress</span>
                                                            <span className="text-primary">{project.progress || 0}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${project.progress || 0}%` }}
                                                                transition={{ duration: 1, delay: 0.5 }}
                                                                className="h-full bg-gradient-to-r from-primary to-destructive shadow-[0_0_10px_hsl(var(--primary))]"
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
                            <Card className="neu-card-pressed border-dashed border-2 border-border">
                                <CardContent className="p-12 text-center text-muted-foreground">
                                    <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p className="font-bold text-sm">No active project signals detected.</p>
                                    <Button variant="link" className="text-primary underline mt-2">Initialize New Request</Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Ongoing Tasks Section */}
                    <div className="mt-12 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
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
                                        <div className="neu-card hover:shadow-neu rounded-2xl p-4 flex items-center justify-between transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-tech-purple/10 flex items-center justify-center border border-tech-purple/20 shadow-neu-sm group-hover:bg-tech-purple/20 transition-colors">
                                                    <Clock className="w-5 h-5 text-tech-purple" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-foreground group-hover:text-tech-purple transition-colors">{task.title}</h4>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-1">
                                                            <div className="w-1 h-1 rounded-full bg-primary" />
                                                            {task.status.replace('_', ' ')}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground/40 font-bold">|</span>
                                                        <span className="text-[10px] text-primary/70 font-black italic">{task.stage_names?.[String(task.current_stage || 1)] || `Stage ${task.current_stage || 1}`}</span>
                                                        {task.departments?.name && (
                                                            <>
                                                                <span className="text-[10px] text-muted-foreground/40 font-bold">|</span>
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
                                                <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-tech-purple transition-all transform group-hover:translate-x-1" />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="text-center py-8 neu-card-pressed rounded-3xl border border-dashed border-border">
                                    <p className="text-xs text-muted-foreground font-medium tracking-widest italic">Stable signal. No active task fluctuations detected.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Panel */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                        <span className="w-2 h-2 rounded-full bg-destructive" />
                        Actions
                    </h2>

                    <div className="grid gap-3">
                        <Button
                            className="w-full bg-card/50 border border-primary/20 hover:bg-primary/10 hover:border-primary text-foreground font-bold h-12 justify-between px-5 rounded-xl group transition-all"
                            onClick={() => window.location.href = '/client/dashboard/financials'}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-primary/10 rounded-lg group-hover:scale-110 transition-transform">
                                    <FileText className="w-4 h-4 text-primary" />
                                </div>
                                <span className="text-sm">View Invoices</span>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                        </Button>

                        <Button
                            className="w-full bg-card/50 border border-primary/20 hover:bg-primary/10 hover:border-primary text-foreground font-bold h-12 justify-between px-5 rounded-xl group transition-all"
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
                            className="w-full bg-card/50 border border-primary/20 hover:bg-primary/10 hover:border-primary text-foreground font-bold h-12 justify-between px-5 rounded-xl group transition-all"
                            onClick={() => window.location.href = '/client/dashboard/support'}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-destructive/10 rounded-lg group-hover:scale-110 transition-transform">
                                    <AlertCircle className="w-4 h-4 text-destructive" />
                                </div>
                                <span className="text-sm">Get Support</span>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                        </Button>

                        <Button
                            className="w-full bg-card/50 border border-red-500/20 hover:bg-red-500/10 hover:border-red-500/40 text-foreground font-bold h-12 justify-between px-5 rounded-xl group transition-all"
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
                            <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                                <Bell className="w-4 h-4 text-primary" />
                                Notifications
                            </h3>
                            {stats.unreadNotifications > 0 && (
                                <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] font-black">
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
                                            "p-3 rounded-xl transition-all cursor-pointer group",
                                            notif.is_read
                                                ? "neu-card-pressed"
                                                : "neu-card border-primary/20 hover:shadow-neu"
                                        )}
                                        onClick={async () => {
                                            await supabase.from("client_notifications").update({ is_read: true }).eq("id", notif.id);
                                            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
                                            if (notif.action_url) window.location.href = notif.action_url;
                                        }}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className={cn("text-xs font-bold truncate", notif.is_read ? "text-muted-foreground" : "text-foreground")}>
                                                    {notif.title}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground/60 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                                                <p className="text-[9px] text-muted-foreground/40 mt-1 font-bold">
                                                    {new Date(notif.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            {!notif.is_read && (
                                                <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1 animate-pulse" />
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 text-muted-foreground text-xs font-bold tracking-widest">
                                    NO NEW NOTIFICATIONS
                                </div>
                            )}
                        </div>
                    </div>

                    <Card className="neu-card bg-gradient-to-br from-primary/10 to-destructive/10 border-primary/20 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-cyber-grid pointer-events-none opacity-20" />
                        <CardHeader className="relative z-10">
                            <CardTitle className="text-foreground flex items-center gap-2">
                                <Shield className="w-5 h-5 text-primary" />
                                Your Support Team
                            </CardTitle>
                            <CardDescription className="text-muted-foreground font-medium">
                                Your dedicated support team is online.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="relative z-10 pt-0">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl neu-elevated flex items-center justify-center border border-border">
                                    <User className="w-6 h-6 text-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-foreground">VAW Support Team</p>
                                    <p className="text-xs text-primary">Support Team</p>
                                </div>
                            </div>
                            <Button
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 rounded-xl transition-all shadow-neu-sm"
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
