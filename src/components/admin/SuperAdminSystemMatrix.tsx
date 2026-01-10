import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Shield,
    Settings,
    Lock,
    Globe,
    Database,
    Cpu,
    Zap,
    RefreshCcw,
    Terminal,
    Server,
    CloudLightning,
    Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

const SuperAdminSystemMatrix = () => {
    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white mb-2">SYSTEM <span className="text-tech-red uppercase">MATRIX CONFIG</span></h1>
                    <p className="text-gray-500 font-medium tracking-tight">Direct manipulation of the global nexus architecture and security layers.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card className="bg-black/40 border-white/5">
                        <CardHeader>
                            <CardTitle className="text-xl font-black text-white uppercase flex items-center gap-3">
                                <Lock className="w-5 h-5 text-tech-red" />
                                Global Access Control
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {[
                                { label: "Client Portal Sync", desc: "Automated 5-minute synchronization cycle", active: true },
                                { label: "Departmental Data Isolation", desc: "Enforce strict RLS between sectors", active: true },
                                { label: "Public API Nexus", desc: "Exposure of public data nodes", active: false },
                                { label: "Quantum Audit Log", desc: "Immutable tracking of all admin mutations", active: true },
                            ].map((setting, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white/5 rounded-xl">
                                            <Shield className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{setting.label}</p>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{setting.desc}</p>
                                        </div>
                                    </div>
                                    <Switch defaultChecked={setting.active} />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="bg-[#050505] border-tech-red/20 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <CloudLightning className="w-32 h-32 text-tech-red" />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-xl font-black text-white uppercase flex items-center gap-3">
                                <Terminal className="w-5 h-5 text-tech-red" />
                                Root Database Override
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                placeholder="EXECUTE GLOBAL_SCHEMA_REFRESH --FORCE --VERIFY_INTEGRITY"
                                className="bg-black border-white/10 font-mono text-xs text-tech-red h-32 p-4 rounded-xl resize-none focus:ring-1 focus:ring-tech-red transition-all"
                            />
                            <div className="flex gap-4">
                                <Button className="flex-1 bg-tech-red hover:bg-white text-white hover:text-black font-black uppercase tracking-widest rounded-xl h-12">
                                    Execute Logic
                                </Button>
                                <Button variant="outline" className="flex-1 border-white/10 text-white font-bold rounded-xl h-12">
                                    Clear Buffer
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-8">
                    <Card className="bg-gradient-to-b from-tech-red/10 to-transparent border-tech-red/20">
                        <CardHeader>
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-tech-red mb-1">Server Pulse</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {[
                                { node: "Nexus-01 (Primary)", ping: "12ms", load: 22 },
                                { node: "Nexus-02 (Backup)", ping: "18ms", load: 5 },
                                { node: "Nexus-Edge (Static)", ping: "4ms", load: 88 },
                            ].map((node, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black text-white uppercase">{node.node}</p>
                                        <p className="text-[9px] font-black text-tech-red">{node.ping}</p>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${node.load}%` }}
                                            className="h-full bg-tech-red"
                                        />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="bg-black/40 border-white/5">
                        <CardHeader>
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-gray-500">Quick Directives</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button className="w-full justify-start gap-3 h-12 bg-white/5 border border-white/5 hover:bg-tech-red hover:text-white group transition-all rounded-xl">
                                <RefreshCcw className="w-4 h-4 text-gray-500 group-hover:text-white" />
                                <span className="font-bold text-xs">Purge Cache Nodes</span>
                            </Button>
                            <Button className="w-full justify-start gap-3 h-12 bg-white/5 border border-white/5 hover:bg-blue-500 hover:text-white group transition-all rounded-xl">
                                <Eye className="w-4 h-4 text-gray-500 group-hover:text-white" />
                                <span className="font-bold text-xs">Observe Audit Stream</span>
                            </Button>
                            <Button className="w-full justify-start gap-3 h-12 bg-white/5 border border-white/5 hover:bg-tech-gold hover:text-black group transition-all rounded-xl">
                                <Zap className="w-4 h-4 text-gray-500 group-hover:text-black" />
                                <span className="font-bold text-xs">Optimize Database</span>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

// Simplified Textarea since I didn't import the UI component
const Textarea = (props: any) => <textarea {...props} />;

export default SuperAdminSystemMatrix;
