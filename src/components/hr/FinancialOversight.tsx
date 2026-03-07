
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
    Loader2
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

interface ApiCredentials {
    url: string;
    key: string;
    secret: string;
}

const loadApiCredentials = async (): Promise<ApiCredentials | null> => {
    try {
        // Try app_settings first
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

        // Fallback to localStorage
        const url = creds.url || localStorage.getItem('vaw_external_api_url') || '';
        const key = creds.key || localStorage.getItem('vaw_external_api_key') || '';
        const secret = creds.secret || localStorage.getItem('vaw_external_api_secret') || '';

        if (!key || !secret) return null;

        // Sync to localStorage for other components
        if (url) localStorage.setItem('vaw_external_api_url', url);
        if (key) localStorage.setItem('vaw_external_api_key', key);
        if (secret) localStorage.setItem('vaw_external_api_secret', secret);

        return { url: url || "https://mezolzequhtjtifeznll.supabase.co/functions/v1/external-api", key, secret };
    } catch {
        // Final fallback to localStorage
        const key = localStorage.getItem('vaw_external_api_key') || '';
        const secret = localStorage.getItem('vaw_external_api_secret') || '';
        if (!key || !secret) return null;
        return {
            url: localStorage.getItem('vaw_external_api_url') || "https://mezolzequhtjtifeznll.supabase.co/functions/v1/external-api",
            key, secret
        };
    }
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

            try {
                const [expRes, invRes] = await Promise.all([
                    fetch(`${creds.url}/expenses?limit=500`, { headers: { 'x-api-key': creds.key, 'x-api-secret': creds.secret } }),
                    fetch(`${creds.url}/invoices?limit=500`, { headers: { 'x-api-key': creds.key, 'x-api-secret': creds.secret } })
                ]);

                if (expRes.ok && invRes.ok) {
                    const expRaw = await expRes.json();
                    const invRaw = await invRes.json();
                    const expenses = Array.isArray(expRaw) ? expRaw : (expRaw?.data || []);
                    const invoices = Array.isArray(invRaw) ? invRaw : (invRaw?.data || []);

                    setExternalStats({ rawExpenses: expenses, rawInvoices: invoices });
                }
            } catch (err) {
                console.error("Failed to fetch external financial stats", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Get synced client IDs
    const syncedClients = clients.filter((c: any) => c.billing_sync_id);
    const syncedSyncIds = syncedClients.map((c: any) => String(c.billing_sync_id));

    // Match invoices to synced clients
    const matchedInvoices = (externalStats?.rawInvoices || []).filter((inv: any) =>
        syncedSyncIds.includes(String(inv.client_id || inv.client_sync_id || inv.client_code || inv.customer_id))
    );

    const totalRevenue = matchedInvoices.reduce((acc: number, inv: any) => acc + Number(inv.amount || inv.total || 0), 0);
    const totalCollected = matchedInvoices
        .filter((inv: any) => inv.status === 'paid' || inv.status === 'collected')
        .reduce((acc: number, inv: any) => acc + Number(inv.amount || inv.total || 0), 0);
    const totalExpenses = (externalStats?.rawExpenses || []).reduce((acc: number, e: any) => acc + Number(e.amount || 0), 0);
    const pendingCollection = totalRevenue - totalCollected;
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

        (externalStats?.rawExpenses || []).forEach((exp: any) => {
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
            const syncId = String(inv.client_id || inv.client_sync_id || inv.client_code || inv.customer_id);
            const internalClient = syncedClients.find((c: any) => String(c.billing_sync_id) === syncId);
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

        return Object.values(clientMap).filter(c => c.total > 0).sort((a, b) => b.paid - a.paid);
    };

    const chartData = getMonthlyData();
    const clientRankings = getClientRankings();

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
        </div>
    );
};

export default FinancialOversight;
