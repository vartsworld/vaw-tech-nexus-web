import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Network,
  Plus,
  Copy,
  CheckCircle2,
  Clock,
  Trophy,
  IndianRupee,
  Zap,
  Wallet,
  Share2,
  Users,
  TrendingUp,
  ChevronRight,
  ExternalLink,
  Loader2,
  Gift,
  ArrowRight,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Reward calculator ──────────────────────────────────────────────────────
const getRewardForValue = (value: number): number => {
  if (value >= 100000) return Math.round(value * 0.05);
  if (value >= 50000) return 5000;
  if (value >= 25000) return 2000;
  if (value >= 10000) return 1000;
  if (value >= 8500) return 500;
  return 0;
};

const REWARD_TABLE = [
  { range: "₹8,500 – ₹10,000", payout: "₹500" },
  { range: "₹10,000 – ₹25,000", payout: "₹1,000" },
  { range: "₹25,000 – ₹50,000", payout: "₹2,000" },
  { range: "₹50,000 – ₹1,00,000", payout: "₹5,000" },
  { range: "Above ₹1,00,000", payout: "5% Commission", highlight: true },
];

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  approved: "bg-sky-500/10 border-sky-500/30 text-sky-400",
  rewarded: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  rejected: "bg-red-500/10 border-red-500/30 text-red-400",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending Review",
  approved: "Approved",
  rewarded: "Reward Paid",
  rejected: "Not Eligible",
};

// ─── Generate referral code ─────────────────────────────────────────────────
const generateReferralCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return "REF-" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

// ─── Component ──────────────────────────────────────────────────────────────
interface ClientReferralHubProps {
  profile: any;
}

interface Referral {
  id: string;
  referral_code: string;
  referred_name: string | null;
  referred_email: string | null;
  referred_phone: string | null;
  referred_company: string | null;
  project_type: string | null;
  project_value: number | null;
  status: string;
  reward_amount: number | null;
  submitted_via: string;
  created_at: string;
}

