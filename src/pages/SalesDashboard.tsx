import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation, Outlet, Link } from "react-router-dom";
import {
  Users,
  Coins,
  Plus,
  LayoutGrid,
  LogOut,
  User,
  Briefcase,
  Edit,
  Trash2,
  FileText,
  X,
  UploadCloud,
  Loader2,
  TrendingUp,
  ChevronRight,
  Search,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  PlusCircle,
  Download,
  Filter,
  ChevronLeft,
  ChevronDown,
  Folder,
  Settings,
  Sparkles,
  Trophy,
  Target,
  Compass,
  CheckCircle,
  HelpCircle,
  Shield,
  Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStaffData } from "@/hooks/useStaffData";
import { useSalesData } from "@/hooks/useSalesData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AttendanceChecker from "@/components/staff/AttendanceChecker";
import MoodQuoteChecker from "@/components/staff/MoodQuoteChecker";
import CoinPopup from "@/components/staff/CoinPopup";
import ClientFolderCard from "@/components/sales/ClientFolderCard";
import ClientOnboardingCreator from "@/components/staff/ClientOnboardingCreator";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import SharedProjectForm from "@/components/projects/SharedProjectForm";

/* ─────────────────────────────────────────────────────────
   HELPER: derive a "notes" localStorage key for a client
───────────────────────────────────────────────────────── */
const notesKey = (clientId: string) => `vaw_sales_notes_${clientId}`;

const pitchTemplates = [
  {
    objection: "Too Expensive / Budget Constraints",
    response: "I completely understand. Quality is an investment, but let me break down how this package pays for itself. With our premium tech stack and AI automation, we reduce manual operations by up to 40% in the first 90 days. We also offer flexible milestones so you only pay as we deliver tangible value. Let's start with a core MVP (Minimum Viable Product) to keep initial costs low and scale as you grow."
  },
  {
    objection: "Why Choose VAW Technologies over Freelancers?",
    response: "Freelancers are great for simple tasks, but with VAW you get a fully synchronized cross-functional team (senior designers, full-stack engineers, and dedicated project managers) under a strict SLA and code-quality guarantee. We don't just write code; we design custom enterprise architectures and scale them securely, backed by post-delivery support. Plus, we are a registered agency—ensuring complete reliability and long-term security."
  },
  {
    objection: "Concerned about Delivery Timelines",
    response: "We establish a highly transparent Kanban project monitor where you can track progress live 24/7. Our agile delivery cycles ensure a working sprint demo is ready every 2 weeks. Additionally, our contracts include specific timeline compliance guarantees to protect your launch window."
  },
  {
    objection: "Do we need the Domain and Tech Setup if we are doing Marketing?",
    response: "Many marketing clients think they just need social media ads, but high-converting ads require ultra-fast landing pages, proper pixel tracking (Meta/Google), and reliable custom domains. Without this tech foundation, you end up wasting up to 50% of your ad spend on slow pages. We bundle domain set up and server configurations so your campaigns yield the highest ROI from day one."
  }
];

const SalesDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSubRoute = location.pathname.includes('/sales/dashboard/') && location.pathname !== '/sales/dashboard';
  const { profile, loading: profileLoading } = useStaffData();
  const { clients, stats, isLoading: salesLoading, refetchClients } = useSalesData(profile?.user_id);

  /* ── Sidebar collapsible ── */
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  /* ── Daily workflow ── */
  const [showCoinPopup, setShowCoinPopup] = useState(false);
  const [showAttendanceCheck, setShowAttendanceCheck] = useState(false);
  const [showMoodCheck, setShowMoodCheck] = useState(false);

  /* ── Client selection ── */
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientProjects, setClientProjects] = useState<any[]>([]);
  const [clientFiles, setClientFiles] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  /* ── Modals ── */
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [showMarketInsight, setShowMarketInsight] = useState(false);
  const [activePitchIndex, setActivePitchIndex] = useState<number | null>(null);

  /* ── File upload ── */
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Notes ── */
  const [clientNotes, setClientNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  /* ── Init ── */
  useEffect(() => {
    if (profile?.user_id) checkDailyRequirements();
  }, [profile?.user_id]);

  /* ── Load client details when selected ── */
  useEffect(() => {
    if (selectedClient) {
      fetchClientProjects(selectedClient.id);
      fetchClientFiles(selectedClient.id);
      const saved = localStorage.getItem(notesKey(selectedClient.id)) || "";
      setClientNotes(saved);
    } else {
      setClientProjects([]);
      setClientFiles([]);
      setClientNotes("");
    }
  }, [selectedClient]);

  /* ─── Daily check ─── */
  const checkDailyRequirements = async () => {
    if (!profile?.user_id) return;
    const today = new Date().toISOString().split("T")[0];
    const [{ data: att }, { data: mood }] = await Promise.all([
      supabase.from("staff_attendance").select("id").eq("user_id", profile.user_id).eq("date", today).maybeSingle(),
      supabase.from("user_mood_entries").select("id").eq("user_id", profile.user_id).eq("date", today).maybeSingle(),
    ]);
    setShowAttendanceCheck(!att);
    setShowMoodCheck(!!att && !mood);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/staff/login");
    toast.success("Signed out");
  };

  /* ─── Fetch projects ─── */
  const fetchClientProjects = async (clientId: string) => {
    setLoadingProjects(true);
    try {
      const { data, error } = await supabase
        .from("client_projects")
        .select("id,title,project_type,status,progress")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setClientProjects(data || []);
    } catch (err: any) {
      console.error("Projects fetch error:", err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleProjectSuccess = (newProject: any) => {
    setClientProjects([newProject, ...clientProjects]);
    setIsAddProjectDialogOpen(false);
    refetchClients(); // Refresh stats if needed
  };

  /* ─── Fetch client-sales files ─── */
  const fetchClientFiles = async (clientId: string) => {
    setLoadingFiles(true);
    try {
      const { data: storageFiles, error } = await supabase.storage
        .from("project_assets")
        .list(`client_sales/${clientId}`, { limit: 50, offset: 0 });
      if (error) throw error;

      const files = (storageFiles || []).map((f) => {
        const path = `client_sales/${clientId}/${f.name}`;
        const { data: urlData } = supabase.storage.from("project_assets").getPublicUrl(path);
        return {
          id: f.id || f.name,
          name: f.name,
          path,
          url: urlData.publicUrl,
          size: f.metadata?.size || 0,
          type: f.name.split(".").pop() || "file",
        };
      });
      setClientFiles(files);
    } catch (err: any) {
      setClientFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  };

  /* ─── Upload files ─── */
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedClient) return;
    setUploadingFile(true);
    let successCount = 0;
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `client_sales/${selectedClient.id}/${Date.now()}_${safeFileName}`;

        const { error: upErr } = await supabase.storage
          .from("project_assets")
          .upload(path, file, { upsert: false });

        if (upErr) {
          toast.error(`Failed to upload ${file.name}: ${upErr.message}`);
        } else {
          successCount++;
        }
      }
      if (successCount > 0) {
        toast.success(`${successCount} file(s) uploaded`);
        fetchClientFiles(selectedClient.id);
        setIsFilesModalOpen(false);
      }
    } catch (err: any) {
      toast.error(`Upload error: ${err.message}`);
    } finally {
      setUploadingFile(false);
    }
  };

  /* ─── Delete file ─── */
  const handleDeleteFile = async (path: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      const { error } = await supabase.storage.from("project_assets").remove([path]);
      if (error) throw error;
      toast.success("File deleted");
      fetchClientFiles(selectedClient.id);
    } catch (err: any) {
      toast.error(`Delete error: ${err.message}`);
    }
  };

  /* ─── Save notes ─── */
  const handleSaveNotes = async () => {
    if (!selectedClient) return;
    setSavingNotes(true);
    localStorage.setItem(notesKey(selectedClient.id), clientNotes);
    try {
      const { error } = await supabase
        .from("clients")
        .update({ notes: clientNotes } as any)
        .eq("id", selectedClient.id);
      if (error) {
        console.warn("Could not save notes to DB:", error.message);
      }
    } catch {}
    setSavingNotes(false);
    toast.success("Notes saved");
    setIsInfoModalOpen(false);
  };

  /* ─── Filter ─── */
  const filteredClients = (clients || []).filter(
    (c) =>
      c.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contact_person?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ─── Pipeline Stats calculations ─── */
  const pipelineStats = useMemo(() => {
    const totalCount = clients?.length || 0;
    const activeProjects = stats?.activeProjects || 0;
    const conversionRate = stats?.conversionRate || 0;
    // Estimated Pipeline Value = Active Projects * Estimated Avg Deal (e.g. 50k INR)
    const pipelineValue = activeProjects * 45000;
    return {
      totalCount,
      activeProjects,
      conversionRate,
      pipelineValue,
      targetGoal: 10, // Deals target
    };
  }, [clients, stats]);

  const sidebarLinks = [
    {
      title: "Sales Portal",
      items: [
        { name: "Client Vault", path: "/sales/dashboard", icon: Briefcase },
        { name: "Agenda (Reminders)", path: "/sales/dashboard/agenda", icon: Edit },
        { name: "Onboarding Links", path: "/sales/dashboard/onboarding", icon: Compass },
      ]
    },
    {
      title: "Resources & Goals",
      items: [
        { name: "Service Pricing", path: "/sales/dashboard/pricing", icon: Coins },
        { name: "Monthly Planner", path: "/sales/dashboard/plans", icon: LayoutGrid },
        { name: "Register Client", path: "/sales/add-client", icon: PlusCircle },
      ]
    }
  ];

  return (
    <div className="min-h-screen h-screen flex flex-col lg:flex-row relative overflow-hidden bg-zinc-950 text-white selection:bg-blue-500/30">

      {/* Background Layer - Fixed to viewport */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-black/45 z-10"></div>
        <img
          src="/lovable-uploads/472162b9-c883-43ff-b81c-428cd163ffd8.png"
          alt="Modern office background"
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
      </div>

      {/* Collapsible Left Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col border-r border-white/5 transition-all duration-300 ease-in-out relative z-30 group overflow-hidden bg-cover bg-center bg-no-repeat shrink-0",
          isSidebarCollapsed ? "w-20" : "w-72"
        )}
        style={{ backgroundImage: "url('/lovable-uploads/472162b9-c883-43ff-b81c-428cd163ffd8.png')" }}
      >
        <div className="absolute inset-0 bg-black/75 backdrop-blur-xl z-0 pointer-events-none" />
        <div className="relative z-10 flex flex-col h-full w-full">
          {/* Top Header Logo (VAW Sales Hub) */}
          <div className={cn("p-6 flex items-center", isSidebarCollapsed ? "justify-center" : "justify-between border-b border-white/5")}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0 shadow-lg">
                <img
                  src="/lovable-uploads/0d3e4545-c80e-401b-82f1-3319db5155b4.png"
                  alt="VAW Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              {!isSidebarCollapsed && (
                <div className="flex flex-col">
                  <span className="font-black text-white uppercase italic tracking-tighter text-sm">VAW Technologies</span>
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none mt-0.5">Sales Hub</span>
                </div>
              )}
            </div>
            {!isSidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white/20 hover:text-white hover:bg-white/5 transition-all"
                onClick={() => setIsSidebarCollapsed(true)}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
          </div>

          <div className="flex-1 px-4 py-4 overflow-y-auto space-y-6">
            {sidebarLinks.map((section) => (
              <div key={section.title} className="space-y-2">
                {!isSidebarCollapsed && (
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-2 block mb-2">
                    {section.title}
                  </span>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                      <Button
                        key={item.path}
                        variant="ghost"
                        className={cn(
                          "w-full transition-all duration-200 group/btn relative justify-start",
                          isSidebarCollapsed ? "justify-center px-0 h-12" : "px-3 h-10",
                          isActive
                            ? "bg-white/5 text-white"
                            : "text-white/40 hover:text-white hover:bg-white/[0.02]"
                        )}
                        onClick={() => navigate(item.path)}
                        title={isSidebarCollapsed ? item.name : undefined}
                      >
                        <Icon className={cn(
                          "w-5 h-5 transition-transform group-hover/btn:scale-110",
                          !isSidebarCollapsed && "mr-3"
                        )} />
                        {!isSidebarCollapsed && (
                          <span className="text-xs font-bold uppercase tracking-tight">{item.name}</span>
                        )}

                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Stats sidebar footer */}
          {!isSidebarCollapsed && (
            <div className="border-t border-white/5 p-5 space-y-3 shrink-0">
              <div className="flex items-center justify-between text-xs text-white/40 font-bold uppercase tracking-wider">
                <span>Direct Sales</span>
                <span className="text-blue-400 font-extrabold">{stats?.conversionRate || 0}% CTR</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${stats?.conversionRate || 0}%` }} />
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative z-10 overflow-hidden">

        {/* Top Header */}
        <header className="relative z-30 bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-2xl shrink-0">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isSidebarCollapsed && (
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-black/40 border-white/10 text-white hover:bg-white/10 backdrop-blur-md shrink-0 mr-1"
                  onClick={() => setIsSidebarCollapsed(false)}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              )}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-600 hover:bg-blue-700 text-white border-none text-[10px] uppercase font-bold px-2 py-0.5">
                    Sales Pro
                  </Badge>
                  <p className="text-white text-base font-bold flex items-center">
                    <User className="inline w-4 h-4 mr-1.5 text-blue-400" />
                    {profile?.full_name || profile?.username || 'Sales Rep'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Coin Vault credits */}
              <button
                onClick={() => setShowCoinPopup(true)}
                className="flex items-center gap-2 bg-zinc-900 border border-white/5 hover:border-amber-500/30 px-3 py-1.5 rounded-xl transition-all"
              >
                <Coins className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="text-right">
                  <p className="text-[8px] font-bold text-white/40 uppercase leading-none">Coins Credits</p>
                  <p className="text-xs font-black text-amber-300 leading-none mt-0.5">{(profile?.total_points || 0).toLocaleString()}</p>
                </div>
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.profile_photo_url || profile?.avatar_url} />
                      <AvatarFallback>{profile?.full_name?.charAt(0) || 'S'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-zinc-950 text-white border-white/10 shadow-2xl">
                  <DropdownMenuLabel className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Sales Account</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={() => navigate("/staff/dashboard")} className="p-3 hover:bg-white/5 cursor-pointer gap-3 text-blue-400">
                    <Compass className="w-4 h-4 shrink-0" /> Staff Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowMarketInsight(true)} className="p-3 hover:bg-white/5 cursor-pointer gap-3">
                    <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" /> Market Analytics
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-400 hover:text-red-300 py-1.5 focus:bg-white/5">
                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Scrollable sub-views layout */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-24 lg:pb-6">
          <div className="max-w-6xl mx-auto space-y-6">

            {isSubRoute ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <Outlet />
              </div>
            ) : (
              <>
                {/* Daily attendance/mood check banners */}
                <AnimatePresence mode="wait">
                  {(showAttendanceCheck || showMoodCheck) && (
                    <motion.div
                      initial={{ opacity: 0, y: -12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      className="bg-black/60 backdrop-blur-2xl border border-white/15 rounded-[2rem] p-5 shadow-2xl"
                    >
                      <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                        <div className="shrink-0">
                          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 mb-2 sm:mb-0">
                            <TrendingUp className="w-6 h-6 text-blue-400 animate-pulse" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-base font-black italic tracking-tight uppercase mb-1">
                            Daily <span className="text-blue-500">Protocol</span>
                          </h2>
                          {showAttendanceCheck ? (
                            <AttendanceChecker userId={profile?.user_id || ""} onAttendanceMarked={() => checkDailyRequirements()} />
                          ) : (
                            <MoodQuoteChecker userId={profile?.user_id || ""} onMoodSubmitted={() => checkDailyRequirements()} />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 1. DEAL PIPELINE SUMMARY & GOAL GAUGE */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  {[
                    { label: "Est. Pipeline Value", value: `₹${pipelineStats.pipelineValue.toLocaleString()}`, trend: "Based on active deals", icon: Coins, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
                    { label: "Active Deals", value: `${pipelineStats.activeProjects} Prospects`, trend: "Currently in negotiations", icon: Briefcase, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
                    { label: "Sales Conversion", value: `${pipelineStats.conversionRate}%`, trend: "Closed-won ratio", icon: TrendingUp, color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
                  ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                      <Card key={i} className="bg-black/60 border-white/15 rounded-[2rem] backdrop-blur-2xl text-white shadow-xl relative overflow-hidden">
                        <CardContent className="p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-white/40">{stat.label}</span>
                            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center border", stat.color)}>
                              <Icon className="w-4 h-4" />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-white">{stat.value}</h3>
                            <p className="text-[10px] font-bold text-white/30 uppercase mt-0.5">{stat.trend}</p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {/* Goal Gauge / Commission Card */}
                  <Card className="bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border-white/15 rounded-[2rem] backdrop-blur-2xl text-white shadow-xl">
                    <CardContent className="p-6 flex flex-col justify-between h-full space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">Sales Commission Target</span>
                        <Trophy className="w-4 h-4 text-amber-400 animate-bounce" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-baseline">
                          <h4 className="text-lg font-black text-white">{pipelineStats.activeProjects} / {pipelineStats.targetGoal} Closed</h4>
                          <span className="text-xs font-bold text-indigo-200">
                            {((pipelineStats.activeProjects / pipelineStats.targetGoal) * 100).toFixed(0)}% Done
                          </span>
                        </div>
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-amber-400 to-indigo-500" style={{ width: `${(pipelineStats.activeProjects / pipelineStats.targetGoal) * 100}%` }} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* CLIENT VAULT */}
                  <div className="lg:col-span-8 space-y-6">
                    <div className="bg-black/60 backdrop-blur-2xl rounded-[2.5rem] border border-white/15 p-6 shadow-2xl">

                      {/* Search & filters */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white flex items-center gap-2.5">
                            <Briefcase className="w-6 h-6 text-blue-500" />
                            Client <span className="text-white/40">Vault</span>
                          </h2>
                          <p className="text-xs text-white/30 font-black uppercase tracking-wider mt-0.5">Manage Leads, Folder Assets, & Direct Pitch Notes</p>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                            <Input
                              placeholder="Search folders..."
                              className="pl-9 bg-zinc-950/50 border-white/10 h-11 rounded-xl text-sm focus:border-blue-500/50 font-bold"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                          </div>
                          <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 rounded-xl border-white/10 bg-zinc-950/40 hover:bg-white/5">
                            <Filter className="w-4 h-4 text-white/50" />
                          </Button>
                        </div>
                      </div>

                      {/* Folder Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {salesLoading ? (
                          Array(6).fill(0).map((_, i) => (
                            <Skeleton key={i} className="h-36 rounded-[2rem] bg-white/5" />
                          ))
                        ) : filteredClients.length === 0 ? (
                          <div className="col-span-full py-20 text-center opacity-20 border-2 border-dashed border-white/10 rounded-[2rem]">
                            <Briefcase className="w-14 h-14 mx-auto mb-3 text-white/50" />
                            <p className="text-xs font-black uppercase tracking-widest text-white/50">No client folders located in vault</p>
                          </div>
                        ) : (
                          filteredClients.map((client) => (
                            <motion.div
                              key={client.id}
                              layout
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                            >
                              <ClientFolderCard client={client as any} onClick={() => setSelectedClient(client)} />
                            </motion.div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 2. PITCH ASSISTANT (Objection Handling / Pitch Cards) */}
                  <div className="lg:col-span-4 space-y-6">
                    {/* Add New Client Shortcut */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate("/sales/add-client")}
                      className="bg-gradient-to-br from-indigo-600/80 to-purple-700/80 backdrop-blur-xl border border-white/15 rounded-[2rem] p-6 cursor-pointer group relative overflow-hidden shadow-2xl"
                    >
                      <div className="relative z-10 space-y-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 group-hover:rotate-12 transition-transform">
                          <Plus className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black italic tracking-tight uppercase text-white leading-tight">
                            Register<br />New Lead Folder
                          </h3>
                          <p className="text-white/60 text-[10px] font-bold mt-2 uppercase tracking-widest flex items-center gap-1.5">
                            Launch Onboarding pipeline <ChevronRight className="w-3 h-3" />
                          </p>
                        </div>
                      </div>
                      <Plus className="absolute -right-6 -bottom-6 w-32 h-32 text-white/10 rotate-12 group-hover:rotate-45 transition-transform duration-500" />
                    </motion.div>

                    {/* Objection Pitch Assistant */}
                    <Card className="bg-black/60 border-white/15 rounded-[2rem] backdrop-blur-2xl text-white shadow-2xl overflow-hidden">
                      <CardHeader className="border-b border-white/10 p-5 bg-white/[0.02]">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-amber-400" />
                          Objection handling Pitch Assistant
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-5 space-y-4">
                        <p className="text-[10px] text-white/40 uppercase font-black tracking-widest leading-relaxed">
                          Tackle common objections with high-converting sales parameters
                        </p>
                        <div className="space-y-2">
                          {pitchTemplates.map((item, idx) => (
                            <div key={idx} className="border border-white/5 rounded-xl overflow-hidden bg-white/[0.01]">
                              <button
                                onClick={() => setActivePitchIndex(activePitchIndex === idx ? null : idx)}
                                className="w-full p-3 text-left text-xs font-black uppercase tracking-tight flex items-center justify-between hover:bg-white/[0.03] transition-colors gap-2"
                              >
                                <span className={cn(activePitchIndex === idx ? "text-primary" : "text-white/80")}>
                                  {item.objection}
                                </span>
                                <ChevronDown className={cn("w-4 h-4 shrink-0 opacity-40 transition-transform", activePitchIndex === idx && "rotate-180")} />
                              </button>
                              <AnimatePresence>
                                {activePitchIndex === idx && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="px-3 pb-3 text-xs text-white/60 leading-relaxed border-t border-white/5 pt-2 italic"
                                  >
                                    "{item.response}"
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════
          CLIENT DETAILS DIALOG (REDESIGNED)
      ═══════════════════════════════════════════════════ */}
      <Dialog open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
        <DialogContent className="
          w-[99vw] max-w-[99vw] sm:w-[90vw] sm:max-w-2xl
          max-h-[99vh]
          bg-zinc-950 border-white/10 rounded-[2.5rem] p-0
          overflow-hidden flex flex-col
          m-auto
        ">
          <div className="bg-gradient-to-br from-blue-500/10 via-transparent to-transparent p-6 border-b border-white/5 shrink-0">
            <DialogHeader>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30 shrink-0">
                  <Briefcase className="w-7 h-7 text-blue-450" />
                </div>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-xl font-black uppercase italic tracking-tight text-white leading-tight truncate">
                    {selectedClient?.company_name}
                  </DialogTitle>
                  <Badge className="mt-1 bg-zinc-700/60 text-zinc-300 border border-zinc-600/50 text-[9px] uppercase font-bold px-2 py-0">
                    Vault Synced
                  </Badge>
                </div>
              </div>
            </DialogHeader>
            <DialogDescription className="sr-only">
              Client details, projects, and resources for {selectedClient?.company_name}
            </DialogDescription>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4 border-t border-white/5 pt-4">
              {[
                { icon: User, label: selectedClient?.contact_person },
                { icon: Mail, label: selectedClient?.email },
                { icon: Phone, label: selectedClient?.phone || "No phone" },
                { icon: MapPin, label: selectedClient?.address || "No address" },
              ].map(({ icon: Icon, label }, i) => (
                <div key={i} className="flex items-center gap-2.5 text-white/60 min-w-0">
                  <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-xs font-semibold truncate">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Projects */}
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-3 flex items-center gap-2">
                <LayoutGrid className="w-3.5 h-3.5 text-primary" /> Active Projects
              </h3>
              {loadingProjects ? (
                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
              ) : clientProjects.length === 0 ? (
                <div className="py-6 text-center border border-white/10 rounded-2xl bg-white/[0.01] opacity-35">
                  <p className="text-[10px] font-black uppercase tracking-widest">No active projects linked</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {clientProjects.map((p) => (
                    <div key={p.id} className="p-3 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between gap-2 group hover:bg-white/10 transition-all">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-white truncate uppercase italic">{p.title}</p>
                        <p className="text-[9px] text-white/40 uppercase font-black tracking-widest">{p.project_type}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="text-[10px] font-black text-emerald-450 uppercase">{p.status}</p>
                          <div className="w-16 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-slate-500 rounded-full" style={{ width: `${p.progress || 0}%` }} />
                          </div>
                        </div>
                        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-white/20 hover:text-white" onClick={() => navigate("/project-monitor")}>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Files */}
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-primary" /> Client Resources</span>
                <span className="text-slate-400 font-bold">{clientFiles.length} file{clientFiles.length !== 1 ? "s" : ""}</span>
              </h3>
              {loadingFiles ? (
                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>
              ) : clientFiles.length === 0 ? (
                <div className="py-6 text-center border border-white/10 rounded-2xl bg-white/[0.01] opacity-35">
                  <p className="text-[10px] font-black uppercase tracking-widest">No resources attached</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {clientFiles.map((f) => (
                    <div key={f.id} className="p-3 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between gap-2 group hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center border border-white/10 shrink-0">
                          <FileText className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{f.name}</p>
                          <p className="text-[9px] text-white/40 uppercase font-black">{f.type} · {f.size > 0 ? `${(f.size / 1024).toFixed(1)} KB` : ""}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-white/30 hover:text-white" asChild>
                          <a href={f.url} target="_blank" rel="noreferrer"><Download className="w-3.5 h-3.5" /></a>
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-white/30 hover:text-red-400" onClick={() => handleDeleteFile(f.path, f.name)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes excerpt */}
            {clientNotes && (
              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <Edit className="w-3.5 h-3.5" /> Saved Notebook Intelligence
                </p>
                <p className="text-xs text-white/60 leading-relaxed line-clamp-3 break-words whitespace-pre-wrap">{clientNotes}</p>
              </div>
            )}
          </div>

          <div className="p-5 border-t border-white/5 bg-zinc-950 shrink-0">
            <div className="flex gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex-1 h-12 rounded-xl border-white/10 font-bold text-xs uppercase tracking-wider gap-2 border-dashed hover:bg-white/5">
                    <PlusCircle className="w-4 h-4 text-slate-400 shrink-0" />
                    Add Resource
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-zinc-900 border-white/10 text-white p-2" align="start" side="top">
                  <DropdownMenuItem className="p-2.5 rounded-lg hover:bg-white/5 cursor-pointer gap-3" onClick={() => setIsFilesModalOpen(true)}>
                    <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0">
                      <UploadCloud className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-white">Upload Files</p>
                      <p className="text-[8px] text-white/40 uppercase font-black">Images, Video, Docs</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="p-2.5 rounded-lg hover:bg-white/5 cursor-pointer gap-3" onClick={() => setIsInfoModalOpen(true)}>
                    <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0">
                      <Edit className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-white">Client Notes</p>
                      <p className="text-[8px] text-white/40 uppercase font-black">Notepad-style editor</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="p-2.5 rounded-lg hover:bg-white/5 cursor-pointer gap-3" onClick={() => setIsAddProjectDialogOpen(true)}>
                    <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center shrink-0">
                      <LayoutGrid className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-white">New Project</p>
                      <p className="text-[8px] text-white/40 uppercase font-black">Initialize & Sync</p>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={() => setSelectedClient(null)}
                className="flex-1 h-12 bg-white hover:bg-zinc-200 text-black rounded-xl font-black text-xs uppercase tracking-wider border-none"
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ ADD PROJECT MODAL ══ */}
      <Dialog open={isAddProjectDialogOpen} onOpenChange={setIsAddProjectDialogOpen}>
        <DialogContent className="
          w-[99vw] max-w-[99vw] sm:w-[90vw] sm:max-w-lg
          max-h-[99vh]
          bg-zinc-950 border-white/10 rounded-[2rem] p-0
          overflow-hidden flex flex-col
          m-auto
        ">
          <div className="p-6 border-b border-white/5 shrink-0">
            <DialogHeader>
              <DialogTitle className="text-lg font-black italic tracking-tight uppercase text-white">
                Initialize <span className="text-indigo-400">Project</span>
              </DialogTitle>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">
                Client: {selectedClient?.company_name}
              </p>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            <SharedProjectForm 
              clientId={selectedClient?.id}
              onSuccess={handleProjectSuccess}
              onCancel={() => setIsAddProjectDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ FILE UPLOAD MODAL ══ */}
      <Dialog open={isFilesModalOpen} onOpenChange={setIsFilesModalOpen}>
        <DialogContent className="
          w-[99vw] max-w-[99vw] sm:w-[90vw] sm:max-w-lg
          max-h-[99vh]
          bg-zinc-950 border-white/10 rounded-[2rem] p-0
          overflow-hidden flex flex-col
          m-auto
        ">
          <div className="p-6 border-b border-white/5 shrink-0">
            <DialogHeader>
              <DialogTitle className="text-lg font-black italic tracking-tight uppercase text-white">
                Upload <span className="text-slate-300">Resources</span>
              </DialogTitle>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">
                For: {selectedClient?.company_name}
              </p>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFileUpload(e.dataTransfer.files); }}
              className={`border-2 border-dashed rounded-[2rem] p-12 text-center transition-all cursor-pointer ${
                isDragOver ? "border-slate-400 bg-white/5" : "border-white/10 hover:border-white/20"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                {uploadingFile ? (
                  <Loader2 className="w-7 h-7 text-slate-300 animate-spin" />
                ) : (
                  <UploadCloud className="w-7 h-7 text-slate-300" />
                )}
              </div>
              <h4 className="text-base font-black text-white mb-1">
                {uploadingFile ? "Uploading..." : "Drag & Drop Files"}
              </h4>
              <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">
                Images · Videos · PDFs · Any file type
              </p>
              {!uploadingFile && (
                <Button variant="outline" className="mt-5 rounded-xl border-white/10 text-xs font-bold uppercase" size="sm">
                  Browse Files
                </Button>
              )}
            </div>
          </div>

          <DialogFooter className="p-5 border-t border-white/5 bg-zinc-950 shrink-0 flex gap-2.5">
            <Button variant="ghost" className="flex-1 h-12 rounded-xl font-bold text-xs uppercase" onClick={() => setIsFilesModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1 h-12 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-black text-xs uppercase tracking-wide border-none"
              disabled={uploadingFile}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadingFile ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Uploading...</> : "Select Files"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ CLIENT NOTEPAD MODAL ══ */}
      <Dialog open={isInfoModalOpen} onOpenChange={setIsInfoModalOpen}>
        <DialogContent className="
          w-[99vw] max-w-[99vw] sm:w-[95vw] sm:max-w-2xl
          max-h-[99vh]
          bg-zinc-950 border-white/10 rounded-[2.5rem] p-0
          overflow-hidden flex flex-col
          m-auto
        ">
          <div className="p-6 border-b border-white/5 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20 shrink-0">
                  <FileText className="w-6 h-6 text-amber-500" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-base sm:text-lg font-black tracking-tight uppercase leading-tight text-white">
                    Client <span className="text-slate-350">Intelligence Notes</span>
                  </DialogTitle>
                  <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest truncate">
                    {selectedClient?.company_name}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl border border-white/5 shrink-0 text-white/60 hover:text-white" onClick={() => setIsInfoModalOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 relative overflow-hidden" style={{ minHeight: "250px" }}>
            <div className="absolute top-0 bottom-0 left-14 sm:left-16 w-px bg-red-500/15 pointer-events-none hidden sm:block" />
            <Textarea
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              placeholder="Start typing client intelligence here — meetings, requirements, follow-ups..."
              className="
                h-full w-full min-h-[250px]
                bg-transparent border-none
                focus-visible:ring-0 focus-visible:outline-none
                resize-none
                text-sm sm:text-base font-semibold text-white/80 leading-[2rem]
                p-4 sm:pl-20 sm:pr-6
                placeholder:text-white/15
                rounded-none
              "
              style={{
                background: "repeating-linear-gradient(transparent, transparent 31px, rgba(255,255,255,0.04) 31px, rgba(255,255,255,0.04) 32px)",
                backgroundAttachment: "local",
              }}
            />
          </div>

          <div className="p-5 border-t border-white/5 bg-zinc-950 shrink-0">
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl font-bold text-xs uppercase border-white/10 hover:bg-white/5 text-white"
                onClick={() => setIsInfoModalOpen(false)}
              >
                Discard
              </Button>
              <Button
                disabled={savingNotes}
                onClick={handleSaveNotes}
                className="flex-1 h-12 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-black text-xs uppercase tracking-wide border-none"
              >
                {savingNotes ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2 shrink-0" />Saving...</>
                ) : (
                  "Save Notes"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Coin Vault credits */}
      <CoinPopup
        isOpen={showCoinPopup}
        onOpenChange={setShowCoinPopup}
        userId={profile?.user_id || ""}
        userProfile={profile}
      />

      {/* Curved glassmorphic 5-tab Bottom Navigation for Mobile Devices */}
      <nav className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
        <div className="bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
          <div className="flex items-center justify-around px-2 py-3 safe-area-inset-bottom">
            {[
              { name: 'Vault', path: '/sales/dashboard', icon: Briefcase },
              { name: 'Agenda', path: '/sales/dashboard/agenda', icon: Edit },
              { name: 'Pricing', path: '/sales/dashboard/pricing', icon: Coins },
              { name: 'Plans', path: '/sales/dashboard/plans', icon: LayoutGrid },
              { name: 'Onboarding', path: '/sales/dashboard/onboarding', icon: Compass },
            ].map((tab) => {
              const isActive = location.pathname === tab.path;

              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className="relative flex flex-col items-center gap-1 py-1 px-2.5 min-w-[56px] group"
                >
                  {isActive && (
                    <motion.div
                      layoutId="salesActiveNavGlow"
                      className="absolute inset-0 rounded-xl bg-blue-500/10 border border-blue-500/20"
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    />
                  )}

                  <tab.icon
                    className={cn(
                      "w-5 h-5 transition-transform duration-200",
                      isActive ? "text-blue-400 scale-110" : "text-zinc-500 group-hover:text-zinc-300"
                    )}
                  />
                  <span
                    className={cn(
                      "text-[9px] font-bold tracking-tight transition-all",
                      isActive ? "text-blue-400 font-black" : "text-zinc-500 group-hover:text-zinc-300"
                    )}
                  >
                    {tab.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Market Insight / Analytics Dialog */}
      <Dialog open={showMarketInsight} onOpenChange={setShowMarketInsight}>
        <DialogContent className="w-[90vw] max-w-sm bg-zinc-950 border-white/10 rounded-[2.5rem] p-6 overflow-hidden flex flex-col m-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase italic tracking-tight text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" /> Market Insight
            </DialogTitle>
            <DialogDescription className="text-xs text-white/40 uppercase tracking-widest font-bold">
              Your aggregated sales analytics
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            <div>
              <div className="flex justify-between items-baseline mb-1.5">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Total Leads</p>
                <p className="text-3xl font-black italic text-white leading-none">{stats?.totalLeads ?? 0}</p>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 0.8 }} className="h-full bg-slate-500 rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-baseline mb-1.5">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Active Projects</p>
                <p className="text-3xl font-black text-teal-300 leading-none">{stats?.activeProjects ?? 0}</p>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: stats?.totalLeads ? `${((stats.activeProjects / stats.totalLeads) * 100).toFixed(0)}%` : "0%" }} transition={{ duration: 0.8 }} className="h-full bg-teal-600 rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-baseline mb-1.5">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Conversion Rate</p>
                <p className="text-3xl font-black text-violet-300 leading-none">{stats?.conversionRate ?? 0}%</p>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${stats?.conversionRate ?? 0}%` }} transition={{ duration: 0.8 }} className="h-full bg-violet-600 rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-baseline mb-1.5">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Pending Deals</p>
                <p className="text-3xl font-black text-orange-300 leading-none">{stats?.pendingDeals ?? 0}</p>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: stats?.totalLeads ? `${((stats.pendingDeals / stats.totalLeads) * 100).toFixed(0)}%` : "0%" }} transition={{ duration: 0.8 }} className="h-full bg-orange-600 rounded-full" />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6 border-t border-white/5 pt-4">
            <Button variant="ghost" onClick={() => setShowMarketInsight(false)} className="w-full h-11 rounded-xl font-bold text-xs uppercase text-white/50 hover:text-white">
              Close Analytics
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesDashboard;
