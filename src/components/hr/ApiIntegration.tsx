
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Key,
    Globe,
    Database,
    Shield,
    Zap,
    Copy,
    Plus,
    Trash2,
    History,
    Book,
    Code,
    Webhook,
    Terminal,
    AlertCircle,
    CheckCircle2,
    Lock,
    ExternalLink,
    RefreshCw,
    Search,
    Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";
import { cn } from "@/lib/utils";

const ApiIntegration = () => {
    const [apiKeyName, setApiKeyName] = useState("");
    const [loading, setLoading] = useState(false);

    // 1. Hook up real-time queries for API Management
    const { data: apiKeys = [], refetch: refetchKeys } = useRealtimeQuery({
        queryKey: ['hr-api-keys'],
        table: 'api_keys',
        select: '*'
    });

    const { data: webhooks = [], refetch: refetchWebhooks } = useRealtimeQuery({
        queryKey: ['hr-webhooks'],
        table: 'api_webhooks',
        select: '*'
    });

    const { data: apiLogs = [] } = useRealtimeQuery({
        queryKey: ['hr-api-logs'],
        table: 'api_logs',
        select: '*',
        order: { column: 'created_at', ascending: false },
        limit: 20
    });

    const [webhookUrl, setWebhookUrl] = useState("");

    // External API Integration Settings (The connection to billing system)
    const [externalApiUrl, setExternalApiUrl] = useState(localStorage.getItem('vaw_external_api_url') || "https://mezolzequhtjtifeznll.supabase.co/functions/v1/external-api");
    const [externalApiKey, setExternalApiKey] = useState(localStorage.getItem('vaw_external_api_key') || "");
    const [externalApiSecret, setExternalApiSecret] = useState(localStorage.getItem('vaw_external_api_secret') || "");
    const [isConnected, setIsConnected] = useState(false);
    const [activeResource, setActiveResource] = useState("invoices");
    const [resourceData, setResourceData] = useState<any[]>([]);
    const [isFetching, setIsFetching] = useState(false);

    // Load credentials from Supabase app_settings on mount
    useEffect(() => {
        const loadSavedCredentials = async () => {
            try {
                const { data } = await supabase
                    .from('app_settings')
                    .select('key, value')
                    .in('key', ['billing_api_url', 'billing_api_key', 'billing_api_secret']);
                
                if (data && data.length > 0) {
                    data.forEach((setting: any) => {
                        const val = typeof setting.value === 'string' ? setting.value : JSON.stringify(setting.value);
                        if (setting.key === 'billing_api_url' && val) {
                            setExternalApiUrl(val.replace(/^"|"$/g, ''));
                            localStorage.setItem('vaw_external_api_url', val.replace(/^"|"$/g, ''));
                        }
                        if (setting.key === 'billing_api_key' && val) {
                            setExternalApiKey(val.replace(/^"|"$/g, ''));
                            localStorage.setItem('vaw_external_api_key', val.replace(/^"|"$/g, ''));
                        }
                        if (setting.key === 'billing_api_secret' && val) {
                            setExternalApiSecret(val.replace(/^"|"$/g, ''));
                            localStorage.setItem('vaw_external_api_secret', val.replace(/^"|"$/g, ''));
                        }
                    });
                }
            } catch (err) {
                console.error('Error loading API credentials from DB:', err);
            }
        };
        loadSavedCredentials().then(() => {
            const key = localStorage.getItem('vaw_external_api_key');
            const secret = localStorage.getItem('vaw_external_api_secret');
            if (key && secret) testConnection();
        });
    }, []);

    const saveCredentials = async () => {
        // Save to localStorage for immediate use
        localStorage.setItem('vaw_external_api_url', externalApiUrl);
        localStorage.setItem('vaw_external_api_key', externalApiKey);
        localStorage.setItem('vaw_external_api_secret', externalApiSecret);

        // Persist to Supabase app_settings for cross-session/cross-device access
        const settings = [
            { key: 'billing_api_url', value: JSON.stringify(externalApiUrl), description: 'Billing software API URL' },
            { key: 'billing_api_key', value: JSON.stringify(externalApiKey), description: 'Billing software API key' },
            { key: 'billing_api_secret', value: JSON.stringify(externalApiSecret), description: 'Billing software API secret' },
        ];
        for (const s of settings) {
            await supabase.from('app_settings').upsert(s, { onConflict: 'key' });
        }

        const success = await testConnection();
        if (success) {
            toast.success("API credentials saved & connection verified!");
            const explorerTab = document.querySelector('[value="explorer"]') as HTMLButtonElement;
            if (explorerTab) explorerTab.click();
            fetchResource(activeResource);
        }
    };

    const testConnection = async (): Promise<boolean> => {
        if (!externalApiKey || !externalApiSecret) return false;
        setLoading(true);
        try {
            const response = await fetch(`${externalApiUrl}/invoices?limit=1`, {
                headers: {
                    'x-api-key': externalApiKey,
                    'x-api-secret': externalApiSecret
                }
            });
            if (response.ok) {
                setIsConnected(true);
                return true;
            } else {
                setIsConnected(false);
                toast.error("API Connection Failed: Check credentials or URL");
                return false;
            }
        } catch (error) {
            setIsConnected(false);
            console.error("Connection error:", error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const fetchResource = async (resource: string) => {
        if (!externalApiKey || !externalApiSecret) return;
        setIsFetching(true);
        try {
            const response = await fetch(`${externalApiUrl}/${resource}?limit=10`, {
                headers: {
                    'x-api-key': externalApiKey,
                    'x-api-secret': externalApiSecret
                }
            });
            const data = await response.json();
            if (response.ok) {
                setResourceData(Array.isArray(data) ? data : data.data || []);
            }
        } catch (error) {
            console.error(`Error fetching ${resource}:`, error);
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        if (isConnected) {
            fetchResource(activeResource);
        }
    }, [activeResource, isConnected]);

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    return (
        <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-black/40 p-8 rounded-[2rem] border border-white/5 backdrop-blur-xl">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-white uppercase">API <span className="text-indigo-500">INTEGRATION</span></h1>
                    </div>
                    <p className="text-gray-400 font-medium">Connect VAW Billing with external systems and manage real-time webhooks.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => document.querySelector('[value="docs"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))}
                        className="border-white/10 hover:bg-white/5 text-xs font-bold uppercase tracking-widest rounded-xl h-12 px-6"
                    >
                        <Book className="w-4 h-4 mr-2" /> Documentation
                    </Button>
                    <Button
                        onClick={() => document.querySelector('[value="settings"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-widest rounded-xl h-12 px-6 shadow-lg shadow-indigo-600/20"
                    >
                        <Plus className="w-4 h-4 mr-2" /> New Connection
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="settings" className="space-y-6">
                <TabsList className="bg-[#111] p-1 border border-white/5 rounded-2xl h-14">
                    <TabsTrigger value="settings" className="rounded-xl px-8 h-12 data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold tracking-tight">
                        <Globe className="w-4 h-4 mr-2" /> Connection
                    </TabsTrigger>
                    <TabsTrigger value="explorer" className="rounded-xl px-8 h-12 data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold tracking-tight">
                        <Database className="w-4 h-4 mr-2" /> Explorer
                    </TabsTrigger>
                </TabsList>

                {/* Integration Settings Tab */}
                <TabsContent value="settings" className="space-y-6 focus-visible:outline-none">
                    <Card className="bg-[#111] border-white/5 rounded-[2rem] overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                        <Globe className="w-5 h-5 text-indigo-500" />
                                        Billing API Connection
                                    </CardTitle>
                                    <CardDescription>Configure credentials to pull real-time data from VA Billing.</CardDescription>
                                </div>
                                <Badge className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                    isConnected ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                )}>
                                    {isConnected ? "Connected" : "Disconnected"}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 pt-4 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Base API URL</Label>
                                    <Input
                                        placeholder="Enter the API Base URL"
                                        value={externalApiUrl}
                                        onChange={(e) => setExternalApiUrl(e.target.value)}
                                        className="bg-white/5 border-white/10 rounded-xl text-gray-300 font-mono text-xs focus:ring-indigo-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Auth Strategy</Label>
                                    <div className="h-10 px-4 bg-indigo-600/10 border border-indigo-600/20 rounded-xl flex items-center">
                                        <span className="text-xs font-bold text-indigo-400">Header: x-api-key + x-api-secret</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">API Key</Label>
                                    <Input
                                        type="password"
                                        placeholder="Enter your API Key"
                                        value={externalApiKey}
                                        onChange={(e) => setExternalApiKey(e.target.value)}
                                        className="bg-white/5 border-white/10 rounded-xl focus:ring-indigo-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">API Secret</Label>
                                    <Input
                                        type="password"
                                        placeholder="Enter your API Secret"
                                        value={externalApiSecret}
                                        onChange={(e) => setExternalApiSecret(e.target.value)}
                                        className="bg-white/5 border-white/10 rounded-xl focus:ring-indigo-600"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                                <Button
                                    variant="outline"
                                    onClick={testConnection}
                                    className="border-white/10 hover:bg-white/5 rounded-xl h-12 px-8 font-black uppercase tracking-widest"
                                    disabled={loading || !externalApiKey}
                                >
                                    {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Verify Signal
                                </Button>
                                <Button
                                    onClick={saveCredentials}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest h-12 rounded-xl px-10 shadow-lg shadow-indigo-600/20"
                                >
                                    Complete Integration
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* API Explorer Tab */}
                <TabsContent value="explorer" className="space-y-6 focus-visible:outline-none">
                    <Card className="bg-[#111] border-white/5 rounded-[2rem] overflow-hidden">
                        <CardHeader className="p-8 border-b border-white/5">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                        <Database className="w-5 h-5 text-indigo-500" />
                                        Resource Explorer
                                    </CardTitle>
                                    <CardDescription>Browse and monitor real-time data from the billing core.</CardDescription>
                                </div>
                                <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5 flex-wrap">
                                    {['invoices', 'clients', 'payments', 'staff', 'recurring', 'tasks', 'products', 'expenses', 'inventory'].map(res => (
                                        <button
                                            key={res}
                                            onClick={() => setActiveResource(res)}
                                            className={cn(
                                                "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                                activeResource === res ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-gray-500 hover:text-white"
                                            )}
                                        >
                                            {res}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 min-h-[400px]">
                            {!isConnected ? (
                                <div className="flex flex-col items-center justify-center h-[400px] text-center p-10">
                                    <AlertCircle className="w-12 h-12 text-gray-700 mb-4" />
                                    <h3 className="text-white font-black uppercase">No Active Link</h3>
                                    <p className="text-gray-500 text-sm mt-2 max-w-sm">Please provide your API credentials in the Connection tab to start exploration.</p>
                                    <Button variant="link" className="text-indigo-500 mt-4" onClick={() => document.querySelector('[value="settings"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))}>
                                        Setup Integration Now
                                    </Button>
                                </div>
                            ) : isFetching ? (
                                <div className="flex items-center justify-center h-[400px]">
                                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                                </div>
                            ) : (
                                <ScrollArea className="h-[450px]">
                                    <div className="p-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {resourceData.map((item, idx) => (
                                                <div key={idx} className="p-4 bg-black/40 border border-white/5 rounded-2xl hover:border-indigo-500/20 transition-all">
                                                    <pre className="text-[10px] font-mono text-gray-400 overflow-hidden text-ellipsis">
                                                        {JSON.stringify(item, null, 2)}
                                                    </pre>
                                                </div>
                                            ))}
                                        </div>
                                        {resourceData.length === 0 && (
                                            <div className="text-center py-20 text-gray-600 uppercase font-black tracking-widest italic">
                                                No {activeResource} records found.
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ApiIntegration;
