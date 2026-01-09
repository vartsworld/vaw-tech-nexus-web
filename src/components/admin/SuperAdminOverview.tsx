import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Activity,
    TrendingUp,
    Users,
    Briefcase,
    ShieldAlert,
    Zap,
    Globe,
    Database,
    Cpu,
    Server,
    Terminal,
    ArrowUpRight
} from "lucide-react";
import { motion } from "framer-motion";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from "recharts";

const data = [
    { name: '00:00', load: 12, users: 4 },
    { name: '04:00', load: 8, users: 2 },
    { name: '08:00', load: 25, users: 15 },
    { name: '12:00', load: 45, users: 32 },
    { name: '16:00', load: 38, users: 28 },
    { name: '20:00', load: 20, users: 12 },
    { name: '23:59', load: 15, users: 6 },
];

const stats = [
    { label: "Global Node Status", value: "NOMINAL", icon: Globe, color: "text-green-500" },
    { label: "Neural Load", value: "14.2ms", icon: Activity, color: "text-tech-red" },
    { label: "Database Sync", value: "COMPLETE", icon: Database, color: "text-blue-500" },
    { label: "Quantum Threads", value: "1,024", icon: Cpu, color: "text-purple-500" },
];

const SuperAdminOverview = () => {
    return (
        <div className="space-y-8 pb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <Card key={i} className="bg-black/60 border-white/5 backdrop-blur-xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-white/10" />
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <stat.icon className={cn("w-5 h-5", stat.color)} />
                                <Zap className="w-3 h-3 text-gray-800 group-hover:text-tech-red transition-colors" />
                            </div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{stat.label}</h3>
                            <p className="text-2xl font-black text-white tracking-tighter mt-1">{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main system load chart */}
                <Card className="lg:col-span-2 bg-black/40 border-white/5">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-black text-white uppercase">System Load Matrix</CardTitle>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Real-time resource allocation telemetry</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-tech-red shadow-[0_0_8px_#FF0000] animate-pulse" />
                            <span className="text-[10px] font-black text-tech-red uppercase">Live Stream</span>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[350px] w-full pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FF0000" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#FF0000" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                <XAxis dataKey="name" stroke="#555" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                                <YAxis stroke="#555" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px' }}
                                    itemStyle={{ color: '#FF0000', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase' }}
                                />
                                <Area type="monotone" dataKey="load" stroke="#FF0000" strokeWidth={3} fillOpacity={1} fill="url(#colorLoad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* System Terminal Card */}
                <Card className="bg-[#050505] border-white/5 flex flex-col">
                    <CardHeader className="bg-white/[0.02] border-b border-white/5 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-tech-red" />
                                <CardTitle className="text-xs font-black uppercase text-white tracking-widest">Global Terminal</CardTitle>
                            </div>
                            <Badge variant="outline" className="text-[10px] font-black bg-tech-red/5 text-tech-red border-tech-red/20 uppercase">A-77</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-4 font-mono text-[10px] overflow-hidden space-y-2">
                        <div className="text-green-500">[01:52:09] SYSTEM_RECOVER_AUTH: SYNC WITH SUB-SERVER 04</div>
                        <div className="text-gray-500">[01:52:12] DB_MUTATION: CLIENT_PROFILE_ID_88 SET_ACCESS_PIN</div>
                        <div className="text-gray-500">[01:52:15] SHARED_PROTOCOL: PROJECT_ID_119 -> DEPT_IT</div>
                        <div className="text-tech-red/[0.5]">[01:52:18] ALERT: UNAUTHORIZED ATTEMPT AT PORT 4433 BLOCKED</div>
                        <div className="text-gray-500">[01:52:21] CRON_TRIGGER: BROADCASTING_DATA_PULSE_99</div>
                        <div className="text-blue-500">[01:52:25] NEXUS_SYNC: ALL CORES ALIGNED</div>
                        <div className="animate-pulse text-white mt-4 tracking-widest">_</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="bg-black/40 border-white/5 group hover:border-tech-red/40 transition-all cursor-pointer">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-tech-red/10 transition-colors">
                                <Server className="w-6 h-6 text-tech-red" />
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-gray-800 group-hover:text-white" />
                        </div>
                        <h4 className="text-xl font-black text-white uppercase tracking-tight">Database Architecture</h4>
                        <p className="text-xs text-gray-500 font-medium mt-2">Manage global schema, indexing, and data integrity protocols.</p>
                    </CardContent>
                </Card>

                <Card className="bg-black/40 border-white/5 group hover:border-tech-red/40 transition-all cursor-pointer">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-tech-red/10 transition-colors">
                                <ShieldAlert className="w-6 h-6 text-tech-red" />
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-gray-800 group-hover:text-white" />
                        </div>
                        <h4 className="text-xl font-black text-white uppercase tracking-tight">Security Protocols</h4>
                        <p className="text-xs text-gray-500 font-medium mt-2">Configure RLS, JWT tokens, and global authority clearance levels.</p>
                    </CardContent>
                </Card>

                <Card className="bg-black/40 border-white/5 group hover:border-tech-red/40 transition-all cursor-pointer">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-tech-red/10 transition-colors">
                                <Globe className="w-6 h-6 text-tech-red" />
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-gray-800 group-hover:text-white" />
                        </div>
                        <h4 className="text-xl font-black text-white uppercase tracking-tight">Global Networking</h4>
                        <p className="text-xs text-gray-500 font-medium mt-2">Monitor CDN performance, edge functions, and user distribution.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const cn = (...inputs: any[]) => {
    return inputs.filter(Boolean).join(" ");
};

export default SuperAdminOverview;
