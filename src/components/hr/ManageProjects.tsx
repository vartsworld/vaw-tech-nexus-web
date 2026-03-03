import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Folder,
    Plus,
    Search,
    Trash2,
    Edit,
    Loader2,
    Building2,
    Layout,
    ExternalLink,
    ChevronRight,
    TrendingUp,
    Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const ManageProjects = () => {
    const [projects, setProjects] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<any>(null);

    const [formData, setFormData] = useState({
        client_id: "",
        title: "",
        description: "",
        project_type: "website",
        status: "planning",
        package_type: "basic_design_website",
        addons: ""
    });

    const { toast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [projectsRes, clientsRes] = await Promise.all([
                supabase
                    .from('client_projects')
                    .select(`
            *,
            clients:client_id (id, company_name)
          `)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('clients')
                    .select('id, company_name')
                    .eq('status', 'active')
                    .order('company_name')
            ]);

            if (projectsRes.error) throw projectsRes.error;
            if (clientsRes.error) throw clientsRes.error;

            setProjects(projectsRes.data || []);
            setClients(clientsRes.data || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
            toast({
                title: "Error",
                description: "Failed to load projects.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!formData.client_id || !formData.title) {
            toast({
                title: "Error",
                description: "Please fill in all required fields.",
                variant: "destructive",
            });
            return;
        }

        try {
            const { data, error } = await supabase
                .from('client_projects')
                .insert(formData)
                .select(`*, clients:client_id(id, company_name)`)
                .single();

            if (error) throw error;

            setProjects([data, ...projects]);
            setIsAddDialogOpen(false);
            resetForm();
            toast({ title: "Success", description: "Project created successfully." });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleUpdate = async () => {
        if (!editingProject) return;

        try {
            const { data, error } = await supabase
                .from('client_projects')
                .update(formData)
                .eq('id', editingProject.id)
                .select(`*, clients:client_id(id, company_name)`)
                .single();

            if (error) throw error;

            setProjects(projects.map(p => p.id === editingProject.id ? data : p));
            setIsEditDialogOpen(false);
            setEditingProject(null);
            resetForm();
            toast({ title: "Success", description: "Project updated successfully." });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This will delete the project data.")) return;

        try {
            const { error } = await supabase
                .from('client_projects')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setProjects(projects.filter(p => p.id !== id));
            toast({ title: "Success", description: "Project deleted." });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const resetForm = () => {
        setFormData({
            client_id: "",
            title: "",
            description: "",
            project_type: "website",
            status: "planning",
            package_type: "basic",
            addons: ""
        });
    };

    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.clients?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === "all" || p.project_type === filterType;
        return matchesSearch && matchesType;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'planning': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'completed': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
            case 'on_hold': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    const projectStats = {
        total: projects.length,
        active: projects.filter(p => p.status === 'active').length,
        planning: projects.filter(p => p.status === 'planning').length,
        completed: projects.filter(p => p.status === 'completed').length,
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Manage Projects</h2>
                    <p className="text-gray-500 mt-1">Strategic oversight and management of all active client projects</p>
                </div>
                <div className="flex items-center gap-3">
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 rounded-xl px-6">
                                <Plus className="w-4 h-4 mr-2" />
                                New Project
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#0f0f0f] border-white/5 text-white max-w-md">
                            <DialogHeader><DialogTitle>Initialize Strategy</DialogTitle></DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Client Partner</Label>
                                    <Select value={formData.client_id} onValueChange={(v) => setFormData({ ...formData, client_id: v })}>
                                        <SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Select Client" /></SelectTrigger>
                                        <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                                            {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Project Designation</Label>
                                    <Input
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g. Q1 Marketing Redesign"
                                        className="bg-white/5 border-white/10 text-white"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Category</Label>
                                        <Select value={formData.project_type} onValueChange={(v) => setFormData({ ...formData, project_type: v })}>
                                            <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                            <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                                                <SelectItem value="website">Website</SelectItem>
                                                <SelectItem value="marketing">Marketing</SelectItem>
                                                <SelectItem value="design">Design</SelectItem>
                                                <SelectItem value="ai">AI Solution</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                                            <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                            <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                                                <SelectItem value="planning">Planning</SelectItem>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="on_hold">On Hold</SelectItem>
                                                <SelectItem value="completed">Completed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Service Package</Label>
                                        <Select value={formData.package_type} onValueChange={(v) => setFormData({ ...formData, package_type: v })}>
                                            <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                            <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                                                <SelectItem value="basic_design_website">Basic Design Website</SelectItem>
                                                <SelectItem value="interactive_creative_website">Interactive &amp; Creative Website</SelectItem>
                                                <SelectItem value="ecommerce_platform">E-commerce Platform</SelectItem>
                                                <SelectItem value="portfolio_showcase">Portfolio Showcase</SelectItem>
                                                <SelectItem value="crypto_trading_portal">Crypto Trading Portal</SelectItem>
                                                <SelectItem value="ai_integrated_website">AI-Integrated Website</SelectItem>
                                                <SelectItem value="social_media_news_website">Social Media-Based News Website</SelectItem>
                                                <SelectItem value="custom">Custom Package</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Addons & Extras</Label>
                                        <Input
                                            value={formData.addons}
                                            onChange={(e) => setFormData({ ...formData, addons: e.target.value })}
                                            placeholder="SEO, Maintenance..."
                                            className="bg-white/5 border-white/10 text-white"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Brief Overview</Label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Deployment of new visual identity..."
                                        className="bg-white/5 border-white/10 text-white h-24"
                                    />
                                </div>
                                <Button onClick={handleCreate} className="w-full bg-indigo-600 hover:bg-indigo-700">Deploy Project</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Quickbar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Deployed', value: projectStats.total, icon: Layout, color: 'text-blue-500' },
                    { label: 'Active', value: projectStats.active, icon: TrendingUp, color: 'text-green-500' },
                    { label: 'Planning', value: projectStats.planning, icon: Target, color: 'text-amber-500' },
                    { label: 'Completed', value: projectStats.completed, icon: Building2, color: 'text-indigo-500' },
                ].map((stat, i) => (
                    <Card key={i} className="bg-[#111] border-white/5 rounded-2xl overflow-hidden group">
                        <CardContent className="p-5 flex items-center justify-between relative">
                            <div className={`absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-3xl pointer-events-none group-hover:bg-indigo-500/10 transition-colors`} />
                            <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
                                <div className="text-2xl font-bold text-white leading-none">{stat.value}</div>
                            </div>
                            <div className={`p-2.5 rounded-xl bg-white/5 group-hover:scale-110 transition-transform ${stat.color}`}>
                                <stat.icon className="w-4 h-4" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Controls */}
            <Card className="bg-[#111] border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
                <CardHeader className="p-6 border-b border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                <Folder className="w-5 h-5 text-indigo-500" />
                            </div>
                            <CardTitle className="text-xl">Project Repository</CardTitle>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Search designations, clients..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-white/5 border-white/10 pl-10 h-11 rounded-xl focus:ring-indigo-500/20"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger className="bg-white/5 border-white/10 h-11 rounded-xl">
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                                    <SelectItem value="all">All Categories</SelectItem>
                                    <SelectItem value="website">Websites</SelectItem>
                                    <SelectItem value="marketing">Marketing</SelectItem>
                                    <SelectItem value="design">Design</SelectItem>
                                    <SelectItem value="ai">AI Solutions</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" onClick={fetchData} className="bg-white/5 border-white/10 h-11 rounded-xl group">
                                <Loader2 className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-white/[0.02]">
                                <TableRow className="border-white/5 hover:bg-transparent">
                                    <TableHead className="py-5 px-6 font-bold tracking-wider text-gray-400 uppercase text-[10px]">Project Designation</TableHead>
                                    <TableHead className="py-5 px-6 font-bold tracking-wider text-gray-400 uppercase text-[10px]">Client Partner</TableHead>
                                    <TableHead className="py-5 px-6 font-bold tracking-wider text-gray-400 uppercase text-[10px]">Strategic Status</TableHead>
                                    <TableHead className="py-5 px-6 font-bold tracking-wider text-gray-400 uppercase text-[10px]">Unit Category</TableHead>
                                    <TableHead className="py-5 px-6 font-bold tracking-wider text-gray-400 uppercase text-[10px] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={5} className="h-64 text-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" /></TableCell></TableRow>
                                ) : filteredProjects.map((p, idx) => (
                                    <motion.tr
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={p.id}
                                        className="border-white/5 hover:bg-white/[0.02] transition-colors group"
                                    >
                                        <TableCell className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-indigo-500/30 transition-colors">
                                                    <Plus className="w-4 h-4 text-indigo-500" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-white tracking-wide">{p.title}</p>
                                                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{p.description || 'No brief provided'}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-sm text-gray-300 font-medium">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-3.5 h-3.5 text-gray-500" />
                                                {p.clients?.company_name || 'Individual Partner'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <Badge variant="outline" className={`rounded-lg px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase border ${getStatusColor(p.status)}`}>
                                                {p.status.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                {p.project_type.charAt(0).toUpperCase() + p.project_type.slice(1)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setEditingProject(p);
                                                        setFormData({
                                                            client_id: p.client_id,
                                                            title: p.title,
                                                            description: p.description || "",
                                                            project_type: p.project_type,
                                                            status: p.status,
                                                            package_type: p.package_type || "basic",
                                                            addons: p.addons || ""
                                                        });
                                                        setIsEditDialogOpen(true);
                                                    }}
                                                    className="h-8 w-8 text-gray-400 hover:text-white"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(p.id)}
                                                    className="h-8 w-8 text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/10"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </motion.tr>
                                ))}
                                {!isLoading && filteredProjects.length === 0 && (
                                    <TableRow><TableCell colSpan={5} className="h-64 text-center text-gray-500 italic">No project data matching your search criteria...</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="bg-[#0f0f0f] border-white/5 text-white max-w-md">
                    <DialogHeader><DialogTitle>Refine Unit Parameters</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Client Partner</Label>
                            <Select value={formData.client_id} onValueChange={(v) => setFormData({ ...formData, client_id: v })}>
                                <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Project Designation</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select value={formData.project_type} onValueChange={(v) => setFormData({ ...formData, project_type: v })}>
                                    <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                                        <SelectItem value="website">Website</SelectItem>
                                        <SelectItem value="marketing">Marketing</SelectItem>
                                        <SelectItem value="design">Design</SelectItem>
                                        <SelectItem value="ai">AI Solution</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                                    <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                                        <SelectItem value="planning">Planning</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="on_hold">On Hold</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Service Package</Label>
                                <Select value={formData.package_type} onValueChange={(v) => setFormData({ ...formData, package_type: v })}>
                                    <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                                        <SelectItem value="basic_design_website">Basic Design Website</SelectItem>
                                        <SelectItem value="interactive_creative_website">Interactive &amp; Creative Website</SelectItem>
                                        <SelectItem value="ecommerce_platform">E-commerce Platform</SelectItem>
                                        <SelectItem value="portfolio_showcase">Portfolio Showcase</SelectItem>
                                        <SelectItem value="crypto_trading_portal">Crypto Trading Portal</SelectItem>
                                        <SelectItem value="ai_integrated_website">AI-Integrated Website</SelectItem>
                                        <SelectItem value="social_media_news_website">Social Media-Based News Website</SelectItem>
                                        <SelectItem value="custom">Custom Package</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Addons & Extras</Label>
                                <Input
                                    value={formData.addons}
                                    onChange={(e) => setFormData({ ...formData, addons: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Brief Overview</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="bg-white/5 border-white/10 text-white h-24"
                            />
                        </div>
                        <Button onClick={handleUpdate} className="w-full bg-indigo-600 hover:bg-indigo-700">Commit Changes</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ManageProjects;
