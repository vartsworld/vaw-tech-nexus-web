import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    TrendingUp,
    TrendingDown,
    Layers,
    Briefcase,
    BarChart3,
    PieChart,
    Activity,
    Zap,
    CheckCircle2,
    Clock,
    LayoutDashboard
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts";

const performanceData = [
    { name: 'Software', performance: 94, color: '#FF0000' },
    { name: 'Design', performance: 88, color: '#FFD700' },
    { name: 'Marketing', performance: 82, color: '#0066FF' },
    { name: 'HR/Admin', performance: 91, color: '#00FF66' },
    { name: 'Finance', performance: 96, color: '#FF00FF' },
];

const SuperAdminWorkflow = () => {
    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white mb-2">COMPANY <span className="text-tech-red uppercase">WORKFLOW MATRIX</span></h1>
                    <p className="text-gray-500 font-medium tracking-tight">Global oversight of departmental synchronization and operational health.</p>
                </div>
                <Badge variant="outline" className="border-tech-red/20 text-tech-red bg-tech-red/10 px-4 py-2 rounded-xl font-black uppercase text-xs">
                    Protocol 9: Advanced Analytics
                </Badge>
            </div>

            {/* Global Department Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-black/60 border-white/5 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                            <BarChart3 className="w-5 h-5 text-tech-red" />
                            Efficiency Coefficients
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={performanceData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                <XAxis dataKey="name" stroke="#555" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                                <YAxis stroke="#555" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} domain={[0, 100]} />
                                <Tooltip
                                    cursor={{ fill: '#ffffff05' }}
                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px' }}
                                    itemStyle={{ fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase' }}
                                />
                                <Bar dataKey="performance" radius={[6, 6, 0, 0]}>
                                    {performanceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="bg-black/40 border-white/5">
                    <CardHeader>
                        <CardTitle className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                            <Activity className="w-5 h-5 text-tech-red" />
                            Live Project Pulse
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {[
                            { name: "VAW Nexus Web Platform", progress: 85, status: "Active", color: "bg-blue-500" },
                            { name: "Global HR Infrastructure", progress: 92, status: "Optimizing", color: "bg-green-500" },
                            { name: "Client Asset Matrix v2", progress: 64, status: "Developing", color: "bg-tech-red" },
                            { name: "Quantum Chess Engine", progress: 41, status: "Testing", color: "bg-tech-gold" },
                        ].map((project, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-2 h-2 rounded-full", project.color)} />
                                        <p className="text-xs font-black text-white uppercase">{project.name}</p>
                                    </div>
                                    <Badge className="bg-white/5 text-[9px] font-black uppercase tracking-widest">{project.status}</Badge>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Progress value={project.progress} className={cn("h-1.5 bg-white/5 [&>div]:" + project.color)} />
                                    <span className="text-[10px] font-black text-gray-500">{project.progress}%</span>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Financial & Operational Oversight */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="bg-black/40 border-white/10 group hover:border-tech-red/40 transition-all">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-tech-red/10 transition-colors">
                                <Zap className="w-6 h-6 text-tech-red" />
                            </div>
                            <div className="flex items-center gap-1 text-green-500">
                                <TrendingUp className="w-4 h-4" />
                                <span className="text-[10px] font-black">12%</span>
                            </div>
                        </div>
                        <h4 className="text-2xl font-black text-white tracking-tighter uppercase">Capital Velocity</h4>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Transaction throughput matrix</p>
                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                            <p className="text-[10px] font-black text-gray-400">STATUS</p>
                            <p className="text-[10px] font-black text-green-500 uppercase">Accelerating</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-black/40 border-white/10 group hover:border-tech-gold/40 transition-all">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-tech-gold/10 transition-colors">
                                <Clock className="w-6 h-6 text-tech-gold" />
                            </div>
                            <div className="flex items-center gap-1 text-tech-red">
                                <TrendingDown className="w-4 h-4" />
                                <span className="text-[10px] font-black">4%</span>
                            </div>
                        </div>
                        <h4 className="text-2xl font-black text-white tracking-tighter uppercase">Latency Nodes</h4>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Global response synchronization</p>
                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                            <p className="text-[10px] font-black text-gray-400">STATUS</p>
                            <p className="text-[10px] font-black text-tech-gold uppercase">Stabilizing</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-black/40 border-white/10 group hover:border-blue-500/40 transition-all">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-blue-500/10 transition-colors">
                                <Layers className="w-6 h-6 text-blue-500" />
                            </div>
                            <div className="flex items-center gap-1 text-blue-500">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-[10px] font-black">99.9%</span>
                            </div>
                        </div>
                        <h4 className="text-2xl font-black text-white tracking-tighter uppercase">Neural Integrity</h4>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Departmental data consistency</p>
                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                            <p className="text-[10px] font-black text-gray-400">STATUS</p>
                            <p className="text-[10px] font-black text-blue-500 uppercase">Synchronized</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const cn = (...inputs: any[]) => {
    return inputs.filter(Boolean).join(" ");
};

export default SuperAdminWorkflow;
