import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    CreditCard,
    Clock,
    CheckCircle2,
    AlertCircle,
    Upload,
    Download,
    X,
    Loader2,
    IndianRupee,
    Calendar,
    FileText,
    RefreshCw,
    Receipt,
    TrendingUp,
    Repeat
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";
import { syncFinancialEntryToBilling } from "@/utils/syncUtils";

interface PaymentCenterProps {
    profile: any;
}

interface ApiCredentials {
    url: string;
    key: string;
    secret: string;
}

const FALLBACK_URL = "https://ecexzlqjobqajfhxmiaa.supabase.co/functions/v1/external-api";

const loadApiCredentials = async (): Promise<ApiCredentials | null> => {
    try {
        const { data } = await supabase
            .from('app_settings')
            .select('key, value')
            .in('key', ['billing_api_url', 'billing_api_key', 'billing_api_secret']);

        const creds: any = {};
        if (data && data.length > 0) {
            data.forEach((s: any) => {
                const val = typeof s.value === 'string' ? s.value.replace(/^"|"$/g, '') : String(s.value);
                if (s.key === 'billing_api_url') creds.url = val;
                if (s.key === 'billing_api_key') creds.key = val;
                if (s.key === 'billing_api_secret') creds.secret = val;
            });
        }

        const url = creds.url || localStorage.getItem('vaw_external_api_url') || '';
        const key = creds.key || localStorage.getItem('vaw_external_api_key') || '';
        const secret = creds.secret || localStorage.getItem('vaw_external_api_secret') || '';

        if (!key || !secret) return null;
        return { url: url || FALLBACK_URL, key, secret };
    } catch {
        const key = localStorage.getItem('vaw_external_api_key') || '';
        const secret = localStorage.getItem('vaw_external_api_secret') || '';
        if (!key || !secret) return null;
        return { url: localStorage.getItem('vaw_external_api_url') || FALLBACK_URL, key, secret };
    }
};

const getClientCode = (record: any): string =>
    String(record.client_code || record.client_id || record.client_sync_id || record.customer_id || '');

