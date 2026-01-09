import { useState, useEffect, useRef } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter
} from "@/components/ui/card";
import {
    Plus,
    Search,
    Filter,
    File,
    Download,
    Upload,
    MoreVertical,
    ChevronRight,
    ExternalLink,
    MessageSquare,
    Clock,
    CheckCircle2,
    AlertTriangle,
    FileCode,
    FileImage,
    FileType,
    Trash2,
    PlusCircle,
    FolderOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ProjectExplorer = ({ profile }: { profile: any }) => {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [isDetailView, setIsDetailView] = useState(false);

    // File upload state
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchProjects();
    }, [profile]);

    const fetchProjects = async () => {
        if (!profile) return;
        const { data, error } = await supabase
            .from("client_projects")
            .select(`
        *,
        client_project_files(*)
      `)
            .eq("client_id", profile.id)
            .order("updated_at", { ascending: false });

        if (data) setProjects(data);
        setLoading(false);
    };

    const getStatusInfo = (status: string) => {
        const map: any = {
            planning: { color: "text-blue-400", bg: "bg-blue-400/10", label: "Planning Phase", icon: Clock },
            development: { color: "text-tech-gold", bg: "bg-tech-gold/10", label: "Active Development", icon: FileCode },
            progress: { color: "text-tech-purple", bg: "bg-tech-purple/10", label: "In Progress", icon: ActivityIcon },
            active: { color: "text-green-400", bg: "bg-green-400/10", label: "Live / Functional", icon: CheckCircle2 },
            functional: { color: "text-green-500", bg: "bg-green-500/10", label: "Fully Functional", icon: CheckCircle2 },
            error: { color: "text-tech-red", bg: "bg-tech-red/10", label: "Action Required", icon: AlertTriangle },
            paused: { color: "text-gray-400", bg: "bg-gray-400/10", label: "Project Paused", icon: Clock },
            cancel: { color: "text-red-500", bg: "bg-red-500/10", label: "Terminated", icon: AlertTriangle },
        };
        return map[status] || map.planning;
    };

    const handleFileUpload = async (projectId: string, files: FileList | null) => {
        if (!files || files.length === 0) return;
        setIsUploading(true);

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `${projectId}/${Date.now()}-${file.name}`;

                // Upload to storage
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('project_assets')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('project_assets')
                    .getPublicUrl(fileName);

                // Save record to database
                const { error: dbError } = await supabase
                    .from('client_project_files')
                    .insert({
                        project_id: projectId,
                        file_name: file.name,
                        file_url: publicUrl,
                        file_type: fileExt || 'other',
                        file_category: 'client_upload',
                        file_size_bytes: file.size,
                        uploaded_by_client: true
                    });

                if (dbError) throw dbError;
            }

            toast.success("Files synchronized successfully");
            fetchProjects();
        } catch (error: any) {
            console.error(error);
            toast.error(`Sync failure: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const filteredProjects = projects.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.project_type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const ActivityIcon = ({ className }: { className?: string }) => (
        <div className={cn("flex items-center gap-1", className)}>
            <div className="w-1 h-3 bg-current animate-pulse-gentle" />
            <div className="w-1 h-5 bg-current animate-pulse-gentle delay-100" />
            <div className="w-1 h-4 bg-current animate-pulse-gentle delay-200" />
        </div>
    );

    return (
        <div className="space-y-6">
            {!isDetailView ? (
                <>
                    {/* Header Controls */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/40 backdrop-blur-xl p-4 rounded-2xl border border-tech-gold/10">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Search project matrix..."
                                className="pl-10 bg-white/5 border-tech-gold/20 text-white rounded-xl focus:ring-tech-gold/20 h-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" className="border-tech-gold/20 bg-white/5 text-white gap-2 rounded-xl h-10 px-4">
                                <Filter className="w-4 h-4" /> Filter
                            </Button>
                            <Button className="bg-tech-gold hover:bg-white text-black font-bold gap-2 rounded-xl h-10 px-4">
                                <Plus className="w-4 h-4" /> New Initiative
                            </Button>
                        </div>
                    </div>

                    {/* Project Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {loading ? (
                            [1, 2, 3].map(i => <div key={i} className="h-64 bg-white/5 rounded-2xl animate-pulse" />)
                        ) : filteredProjects.length > 0 ? (
                            filteredProjects.map((project) => (
                                <motion.div
                                    key={project.id}
                                    layoutId={project.id}
                                    onClick={() => {
                                        setSelectedProject(project);
                                        setIsDetailView(true);
                                    }}
                                    className="cursor-pointer"
                                >
                                    <Card className="bg-black/40 backdrop-blur-xl border-tech-gold/10 hover:border-tech-gold/40 transition-all duration-500 group relative overflow-hidden h-full flex flex-col">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-tech-gold/5 blur-[40px] pointer-events-none group-hover:bg-tech-gold/10 transition-all" />

                                        <CardHeader className="pb-2">
                                            <div className="flex items-start justify-between mb-2">
                                                <Badge className="bg-tech-gold/10 text-tech-gold border-tech-gold/20 text-[10px] uppercase font-black tracking-[0.2em]">
                                                    {project.project_type}
                                                </Badge>
                                                <div className="p-1 px-2 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
                                                    <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", getStatusInfo(project.status).color.replace('text', 'bg'))} />
                                                    <span className={cn("text-[10px] font-bold uppercase tracking-widest", getStatusInfo(project.status).color)}>
                                                        {project.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <CardTitle className="text-xl font-bold text-white group-hover:text-tech-gold transition-colors">{project.title}</CardTitle>
                                            <CardDescription className="text-gray-400 line-clamp-2 text-xs font-medium mt-1">
                                                {project.description || "Project initialized and operating within planned parameters."}
                                            </CardDescription>
                                        </CardHeader>

                                        <CardContent className="flex-1 mt-4">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                                        <span>Integration Metric</span>
                                                        <span className="text-tech-gold">{project.progress}%</span>
                                                    </div>
                                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-tech-gold to-tech-red shadow-[0_0_10px_#FFD700]"
                                                            style={{ width: `${project.progress}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 pt-2">
                                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Nexus Data</p>
                                                        <p className="text-xs font-bold text-white">{project.client_project_files?.length || 0} Assets</p>
                                                    </div>
                                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Financial State</p>
                                                        <p className="text-xs font-bold text-white">₹{(project.amount_paid / 1000).toFixed(1)}k Paid</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>

                                        <CardFooter className="pt-0 pb-6 border-t border-white/5 pt-4 group-hover:border-tech-gold/20 transition-colors">
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex -space-x-2">
                                                    {[1, 2, 3].map(i => (
                                                        <div key={i} className="w-7 h-7 rounded-full border-2 border-black bg-tech-gold/10 flex items-center justify-center text-[10px] font-bold text-tech-gold">
                                                            {['S', 'D', 'H'][i - 1]}
                                                        </div>
                                                    ))}
                                                </div>
                                                <span className="text-xs font-bold text-tech-gold flex items-center gap-1 group-hover:gap-2 transition-all">
                                                    Enter Workspace <ChevronRight className="w-4 h-4" />
                                                </span>
                                            </div>
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-full py-20 bg-black/20 border-2 border-dashed border-tech-gold/10 rounded-3xl flex flex-col items-center justify-center text-center">
                                <FolderOpen className="w-16 h-16 text-tech-gold/20 mb-4" />
                                <h3 className="text-lg font-bold text-white">No active signal found in the matrix.</h3>
                                <p className="text-sm text-gray-500 max-w-xs mt-2">Initialize your first project initiative to see results here.</p>
                                <Button className="mt-6 bg-tech-gold hover:bg-white text-black font-bold h-12 px-8 rounded-xl shadow-lg shadow-tech-gold/20">
                                    Broadcast Project Idea
                                </Button>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <ProjectDetails
                    project={selectedProject}
                    onBack={() => {
                        setIsDetailView(false);
                        setSelectedProject(null);
                        fetchProjects();
                    }}
                    onUpload={(files) => handleFileUpload(selectedProject.id, files)}
                    isUploading={isUploading}
                />
            )}
        </div>
    );
};

