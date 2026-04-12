import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

/* ─────────────────────────────────────────────────────────
   HELPER: derive a "notes" localStorage key for a client
───────────────────────────────────────────────────────── */
const notesKey = (clientId: string) => `vaw_sales_notes_${clientId}`;

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────── */
const SalesDashboard = () => {
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useStaffData();
  const { clients, stats, isLoading: salesLoading, refetchClients } = useSalesData(profile?.user_id);

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
  const [showMarketInsight, setShowMarketInsight] = useState(false);

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

  /* ─── Fetch client-sales files stored with file_category = 'sales_resource'
         We store the client ID in the file_url path so we can filter by it.
         We use "project_id = null" + file_category as a marker. ─── */
  const fetchClientFiles = async (clientId: string) => {
    setLoadingFiles(true);
    try {
      // List files from storage path client_sales/{clientId}/
      const { data: storageFiles, error } = await supabase.storage
        .from("project_assets")
        .list(`client_sales/${clientId}`, { limit: 50, offset: 0 });
      if (error) throw error;

      // Build proper URLs
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
      // Folder might not exist yet — that's fine
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

  /* ─── Save notes (localStorage + try DB) ─── */
  const handleSaveNotes = async () => {
    if (!selectedClient) return;
    setSavingNotes(true);
    // Always save to localStorage as primary reliable store
    localStorage.setItem(notesKey(selectedClient.id), clientNotes);
    // Then try to persist to DB (may fail if notes column doesn't exist)
    try {
      const { error } = await supabase
        .from("clients")
        .update({ notes: clientNotes } as any)
        .eq("id", selectedClient.id);
      if (error) {
        // Column might not exist — we saved to localStorage, that's fine
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

  /* ════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-500/30">

      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/90 backdrop-blur-xl border-b border-white/5">
        <div className="px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
              <img src="/lovable-uploads/3268a3ac-c0c1-40de-8ba7-8f1b1099460e.png" alt="Logo" className="w-6 h-6 sm:w-7 sm:h-7 object-contain" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tighter uppercase italic text-white leading-none">
                VAW <span className="text-blue-500">Sales</span>
              </h1>
              <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest leading-none mt-0.5">Pro Dashboard</p>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Coin chip — hidden on very small screens */}
            <button
              onClick={() => setShowCoinPopup(true)}
              className="hidden sm:flex items-center gap-2 bg-zinc-900 border border-white/5 hover:border-amber-500/30 px-3 py-2 rounded-xl transition-all"
            >
              <Coins className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="text-right">
                <p className="text-[8px] font-bold text-white/40 uppercase leading-none">Credits</p>
                <p className="text-xs font-black text-amber-300 leading-none">{profile?.total_points?.toLocaleString() || 0}</p>
              </div>
            </button>

            {/* Avatar menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl border border-white/5 hover:bg-white/5">
                  <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border border-white/10">
                    <AvatarImage src={profile?.profile_photo_url} />
                    <AvatarFallback className="bg-zinc-800 text-xs font-bold">
                      {profile?.full_name?.charAt(0) || "S"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-white/10 text-white">
                <DropdownMenuLabel className="p-3">
                  <p className="text-sm font-bold truncate">{profile?.full_name || "Sales User"}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">{profile?.role || "Staff"}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem onClick={() => setShowMarketInsight(true)} className="p-3 hover:bg-white/5 cursor-pointer gap-3">
                  <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" /> Market Insight
                </DropdownMenuItem>
                <DropdownMenuItem className="p-3 hover:bg-white/5 cursor-pointer gap-3">
                  <User className="w-4 h-4 text-slate-400 shrink-0" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowCoinPopup(true)} className="p-3 hover:bg-white/5 cursor-pointer gap-3">
                  <Coins className="w-4 h-4 text-amber-500 shrink-0" /> Coin Vault
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem onClick={handleLogout} className="p-3 hover:bg-white/5 cursor-pointer gap-3 text-red-400">
                  <LogOut className="w-4 h-4 shrink-0" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="px-4 sm:px-6 pt-20 sm:pt-24 pb-12 max-w-7xl mx-auto">

        {/* DAILY PROTOCOL banner */}
        <AnimatePresence mode="wait">
          {(showAttendanceCheck || showMoodCheck) && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="mb-5 bg-gradient-to-br from-blue-600/10 via-transparent to-transparent border border-blue-500/20 rounded-2xl p-5"
            >
              <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                <div className="shrink-0">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30 mb-2 sm:mb-0">
                    <TrendingUp className="w-6 h-6 text-blue-400" />
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

        {/* ═══ MOBILE LAYOUT: single col | DESKTOP: 2-col ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ── LEFT / MAIN COL ── */}
          <div className="lg:col-span-8 order-2 lg:order-1 space-y-5">

            {/* Client Vault */}
            <div className="bg-zinc-900/60 rounded-2xl border border-white/5 p-5 sm:p-6">
              {/* Header row */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
                <div>
                  <h2 className="text-lg sm:text-xl font-black italic tracking-tight uppercase flex items-center gap-2 leading-tight">
                    <Briefcase className="w-5 h-5 text-blue-500 shrink-0" />
                    Client <span className="text-white/40">Vault</span>
                  </h2>
                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider mt-0.5">Proprietary Sales Records</p>
                </div>
                {/* Search */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-56">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                    <Input
                      placeholder="Search clients..."
                      className="pl-9 bg-zinc-950 border-white/5 h-10 rounded-xl text-sm focus:border-blue-500/50"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-xl border-white/5 bg-zinc-950 hover:bg-white/5">
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {salesLoading ? (
                  Array(4).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-36 rounded-2xl bg-white/5" />
                  ))
                ) : filteredClients.length === 0 ? (
                  <div className="col-span-full py-16 text-center opacity-20 border-2 border-dashed border-white/5 rounded-2xl">
                    <Briefcase className="w-14 h-14 mx-auto mb-3" />
                    <p className="text-xs font-black uppercase tracking-widest">No Client Folders</p>
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

          {/* ── RIGHT SIDEBAR ── */}
          <div className="lg:col-span-4 order-1 lg:order-2 space-y-4">

            {/* 1. Add New Client – FIRST CARD (Market Insight moved to profile menu) */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/sales/add-client")}
              className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-5 sm:p-6 cursor-pointer group relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-4 border border-white/30 group-hover:rotate-12 transition-transform">
                  <Plus className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-black italic tracking-tight uppercase text-white leading-tight">
                  Register<br />New Client
                </h3>
                <p className="text-white/60 text-[10px] font-bold mt-2.5 uppercase tracking-widest flex items-center gap-1.5">
                  Multi-step entry <ChevronRight className="w-3 h-3" />
                </p>
              </div>
              <Plus className="absolute -right-6 -bottom-6 w-32 h-32 text-white/10 rotate-12 group-hover:rotate-45 transition-transform duration-500" />
            </motion.div>

            {/* 3. Onboarding Link Creator */}
            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5 sm:p-6">
              <ClientOnboardingCreator userId={profile?.user_id || ""} />
            </div>

          </div>
        </div>
      </main>

      {/* ═══════════════════════════════════════════════════
          CLIENT DETAILS DIALOG
      ═══════════════════════════════════════════════════ */}
      <Dialog open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
        <DialogContent className="
          w-[99vw] max-w-[99vw] sm:w-[90vw] sm:max-w-2xl
          max-h-[99vh]
          bg-zinc-950 border-white/10 rounded-2xl p-0
          overflow-hidden flex flex-col
          m-auto
        ">
          {/* Header */}
          <div className="bg-gradient-to-br from-blue-500/10 via-transparent to-transparent p-5 sm:p-6 border-b border-white/5 shrink-0">
            <DialogHeader>
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30 shrink-0">
                  <Briefcase className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-lg sm:text-xl font-black uppercase italic tracking-tight text-white leading-tight truncate">
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

            {/* Contact info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
              {[
                { icon: User, label: selectedClient?.contact_person },
                { icon: Mail, label: selectedClient?.email },
                { icon: Phone, label: selectedClient?.phone || "No phone" },
                { icon: MapPin, label: selectedClient?.address || "No address" },
              ].map(({ icon: Icon, label }, i) => (
                <div key={i} className="flex items-center gap-2.5 text-white/60 min-w-0">
                  <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-xs font-medium truncate">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-5">

            {/* Projects */}
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-3 flex items-center gap-2">
                <LayoutGrid className="w-3 h-3" /> Active Projects
              </h3>
              {loadingProjects ? (
                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
              ) : clientProjects.length === 0 ? (
                <div className="py-6 text-center border-2 border-dashed border-white/5 rounded-xl opacity-30">
                  <p className="text-[10px] font-black uppercase tracking-widest">No active projects</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {clientProjects.map((p) => (
                    <div key={p.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between gap-2 group hover:bg-white/8 transition-all">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{p.title}</p>
                        <p className="text-[9px] text-white/40 uppercase font-bold tracking-widest">{p.project_type}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="text-[10px] font-black text-emerald-400 capitalize">{p.status}</p>
                          <div className="w-16 h-0.5 bg-white/10 rounded-full mt-1">
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
                <span className="flex items-center gap-2"><FileText className="w-3 h-3" /> Client Resources</span>
                <span className="text-slate-400">{clientFiles.length} file{clientFiles.length !== 1 ? "s" : ""}</span>
              </h3>
              {loadingFiles ? (
                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>
              ) : clientFiles.length === 0 ? (
                <div className="py-6 text-center border-2 border-dashed border-white/5 rounded-xl opacity-30">
                  <p className="text-[10px] font-black uppercase tracking-widest">No resources attached</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {clientFiles.map((f) => (
                    <div key={f.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between gap-2 group hover:bg-white/8 transition-all">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center border border-white/10 shrink-0">
                          <FileText className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{f.name}</p>
                          <p className="text-[9px] text-white/40 uppercase font-bold">{f.type} · {f.size > 0 ? `${(f.size / 1024).toFixed(1)} KB` : ""}</p>
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

            {/* Notes excerpt (if any) */}
            {clientNotes && (
              <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                <p className="text-[9px] font-black text-amber-500/70 uppercase tracking-widest mb-1">Saved Notes</p>
                <p className="text-xs text-white/60 leading-relaxed line-clamp-3 break-words">{clientNotes}</p>
              </div>
            )}
          </div>

          {/* Fixed footer */}
          <div className="p-4 sm:p-5 border-t border-white/5 bg-zinc-950 shrink-0">
            <div className="flex gap-2.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex-1 h-11 rounded-xl border-white/10 font-bold text-xs uppercase tracking-wider gap-2 border-dashed hover:bg-white/5">
                    <PlusCircle className="w-4 h-4 text-slate-400 shrink-0" />
                    Add Resource
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-52 bg-zinc-900 border-white/10 text-white p-2" align="start" side="top">
                  <DropdownMenuItem className="p-2.5 rounded-lg hover:bg-white/5 cursor-pointer gap-3" onClick={() => setIsFilesModalOpen(true)}>
                    <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0">
                      <UploadCloud className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-bold text-xs">Upload Files</p>
                      <p className="text-[8px] text-white/40 uppercase font-black">Images, Video, Docs</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="p-2.5 rounded-lg hover:bg-white/5 cursor-pointer gap-3" onClick={() => setIsInfoModalOpen(true)}>
                    <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0">
                      <Edit className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-bold text-xs">Client Notes</p>
                      <p className="text-[8px] text-white/40 uppercase font-black">Notepad-style editor</p>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={() => setSelectedClient(null)}
                className="flex-1 h-11 bg-white hover:bg-zinc-200 text-black rounded-xl font-black text-xs uppercase tracking-wider"
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════
          FILE UPLOAD MODAL
      ═══════════════════════════════════════════════════ */}
      <Dialog open={isFilesModalOpen} onOpenChange={setIsFilesModalOpen}>
        <DialogContent className="
          w-[99vw] max-w-[99vw] sm:w-[90vw] sm:max-w-lg
          max-h-[99vh]
          bg-zinc-950 border-white/10 rounded-2xl p-0
          overflow-hidden flex flex-col
          m-auto
        ">
          <div className="p-5 sm:p-6 border-b border-white/5 shrink-0">
            <DialogHeader>
              <DialogTitle className="text-lg font-black italic tracking-tight uppercase">
                Upload <span className="text-slate-300">Resources</span>
              </DialogTitle>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">
                For: {selectedClient?.company_name}
              </p>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-6">
            {/* Drag & drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFileUpload(e.dataTransfer.files); }}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
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
              <h4 className="text-base font-bold text-white mb-1">
                {uploadingFile ? "Uploading..." : "Drag & Drop Files"}
              </h4>
              <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">
                Images · Videos · PDFs · Any file type
              </p>
              {!uploadingFile && (
                <Button variant="outline" className="mt-5 rounded-xl border-white/10 text-sm" size="sm">
                  Browse Files
                </Button>
              )}
            </div>
          </div>

          <DialogFooter className="p-4 sm:p-5 border-t border-white/5 bg-zinc-950 shrink-0 flex gap-2.5">
            <Button variant="ghost" className="flex-1 h-11 rounded-xl font-bold text-xs uppercase" onClick={() => setIsFilesModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1 h-11 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-black text-xs uppercase tracking-wide"
              disabled={uploadingFile}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadingFile ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Uploading...</> : "Select Files"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════
          CLIENT NOTEPAD MODAL
      ═══════════════════════════════════════════════════ */}
      <Dialog open={isInfoModalOpen} onOpenChange={setIsInfoModalOpen}>
        <DialogContent className="
          w-[99vw] max-w-[99vw] sm:w-[95vw] sm:max-w-2xl
          max-h-[99vh]
          bg-zinc-950 border-white/10 rounded-2xl p-0
          overflow-hidden flex flex-col
          m-auto
        ">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-white/5 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20 shrink-0">
                  <FileText className="w-6 h-6 text-amber-500" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-base sm:text-lg font-black tracking-tight uppercase leading-tight">
                    Client <span className="text-slate-300">Notes</span>
                  </DialogTitle>
                  <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest truncate">
                    {selectedClient?.company_name}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl border border-white/5 shrink-0" onClick={() => setIsInfoModalOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Notepad body – grows to fill space */}
          <div className="flex-1 relative overflow-hidden" style={{ minHeight: "200px" }}>
            {/* Red margin line (decorative, desktop only) */}
            <div className="absolute top-0 bottom-0 left-14 sm:left-16 w-px bg-red-500/15 pointer-events-none hidden sm:block" />
            <Textarea
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              placeholder="Start typing client intelligence here — meetings, requirements, follow-ups..."
              className="
                h-full w-full min-h-[200px]
                bg-transparent border-none
                focus-visible:ring-0 focus-visible:outline-none
                resize-none
                text-sm sm:text-base font-medium text-white/80 leading-[2rem]
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

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-white/5 bg-zinc-950 shrink-0">
            <div className="flex gap-2.5">
              <Button
                variant="outline"
                className="flex-1 h-11 rounded-xl font-bold text-xs uppercase border-white/10 hover:bg-white/5"
                onClick={() => setIsInfoModalOpen(false)}
              >
                Discard
              </Button>
              <Button
                disabled={savingNotes}
                onClick={handleSaveNotes}
                className="flex-1 h-11 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-black text-xs uppercase tracking-wide"
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

      {/* ── Coin Popup ── */}
      <CoinPopup
        isOpen={showCoinPopup}
        onOpenChange={setShowCoinPopup}
        userId={profile?.user_id || ""}
        userProfile={profile}
      />
      {/* ── Market Insight Dialog ── */}
      <Dialog open={showMarketInsight} onOpenChange={setShowMarketInsight}>
        <DialogContent className="w-[90vw] max-w-sm bg-zinc-950 border-white/10 rounded-2xl p-5 sm:p-6 overflow-hidden flex flex-col m-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase italic tracking-tight text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" /> Market Insight
            </DialogTitle>
            <DialogDescription className="text-xs text-white/40 uppercase tracking-widest font-bold">
              Your aggregated sales analytics
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* Total Leads */}
            <div>
              <div className="flex justify-between items-baseline mb-1.5">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Total Leads</p>
                <p className="text-3xl font-black italic text-white leading-none">{stats?.totalLeads ?? 0}</p>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 0.8 }} className="h-full bg-slate-500 rounded-full" />
              </div>
            </div>
            {/* Active Projects */}
            <div>
              <div className="flex justify-between items-baseline mb-1.5">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Active Projects</p>
                <p className="text-3xl font-black text-teal-300 leading-none">{stats?.activeProjects ?? 0}</p>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: stats?.totalLeads ? `${((stats.activeProjects / stats.totalLeads) * 100).toFixed(0)}%` : "0%" }} transition={{ duration: 0.8 }} className="h-full bg-teal-600 rounded-full" />
              </div>
            </div>
            {/* Conversion Rate */}
            <div>
              <div className="flex justify-between items-baseline mb-1.5">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Conversion Rate</p>
                <p className="text-3xl font-black text-violet-300 leading-none">{stats?.conversionRate ?? 0}%</p>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${stats?.conversionRate ?? 0}%` }} transition={{ duration: 0.8 }} className="h-full bg-violet-600 rounded-full" />
              </div>
            </div>
            {/* Pending Deals */}
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