const PaymentCenter = ({ profile }: PaymentCenterProps) => {
    const billingId = profile?.billing_sync_id;

    // Local payment reminders (fallback)
    const { data: paymentReminders = [] } = useRealtimeQuery({
        queryKey: ['payment-reminders', profile?.id],
        table: 'payment_reminders',
        filter: `client_id=eq.${profile?.id}`,
        enabled: !!profile?.id
    });

    // Billing API data
    const [invoices, setInvoices] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [recurringInvoices, setRecurringInvoices] = useState<any[]>([]);
    const [billingLoading, setBillingLoading] = useState(true);
    const [billingConnected, setBillingConnected] = useState(false);

    // Payment confirmation state
    const [selectedReminder, setSelectedReminder] = useState<any>(null);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [screenshotPreview, setScreenshotPreview] = useState("");
    const [transactionId, setTransactionId] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (profile?.id) fetchBillingData();
    }, [profile?.id, billingId]);

    const fetchBillingData = async () => {
        setBillingLoading(true);
        const creds = await loadApiCredentials();
        if (!creds || !billingId) {
            setBillingConnected(false);
            setBillingLoading(false);
            return;
        }

        setBillingConnected(true);
        const headers = { 'x-api-key': creds.key, 'x-api-secret': creds.secret };

        try {
            const parse = async (res: Response) => {
                if (!res.ok) return [];
                const raw = await res.json();
                return Array.isArray(raw) ? raw : (raw?.data || []);
            };

            const [invRes, payRes, recRes] = await Promise.all([
                fetch(`${creds.url}/invoices?limit=500`, { headers }),
                fetch(`${creds.url}/payments?limit=500`, { headers }),
                fetch(`${creds.url}/recurring-invoices?limit=500`, { headers }),
            ]);

            const [allInvoices, allPayments, allRecurring] = await Promise.all([
                parse(invRes), parse(payRes), parse(recRes)
            ]);

            // Filter by client's billing_sync_id
            const matchId = billingId.toLowerCase();
            const filterByClient = (records: any[]) =>
                records.filter(r => getClientCode(r).toLowerCase() === matchId);

            setInvoices(filterByClient(allInvoices));
            setPayments(filterByClient(allPayments));
            setRecurringInvoices(filterByClient(allRecurring));
        } catch (err) {
            console.error("Billing API fetch error:", err);
        } finally {
            setBillingLoading(false);
        }
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

    const pendingInvoices = invoices.filter(inv =>
        ['draft', 'sent', 'overdue', 'partially_paid', 'unpaid'].includes(inv.status?.toLowerCase())
    );
    const paidInvoices = invoices.filter(inv =>
        ['paid', 'collected'].includes(inv.status?.toLowerCase())
    );

    const totalPaid = payments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
    const totalPending = pendingInvoices.reduce((sum: number, inv: any) =>
        sum + (Number(inv.balance) || Number(inv.total) || 0), 0);

    const downloadReceipt = (record: any, type: 'payment' | 'invoice') => {
        const companyName = profile?.company_name || 'Client';
        const date = record.payment_date || record.date || record.issue_date || new Date().toISOString();
        const amount = Number(record.amount || record.total || 0);
        const ref = record.receipt_number || record.reference_number || record.invoice_number || record.payment_number || `${type.toUpperCase()}-${Date.now()}`;
        const method = record.payment_method || record.payment_mode || 'N/A';
        const status = record.payment_status || record.status || 'completed';
        const dueDate = record.due_date || '';

        const lines = [
            '═══════════════════════════════════════════',
            '           VAW TECHNOLOGIES PVT LTD',
            '═══════════════════════════════════════════',
            '',
            type === 'payment' ? '          PAYMENT RECEIPT' : '              INVOICE',
            '',
            `  ${type === 'payment' ? 'Receipt' : 'Invoice'} #:  ${ref}`,
            `  Date:       ${new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`,
            ...(dueDate ? [`  Due Date:   ${new Date(dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`] : []),
            '',
            '───────────────────────────────────────────',
            `  Bill To:    ${companyName}`,
            ...(type === 'payment' ? [`  Method:     ${method.toUpperCase()}`] : []),
            `  Status:     ${status.toUpperCase()}`,
            '───────────────────────────────────────────',
            '',
            `  Amount:     ₹${amount.toLocaleString('en-IN')}`,
            '',
            '═══════════════════════════════════════════',
            '  Thank you for your business!',
            '  support@vawtech.com | vawtech.com',
            '═══════════════════════════════════════════',
        ];

        const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${ref}_${new Date(date).toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`${type === 'payment' ? 'Receipt' : 'Invoice'} downloaded`);
    };

    // Payment confirmation handlers
    const generateUPILink = (reminder: any) => {
        const upiId = "vaw@paytm";
        const amount = reminder.amount || reminder.total || reminder.balance;
        const transactionNote = `Payment for ${reminder.title || reminder.invoice_number || 'Invoice'}`;
        return `upi://pay?pa=${upiId}&pn=${encodeURIComponent("VAW Technologies")}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
    };

    const handlePayNow = (reminder: any) => {
        setSelectedReminder(reminder);
        window.location.href = generateUPILink(reminder);
        setTimeout(() => setPaymentDialogOpen(true), 1000);
    };

    const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { toast.error("Screenshot must be less than 5MB"); return; }
            setScreenshot(file);
            const reader = new FileReader();
            reader.onloadend = () => setScreenshotPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmitPayment = async () => {
        if (!screenshot || !transactionId.trim()) { toast.error("Please upload screenshot and enter transaction ID"); return; }
        if (!selectedReminder) return;
        setSubmitting(true);
        try {
            const fileExt = screenshot.name.split('.').pop();
            const fileName = `${profile.id}/payments/${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('payment-confirmations').upload(fileName, screenshot);
            if (uploadError) throw uploadError;
            const { data: urlData } = supabase.storage.from('payment-confirmations').getPublicUrl(fileName);

            const amount = selectedReminder.amount || selectedReminder.total || selectedReminder.balance;
            const title = selectedReminder.title || selectedReminder.invoice_number || 'Invoice Payment';

            await supabase.from('client_documents').insert({
                client_id: profile.id, title: `Payment Confirmation - ${title}`,
                file_url: urlData.publicUrl, doc_type: 'payment_confirmation',
                amount, status: 'pending_verification'
            });

            if (selectedReminder.id && !selectedReminder.invoice_number) {
                await supabase.from('payment_reminders').update({ status: 'confirmation_submitted' }).eq('id', selectedReminder.id);
            }

            await supabase.from('client_notifications').insert({
                client_id: null, title: 'Payment Confirmation Received',
                message: `${profile.company_name} submitted payment confirmation for ${title}. Transaction ID: ${transactionId}`,
                type: 'payment_confirmation', category: 'payment', priority: 'high', is_read: false
            });

            toast.success("Payment confirmation submitted!");
            setScreenshot(null); setScreenshotPreview(""); setTransactionId("");
            setPaymentDialogOpen(false); setSelectedReminder(null);
        } catch (error: any) {
            toast.error(error.message || "Failed to submit payment confirmation");
        } finally { setSubmitting(false); }
    };

    const getInvoiceStatusBadge = (status: string) => {
        const map: Record<string, { bg: string; text: string; label: string }> = {
            paid: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "Paid" },
            collected: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "Collected" },
            sent: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Sent" },
            draft: { bg: "bg-gray-500/20", text: "text-gray-400", label: "Draft" },
            overdue: { bg: "bg-red-500/20", text: "text-red-400", label: "Overdue" },
            partially_paid: { bg: "bg-amber-500/20", text: "text-amber-400", label: "Partial" },
            unpaid: { bg: "bg-orange-500/20", text: "text-orange-400", label: "Unpaid" },
        };
        const s = map[status?.toLowerCase()] || { bg: "bg-gray-500/20", text: "text-gray-400", label: status || "Unknown" };
        return <Badge className={`${s.bg} ${s.text} border-0`}>{s.label}</Badge>;
    };

    const loading = !profile;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-tech-gold" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-2">
                        PAYMENT <span className="text-tech-gold">CENTER</span>
                    </h1>
                    <p className="text-gray-400 font-medium">Manage your payments and invoices</p>
                </div>
                {billingConnected && (
                    <Button
                        variant="outline"
                        className="border-tech-gold/20 text-tech-gold hover:bg-tech-gold/10 gap-2"
                        onClick={fetchBillingData}
                        disabled={billingLoading}
                    >
                        <RefreshCw className={cn("w-4 h-4", billingLoading && "animate-spin")} />
                        Sync
                    </Button>
                )}
            </div>

            {/* Summary Cards */}
            {billingConnected && !billingLoading && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(() => {
                        const activeRecs = recurringInvoices.filter((r: any) => r.status?.toLowerCase() !== 'paused' && r.status?.toLowerCase() !== 'stopped');
                        const nextRec = activeRecs.sort((a: any, b: any) => new Date(a.next_issue_date || a.next_invoice_date || '9999').getTime() - new Date(b.next_issue_date || b.next_invoice_date || '9999').getTime())[0];
                        const nextDate = nextRec?.next_issue_date || nextRec?.next_invoice_date;
                        const daysUntil = nextDate ? Math.ceil((new Date(nextDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                        return (
                            <Card className="bg-black/40 border-tech-gold/10">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="p-2.5 bg-violet-500/10 rounded-xl">
                                        <Calendar className="w-5 h-5 text-violet-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Next Billing</p>
                                        {nextDate ? (
                                            <>
                                                <p className="text-lg font-black text-violet-400">{formatCurrency(Number(nextRec.total) || 0)}</p>
                                                <p className="text-[10px] text-gray-500">{new Date(nextDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {daysUntil! > 0 ? `${daysUntil}d` : 'Due'}</p>
                                            </>
                                        ) : (
                                            <p className="text-sm text-gray-500">No upcoming</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })()}
                    <Card className="bg-black/40 border-tech-gold/10">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2.5 bg-orange-500/10 rounded-xl">
                                <Clock className="w-5 h-5 text-orange-400" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Pending</p>
                                <p className="text-lg font-black text-orange-400">{formatCurrency(totalPending)}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-black/40 border-tech-gold/10">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2.5 bg-blue-500/10 rounded-xl">
                                <Receipt className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Invoices</p>
                                <p className="text-lg font-black text-blue-400">{invoices.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-black/40 border-tech-gold/10">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2.5 bg-violet-500/10 rounded-xl">
                                <Repeat className="w-5 h-5 text-violet-400" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Recurring</p>
                                <p className="text-lg font-black text-violet-400">{recurringInvoices.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Tabs defaultValue="pending" className="space-y-6">
                <TabsList className="bg-black/40 border border-tech-gold/20">
                    <TabsTrigger value="pending" className="data-[state=active]:bg-tech-gold data-[state=active]:text-black">
                        Pending Invoices
                    </TabsTrigger>
                    <TabsTrigger value="history" className="data-[state=active]:bg-tech-gold data-[state=active]:text-black">
                        Payment History
                    </TabsTrigger>
                    <TabsTrigger value="recurring" className="data-[state=active]:bg-tech-gold data-[state=active]:text-black">
                        Recurring
                    </TabsTrigger>
                </TabsList>

                {/* Pending Invoices Tab */}
                <TabsContent value="pending" className="space-y-4">
                    {billingLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-tech-gold" />
                        </div>
                    ) : pendingInvoices.length === 0 && paymentReminders.filter((r: any) => r.status !== 'paid').length === 0 ? (
                        <Card className="bg-black/20 border-tech-gold/10 border-dashed border-2">
                            <CardContent className="p-12 text-center">
                                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-emerald-500/30" />
                                <h3 className="text-xl font-bold text-white mb-2">All Caught Up!</h3>
                                <p className="text-gray-400">You have no pending payments</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {/* Billing API invoices */}
                            {pendingInvoices.map((inv, idx) => {
                                const amount = Number(inv.balance) || Number(inv.total) || 0;
                                const dueDate = inv.due_date || inv.date;
                                const daysUntil = dueDate ? Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                                const isOverdue = daysUntil !== null && daysUntil < 0;

                                return (
                                    <motion.div key={inv.id || idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}>
                                        <Card className={cn(
                                            "bg-black/40 backdrop-blur-xl border-tech-gold/10 hover:border-tech-gold/30 transition-all overflow-hidden",
                                            isOverdue && "border-red-500/50 bg-red-500/5"
                                        )}>
                                            <CardContent className="p-6">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                    <div className="flex-1">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h3 className="text-xl font-bold text-white">
                                                                        {inv.invoice_number || inv.reference || `Invoice`}
                                                                    </h3>
                                                                    {getInvoiceStatusBadge(inv.status)}
                                                                </div>
                                                                {inv.notes && <p className="text-sm text-gray-400 line-clamp-1">{inv.notes}</p>}
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <IndianRupee className="w-4 h-4 text-tech-gold" />
                                                                <span className="text-2xl font-black text-tech-gold">
                                                                    {Number(amount).toLocaleString('en-IN')}
                                                                </span>
                                                            </div>
                                                            {dueDate && (
                                                                <div className="flex items-center gap-2 text-gray-400">
                                                                    <Calendar className="w-4 h-4" />
                                                                    <span>Due: {new Date(dueDate).toLocaleDateString('en-IN')}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {isOverdue && (
                                                            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                                                <p className="text-xs text-red-400 flex items-center gap-2">
                                                                    <AlertCircle className="w-4 h-4" />
                                                                    This invoice is {Math.abs(daysUntil!)} days overdue
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <Button
                                                            onClick={() => handlePayNow({ ...inv, amount })}
                                                            className="bg-tech-gold hover:bg-white text-black font-bold h-12 px-6 rounded-xl shadow-lg shadow-tech-gold/20"
                                                        >
                                                            <IndianRupee className="w-4 h-4 mr-2" /> Pay Now via UPI
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            className="border-tech-gold/20 hover:bg-tech-gold/10 text-white font-bold"
                                                            onClick={() => { setSelectedReminder({ ...inv, amount }); setPaymentDialogOpen(true); }}
                                                        >
                                                            Submit Confirmation
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })}

                            {/* Local payment reminders (non-billing) */}
                            {paymentReminders
                                .filter((r: any) => r.status !== 'paid')
                                .map((reminder: any, idx: number) => {
                                    const daysUntil = Math.ceil((new Date(reminder.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                    const isOverdue = daysUntil < 0;
                                    return (
                                        <motion.div key={reminder.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (pendingInvoices.length + idx) * 0.08 }}>
                                            <Card className={cn("bg-black/40 backdrop-blur-xl border-tech-gold/10 hover:border-tech-gold/30 transition-all", isOverdue && "border-red-500/50 bg-red-500/5")}>
                                                <CardContent className="p-6">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                        <div className="flex-1">
                                                            <div className="flex items-start justify-between mb-3">
                                                                <h3 className="text-xl font-bold text-white">{reminder.title}</h3>
                                                                <Badge className="bg-tech-gold/20 text-tech-gold border-0 text-[10px]">LOCAL</Badge>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                                <div className="flex items-center gap-2">
                                                                    <IndianRupee className="w-4 h-4 text-tech-gold" />
                                                                    <span className="text-2xl font-black text-tech-gold">
                                                                        {Number(reminder.amount).toLocaleString('en-IN')}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-gray-400">
                                                                    <Calendar className="w-4 h-4" />
                                                                    <span>Due: {new Date(reminder.due_date).toLocaleDateString('en-IN')}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            <Button onClick={() => handlePayNow(reminder)} className="bg-tech-gold hover:bg-white text-black font-bold h-12 px-6 rounded-xl">
                                                                <IndianRupee className="w-4 h-4 mr-2" /> Pay Now
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                        </div>
                    )}
                </TabsContent>

                {/* Payment History Tab */}
                <TabsContent value="history" className="space-y-4">
                    {billingLoading ? (
                        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-tech-gold" /></div>
                    ) : payments.length === 0 && paidInvoices.length === 0 ? (
                        <Card className="bg-black/20 border-tech-gold/10 border-dashed border-2">
                            <CardContent className="p-12 text-center">
                                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-500 opacity-20" />
                                <p className="text-gray-400">No payment history available</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {/* Payments from billing API */}
                            {payments.map((pay, idx) => (
                                <motion.div key={pay.id || idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                                    <Card className="bg-black/40 backdrop-blur-xl border-tech-gold/10 hover:border-tech-gold/30 transition-all">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-emerald-500/10 rounded-xl">
                                                        <CreditCard className="w-5 h-5 text-emerald-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white font-bold">
                                                            {pay.reference || pay.payment_number || `Payment #${idx + 1}`}
                                                        </h4>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            {pay.date ? new Date(pay.date).toLocaleDateString('en-IN') : ''}
                                                            {pay.payment_mode && <span className="ml-2 text-gray-500">• {pay.payment_mode}</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-emerald-400 font-bold text-lg">
                                                        {formatCurrency(Number(pay.amount) || 0)}
                                                    </p>
                                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-0">Paid</Badge>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}

                            {/* Paid invoices */}
                            {paidInvoices.map((inv, idx) => (
                                <motion.div key={inv.id || `inv-${idx}`} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: (payments.length + idx) * 0.05 }}>
                                    <Card className="bg-black/40 backdrop-blur-xl border-tech-gold/10 hover:border-tech-gold/30 transition-all">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-tech-gold/10 rounded-xl">
                                                        <FileText className="w-5 h-5 text-tech-gold" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white font-bold">{inv.invoice_number || 'Invoice'}</h4>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            {inv.date ? new Date(inv.date).toLocaleDateString('en-IN') : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-tech-gold font-bold">
                                                        {formatCurrency(Number(inv.total) || 0)}
                                                    </p>
                                                    {getInvoiceStatusBadge(inv.status)}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Recurring Invoices Tab */}
                <TabsContent value="recurring" className="space-y-4">
                    {billingLoading ? (
                        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-tech-gold" /></div>
                    ) : recurringInvoices.length === 0 ? (
                        <Card className="bg-black/20 border-tech-gold/10 border-dashed border-2">
                            <CardContent className="p-12 text-center">
                                <Repeat className="w-16 h-16 mx-auto mb-4 text-gray-500 opacity-20" />
                                <p className="text-gray-400">No recurring invoices found</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {recurringInvoices.map((rec, idx) => {
                                const isActive = rec.status?.toLowerCase() !== 'paused' && rec.status?.toLowerCase() !== 'stopped';
                                const nextDate = rec.next_issue_date || rec.next_invoice_date || rec.next_generation_date;
                                const createdDate = rec.created_at;
                                const freq = rec.frequency || rec.recurrence_frequency || 'monthly';
                                
                                // Calculate timeline progress
                                let timelineProgress = 0;
                                if (nextDate && createdDate && isActive) {
                                    const now = new Date().getTime();
                                    const start = new Date(createdDate).getTime();
                                    const end = new Date(nextDate).getTime();
                                    if (end > start) {
                                        timelineProgress = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
                                    }
                                }
                                
                                const daysUntilNext = nextDate ? Math.ceil((new Date(nextDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

                                return (
                                    <motion.div key={rec.id || idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                                        <Card className="bg-black/40 backdrop-blur-xl border-tech-gold/10 hover:border-tech-gold/30 transition-all">
                                            <CardContent className="p-5 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn("p-3 rounded-xl", isActive ? "bg-violet-500/10" : "bg-gray-500/10")}>
                                                            <Repeat className={cn("w-5 h-5", isActive ? "text-violet-400" : "text-gray-400")} />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-white font-bold">
                                                                {rec.name || rec.invoice_number || `Recurring #${idx + 1}`}
                                                            </h4>
                                                            <p className="text-xs text-gray-400 mt-1 capitalize">
                                                                {freq} billing cycle
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <p className="text-violet-400 font-bold">
                                                            {formatCurrency(Number(rec.total) || 0)}
                                                        </p>
                                                        <Badge className={cn("border-0", isActive ? "bg-violet-500/20 text-violet-400" : "bg-gray-500/20 text-gray-400")}>
                                                            {isActive ? "Active" : rec.status}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                {/* Timeline */}
                                                {isActive && nextDate && (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between text-[11px]">
                                                            <span className="text-gray-500">
                                                                {createdDate ? `Started ${new Date(createdDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Billing cycle'}
                                                            </span>
                                                            <span className="text-violet-400 font-semibold flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                Next: {new Date(nextDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </span>
                                                        </div>
                                                        <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                                                            <motion.div
                                                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-violet-400 rounded-full"
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${timelineProgress}%` }}
                                                                transition={{ duration: 1, delay: idx * 0.1 }}
                                                            />
                                                        </div>
                                                        {daysUntilNext !== null && (
                                                            <p className={cn("text-[11px] font-semibold text-right", daysUntilNext <= 30 ? "text-amber-400" : "text-gray-500")}>
                                                                {daysUntilNext > 0 ? `${daysUntilNext} days until next billing` : daysUntilNext === 0 ? 'Due today' : `Overdue by ${Math.abs(daysUntilNext)} days`}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Payment Confirmation Dialog */}
            <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                <DialogContent className="bg-black border-tech-gold/20 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Submit Payment Confirmation</DialogTitle>
                    </DialogHeader>
                    {selectedReminder && (
                        <div className="space-y-4">
                            <div className="p-4 bg-tech-gold/10 border border-tech-gold/20 rounded-xl">
                                <p className="text-sm text-gray-400 mb-1">Payment for:</p>
                                <p className="text-white font-bold">{selectedReminder.title || selectedReminder.invoice_number || 'Invoice'}</p>
                                <p className="text-2xl font-black text-tech-gold mt-2">
                                    ₹{Number(selectedReminder.amount || selectedReminder.total || selectedReminder.balance || 0).toLocaleString('en-IN')}
                                </p>
                            </div>
                            <div>
                                <Label className="text-gray-300">Transaction ID *</Label>
                                <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)}
                                    placeholder="Enter UPI transaction ID"
                                    className="bg-white/5 border-tech-gold/20 text-white placeholder:text-gray-500 mt-2" />
                            </div>
                            <div>
                                <Label className="text-gray-300">Payment Screenshot *</Label>
                                {screenshotPreview ? (
                                    <div className="relative mt-2">
                                        <img src={screenshotPreview} alt="Payment screenshot" className="w-full h-48 object-cover rounded-xl border border-tech-gold/20" />
                                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 bg-black/80 hover:bg-red-500/20"
                                            onClick={() => { setScreenshot(null); setScreenshotPreview(""); }}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <label className="mt-2 flex flex-col items-center justify-center h-32 border-2 border-dashed border-tech-gold/20 rounded-xl cursor-pointer hover:border-tech-gold/40 transition-colors">
                                        <Upload className="w-8 h-8 text-tech-gold mb-2" />
                                        <span className="text-sm text-gray-400">Upload payment screenshot</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={handleScreenshotChange} />
                                    </label>
                                )}
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button variant="outline" className="flex-1 border-tech-gold/20" onClick={() => setPaymentDialogOpen(false)} disabled={submitting}>Cancel</Button>
                                <Button onClick={handleSubmitPayment} disabled={submitting || !screenshot || !transactionId.trim()} className="flex-1 bg-tech-gold hover:bg-white text-black font-bold">
                                    {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : "Submit Confirmation"}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PaymentCenter;
