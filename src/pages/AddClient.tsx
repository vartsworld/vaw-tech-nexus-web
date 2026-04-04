import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Loader2, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Briefcase,
  FileText,
  Save,
  MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useStaffData } from "@/hooks/useStaffData";

const STORAGE_KEY = "sales_draft_v1";

const AddClient = () => {
  const navigate = useNavigate();
  const { profile } = useStaffData();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const [form, setForm] = useState({
    company_name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    project_type: "website",
    budget: "",
    description: "",
    website_url: "",
    social_links: "",
    notes: ""
  });

  // Auto-save logic
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setForm(JSON.parse(saved));
        toast.info("Draft restored from previous session");
      } catch (e) {
        console.error("Failed to restore draft", e);
      }
    }

    const interval = setInterval(() => {
      saveToLocal();
    }, 20000); // 20 seconds

    return () => clearInterval(interval);
  }, []);

  const saveToLocal = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    setLastSaved(new Date().toLocaleTimeString());
    console.log("Draft auto-saved at", new Date().toLocaleTimeString());
  };

  const handleNext = () => setStep(prev => Math.min(prev + 1, 4));
  const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    if (!profile?.user_id) return;
    
    setLoading(true);
    try {
      // 1. Create Client
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({
          company_name: form.company_name,
          contact_person: form.contact_person,
          email: form.email,
          phone: form.phone,
          address: form.address,
          notes: form.notes,
          status: "active",
          created_by: profile.user_id,
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // 2. Create Project
      const { error: projectError } = await supabase
        .from("client_projects")
        .insert({
          client_id: client.id,
          title: `${form.company_name} — ${form.project_type}`,
          description: form.description,
          project_type: form.project_type,
          status: "planning",
          total_amount: parseFloat(form.budget) || 0,
        });

      if (projectError) throw projectError;

      // 3. Reward Points (10 Coins)
      const points = 10;
      await supabase.from('user_coin_transactions').insert({
        user_id: profile.user_id,
        coins: points,
        transaction_type: 'earning',
        reason: `Added new client: ${form.company_name}`,
        source_type: 'client_onboarding'
      } as any);

      await supabase.from('user_points_log').insert({
        user_id: profile.user_id,
        points: points,
        reason: `Added new client: ${form.company_name}`,
        category: 'sales'
      });

      toast.success(`Client added successfully! Earned ${points} coins.`);
      localStorage.removeItem(STORAGE_KEY);
      navigate("/sales/dashboard");
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(error.message || "Failed to submit client data");
    } finally {
      setLoading(false);
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-blue-500/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 h-20">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate("/sales/dashboard")}
                className="hover:bg-white/5 border border-white/5 rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-black tracking-tighter uppercase italic">Client <span className="text-blue-500">Registration</span></h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest leading-none mb-1">Session Protocol</p>
              <p className="text-xs font-medium text-white/60">Auto-saved: {lastSaved || "Standby"}</p>
            </div>
            <div className="h-8 w-[1px] bg-white/5 mx-2 hidden md:block" />
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map(s => (
                <div key={s} className={`h-1.5 w-8 rounded-full transition-all ${s <= step ? "bg-blue-500" : "bg-white/10"}`} />
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-32 pb-12">
        <div className="max-w-3xl mx-auto">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <Card className="bg-zinc-900 border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  {step === 1 && <Building2 className="w-40 h-40" />}
                  {step === 2 && <Briefcase className="w-40 h-40" />}
                  {step === 3 && <Globe className="w-40 h-40" />}
                  {step === 4 && <Check className="w-40 h-40" />}
                </div>

                <div className="relative z-10">
                  <div className="mb-10">
                    <p className="text-blue-500 font-black tracking-widest uppercase text-xs mb-1">Step 0{step}</p>
                    <h2 className="text-3xl font-black italic tracking-tighter uppercase">
                      {step === 1 && "Client Identity"}
                      {step === 2 && "Project Anatomy"}
                      {step === 3 && "Digital Context"}
                      {step === 4 && "Review Vault Entry"}
                    </h2>
                  </div>

                  {step === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-white/40 uppercase text-[10px] font-bold tracking-widest">Business Entity Name</Label>
                        <div className="relative">
                          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                          <Input 
                            value={form.company_name}
                            onChange={e => setForm({...form, company_name: e.target.value})}
                            className="bg-zinc-950 border-white/10 h-14 pl-12 rounded-2xl focus:border-blue-500/50" 
                            placeholder="e.g. Acme Corp Industries" 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/40 uppercase text-[10px] font-bold tracking-widest">Contact Point Person</Label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                          <Input 
                            value={form.contact_person}
                            onChange={e => setForm({...form, contact_person: e.target.value})}
                            className="bg-zinc-950 border-white/10 h-14 pl-12 rounded-2xl focus:border-blue-500/50" 
                            placeholder="Full Name" 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/40 uppercase text-[10px] font-bold tracking-widest">Official Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                          <Input 
                            type="email"
                            value={form.email}
                            onChange={e => setForm({...form, email: e.target.value})}
                            className="bg-zinc-950 border-white/10 h-14 pl-12 rounded-2xl focus:border-blue-500/50" 
                            placeholder="contact@company.com" 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/40 uppercase text-[10px] font-bold tracking-widest">Phone Frequency</Label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                          <Input 
                            value={form.phone}
                            onChange={e => setForm({...form, phone: e.target.value})}
                            className="bg-zinc-950 border-white/10 h-14 pl-12 rounded-2xl focus:border-blue-500/50" 
                            placeholder="+1 (000) 000-0000" 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/40 uppercase text-[10px] font-bold tracking-widest">Physical Headquarters</Label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                          <Input 
                            value={form.address}
                            onChange={e => setForm({...form, address: e.target.value})}
                            className="bg-zinc-950 border-white/10 h-14 pl-12 rounded-2xl focus:border-blue-500/50" 
                            placeholder="City, Country" 
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-white/40 uppercase text-[10px] font-bold tracking-widest">Project Classification</Label>
                        <select 
                            value={form.project_type}
                            onChange={e => setForm({...form, project_type: e.target.value})}
                            className="w-full bg-zinc-950 border border-white/10 h-14 px-4 rounded-2xl focus:border-blue-500/50 outline-none text-white appearance-none"
                        >
                          <option value="website">Website Development</option>
                          <option value="marketing">Digital Marketing</option>
                          <option value="app">Mobile/Web App</option>
                          <option value="ai">AI Solution</option>
                          <option value="design">Graphic/Brand Design</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/40 uppercase text-[10px] font-bold tracking-widest">Estimated Valuation (Points/Cur)</Label>
                        <Input 
                            type="number"
                            value={form.budget}
                            onChange={e => setForm({...form, budget: e.target.value})}
                            className="bg-zinc-950 border-white/10 h-14 rounded-2xl focus:border-blue-500/50" 
                            placeholder="Enter amount" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/40 uppercase text-[10px] font-bold tracking-widest">Project Requirements Summary</Label>
                        <Textarea 
                            value={form.description}
                            onChange={e => setForm({...form, description: e.target.value})}
                            className="bg-zinc-950 border-white/10 min-h-[160px] rounded-2xl focus:border-blue-500/50 p-4" 
                            placeholder="Core deliverables and client expectations..." 
                        />
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-white/40 uppercase text-[10px] font-bold tracking-widest">Digital Hub (URL)</Label>
                        <div className="relative">
                          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                          <Input 
                            value={form.website_url}
                            onChange={e => setForm({...form, website_url: e.target.value})}
                            className="bg-zinc-950 border-white/10 h-14 pl-12 rounded-2xl focus:border-blue-500/50" 
                            placeholder="https://company.com" 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/40 uppercase text-[10px] font-bold tracking-widest">Social Coordinates</Label>
                        <div className="relative">
                          <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                          <Input 
                            value={form.social_links}
                            onChange={e => setForm({...form, social_links: e.target.value})}
                            className="bg-zinc-950 border-white/10 h-14 pl-12 rounded-2xl focus:border-blue-500/50" 
                            placeholder="@instagram, linkedin.com/..." 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/40 uppercase text-[10px] font-bold tracking-widest">Internal Narrative</Label>
                        <Textarea 
                            value={form.notes}
                            onChange={e => setForm({...form, notes: e.target.value})}
                            className="bg-zinc-950 border-white/10 min-h-[160px] rounded-2xl focus:border-blue-500/50 p-4" 
                            placeholder="Discussion highlights or special instructions..." 
                        />
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="space-y-4">
                      <div className="bg-zinc-950/50 border border-white/5 rounded-2xl p-6 space-y-4">
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="text-[10px] font-bold text-white/20 uppercase">Entity</span>
                          <span className="text-sm font-bold text-white tracking-tight">{form.company_name}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="text-[10px] font-bold text-white/20 uppercase">Contact</span>
                          <span className="text-sm font-bold text-white tracking-tight">{form.contact_person}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="text-[10px] font-bold text-white/20 uppercase">Classification</span>
                          <span className="text-sm font-bold text-blue-400 tracking-tight uppercase">{form.project_type}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="text-[10px] font-bold text-white/20 uppercase">Valuation</span>
                          <span className="text-sm font-bold text-amber-400 tracking-tight">${form.budget || "0"}</span>
                        </div>
                      </div>
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-400" />
                        <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">
                          Reward Protocol: +10 Vault Credits on submission
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-12 flex justify-between items-center">
                    <Button 
                      variant="ghost" 
                      onClick={handlePrev} 
                      disabled={step === 1}
                      className="rounded-xl border border-white/5 h-12 px-6 font-bold uppercase tracking-widest text-xs disabled:opacity-20"
                    >
                      Back Analysis
                    </Button>

                    <div className="flex gap-3">
                        <Button 
                            variant="outline" 
                            onClick={saveToLocal}
                            className="rounded-xl border-white/5 bg-zinc-950 h-12 w-12 hover:bg-white/5"
                        >
                            <Save className="w-4 h-4" />
                        </Button>
                        <Button 
                            onClick={step === 4 ? handleSubmit : handleNext} 
                            disabled={loading}
                            className="min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 px-8 font-black uppercase tracking-tighter italic shadow-xl shadow-blue-500/20"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : step === 4 ? (
                                "Initiate Sync"
                            ) : (
                                "Proceed"
                            )}
                            {step < 4 && <ArrowRight className="w-4 h-4 ml-2" />}
                        </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>

          <p className="text-center text-[10px] font-bold text-white/10 uppercase tracking-[0.4em] mt-12">
            Secure Entry Protocol v4.0.1 • VAW Systems Inc.
          </p>
        </div>
      </main>
    </div>
  );
};

export default AddClient;
