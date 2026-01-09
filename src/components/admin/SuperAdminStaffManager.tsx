import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import {
    Users,
    ShieldCheck,
    Award,
    Search,
    Filter,
    Settings2,
    Trash2,
    Edit,
    Mail,
    UserCheck,
    Building,
    Activity,
    UserPlus,
    ArrowUpRight,
    TrendingDown,
    TrendingUp,
    CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const SuperAdminStaffManager = () => {
    const [staff, setStaff] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        admins: 0,
        heads: 0,
        performance: "88%"
    });

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const { data, error } = await supabase
                .from("staff_profiles")
                .select(`
                    *,
                    departments (id, name),
                    user_coin_transactions (id, amount)
                `)
                .order('full_name', { ascending: true });

            if (error) throw error;
            setStaff(data || []);

            // Calc stats
            const adminCount = data?.filter(s => s.role === 'admin' || s.role === 'hr').length || 0;
            const headCount = data?.filter(s => s.role === 'head' || s.role === 'manager').length || 0;
            setStats({
                total: data?.length || 0,
                admins: adminCount,
                heads: headCount,
                performance: "92%"
            });
        } catch (error: any) {
            toast.error(`Staff Retrieval Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const filteredStaff = staff.filter(s =>
        s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.departments?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white mb-2">STAFF <span className="text-tech-red uppercase">OPERATIONS CENTER</span></h1>
                    <p className="text-gray-500 font-medium tracking-tight">Regulate company tiers, department heads, and operational roles.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="border-white/10 hover:bg-white/5 text-white font-bold rounded-xl h-12">
                        <Filter className="w-4 h-4 mr-2" />
                        ROLE FILTER
                    </Button>
                    <Button className="bg-tech-red hover:bg-white text-white hover:text-black font-black rounded-xl h-12 px-6 shadow-lg shadow-tech-red/20 transition-all uppercase">
                        <UserPlus className="w-5 h-5 mr-2" />
                        Deploy Personnel
                    </Button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Personnel", value: stats.total, icon: Users, color: "blue", trend: "+2 this month" },
                    { label: "Authority Tier", value: stats.admins, icon: ShieldCheck, color: "red", trend: "Full clearance" },
                    { label: "Nexus Heads", value: stats.heads, icon: Building, color: "gold", trend: "All departments active" },
                    { label: "Matrix Performance", value: stats.performance, icon: Activity, color: "green", trend: "Optimized" },
                ].map((stat, i) => (
                    <Card key={i} className="bg-black/40 border-white/5 overflow-hidden group">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={cn("p-2 rounded-lg bg-opacity-10",
                                    stat.color === 'blue' ? "bg-blue-500 text-blue-500" :
                                        stat.color === 'red' ? "bg-tech-red text-tech-red" :
                                            stat.color === 'gold' ? "bg-tech-gold text-tech-gold" : "bg-green-500 text-green-500"
                                )}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-gray-700 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{stat.label}</h3>
                            <div className="flex items-end gap-2">
                                <p className="text-3xl font-black text-white tracking-tighter">{stat.value}</p>
                                <p className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-tight">{stat.trend}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Staff Search Panel */}
            <Card className="bg-black border-white/10">
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-tech-red" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Identify personnel via Name, Title, or Department Matrix..."
                            className="bg-white/5 border-white/5 pl-12 h-14 rounded-2xl text-lg font-medium focus:border-tech-red/40 focus:ring-0"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Personnel Registry Table */}
            <Card className="bg-[#050505] border-white/10 overflow-hidden">
                <CardHeader className="bg-white/[0.02] border-b border-white/5">
                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 italic">Personnel Registry Alpha-01</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="px-6 h-12 text-[10px] font-black uppercase text-gray-600 tracking-widest">Personnel Identity</TableHead>
                                <TableHead className="h-12 text-[10px] font-black uppercase text-gray-600 tracking-widest">Sector / Dept</TableHead>
                                <TableHead className="h-12 text-[10px] font-black uppercase text-gray-600 tracking-widest">Access Clearance (Role)</TableHead>
                                <TableHead className="h-12 text-[10px] font-black uppercase text-gray-600 tracking-widest">Capital Holdings (Coins)</TableHead>
                                <TableHead className="px-6 h-12 text-right text-[10px] font-black uppercase text-gray-600 tracking-widest">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center text-gray-600 font-black uppercase text-xs tracking-[0.3em]">Synching Neural-Net Link...</TableCell>
                                </TableRow>
                            ) : filteredStaff.map((person) => (
                                <TableRow key={person.id} className="border-white/5 hover:bg-white/[0.01] transition-all group">
                                    <TableCell className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-gray-400 group-hover:border-tech-red/40 transition-colors">
                                                {person.full_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-white tracking-tight">{person.full_name}</p>
                                                <p className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                                                    <Mail className="w-3 h-3" /> {person.employee_id || "EXT-001"}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-white/5 border-white/10 text-white font-black uppercase text-[10px] px-3">
                                            {person.departments?.name || "Global Management"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-2 h-2 rounded-full",
                                                person.role === 'admin' ? "bg-tech-red shadow-[0_0_8px_#FF0000]" :
                                                    person.role === 'head' ? "bg-tech-gold shadow-[0_0_8px_#FFD700]" : "bg-blue-500"
                                            )} />
                                            <span className="text-xs font-black text-white uppercase tracking-tighter">{person.role || "Specialist"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="w-4 h-4 text-tech-gold" />
                                            <p className="font-black text-white">
                                                {person.user_coin_transactions?.reduce((acc: number, t: any) => acc + (t.amount || 0), 0) || 0}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <Button variant="ghost" size="icon" className="h-9 w-9 bg-white/5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/30">
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 bg-tech-red/10 rounded-lg border border-tech-red/20 text-tech-red hover:bg-tech-red hover:text-white transition-all">
                                                <Settings2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default SuperAdminStaffManager;