const ProjectDetails = ({ project, onBack, onUpload, isUploading }: any) => {
    const [activeTab, setActiveTab] = useState("overview");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const tabs = [
        { id: "overview", label: "Protocol Overview", icon: ActivityIcon },
        { id: "files", label: "Asset Matrix", icon: FolderIcon },
        { id: "milestones", label: "Timeline Nodes", icon: TimelineIcon },
        { id: "feedback", label: "Signal Feed", icon: MessageIcon },
    ];

    function ActivityIcon() { return <Activity className="w-4 h-4" />; }
    function FolderIcon() { return <FolderOpen className="w-4 h-4" />; }
    function TimelineIcon() { return <Clock className="w-4 h-4" />; }
    function MessageIcon() { return <MessageSquare className="w-4 h-4" />; }

    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
        >
            {/* Detail Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-black/40 backdrop-blur-xl p-8 rounded-3xl border border-tech-gold/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[30%] h-full bg-tech-gold/5 blur-[50px] pointer-events-none" />

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 z-10">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onBack}
                        className="text-tech-gold hover:bg-tech-gold/10 rounded-xl"
                    >
                        <ChevronRight className="w-6 h-6 rotate-180" />
                    </Button>
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-3xl font-black text-white">{project.title}</h1>
                            <Badge className="bg-tech-gold/10 text-tech-gold border-tech-gold/20 font-black uppercase text-[10px] tracking-widest">
                                {project.project_type}
                            </Badge>
                        </div>
                        <p className="text-gray-400 font-medium max-w-xl">{project.description || "Project workspace active."}</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 z-10">
                    <Button
                        className="bg-white/5 border border-tech-gold/20 hover:border-tech-gold text-white font-bold h-12 rounded-xl px-4 gap-2"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        <Upload className={cn("w-4 h-4", isUploading && "animate-bounce")} />
                        {isUploading ? "Uploading..." : "Inject Assets"}
                    </Button>
                    <input
                        type="file"
                        multiple
                        className="hidden"
                        ref={fileInputRef}
                        onChange={(e) => onUpload(e.target.files)}
                    />
                    <Button className="bg-tech-gold hover:bg-white text-black font-bold h-12 rounded-xl px-6">
                        Secure Update Request
                    </Button>
                </div>
            </div>

            {/* Detail Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Navigation Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-black/20 border border-tech-gold/10 rounded-2xl p-2 space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-bold text-sm",
                                    activeTab === tab.id
                                        ? "bg-tech-gold/10 text-tech-gold border border-tech-gold/20"
                                        : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                                )}
                            >
                                <tab.icon />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <Card className="bg-black/20 border-tech-gold/10 rounded-2xl overflow-hidden">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-gray-500">Core Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400">Project Status</span>
                                <Badge variant="outline" className="border-tech-gold/30 text-tech-gold text-[10px] font-black uppercase tracking-wider">
                                    {project.status}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400">Start Date</span>
                                <span className="text-xs font-bold">{new Date(project.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400">Total Pipeline</span>
                                <span className="text-xs font-bold text-tech-gold">₹{Number(project.total_amount).toLocaleString()}</span>
                            </div>
                            <div className="space-y-2 pt-2">
                                <div className="flex items-center justify-between text-[10px] uppercase font-black text-gray-500 tracking-tighter">
                                    <span>Nexus Integration</span>
                                    <span className="text-tech-gold">{project.progress}%</span>
                                </div>
                                <Progress value={project.progress} className="h-1.5 bg-white/5" indicatorClassName="bg-tech-gold" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tab Content */}
                <div className="lg:col-span-3">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Card className="bg-black/40 backdrop-blur-xl border-tech-gold/10 rounded-3xl min-h-[500px]">
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                                        {tabs.find(t => t.id === activeTab)?.label}
                                        <div className="h-px flex-1 bg-tech-gold/10 mx-4" />
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {activeTab === "overview" && (
                                        <div className="space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <h3 className="text-sm font-black uppercase tracking-widest text-tech-gold">Project Scope</h3>
                                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 h-40">
                                                        <p className="text-sm text-gray-300 leading-relaxed font-medium">
                                                            {project.description || "The scope for this project covers end-to-end implementation of digital assets as requested. All parameters are verified for quality."}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <h3 className="text-sm font-black uppercase tracking-widest text-tech-red">Current Phase</h3>
                                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 h-40 flex flex-col justify-center items-center text-center">
                                                        <CheckCircle2 className="w-10 h-10 text-tech-gold mb-3 animate-pulse-gentle" />
                                                        <p className="text-lg font-black text-white">{project.status.toUpperCase()}</p>
                                                        <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-widest">Phase {project.progress > 80 ? 'Finalization' : project.progress > 40 ? 'Production' : 'Blueprint'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Technical Attributes</h3>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {[
                                                        { label: "Stability", value: "99.9%", color: "text-green-500" },
                                                        { label: "Sync Speed", value: "Realtime", color: "text-tech-gold" },
                                                        { label: "Data Integrity", value: "Verified", color: "text-blue-500" },
                                                        { label: "Nexus Node", value: "Active", color: "text-tech-red" },
                                                    ].map((attr, i) => (
                                                        <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{attr.label}</p>
                                                            <p className={cn("text-lg font-black", attr.color)}>{attr.value}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === "files" && (
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-black uppercase tracking-widest text-tech-gold">Project Assets</h3>
                                                <span className="text-xs text-gray-500 font-bold">{project.client_project_files?.length || 0} TOTAL CLOUD ASSETS</span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {project.client_project_files?.length > 0 ? (
                                                    project.client_project_files.map((file: any) => (
                                                        <Card key={file.id} className="bg-white/5 border-white/10 hover:border-tech-gold/30 hover:bg-tech-gold/5 transition-all group rounded-2xl overflow-hidden">
                                                            <CardContent className="p-4 flex items-center justify-between">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center border border-white/10 group-hover:border-tech-gold/20 transition-colors">
                                                                        {file.file_type === 'img' || file.file_type === 'png' || file.file_type === 'jpg' ? (
                                                                            <FileImage className="w-5 h-5 text-tech-gold" />
                                                                        ) : file.file_type === 'pdf' || file.file_type === 'doc' ? (
                                                                            <FileText className="w-5 h-5 text-blue-500" />
                                                                        ) : (
                                                                            <FileCode className="w-5 h-5 text-tech-purple" />
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-bold text-white truncate max-w-[150px]">{file.file_name}</p>
                                                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                                            {file.file_type.toUpperCase()} • {(file.file_size_bytes / 1024 / 1024).toFixed(2)} MB
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Button variant="ghost" size="icon" className="hover:text-tech-gold" asChild>
                                                                        <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                                                                            <Download className="w-4 h-4" />
                                                                        </a>
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="text-tech-red hover:bg-tech-red/10 border-transparent">
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    ))
                                                ) : (
                                                    <div className="col-span-full py-20 text-center opacity-40">
                                                        <FileType className="w-12 h-12 mx-auto mb-4" />
                                                        <p className="font-bold text-sm">NO ASSETS DETECTED IN CLOUD MATRIX</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === "milestones" && (
                                        <div className="space-y-8">
                                            <div className="relative pl-8 space-y-12 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-tech-gold/10">
                                                {[
                                                    { title: "Nexus Blueprint", date: "Initial Phase", status: "completed", desc: "Project parameters defined and architectural requirements met." },
                                                    { title: "Production Zero", date: "Month 1", status: "completed", desc: "Core engine development and asset gathering cycle completed." },
                                                    { title: "Beta Integration", date: "Month 2", status: "current", desc: "Current phase. Functional testing and UI/UX optimization." },
                                                    { title: "Final Deployment", date: "Protocol Target", status: "pending", desc: "Final nexus deployment and performance validation." },
                                                ].map((m, i) => (
                                                    <div key={i} className="relative">
                                                        <div className={cn(
                                                            "absolute -left-[29px] top-1.5 w-5 h-5 rounded-full border-2 border-black flex items-center justify-center z-10",
                                                            m.status === 'completed' ? "bg-tech-gold" : m.status === 'current' ? "bg-tech-gold animate-pulse shadow-[0_0_10px_#FFD700]" : "bg-black border-tech-gold/30"
                                                        )}>
                                                            {m.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-black" />}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-tech-gold">{m.date}</span>
                                                            <h4 className="text-lg font-black text-white">{m.title}</h4>
                                                            <p className="text-sm text-gray-400 font-medium max-w-md">{m.desc}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === "feedback" && (
                                        <div className="space-y-6">
                                            <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                                                <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                                                    <PlusCircle className="w-4 h-4 text-tech-gold" />
                                                    Transmit New Signal
                                                </h4>
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Transmitting to</Label>
                                                        <Input value="Technical Director - Project Alpha" disabled className="bg-black/40 border-tech-gold/20 text-gray-400 text-xs font-bold rounded-xl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Signal Message</Label>
                                                        <Textarea
                                                            placeholder="Describe your request or feedback for immediate nexus processing..."
                                                            className="bg-black/40 border-tech-gold/20 text-white min-h-[120px] rounded-2xl focus:ring-tech-gold/20"
                                                        />
                                                    </div>
                                                    <Button className="w-full bg-tech-gold hover:bg-white text-black font-bold h-12 rounded-xl transition-all shadow-lg shadow-tech-gold/20">
                                                        INITIALIZE TRANSMISSION
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <h4 className="text-xs font-black uppercase tracking-widest text-gray-500">Recent Signal History</h4>
                                                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between opacity-50">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-8 h-8 rounded-lg bg-tech-gold/10 flex items-center justify-center">
                                                            <CheckCircle2 className="w-4 h-4 text-tech-gold" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-white italic">"Color profile adjusted as requested"</p>
                                                            <p className="text-[10px] text-gray-500 font-bold uppercase">System Update • 2 days ago</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};

function Activity({ className }: { className?: string }) {
    return (
        <div className={cn("flex items-center gap-0.5", className)}>
            <div className="w-0.5 h-3 bg-current" />
            <div className="w-0.5 h-4 bg-current" />
            <div className="w-0.5 h-2 bg-current" />
        </div>
    );
}

export default ProjectExplorer;