const ClientReferralHub = ({ profile }: ClientReferralHubProps) => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Referral link code for this client (one code can be reused to share link)
  const [myReferralCode] = useState<string>(() => {
    const stored = localStorage.getItem(`referral_code_${profile?.id}`);
    if (stored) return stored;
    const code = generateReferralCode();
    localStorage.setItem(`referral_code_${profile?.id}`, code);
    return code;
  });

  const referralLinkUrl = `${window.location.origin}/refer/${myReferralCode}`;

  // Form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    project_type: "",
    project_value: "",
    notes: "",
  });

  const totalEarned = referrals
    .filter(r => r.status === "rewarded")
    .reduce((sum, r) => sum + (r.reward_amount || 0), 0);

  const pendingCount = referrals.filter(r => r.status === "pending").length;

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchReferrals = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("client_referrals")
        .select("*")
        .eq("referrer_id", profile.id)
        .order("created_at", { ascending: false });
      if (!error) setReferrals((data as Referral[]) || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchReferrals();

    // Realtime subscription
    const channel = supabase
      .channel(`referrals_${profile?.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "client_referrals",
        filter: `referrer_id=eq.${profile?.id}`,
      }, () => fetchReferrals())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchReferrals, profile?.id]);

  // ── Submit manual referral ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Name and phone are required.");
      return;
    }
    setSaving(true);
    try {
      const referralCode = generateReferralCode();
      const projVal = form.project_value ? parseFloat(form.project_value) : null;
      const reward = projVal ? getRewardForValue(projVal) : null;

      const { error } = await supabase.from("client_referrals").insert({
        referrer_id: profile.id,
        referral_code: referralCode,
        referred_name: form.name.trim(),
        referred_email: form.email.trim() || null,
        referred_phone: form.phone.trim(),
        referred_company: form.company.trim() || null,
        project_type: form.project_type.trim() || null,
        project_value: projVal,
        reward_amount: reward,
        submitted_via: "manual",
        notes: form.notes.trim() || null,
        status: "pending",
      } as any);

      if (error) throw error;

      toast.success("Referral submitted! We'll review it shortly.");
      setForm({ name: "", email: "", phone: "", company: "", project_type: "", project_value: "", notes: "" });
      setAddOpen(false);
      fetchReferrals();
    } catch (e: any) {
      toast.error(e.message || "Failed to submit referral.");
    } finally {
      setSaving(false);
    }
  };

  // ── Copy helper ────────────────────────────────────────────────────────────
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(key);
    toast.success("Copied!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a0618] via-[#07101e] to-black border border-white/10 p-6 md:p-8"
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-600/10 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tech-gold/10 border border-tech-gold/20 text-tech-gold text-xs font-bold uppercase tracking-widest mb-3">
              <Network className="w-3.5 h-3.5" />
              Refer & Earn Program
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Turn Your Network <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fbbf24] to-[#f59e0b]">
                Into Earnings
              </span>
            </h1>
            <p className="text-sm text-gray-400 mt-2 max-w-sm">
              Refer clients for website & software projects and get rewarded after each successful deal.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 shrink-0">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-tech-gold">{referrals.length}</p>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-0.5">Total</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-amber-400">{pendingCount}</p>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-0.5">Pending</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-emerald-400">{formatCurrency(totalEarned)}</p>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-0.5">Earned</p>
            </div>
          </div>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-card border border-border h-11">
          <TabsTrigger value="overview" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Network className="w-4 h-4 mr-1" /> Overview
          </TabsTrigger>
          <TabsTrigger value="my-referrals" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Users className="w-4 h-4 mr-1" /> My Referrals
            {pendingCount > 0 && <Badge className="ml-1.5 h-4 px-1 text-[10px] bg-amber-500 text-black">{pendingCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Gift className="w-4 h-4 mr-1" /> Rewards
          </TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Share referral link */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <h3 className="font-bold flex items-center gap-2 text-foreground">
                <Share2 className="w-4 h-4 text-primary" />
                Your Personal Referral Link
              </h3>
              <p className="text-xs text-muted-foreground">
                Share this link. When someone fills the form, their referral is
                automatically linked to you.
              </p>

              <div className="bg-muted/50 border border-border rounded-xl p-3 flex items-center justify-between gap-2 text-xs font-mono break-all">
                <span className="text-primary flex-1 truncate">{referralLinkUrl}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => handleCopy(referralLinkUrl, "link")}
                >
                  {copiedCode === "link" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleCopy(referralLinkUrl, "link")}
                  className="flex-1 h-9 text-xs"
                  variant="outline"
                >
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Copy Link
                </Button>
                <Button
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Hey! I'm referring you to VAW Technologies. Fill this quick form and get connected: ${referralLinkUrl}`)}`, "_blank")}
                  className="flex-1 h-9 text-xs bg-[#25D366] hover:bg-[#1DA851] text-white border-0"
                >
                  Share via WhatsApp
                  <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
                <span>Your code:</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono font-bold text-primary">{myReferralCode}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleCopy(myReferralCode, "code")}>
                    {copiedCode === "code" ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Manual entry CTA */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4 flex flex-col">
              <h3 className="font-bold flex items-center gap-2 text-foreground">
                <Plus className="w-4 h-4 text-primary" />
                Add a Referral Manually
              </h3>
              <p className="text-xs text-muted-foreground flex-1">
                Already spoke to someone? Enter their details directly and we'll take it from there.
              </p>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-1">
                {["Just fill their name & contact", "We reach out and discuss the project", "You earn when payment is received"].map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-foreground">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-black flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    {step}
                  </div>
                ))}
              </div>

              <Button
                className="h-10 w-full font-bold"
                onClick={() => setAddOpen(true)}
              >
                <Users className="w-4 h-4 mr-2" />
                Add New Referral
                <ChevronRight className="w-4 h-4 ml-auto" />
              </Button>
            </div>
          </div>

          {/* Benefits bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: <Zap className="w-4 h-4" />, label: "Instant opportunity", color: "text-amber-400" },
              { icon: <Wallet className="w-4 h-4" />, label: "No investment needed", color: "text-sky-400" },
              { icon: <IndianRupee className="w-4 h-4" />, label: "Payout in 3–7 days", color: "text-emerald-400" },
              { icon: <TrendingUp className="w-4 h-4" />, label: "Unlimited referrals", color: "text-purple-400" },
            ].map((b, i) => (
              <div key={i} className={cn("bg-card border border-border rounded-xl p-3 flex items-center gap-2 text-xs font-semibold", b.color)}>
                {b.icon}
                <span className="text-foreground">{b.label}</span>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ── My Referrals Tab ─────────────────────────────────────────────── */}
        <TabsContent value="my-referrals" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground">
              {referrals.length} referral{referrals.length !== 1 ? "s" : ""} submitted
            </p>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add Referral
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : referrals.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Network className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="font-bold text-muted-foreground">No referrals yet</p>
              <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto">
                Add your first referral manually or share your link.
              </p>
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="w-4 h-4 mr-1" /> Add First Referral
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-foreground">{r.referred_name || "Unknown"}</p>
                      {r.referred_company && (
                        <span className="text-xs text-muted-foreground">· {r.referred_company}</span>
                      )}
                      <Badge className={cn("text-[10px] border h-5", STATUS_COLOR[r.status] || STATUS_COLOR.pending)}>
                        {STATUS_LABEL[r.status] || r.status}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] h-5 capitalize">
                        via {r.submitted_via}
                      </Badge>
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                      {r.referred_phone && <span>📞 {r.referred_phone}</span>}
                      {r.referred_email && <span>✉ {r.referred_email}</span>}
                      {r.project_type && <span>🏷 {r.project_type}</span>}
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-1 shrink-0">
                    {r.reward_amount ? (
                      <span className={cn("text-sm font-black", r.status === "rewarded" ? "text-emerald-400" : "text-amber-400")}>
                        {formatCurrency(r.reward_amount)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Reward TBD</span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Rewards Tab ───────────────────────────────────────────────────── */}
        <TabsContent value="rewards" className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-black text-lg text-foreground flex items-center gap-2">
              <Trophy className="w-5 h-5 text-tech-gold" />
              Reward Structure
            </h3>
            <p className="text-sm text-muted-foreground">
              Rewards are calculated based on the project value and paid within 3–7 days after the referred client completes payment.
            </p>
            <div className="space-y-2">
              {REWARD_TABLE.map((row, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-xl border text-sm",
                    row.highlight
                      ? "bg-gradient-to-r from-sky-500/10 to-purple-500/10 border-sky-400/20 shadow-[0_0_15px_rgba(56,189,248,0.08)]"
                      : "bg-card border-border"
                  )}
                >
                  <span className="text-foreground font-medium">{row.range}</span>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 hidden sm:block" />
                    <span className={cn("font-black", row.highlight ? "text-sky-400" : "text-tech-gold")}>
                      {row.payout}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 text-xs text-muted-foreground space-y-1">
              <p className="font-bold text-destructive/80 uppercase tracking-wider text-[10px]">⚠ Important Notes</p>
              <p>• Applicable only for website & software projects.</p>
              <p>• Not valid for digital marketing & creative services.</p>
              <p>• Payout happens after referred client completes payment.</p>
            </div>
          </div>

          {/* Earnings summary */}
          {totalEarned > 0 && (
            <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <IndianRupee className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-400/80">Total Rewards Earned</p>
                <p className="text-3xl font-black text-emerald-400">{formatCurrency(totalEarned)}</p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Add Referral Dialog ─────────────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Add New Referral
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Full Name *</Label>
                <Input placeholder="John Doe" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Phone *</Label>
                <Input placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input type="email" placeholder="john@company.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Company Name</Label>
                <Input placeholder="Acme Corp" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Project Type</Label>
                <Input placeholder="e.g. E-commerce website" value={form.project_type} onChange={e => setForm(p => ({ ...p, project_type: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Estimated Value (₹)</Label>
                <Input type="number" placeholder="e.g. 25000" value={form.project_value} onChange={e => setForm(p => ({ ...p, project_value: e.target.value }))} />
              </div>
            </div>

            {/* Reward preview */}
            {form.project_value && Number(form.project_value) >= 8500 && (
              <div className="bg-tech-gold/10 border border-tech-gold/20 rounded-lg px-3 py-2 text-xs flex items-center gap-2">
                <Gift className="w-3.5 h-3.5 text-tech-gold" />
                <span className="text-tech-gold">Estimated reward: <strong>{formatCurrency(getRewardForValue(Number(form.project_value)))}</strong></span>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs">Additional Notes</Label>
              <Textarea placeholder="Any context about their project..." rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Submit Referral
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientReferralHub;
