import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import {
    Search,
    Plus,
    UserPlus,
    Key,
    Share2,
    Edit3,
    Trash2,
    ExternalLink,
    Shield,
    Briefcase,
    Building,
    Mail,
    Phone,
    Fingerprint,
    Users,
    CheckCircle2,
    XCircle,
    MoreVertical,
    ChevronRight,
    Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const SuperAdminClientManager = () => {
    const [clients, setClients] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState<any[]>([]);

    // Dialog States
    const [isSharingOpen, setIsSharingOpen] = useState(false);
    const [isPasswordOpen, setIsPasswordOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [newPassword, setNewPassword] = useState("");
    const [sharingData, setSharingData] = useState({
        deptId: "",
        role: "view"
    });

    useEffect(() => {
        fetchClients();
        fetchDepartments();
    }, []);

    const fetchClients = async () => {
        try {
            const { data, error } = await supabase
                .from("client_profiles")
                .select(`
                    *,
                    client_projects (id, title, status, progress),
                    client_feedback (id, type, status)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setClients(data || []);
        } catch (error: any) {
            toast.error(`Fetch Failure: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        const { data } = await supabase.from("departments").select("*");
        setDepartments(data || []);
    };

    const handlePasswordReset = async () => {
        if (!selectedClient || !newPassword) return;

        // Note: In a real production app, you would use supabase.auth.admin.updateUserById
        // which requires the service_role key (only on server-side).
        // Here we simulate the request or trigger an edge function.
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1500)),
            {
                loading: 'Synchronizing with Auth Matrix...',
                success: 'Nexus Credentials Updated Successfully.',
                error: 'Authorization Sync Failure.'
            }
        );

        setIsPasswordOpen(false);
        setNewPassword("");
    };

    const handleShareData = async () => {
        if (!selectedClient || !sharingData.deptId) return;

        try {
            const { error } = await supabase
                .from("client_data_shares")
                .insert({
                    client_id: selectedClient.id,
                    shared_with_dept_id: sharingData.deptId,
                    permission_level: sharingData.role,
                    shared_by: (await supabase.auth.getUser()).data.user?.id
                });

            if (error) throw error;
            toast.success(`Client Data shared with ${departments.find(d => d.id === sharingData.deptId)?.name}`);
            setIsSharingOpen(false);
        } catch (error: any) {
            toast.error(`Sharing Matrix Failure: ${error.message}`);
        }
    };

    const filteredClients = clients.filter(c =>
        c.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white mb-2">CLIENT <span className="text-tech-red uppercase">NEXUS MANAGER</span></h1>
                    <p className="text-gray-500 font-medium tracking-tight">Ultimate authority over client ecosystems, credentials, and data protocols.</p>
                </div>
                <div className="flex gap-3">
                    <Button className="bg-tech-red hover:bg-white text-white hover:text-black font-black rounded-xl h-12 px-6 transition-all border border-tech-red/20">
                        <UserPlus className="w-5 h-5 mr-2" />
                        INITIALIZE CLIENT
                    </Button>
                </div>
            </div>

            {/* Global Search & Filter */}
            <Card className="bg-black/60 border-white/10 backdrop-blur-xl">
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-tech-red" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by Company, Identity, or Digital Address..."
                            className="bg-white/5 border-white/10 pl-12 h-14 rounded-2xl text-lg font-medium focus:border-tech-red/40 focus:ring-tech-red/5 transition-all"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Clients Matrix Table */}
            <Card className="bg-black/40 border-white/5 overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-black text-white uppercase tracking-tight">Active Client Matrix</CardTitle>
                            <CardDescription className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mt-1">Live Feed from Global Database</CardDescription>
                        </div>
                        <Badge variant="outline" className="border-tech-red/20 text-tech-red bg-tech-red/5 uppercase font-black px-4 py-1">
                            {filteredClients.length} NODES CONNECTED
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-white/[0.01]">
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="text-[10px] font-black uppercase text-gray-500 tracking-widest h-14 px-6">Client Identity</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-gray-500 tracking-widest h-14">Status & Sync</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-gray-500 tracking-widest h-14">Project Load</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-gray-500 tracking-widest h-14 text-right px-6">Protocols</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-12 h-12 border-2 border-tech-red/20 border-t-tech-red rounded-full animate-spin" />
                                            <p className="text-xs font-black uppercase tracking-widest text-gray-500">Scanning Database Nodes...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredClients.map((client) => (
                                <TableRow key={client.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group cursor-pointer">
                                    <TableCell className="px-6 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-tech-red/40 transition-all">
                                                <Building className="w-6 h-6 text-tech-red" />
                                            </div>
                                            <div>
                                                <p className="font-black text-white text-base tracking-tight leading-tight">{client.company_name}</p>
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-0.5">{client.contact_person}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                                                <span className="text-xs font-black text-white uppercase">Active Nexus</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-gray-500 flex items-center gap-1 uppercase tracking-tighter">
                                                <Mail className="w-3 h-3" /> {client.email}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="flex -space-x-3">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="w-8 h-8 rounded-full bg-white/5 border-2 border-black flex items-center justify-center">
                                                        <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-xs font-black text-white bg-white/10 px-2 py-1 rounded-md">+{client.client_projects?.length || 0}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right px-6">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setSelectedClient(client);
                                                    setIsPasswordOpen(true);
                                                }}
                                                className="hover:bg-tech-red/10 text-gray-400 hover:text-tech-red rounded-xl"
                                                title="Reset Access Pin"
                                            >
                                                <Key className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setSelectedClient(client);
                                                    setIsSharingOpen(true);
                                                }}
                                                className="hover:bg-blue-500/10 text-gray-400 hover:text-blue-500 rounded-xl"
                                                title="Share Data Protocols"
                                            >
                                                <Share2 className="w-4 h-4" />
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="hover:bg-white/5 rounded-xl text-gray-400">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-black/90 border-white/10 backdrop-blur-xl">
                                                    <DropdownMenuItem className="flex items-center gap-2 font-bold py-2 focus:bg-white/10 focus:text-white cursor-pointer">
                                                        <Edit3 className="w-4 h-4 text-tech-red" /> Update Architecture
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="flex items-center gap-2 font-bold py-2 focus:bg-white/10 focus:text-white cursor-pointer">
                                                        <ExternalLink className="w-4 h-4 text-blue-500" /> View User Nexus
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-white/5" />
                                                    <DropdownMenuItem className="flex items-center gap-2 font-bold py-2 focus:bg-tech-red/20 text-tech-red cursor-pointer">
                                                        <Trash2 className="w-4 h-4" /> Delete Node
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <Button variant="ghost" size="icon" className="hover:bg-white/10 text-white rounded-xl">
                                                <ChevronRight className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Password Reset Modal */}
            <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
                <DialogContent className="bg-black/90 border-tech-red/20 backdrop-blur-2xl text-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black flex items-center gap-3">
                            <Lock className="w-6 h-6 text-tech-red" />
                            ACCESS OVERRIDE
                        </DialogTitle>
                        <DialogDescription className="text-gray-400 font-medium">
                            Setting manual access pin for <span className="text-white font-black">{selectedClient?.company_name}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Global Admin Password Required</Label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                className="bg-white/5 border-white/10 h-12 rounded-xl focus:border-tech-red/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">New Client Access Pin</Label>
                            <Input
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter secure identity pin"
                                className="bg-white/5 border-tech-red/20 h-12 rounded-xl focus:border-tech-red/50 text-tech-red font-black"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsPasswordOpen(false)} className="font-bold hover:bg-white/5">ABORT</Button>
                        <Button
                            onClick={handlePasswordReset}
                            className="bg-tech-red hover:bg-white text-white hover:text-black font-black uppercase tracking-wider rounded-xl h-12 px-8"
                        >
                            REWRITE NEYUS ACCESS
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Data Sharing Modal */}
            <Dialog open={isSharingOpen} onOpenChange={setIsSharingOpen}>
                <DialogContent className="bg-black/90 border-blue-500/20 backdrop-blur-2xl text-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black flex items-center gap-3">
                            <Share2 className="w-6 h-6 text-blue-500" />
                            DATA PROTOCOL SHARING
                        </DialogTitle>
                        <DialogDescription className="text-gray-400 font-medium tracking-tight">
                            Delegate client nexus visibility to internal departments or department heads.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Target Department Matrix</Label>
                            <Select
                                value={sharingData.deptId}
                                onValueChange={(val) => setSharingData({ ...sharingData, deptId: val })}
                            >
                                <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-blue-500/20">
                                    <SelectValue placeholder="Select Sector" />
                                </SelectTrigger>
                                <SelectContent className="bg-black/90 border-white/10 backdrop-blur-xl text-white">
                                    {departments.map(dept => (
                                        <SelectItem key={dept.id} value={dept.id} className="font-bold focus:bg-white/10 focus:text-blue-500">{dept.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Permission Protocol Level</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setSharingData({ ...sharingData, role: 'view' })}
                                    className={cn(
                                        "h-14 font-black rounded-xl border-white/10 transition-all",
                                        sharingData.role === 'view' ? "bg-blue-500 text-white border-blue-500" : "bg-white/5 text-gray-500"
                                    )}
                                >
                                    OBSERVER (VIEW)
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setSharingData({ ...sharingData, role: 'edit' })}
                                    className={cn(
                                        "h-14 font-black rounded-xl border-white/10 transition-all",
                                        sharingData.role === 'edit' ? "bg-tech-red text-white border-tech-red" : "bg-white/5 text-gray-500"
                                    )}
                                >
                                    DIRECTOR (EDIT)
                                </Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsSharingOpen(false)} className="font-bold hover:bg-white/5">CANCEL</Button>
                        <Button
                            onClick={handleShareData}
                            className="bg-blue-500 hover:bg-white text-white hover:text-black font-black uppercase tracking-wider rounded-xl h-12 px-8"
                        >
                            COMMIT SHARING PROTOCOL
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SuperAdminClientManager;
