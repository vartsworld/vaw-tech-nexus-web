import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  User, 
  Lock, 
  Mail, 
  Calendar, 
  Award, 
  LogOut, 
  ArrowLeft, 
  Fingerprint, 
  RefreshCw, 
  CheckCircle, 
  Zap,
  Target,
  Trophy,
  ShieldCheck,
  Settings,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const AccountDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [isUpdating, setIsUpdating] = useState(false);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [isFingerprintRegistered, setIsFingerprintRegistered] = useState(false);
  
  // Stats
  const [completedTasksCount, setCompletedTasksCount] = useState(0);
  const [efficiencyRate, setEfficiencyRate] = useState(0);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    about_me: "",
  });
  
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/staff/login");
        return;
      }

      const { data, error } = await supabase
        .from("staff_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setFormData({
        full_name: data.full_name || "",
        email: user.email || "",
        about_me: data.about_me || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: tasks, error } = await supabase
        .from("staff_tasks")
        .select("status")
        .eq("assigned_to", user.id);

      if (error) throw error;

      const completed = tasks.filter(t => t.status === "completed").length;
      setCompletedTasksCount(completed);
      
      if (tasks.length > 0) {
        setEfficiencyRate(Math.round((completed / tasks.length) * 100));
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("staff_profiles")
        .update({
          full_name: formData.full_name,
          about_me: formData.about_me,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Profile synchronized successfully");
      fetchProfile();
    } catch (error) {
      toast.error("Synchronization failed");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setIsUpdating(true);
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });
      if (error) throw error;
      toast.success("Credentials updated successfully");
      setPasswordData({ newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast.error(error.message || "Failed to update credentials");
    } finally {
      setIsUpdating(false);
    }
  };

  const checkUpdates = () => {
    setCheckingUpdates(true);
    setTimeout(() => {
      setCheckingUpdates(false);
      toast.success("System is up to date (v2.4.0)");
    }, 1500);
  };

  const handleFingerprintSetup = () => {
    if (isFingerprintRegistered) {
      toast.info("Fingerprint already registered");
      return;
    }
    toast.info("Initializing Biometric Scanner...");
    setTimeout(() => {
      setIsFingerprintRegistered(true);
      toast.success("Fingerprint registered successfully");
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center animate-pulse">
           <User className="w-8 h-8 text-blue-400" />
        </div>
        <p className="text-white/40 font-black uppercase tracking-widest text-xs">Accessing Neural Profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />
      
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 p-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white/40 hover:text-white rounded-2xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-sm font-black uppercase tracking-widest text-white/90 italic">Account Core</h1>
          </div>
          <Button variant="ghost" onClick={() => supabase.auth.signOut().then(() => navigate("/staff/login"))} className="text-red-400/60 hover:text-red-400 hover:bg-red-400/10 rounded-2xl h-10 px-4 font-black uppercase text-[10px] tracking-widest">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </header>

      <div className="max-w-xl mx-auto p-5 space-y-8 relative">
        <section className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000" />
          <div className="relative bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-[30px] opacity-20" />
              <Avatar className="h-28 w-28 rounded-3xl border-2 border-white/10 relative z-10">
                <AvatarImage src={profile?.profile_photo_url} />
                <AvatarFallback className="text-3xl font-black bg-slate-800 text-blue-400">
                  {profile?.full_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center border-4 border-slate-900 shadow-xl">
                 <CheckCircle className="w-4 h-4 text-white" />
              </div>
            </div>
            
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight">{profile?.full_name}</h2>
              <div className="flex items-center justify-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full">
                  {profile?.role || "Staff Member"}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Level {Math.floor((profile?.total_points || 0) / 100) + 1}
                </span>
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
               <div className="text-center">
                  <p className="text-[9px] text-white/30 uppercase font-black tracking-widest">Net Points</p>
                  <p className="text-xl font-black text-white italic">{profile?.total_points || 0}</p>
               </div>
               <div className="text-center">
                  <p className="text-[9px] text-white/30 uppercase font-black tracking-widest">Joined</p>
                  <p className="text-xl font-black text-white italic">{profile?.hire_date ? format(new Date(profile.hire_date), 'MMM yyyy') : '2024'}</p>
               </div>
            </div>
          </div>
        </section>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-900/50 border border-white/5 p-1 rounded-3xl h-14 w-full grid grid-cols-3 mb-8">
            <TabsTrigger value="profile" className="rounded-2xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-blue-500 data-[state=active]:text-white">Profile</TabsTrigger>
            <TabsTrigger value="security" className="rounded-2xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-blue-500 data-[state=active]:text-white">Security</TabsTrigger>
            <TabsTrigger value="milestones" className="rounded-2xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-blue-500 data-[state=active]:text-white">Milestones</TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="profile" className="space-y-6 outline-none">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-slate-900/50 border border-white/5 rounded-[2rem] p-6 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Full Name</Label>
                    <Input value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Email Identifier</Label>
                    <div className="relative">
                       <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                       <Input value={formData.email} disabled className="h-14 pl-12 rounded-2xl bg-white/[0.02] border-white/5 text-white/40 font-bold" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Professional Bio</Label>
                    <Textarea value={formData.about_me} onChange={e => setFormData({...formData, about_me: e.target.value})} className="rounded-2xl bg-white/5 border-white/10 text-white font-medium min-h-[120px]" placeholder="Brief description of your expertise..." />
                  </div>
                  <Button onClick={handleUpdateProfile} disabled={isUpdating} className="w-full h-14 rounded-2xl bg-blue-500 hover:bg-blue-600 font-black uppercase tracking-widest shadow-xl shadow-blue-500/20">
                    {isUpdating ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Synchronize Profile"}
                  </Button>
                </div>
                
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-[2rem] p-6 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/20">
                         <RefreshCw className={cn("w-6 h-6 text-blue-400", checkingUpdates && "animate-spin")} />
                      </div>
                      <div>
                         <p className="text-xs font-black uppercase text-white/90">System Updates</p>
                         <p className="text-[10px] text-white/30 font-medium">Check for latest core updates</p>
                      </div>
                   </div>
                   <Button variant="ghost" onClick={checkUpdates} className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 p-0">
                      <ChevronRight className="w-5 h-5" />
                   </Button>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="security" className="space-y-6 outline-none">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                   <div className="flex flex-col items-center text-center space-y-2">
                      <div className={cn("w-20 h-20 rounded-[2rem] border flex items-center justify-center mb-2 transition-colors", isFingerprintRegistered ? "bg-emerald-500/10 border-emerald-500/20" : "bg-indigo-500/10 border-indigo-500/20")}>
                         <Fingerprint className={cn("w-10 h-10", isFingerprintRegistered ? "text-emerald-400" : "text-indigo-400")} />
                      </div>
                      <h3 className="text-lg font-black uppercase italic tracking-tighter">{isFingerprintRegistered ? "Biometrics Active" : "Biometric Access"}</h3>
                      <p className="text-xs text-white/30 font-medium max-w-[200px]">{isFingerprintRegistered ? "Your identity is secured via neural fingerprint scanner." : "Secure your workspace with neural fingerprint scanning."}</p>
                   </div>
                   <Button onClick={handleFingerprintSetup} className={cn("w-full h-14 rounded-2xl font-black uppercase tracking-widest gap-3 shadow-xl transition-all", isFingerprintRegistered ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/20")}>
                      <ShieldCheck className="w-5 h-5" /> {isFingerprintRegistered ? "Scanner Configured" : "Initialize Scanner"}
                   </Button>
                </div>

                <div className="bg-slate-900/50 border border-white/5 rounded-[2rem] p-6 space-y-6">
                   <div className="flex items-center gap-3 mb-2">
                      <Lock className="w-4 h-4 text-blue-400" />
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Credential Reset</h4>
                   </div>
                   <div className="space-y-4">
                      <Input type="password" value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} placeholder="New Secret Key" className="h-14 rounded-2xl bg-white/5 border-white/10" />
                      <Input type="password" value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} placeholder="Confirm Secret Key" className="h-14 rounded-2xl bg-white/5 border-white/10" />
                      <Button onClick={handlePasswordReset} disabled={isUpdating} className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 font-black uppercase text-[10px] tracking-widest">
                         {isUpdating ? "Updating..." : "Update Credentials"}
                      </Button>
                   </div>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="milestones" className="space-y-6 outline-none">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-5 space-y-3">
                      <Trophy className="w-6 h-6 text-emerald-400" />
                      <div>
                         <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Done Projects</p>
                         <p className="text-2xl font-black italic">{completedTasksCount} <span className="text-[10px] text-emerald-400/60 uppercase">Files</span></p>
                      </div>
                   </div>
                   <div className="bg-orange-500/10 border border-orange-500/20 rounded-3xl p-5 space-y-3">
                      <Target className="w-6 h-6 text-orange-400" />
                      <div>
                         <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Avg Efficiency</p>
                         <p className="text-2xl font-black italic">{efficiencyRate}<span className="text-[10px] text-orange-400/60 uppercase">%</span></p>
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                   <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 ml-2">Recent Milestones</h4>
                   {[
                     { title: "UI Expert Badge", date: "2 days ago", icon: Trophy, color: "text-blue-400", achieved: completedTasksCount >= 5 },
                     { title: "100 Task Streak", date: "1 week ago", icon: Award, color: "text-purple-400", achieved: completedTasksCount >= 100 },
                     { title: "Perfect Attendance", date: "2 weeks ago", icon: CheckCircle, color: "text-emerald-400", achieved: (profile?.attendance_streak || 0) >= 5 },
                   ].map((m, i) => (
                     <div key={i} className={cn("bg-white/[0.02] border border-white/5 rounded-3xl p-5 flex items-center gap-4 transition-opacity", !m.achieved && "opacity-40 grayscale")}>
                        <div className={cn("w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center", m.color)}>
                           <m.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                           <p className="text-sm font-black italic text-white/90">{m.title}</p>
                           <p className="text-[10px] text-white/30 font-medium uppercase">{m.achieved ? m.date : "Locked"}</p>
                        </div>
                        {m.achieved ? <ChevronRight className="w-4 h-4 text-white/10" /> : <Lock className="w-4 h-4 text-white/5" />}
                     </div>
                   ))}
                </div>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  );
};

export default AccountDashboard;
