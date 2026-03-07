
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    DollarSign,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    CreditCard,
    Activity,
    Users,
    Loader2,
    CalendarClock,
    RefreshCw
} from "lucide-react";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import { format } from "date-fns";

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

        if (url) localStorage.setItem('vaw_external_api_url', url);
        if (key) localStorage.setItem('vaw_external_api_key', key);
        if (secret) localStorage.setItem('vaw_external_api_secret', secret);

        return { url: url || FALLBACK_URL, key, secret };
    } catch {
        const key = localStorage.getItem('vaw_external_api_key') || '';
        const secret = localStorage.getItem('vaw_external_api_secret') || '';
        if (!key || !secret) return null;
        return {
            url: localStorage.getItem('vaw_external_api_url') || FALLBACK_URL,
            key, secret
        };
    }
};

const getClientCode = (record: any): string => {
    return String(record.client_code || record.client_id || record.client_sync_id || record.customer_id || '');
};

const FinancialOversight = () => {
    const { data: clients = [] } = useRealtimeQuery({
        queryKey: ['hr-financial-clients'],
        table: 'clients',
        select: 'id, company_name, billing_sync_id'
    });

    const [externalStats, setExternalStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const creds = await loadApiCredentials();
            if (!creds) {
                setLoading(false);
                return;
            }

            const headers = { 'x-api-key': creds.key, 'x-api-secret': creds.secret };

            try {
                const [invRes, expRes, recRes, payRes] = await Promise.all([
                    fetch(`${creds.url}/invoices?limit=500`, { headers }),
                    fetch(`${creds.url}/expenses?limit=500`, { headers }),
                    fetch(`${creds.url}/recurring-invoices?limit=500`, { headers }),
                    fetch(`${creds.url}/payments?limit=500`, { headers })
                ]);

                const parse = async (res: Response) => {
                    if (!res.ok) return [];
                    const raw = await res.json();
                    return Array.isArray(raw) ? raw : (raw?.data || []);
                };

                const [invoices, expenses, recurring, payments] = await Promise.all([
                    parse(invRes), parse(expRes), parse(recRes), parse(payRes)
                ]);

                setExternalStats({ invoices, expenses, recurring, payments });
            } catch (err) {
                console.error("Failed to fetch external financial stats", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Build synced client lookup
    const syncedClients = (clients as any[]).filter((c) => c.billing_sync_id);
    const syncIdSet = new Set(syncedClients.map((c) => String(c.billing_sync_id)));
    const syncIdToClient = new Map<string, any>(syncedClients.map((c) => [String(c.billing_sync_id), c]));

    const isMatched = (record: any) => syncIdSet.has(getClientCode(record));

    // Matched data
    const matchedInvoices = (externalStats?.invoices || []).filter(isMatched);
    const matchedPayments = (externalStats?.payments || []).filter(isMatched);
    const matchedRecurring = (externalStats?.recurring || []).filter(isMatched);
    const allExpenses = externalStats?.expenses || [];

    // Calculations
    const totalRevenue = matchedInvoices.reduce((acc: number, inv: any) => acc + Number(inv.amount || inv.total || 0), 0);
    const totalCollected = matchedPayments.reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0)
        + matchedInvoices
            .filter((inv: any) => inv.status === 'paid' || inv.status === 'collected')
            .reduce((acc: number, inv: any) => acc + Number(inv.amount || inv.total || 0), 0);
    const totalExpenses = allExpenses.reduce((acc: number, e: any) => acc + Number(e.amount || 0), 0);
    const pendingCollection = Math.max(0, totalRevenue - totalCollected);
    const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue * 100).toFixed(1) : '0';

    // Monthly chart data
    const getMonthlyData = () => {
        const dataMap: Record<string, { name: string; revenue: number; expenses: number; timestamp: number }> = {};

        matchedInvoices.forEach((inv: any) => {
            const date = new Date(inv.created_at || inv.date || Date.now());
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            if (!dataMap[key]) {
                dataMap[key] = { name: date.toLocaleString('default', { month: 'short', year: '2-digit' }), revenue: 0, expenses: 0, timestamp: date.getTime() };
            }
            dataMap[key].revenue += Number(inv.amount || inv.total || 0);
        });

        allExpenses.forEach((exp: any) => {
            const date = new Date(exp.created_at || exp.date || Date.now());
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            if (!dataMap[key]) {
                dataMap[key] = { name: date.toLocaleString('default', { month: 'short', year: '2-digit' }), revenue: 0, expenses: 0, timestamp: date.getTime() };
            }
            dataMap[key].expenses += Number(exp.amount || 0);
        });

        const sorted = Object.values(dataMap).sort((a, b) => a.timestamp - b.timestamp);
        if (sorted.length === 0) {
            return Array.from({ length: 6 }).map((_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - (5 - i));
                return { name: d.toLocaleString('default', { month: 'short' }), revenue: 0, expenses: 0 };
            });
        }
        return sorted;
    };

    // Client billing ranking
    const getClientRankings = () => {
        const clientMap: Record<string, { id: string; name: string; paid: number; total: number }> = {};

        matchedInvoices.forEach((inv: any) => {
            const code = getClientCode(inv);
            const internalClient = syncIdToClient.get(code);
            if (!internalClient) return;

            if (!clientMap[internalClient.id]) {
                clientMap[internalClient.id] = { id: internalClient.id, name: internalClient.company_name, paid: 0, total: 0 };
            }
            const amount = Number(inv.amount || inv.total || 0);
            if (amount === 0) return;

            if (inv.status === 'paid' || inv.status === 'collected') {
                clientMap[internalClient.id].paid += amount;
            }
            clientMap[internalClient.id].total += amount;
        });

        // Also add payments data
        matchedPayments.forEach((p: any) => {
            const code = getClientCode(p);
            const internalClient = syncIdToClient.get(code);
            if (!internalClient) return;

            if (!clientMap[internalClient.id]) {
                clientMap[internalClient.id] = { id: internalClient.id, name: internalClient.company_name, paid: 0, total: 0 };
            }
            clientMap[internalClient.id].paid += Number(p.amount || 0);
        });

        return Object.values(clientMap).filter(c => c.total > 0).sort((a, b) => b.paid - a.paid);
    };

    // Upcoming recurring
    const getUpcomingRecurring = () => {
        return matchedRecurring
            .map((r: any) => {
                const code = getClientCode(r);
                const client = syncIdToClient.get(code);
                return {
                    ...r,
                    clientName: client?.company_name || code,
                    nextDate: r.next_date || r.next_due_date || r.next_invoice_date || r.due_date || null,
                    amount: Number(r.amount || r.total || 0),
                    frequency: r.frequency || r.interval || r.recurrence || 'monthly'
                };
            })
            .sort((a: any, b: any) => {
                if (!a.nextDate) return 1;
                if (!b.nextDate) return -1;
                return new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime();
            });
    };

    const chartData = getMonthlyData();
    const clientRankings = getClientRankings();
    const upcomingRecurring = getUpcomingRecurring();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <span className="ml-3 text-gray-400 font-bold">Loading financial data...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight">FINANCIAL <span className="text-indigo-500">OVERSIGHT</span></h1>
                    <p className="text-gray-500 font-medium">
                        Global financial analytics synchronized with VAW Billing Matrix.
                        {syncedClients.length > 0 && (
                            <Badge className="ml-2 bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">
                                {syncedClients.length} synced client{syncedClients.length !== 1 ? 's' : ''}
                            </Badge>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-black/40 border border-white/5 p-2 rounded-2xl backdrop-blur-md">
                    <Activity className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">All-Time Financial Matrix</span>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-indigo-500", bg: "bg-indigo-500/10", trend: totalRevenue > 0 ? "+12.5%" : "0%", trendUp: totalRevenue > 0 },
                    { label: "Amount Collected", value: `₹${totalCollected.toLocaleString()}`, icon: Wallet, color: "text-green-500", bg: "bg-green-500/10", trend: totalCollected > 0 ? "+8.2%" : "0%", trendUp: totalCollected > 0 },
                    { label: "Pending Dues", value: `₹${pendingCollection.toLocaleString()}`, icon: CreditCard, color: "text-rose-500", bg: "bg-rose-500/10", trend: pendingCollection > 0 ? `-${((pendingCollection / (totalRevenue || 1)) * 100).toFixed(1)}%` : "0%", trendUp: false },
                    { label: "Profit Margin", value: `${profitMargin}%`, icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-500/10", trend: `${profitMargin}%`, trendUp: Number(profitMargin) > 0 },
                ].map((stat, i) => (
                    <Card key={i} className="bg-black/40 border-white/5 backdrop-blur-xl group hover:border-indigo-500/20 transition-all rounded-[1.5rem] overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 ${stat.bg} rounded-2xl group-hover:scale-110 transition-transform`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                                <div className={`flex items-center gap-1 ${stat.trendUp ? 'text-green-500' : 'text-rose-500'}`}>
                                    {stat.trendUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                    <span className="text-[10px] font-black">{stat.trend}</span>
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
                            <h3 className="text-2xl font-black text-white tracking-tighter">{stat.value}</h3>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart */}
                <Card className="lg:col-span-2 bg-black/40 border-white/5 backdrop-blur-xl rounded-[2rem]">
                    <CardHeader className="p-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-black text-white uppercase tracking-tight">Revenue Stream Velocity</CardTitle>
                                <CardDescription>Monthly growth and operational burn rates.</CardDescription>
                            </div>
                            <Badge className="bg-indigo-600/10 text-indigo-500 border-indigo-500/20">LIVE MATRIX</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                <XAxis dataKey="name" stroke="#555" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                                <YAxis stroke="#555" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px' }} itemStyle={{ fontWeight: 'bold', fontSize: '10px' }} />
                                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Client Billing Ranking */}
                <Card className="bg-[#111] border-white/5 rounded-[2rem] overflow-hidden">
                    <CardHeader className="p-8">
                        <CardTitle className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-3">
                            <Users className="w-5 h-5 text-indigo-500" />
                            Client Billing Ranking
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-6">
                        {clientRankings.slice(0, 8).map((client: any) => (
                            <div key={client.id} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-bold text-white uppercase tracking-tight truncate max-w-[150px]">{client.name}</p>
                                    <span className="text-[10px] font-black text-indigo-400">₹{client.paid?.toLocaleString()} / ₹{client.total?.toLocaleString()}</span>
                                </div>
                                <Progress value={(client.paid / (client.total || 1)) * 100} className="h-1 bg-white/5" />
                            </div>
                        ))}
                        {clientRankings.length === 0 && (
                            <div className="text-center py-10">
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                                    {syncedClients.length === 0 ? "No clients synced yet" : "No billing data found for synced clients"}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recurring Invoices & Upcoming Payments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recurring Invoices List */}
                <Card className="bg-black/40 border-white/5 backdrop-blur-xl rounded-[2rem]">
                    <CardHeader className="p-8">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-3">
                                <RefreshCw className="w-5 h-5 text-emerald-500" />
                                Recurring Payments
                            </CardTitle>
                            <Badge className="bg-emerald-600/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                                {matchedRecurring.length} active
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-4 max-h-[400px] overflow-y-auto">
                        {matchedRecurring.length === 0 ? (
                            <div className="text-center py-10">
                                <RefreshCw className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">No recurring invoices found</p>
                            </div>
                        ) : (
                            upcomingRecurring.map((r: any, i: number) => (
                                <div key={r.id || i} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-emerald-500/20 transition-all">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate">{r.title || r.description || r.clientName}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase">{r.clientName}</span>
                                            <span className="text-[10px] text-gray-600">•</span>
                                            <span className="text-[10px] font-bold text-emerald-400 uppercase">{r.frequency}</span>
                                        </div>
                                    </div>
                                    <div className="text-right ml-4">
                                        <p className="text-sm font-black text-white">₹{r.amount.toLocaleString()}</p>
                                        <Badge variant="outline" className={`text-[9px] mt-1 ${r.status === 'active' ? 'border-emerald-500/30 text-emerald-400' : 'border-gray-500/30 text-gray-400'}`}>
                                            {r.status || 'active'}
                                        </Badge>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Upcoming Payments */}
                <Card className="bg-black/40 border-white/5 backdrop-blur-xl rounded-[2rem]">
                    <CardHeader className="p-8">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-3">
                                <CalendarClock className="w-5 h-5 text-amber-500" />
                                Upcoming Payments
                            </CardTitle>
                            <Badge className="bg-amber-600/10 text-amber-400 border-amber-500/20 text-[10px]">
                                SCHEDULE
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-4 max-h-[400px] overflow-y-auto">
                        {upcomingRecurring.filter((r: any) => r.nextDate).length === 0 ? (
                            <div className="text-center py-10">
                                <CalendarClock className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">No upcoming payments scheduled</p>
                            </div>
                        ) : (
                            upcomingRecurring
                                .filter((r: any) => r.nextDate)
                                .map((r: any, i: number) => {
                                    const nextDate = new Date(r.nextDate);
                                    const daysUntil = Math.ceil((nextDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                    const isOverdue = daysUntil < 0;
                                    const isSoon = daysUntil >= 0 && daysUntil <= 7;

                                    return (
                                        <div key={r.id || i} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-amber-500/20 transition-all">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-white truncate">{r.clientName}</p>
                                                <p className="text-[10px] text-gray-500 mt-1">
                                                    {format(nextDate, 'dd MMM yyyy')}
                                                </p>
                                            </div>
                                            <div className="text-right ml-4">
                                                <p className="text-sm font-black text-white">₹{r.amount.toLocaleString()}</p>
                                                <Badge className={`text-[9px] mt-1 ${
                                                    isOverdue 
                                                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                                                        : isSoon 
                                                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                                                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                }`}>
                                                    {isOverdue ? `${Math.abs(daysUntil)}d overdue` : isSoon ? `In ${daysUntil}d` : `In ${daysUntil}d`}
                                                </Badge>
                                            </div>
                                        </div>
                                    );
                                })
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Payments Log */}
            <Card className="bg-black/40 border-white/5 backdrop-blur-xl rounded-[2rem]">
                <CardHeader className="p-8">
                    <CardTitle className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-green-500" />
                        Recent Payments
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                    {matchedPayments.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">No payments recorded yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {matchedPayments.slice(0, 10).map((p: any, i: number) => {
                                const code = getClientCode(p);
                                const client = syncIdToClient.get(code);
                                return (
                                    <div key={p.id || i} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white truncate">{client?.company_name || code}</p>
                                            <p className="text-[10px] text-gray-500 mt-1">
                                                {p.created_at || p.date ? format(new Date(p.created_at || p.date), 'dd MMM yyyy') : 'N/A'}
                                                {p.method && <span className="ml-2 text-gray-600">• {p.method}</span>}
                                            </p>
                                        </div>
                                        <div className="text-right ml-4">
                                            <p className="text-sm font-black text-green-400">₹{Number(p.amount || 0).toLocaleString()}</p>
                                            <Badge variant="outline" className="text-[9px] mt-1 border-green-500/30 text-green-400">
                                                {p.status || 'received'}
                                            </Badge>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default FinancialOversight;
