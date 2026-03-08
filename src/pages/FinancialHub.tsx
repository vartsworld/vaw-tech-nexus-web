import { useState, useEffect, useMemo } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter
} from "@/components/ui/card";
import {
    CreditCard,
    Download,
    FileText,
    Clock,
    CheckCircle2,
    TrendingDown,
    ChevronRight,
    ShieldCheck,
    AlertCircle,
    ExternalLink,
    History,
    Zap,
    Bell,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface DueAlert {
    id: string;
    amount: number;
    daysUntilDue: number;
    dueDate: string;
    label: string;
    invoiceNumber?: string;
    shareUrl?: string;
}

const FALLBACK_URL = "https://ecexzlqjobqajfhxmiaa.supabase.co/functions/v1/external-api";

const FinancialHub = ({ profile }: { profile: any }) => {
    const [dueAlerts, setDueAlerts] = useState<DueAlert[]>([]);
    const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

    // Fetch projects for billing info in realtime
    const { data: projects = [] } = useRealtimeQuery({
        queryKey: ['client-projects', profile?.id],
        table: 'client_projects',
        filter: `client_id=eq.${profile?.id}`,
        enabled: !!profile?.id
    });

    // Fetch documents (invoices, agreements) in realtime
    const { data: documents = [] } = useRealtimeQuery({
        queryKey: ['client-documents', profile?.id],
        table: 'client_documents',
        filter: `client_id=eq.${profile?.id}`,
        enabled: !!profile?.id
    });

    // Fetch billing API invoices for due date alerts
    useEffect(() => {
        const fetchDueAlerts = async () => {
            if (!profile?.billing_sync_id) {
                // Fallback: use local project next_payment_date
                const localAlerts: DueAlert[] = projects
                    .filter((p: any) => p.next_payment_date && Number(p.amount_paid || 0) < Number(p.total_amount || 0))
                    .map((p: any) => {
                        const due = new Date(p.next_payment_date);
                        const now = new Date();
                        const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        return {
                            id: p.id,
                            amount: Number(p.total_amount || 0) - Number(p.amount_paid || 0),
                            daysUntilDue: diff,
                            dueDate: p.next_payment_date,
                            label: p.title,
                        };
                    })
                    .filter((a: DueAlert) => a.daysUntilDue <= 30 && a.daysUntilDue >= -30);
                setDueAlerts(localAlerts);
                return;
            }

            try {
                const { data: settings } = await supabase
                    .from('app_settings')
                    .select('key, value')
                    .in('key', ['billing_api_url', 'billing_api_key', 'billing_api_secret']);

                const creds: any = {};
                settings?.forEach((s: any) => {
                    const val = typeof s.value === 'string' ? s.value.replace(/^"|"$/g, '') : String(s.value);
                    if (s.key === 'billing_api_url') creds.url = val;
                    if (s.key === 'billing_api_key') creds.key = val;
                    if (s.key === 'billing_api_secret') creds.secret = val;
                });

                const url = creds.url || localStorage.getItem('vaw_external_api_url') || FALLBACK_URL;
                const key = creds.key || localStorage.getItem('vaw_external_api_key') || '';
                const secret = creds.secret || localStorage.getItem('vaw_external_api_secret') || '';

                if (!key || !secret) return;

                const headers = { 'x-api-key': key, 'x-api-secret': secret };
                const res = await fetch(`${url}/invoices?limit=500`, { headers });
                if (!res.ok) return;
                const raw = await res.json();
                const allInvoices = Array.isArray(raw) ? raw : (raw?.data || []);

                const matchId = profile.billing_sync_id.toLowerCase();
                const clientInvoices = allInvoices.filter((inv: any) => {
                    const code = String(inv.client_code || inv.client_id || inv.client_sync_id || inv.customer_id || '').toLowerCase();
                    return code === matchId;
                });

                const now = new Date();
                const alerts: DueAlert[] = clientInvoices
                    .filter((inv: any) => {
                        const status = (inv.status || '').toLowerCase();
                        return ['pending', 'draft', 'sent', 'overdue', 'partially_paid', 'unpaid', 'partial'].includes(status);
                    })
                    .filter((inv: any) => inv.due_date)
                    .map((inv: any) => {
                        const due = new Date(inv.due_date);
                        const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        return {
                            id: inv.id,
                            amount: Number(inv.balance) || Number(inv.total) || 0,
                            daysUntilDue: diff,
                            dueDate: inv.due_date,
                            label: inv.invoice_number || 'Invoice',
                            invoiceNumber: inv.invoice_number,
                            shareUrl: inv.share_url,
                        };
                    })
                    .filter((a: DueAlert) => a.daysUntilDue <= 30 && a.daysUntilDue >= -30);

                setDueAlerts(alerts);
            } catch (err) {
                console.error('Due alerts fetch error:', err);
            }
        };

        fetchDueAlerts();
        // Re-check every 5 minutes
        const interval = setInterval(fetchDueAlerts, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [profile?.billing_sync_id, profile?.id, projects]);

    const visibleAlerts = dueAlerts.filter(a => !dismissedAlerts.has(a.id));

    const dismissAlert = (id: string) => {
        setDismissedAlerts(prev => new Set([...prev, id]));
    };

    const getAlertStyle = (days: number) => {
        if (days < 0) return { bg: 'bg-red-500/15', border: 'border-red-500/30', text: 'text-red-400', icon: 'text-red-500' };
        if (days <= 3) return { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', icon: 'text-red-500' };
        if (days <= 7) return { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', icon: 'text-amber-500' };
        return { bg: 'bg-tech-gold/10', border: 'border-tech-gold/20', text: 'text-tech-gold', icon: 'text-tech-gold' };
    };

    const getDueMessage = (alert: DueAlert) => {
        if (alert.daysUntilDue < 0) return `Your payment of ₹${alert.amount.toLocaleString()} was due ${Math.abs(alert.daysUntilDue)} day${Math.abs(alert.daysUntilDue) !== 1 ? 's' : ''} ago — overdue!`;
        if (alert.daysUntilDue === 0) return `Your payment of ₹${alert.amount.toLocaleString()} is due today!`;
        return `Your payment of ₹${alert.amount.toLocaleString()} is due in ${alert.daysUntilDue} day${alert.daysUntilDue !== 1 ? 's' : ''}`;
    };

    const loading = !profile;

    const totalBudget = projects.reduce((acc, p) => acc + Number(p.total_amount || 0), 0);
    const totalPaid = projects.reduce((acc, p) => acc + Number(p.amount_paid || 0), 0);
    const pendingAmount = totalBudget - totalPaid;

    return (
        <div className="space-y-8 pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-2">FINANCIAL <span className="text-tech-gold uppercase">RECORDS</span></h1>
                    <p className="text-gray-400 font-medium italic">Transparency in every transaction.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button className="bg-tech-gold hover:bg-white text-black font-bold h-12 px-6 rounded-xl transition-all shadow-lg shadow-tech-gold/20">
                        Quick Pay
                    </Button>
                </div>
            </div>

            {/* Payment Due Notifications */}
            <AnimatePresence>
                {visibleAlerts.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-3"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <Bell className="w-4 h-4 text-tech-gold animate-pulse" />
                            <span className="text-xs font-black text-tech-gold uppercase tracking-[0.2em]">Payment Reminders</span>
                            <Badge variant="outline" className="border-tech-gold/30 text-tech-gold text-[10px] ml-auto">
                                {visibleAlerts.length} pending
                            </Badge>
                        </div>
                        {visibleAlerts.map((alert) => {
                            const style = getAlertStyle(alert.daysUntilDue);
                            return (
                                <motion.div
                                    key={alert.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20, height: 0 }}
                                    className={`flex items-center gap-4 p-4 rounded-2xl border ${style.bg} ${style.border} backdrop-blur-xl`}
                                >
                                    <div className={`p-2 rounded-xl ${style.bg}`}>
                                        <AlertCircle className={`w-5 h-5 ${style.icon} ${alert.daysUntilDue <= 3 ? 'animate-pulse' : ''}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-bold ${style.text}`}>
                                            {getDueMessage(alert)}
                                        </p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                                            {alert.label} • Due: {new Date(alert.dueDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {alert.shareUrl && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={`${style.text} hover:bg-white/5 rounded-xl h-8 w-8`}
                                                onClick={() => window.open(alert.shareUrl, '_blank', 'noopener,noreferrer')}
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-gray-500 hover:bg-white/5 rounded-xl h-8 w-8"
                                            onClick={() => dismissAlert(alert.id)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Financial Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-black/40 backdrop-blur-xl border-tech-gold/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-tech-gold/5 blur-[30px]" />
                    <CardContent className="p-8">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-tech-gold/10 rounded-2xl group-hover:scale-110 transition-transform">
                                <CreditCard className="w-6 h-6 text-tech-gold" />
                            </div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Total Budget</p>
                        </div>
                        <h2 className="text-4xl font-black text-white mb-2">₹{totalBudget.toLocaleString()}</h2>
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-bold uppercase tracking-widest mt-4">
                            <TrendingDown className="w-4 h-4 text-tech-gold" /> 100% Guaranteed Accuracy
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-black/40 backdrop-blur-xl border-green-500/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 blur-[30px]" />
                    <CardContent className="p-8">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-green-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                                <CheckCircle2 className="w-6 h-6 text-green-500" />
                            </div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Amount Paid</p>
                        </div>
                        <h2 className="text-4xl font-black text-white mb-2">₹{totalPaid.toLocaleString()}</h2>
                        <div className="space-y-1 mt-4">
                            <Progress value={(totalPaid / totalBudget) * 100} className="h-1 bg-white/5 [&>div]:bg-green-500" />
                            <p className="text-[10px] text-green-500 font-black text-right uppercase">{(totalPaid / totalBudget * 100).toFixed(1)}% PAID</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-black/40 backdrop-blur-xl border-tech-red/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-tech-red/5 blur-[30px]" />
                    <CardContent className="p-8">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-tech-red/10 rounded-2xl group-hover:scale-110 transition-transform">
                                <Clock className="w-6 h-6 text-tech-red" />
                            </div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Pending Dues</p>
                        </div>
                        <h2 className="text-4xl font-black text-white mb-2">₹{pendingAmount.toLocaleString()}</h2>
                        <div className="flex items-center gap-2 text-xs text-tech-red font-bold uppercase tracking-widest mt-4">
                            <AlertCircle className="w-4 h-4" /> Payment required soon
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Project Billing Breakdown */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-tech-gold" />
                        Project Billing
                    </h2>

                    <div className="grid gap-4">
                        {loading ? (
                            <div className="h-40 bg-white/5 rounded-2xl animate-pulse" />
                        ) : projects.length > 0 ? (
                            projects.map((project) => (
                                <Card key={project.id} className="bg-black/40 backdrop-blur-xl border-white/5 hover:border-tech-gold/20 transition-all group rounded-2xl overflow-hidden">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="space-y-1">
                                                <h4 className="font-bold text-white group-hover:text-tech-gold transition-colors">{project.title}</h4>
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="outline" className="border-tech-gold/20 text-tech-gold text-[10px] uppercase font-black px-1 leading-none h-4">
                                                        {project.project_type}
                                                    </Badge>
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                                        Frequency: Milestone-based
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-2">
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-white">₹{Number(project.amount_paid).toLocaleString()}</p>
                                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Of ₹{Number(project.total_amount).toLocaleString()} Total</p>
                                                </div>
                                                {project.next_payment_date && (
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-tech-gold uppercase bg-tech-gold/10 px-2 py-0.5 rounded-full border border-tech-gold/20 animate-pulse-gentle">
                                                        <Zap className="w-3 h-3" /> Due: {new Date(project.next_payment_date).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <p className="text-gray-500 italic text-center py-12">No active billing cycles found.</p>
                        )}
                    </div>
                </div>

                {/* Documents & Invoices */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Documents
                    </h2>

                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-4 space-y-3">
                        {loading ? (
                            <div className="h-40 bg-white/5 animate-pulse" />
                        ) : documents.length > 0 ? (
                            documents.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-tech-gold/30 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center group-hover:text-tech-gold transition-colors">
                                            {doc.doc_type === 'invoice' ? <CreditCard className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white truncate max-w-[120px]">{doc.title}</p>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                {doc.doc_type.toUpperCase()} • {new Date(doc.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-tech-gold hover:bg-tech-gold/10 rounded-xl" asChild>
                                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                            <Download className="w-5 h-5" />
                                        </a>
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center text-gray-600">
                                <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p className="text-xs font-bold uppercase tracking-widest">No Documents Found</p>
                            </div>
                        )}
                    </div>

                    <Card className="bg-gradient-to-br from-blue-500/20 to-tech-purple/20 border-blue-500/30">
                        <CardHeader>
                            <CardTitle className="text-white text-sm flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-blue-400" />
                                Compliance
                            </CardTitle>
                            <CardDescription className="text-gray-300 text-[10px] font-bold uppercase">
                                Secure Payment Processing Active
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <p className="text-xs text-gray-400 font-medium mb-4">
                                All financial transactions are encrypted and verified. For corporate tax inquiries, please request a ledger export.
                            </p>
                            <Button variant="outline" className="w-full border-blue-500/30 text-white hover:bg-blue-500/10 text-xs font-bold h-10 rounded-xl">
                                Request Ledger
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default FinancialHub;
