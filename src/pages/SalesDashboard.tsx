import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  Coins, 
  Plus, 
  LayoutGrid, 
  LogOut, 
  User, 
  Briefcase, 
  TrendingUp,
  Clock,
  ChevronRight,
  Search,
  Filter,
  Link as LinkIcon,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Loader2
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ScrollArea } from "@/components/ui/scroll-area";

const SalesDashboard = () => {
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useStaffData();
  const { clients, stats, isLoading: salesLoading } = useSalesData(profile?.user_id);
  
  const [showCoinPopup, setShowCoinPopup] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientProjects, setClientProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAttendanceCheck, setShowAttendanceCheck] = useState(false);
  const [showMoodCheck, setShowMoodCheck] = useState(false);

  useEffect(() => {
    if (profile?.user_id) {
      checkDailyRequirements();
    }
  }, [profile?.user_id]);

  useEffect(() => {
    if (selectedClient) {
      fetchClientProjects(selectedClient.id);
    }
  }, [selectedClient]);

  const fetchClientProjects = async (clientId: string) => {
    setLoadingProjects(true);
    try {
      const { data, error } = await supabase
        .from('client_projects')
        .select('*')
        .eq('client_id', clientId);
      if (error) throw error;
      setClientProjects(data || []);
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const checkDailyRequirements = async () => {
    if (!profile?.user_id) return;
    const today = new Date().toISOString().split('T')[0];
    
    const { data: attendance } = await supabase
      .from('staff_attendance')
      .select('*')
      .eq('user_id', profile.user_id)
      .eq('date', today)
      .maybeSingle();

    const { data: mood } = await supabase
      .from('user_mood_entries')
      .select('*')
      .eq('user_id', profile.user_id)
      .eq('date', today)
      .maybeSingle();

    setShowAttendanceCheck(!attendance);
    setShowMoodCheck(!!attendance && !mood);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/staff/login");
    toast.success("Logged out successfully");
  };

  const filteredClients = clients?.filter(c => 
    c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.contact_person.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-500/30">
      {/* Premium Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 shadow-2xl">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group transition-all hover:bg-white/10">
              <img 
                src="/lovable-uploads/3268a3ac-c0c1-40de-8ba7-8f1b1099460e.png" 
                alt="Logo" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase italic text-white">
                Vault <span className="text-blue-500">Sales</span>
              </h1>
              <Badge variant="outline" className="text-[9px] uppercase tracking-widest font-bold py-0 bg-blue-500/10 text-blue-400 border-blue-500/20">
                PRO DASHBOARD
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Coin Insight */}
            <div 
              onClick={() => setShowCoinPopup(true)}
              className="hidden md:flex items-center gap-2 bg-zinc-900 border border-white/5 hover:border-amber-500/30 px-3 py-2 rounded-xl cursor-pointer transition-all hover:bg-white/5"
            >
              <div className="p-1.5 bg-amber-500/10 rounded-lg">
                <Coins className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold text-white/40 uppercase leading-none mb-0.5">VAW Credit</p>
                <p className="text-xs font-black text-amber-200 leading-none">
                  {profile?.total_points?.toLocaleString() || 0} Points
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl hover:bg-white/5 border border-white/5">
                  <Avatar className="h-9 w-9 border border-white/10">
                    <AvatarImage src={profile?.profile_photo_url} />
                    <AvatarFallback className="bg-zinc-800 text-xs">{profile?.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-zinc-900 border-white/10 text-white">
                <DropdownMenuLabel className="font-bold p-4">
                  <p className="text-sm">{profile?.full_name || 'Sales User'}</p>
                  <p className="text-xs text-white/40 font-normal uppercase tracking-widest mt-1">{profile?.role || 'Staff'}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem className="p-3 hover:bg-white/5 cursor-pointer flex items-center gap-3">
                  <User className="w-4 h-4 text-blue-500" /> View Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowCoinPopup(true)} className="p-3 hover:bg-white/5 cursor-pointer flex items-center gap-3">
                  <Coins className="w-4 h-4 text-amber-500" /> Coin Vault
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem onClick={handleLogout} className="p-3 hover:bg-white/5 cursor-pointer flex items-center gap-3 text-red-400">
                  <LogOut className="w-4 h-4" /> Sign Out System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-28 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* DAILY WORKFLOW TILES (L-COL) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Mission Critical Bento */}
            <AnimatePresence mode="wait">
              {(showAttendanceCheck || showMoodCheck) && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-gradient-to-br from-blue-600/10 via-transparent to-transparent border border-blue-500/20 rounded-3xl p-6 relative overflow-hidden"
                >
                  <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
                    <div className="shrink-0 text-center md:text-left">
                      <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-3 mx-auto md:mx-0 border border-blue-500/30">
                        <TrendingUp className="w-8 h-8 text-blue-400" />
                      </div>
                      <h2 className="text-xl font-black italic tracking-tighter uppercase">Daily <span className="text-blue-500">Protocol</span></h2>
                      <p className="text-xs text-white/40 font-medium">Verify attendance & sync daily mood</p>
                    </div>
                    
                    <div className="flex-1 w-full">
                      {showAttendanceCheck ? (
                        <AttendanceChecker 
                          userId={profile?.user_id || ''} 
                          onAttendanceMarked={() => checkDailyRequirements()} 
                        />
                      ) : (
                        <MoodQuoteChecker 
                          userId={profile?.user_id || ''} 
                          onMoodSubmitted={() => checkDailyRequirements()} 
                        />
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Client Repository Bento */}
            <div className="bg-zinc-900/50 rounded-3xl border border-white/5 p-8 backdrop-blur-sm min-h-[600px] flex flex-col overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-2">
                    <Briefcase className="w-6 h-6 text-blue-500" /> 
                    Client <span className="text-white/40">Vault</span>
                  </h2>
                  <p className="text-xs text-white/40 font-medium mt-1 uppercase tracking-[0.15em]">Proprietary Sales Records</p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <Input 
                      placeholder="Search vault..." 
                      className="pl-10 bg-zinc-950 border-white/5 h-11 rounded-xl focus:border-blue-500/50"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-white/5 bg-zinc-950 hover:bg-white/5">
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 pt-2">
                {salesLoading ? (
                  Array(6).fill(0).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="h-40 w-full rounded-2xl bg-white/5" />
                      <Skeleton className="h-4 w-3/4 rounded bg-white/5" />
                    </div>
                  ))
                ) : filteredClients?.length === 0 ? (
                  <div className="col-span-full py-20 text-center opacity-20 border-2 border-dashed border-white/5 rounded-3xl">
                    <Briefcase className="w-20 h-20 mx-auto mb-4" />
                    <p className="text-sm font-black uppercase tracking-widest">No Client Folders Synchronized</p>
                  </div>
                ) : (
                  filteredClients?.map((client) => (
                    <motion.div 
                      key={client.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <ClientFolderCard client={client as any} onClick={() => setSelectedClient(client)} />
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* SIDEBAR BENTO TOOLS (R-COL) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Quick Add Bento */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/sales/add-client")}
              className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-8 cursor-pointer shadow-2xl shadow-blue-500/20 group relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/30 group-hover:rotate-12 transition-transform">
                  <Plus className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white leading-none">Register <br />New client</h3>
                <p className="text-white/60 text-xs font-bold mt-3 uppercase tracking-widest flex items-center gap-2">
                  Launch multi-step entry <ChevronRight className="w-3 h-3 pt-0.5" />
                </p>
              </div>
              <Plus className="absolute -right-8 -bottom-8 w-40 h-40 text-white/10 rotate-12 group-hover:rotate-45 transition-transform" />
            </motion.div>

            {/* Onboarding Link Creator Bento */}
            <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6 relative overflow-hidden">
                <ClientOnboardingCreator userId={profile?.user_id || ''} />
            </div>

            {/* Statistics Insight Bento */}
            <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8 relative overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Market Insight</h3>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <p className="text-xs font-bold text-white/40 uppercase">Total Leads</p>
                    <p className="text-2xl font-black italic text-white">{stats?.totalLeads || 0}</p>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: '75%' }} className="h-full bg-blue-500" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <p className="text-xs font-bold text-white/40 uppercase">Active Projects</p>
                    <p className="text-2xl font-black italic text-emerald-400">{stats?.activeProjects || 0}</p>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: '45%' }} className="h-full bg-emerald-500" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <p className="text-xs font-bold text-white/40 uppercase">Conversion Rate</p>
                    <p className="text-2xl font-black italic text-amber-400">12.5%</p>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: '12.5%' }} className="h-full bg-amber-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Time Tracking Bento */}
            <div className="bg-zinc-950 border border-white/5 rounded-3xl p-8 flex items-center justify-between group">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 text-white/40 group-hover:text-amber-500 transition-colors">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Office Time</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/20" />
            </div>

          </div>
        </div>
      </main>
      
      {/* Client Details Dialog */}
      <Dialog open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
        <DialogContent className="max-w-2xl bg-zinc-950 border-white/10 overflow-hidden p-0 rounded-3xl">
          <div className="bg-gradient-to-br from-blue-500/10 via-transparent to-transparent p-8 border-b border-white/5">
            <DialogHeader>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                  <Briefcase className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black uppercase text-white italic tracking-tighter">
                    {selectedClient?.company_name}
                  </DialogTitle>
                  <Badge className="bg-amber-500/20 text-amber-500 border border-amber-500/30 text-[10px] uppercase font-bold px-2 py-0">
                    Vault Synchronized
                  </Badge>
                </div>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-white/60">
                  <User className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-bold uppercase tracking-widest text-[10px]">POC: {selectedClient?.contact_person}</span>
                </div>
                <div className="flex items-center gap-3 text-white/60">
                  <Mail className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">{selectedClient?.email}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-white/60">
                  <Phone className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">{selectedClient?.phone || "No Phone Data"}</span>
                </div>
                <div className="flex items-center gap-3 text-white/60">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span className="text-sm truncate">{selectedClient?.address || "No Address Data"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4 flex items-center gap-2">
              <LayoutGrid className="w-3 h-3" />
              Active Projects & Assets
            </h3>
            
            <ScrollArea className="h-[250px] pr-4">
              {loadingProjects ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              ) : clientProjects.length === 0 ? (
                <div className="py-12 text-center opacity-20 border-2 border-dashed border-white/5 rounded-2xl">
                  <Plus className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No Active Projects</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {clientProjects.map((project) => (
                    <div key={project.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all">
                      <div>
                        <p className="text-sm font-bold text-white">{project.title}</p>
                        <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mt-0.5">{project.project_type}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs font-black text-emerald-400 capitalize">{project.status}</p>
                          <div className="w-20 h-1 bg-white/10 rounded-full mt-1">
                             <div className="h-full bg-blue-500 rounded-full" style={{ width: `${project.progress || 0}%` }} />
                          </div>
                        </div>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-white/20 group-hover:text-white" onClick={() => navigate("/project-monitor")}>
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="mt-8 pt-8 border-t border-white/5 flex gap-3">
               <Button variant="outline" className="flex-1 rounded-xl border-white/10 h-12 font-bold uppercase tracking-widest text-[10px] hover:bg-white/5">
                 Archive Folder
               </Button>
               <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 font-black uppercase tracking-tighter italic shadow-xl shadow-blue-500/20">
                 Synchronize Data
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <CoinPopup 
        isOpen={showCoinPopup} 
        onOpenChange={setShowCoinPopup} 
        userId={profile?.user_id || ''} 
        userProfile={profile}
      />
    </div>
  );
};

export default SalesDashboard;
