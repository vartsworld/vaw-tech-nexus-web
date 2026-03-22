import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Network, CheckCircle2, Loader2, Gift, ArrowRight, IndianRupee } from "lucide-react";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";

const REWARD_TABLE = [
  { range: "₹8,500 – ₹10,000", payout: "₹500" },
  { range: "₹10,000 – ₹25,000", payout: "₹1,000" },
  { range: "₹25,000 – ₹50,000", payout: "₹2,000" },
  { range: "₹50,000 – ₹1,00,000", payout: "₹5,000" },
  { range: "Above ₹1,00,000", payout: "5% Commission", highlight: true },
];

const generateReferralCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return "REF-" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const ReferralFormPage = () => {
  const { code } = useParams<{ code: string }>();
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", project_type: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referrerName, setReferrerName] = useState<string | null>(null);

  // Optionally look up who referred (stored code → client name via localStorage stored with profile — no DB lookup needed, just show the code)
  const referralCode = code || "";

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Please fill in your name and phone number.");
      return;
    }

    setSubmitting(true);
    try {
      const newCode = generateReferralCode();
      const { error } = await supabase.from("client_referrals").insert({
        referrer_id: "via_link", // placeholder – backend/admin can look up by referral_code link
        referral_code: newCode,
        referred_name: form.name.trim(),
        referred_email: form.email.trim() || null,
        referred_phone: form.phone.trim(),
        referred_company: form.company.trim() || null,
        project_type: form.project_type.trim() || null,
        notes: (form.notes.trim() || null),
        submitted_via: "link",
        status: "pending",
        // Store the original referrer code in notes for admin to match
      } as any);

      // Also store referrer code in a second upsert-style insert for mapping
      if (!error) {
        await supabase.from("client_referrals").update({
          notes: `Referred via link code: ${referralCode}. ${form.notes || ""}`.trim()
        } as any).eq("referral_code", newCode);
      }

      if (error) throw error;

      toast.success("Your details submitted! The VAW Technologies team will reach out soon.");
      setSubmitted(true);
    } catch (e: any) {
      toast.error(e.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-[#0a0618] to-[#040b16] flex items-center justify-center p-6">
        <SEO title="Referral Submitted | VAW Technologies" description="Your referral has been submitted." />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-5 max-w-sm"
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black text-white">You're All Set! 🎉</h2>
          <p className="text-gray-400 text-sm">
            Thank you for reaching out. The VAW Technologies team will contact you within 24 hours to discuss your project requirements.
          </p>
          <Badge className="bg-tech-gold/10 border-tech-gold/20 text-tech-gold text-xs font-bold px-3 py-1.5">
            Referral Code: {referralCode}
          </Badge>
          <p className="text-xs text-gray-600">
            Reference code for your records. Keep this in case you need to follow up.
          </p>
          <Link to="/">
            <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 mt-2">
              Back to VAW Technologies
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="You're Referred to VAW Technologies | Fill Your Details"
        description="A friend referred you to VAW Technologies. Fill in your details so we can connect with you about your website or software project."
      />
      <div className="min-h-screen bg-gradient-to-br from-black via-[#0a0618] to-[#040b16] text-white">
        {/* Nav */}
        <nav className="p-5 flex justify-between items-center border-b border-white/5 backdrop-blur-sm">
          <Link to="/" className="text-xl font-black tracking-tight">
            VAW <span className="text-tech-gold">Technologies</span>
          </Link>
          <Badge className="bg-white/5 border-white/10 text-gray-400 text-[10px] font-bold">
            Referral Code: {referralCode || "—"}
          </Badge>
        </nav>

        <main className="max-w-3xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-8">
          {/* Left info panel */}
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tech-gold/10 border border-tech-gold/20 text-tech-gold text-xs font-bold uppercase tracking-widest mb-4">
                <Network className="w-3.5 h-3.5" />
                Referred by a friend
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
                Get Your Project<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">
                  Started Today
                </span>
              </h1>
              <p className="text-gray-400 text-sm">
                Fill in your details and our team will reach out within 24 hours to discuss your project.
              </p>
            </div>

            {/* Reward preview */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-tech-gold" />
                Your referrer earns a reward
              </p>
              <div className="space-y-1.5">
                {REWARD_TABLE.map((row, i) => (
                  <div key={i} className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs ${row.highlight ? "bg-sky-500/10 border border-sky-500/20" : "bg-white/3"}`}>
                    <span className="text-gray-300">{row.range}</span>
                    <div className="flex items-center gap-1.5">
                      <ArrowRight className="w-3 h-3 text-gray-600" />
                      <span className={`font-bold ${row.highlight ? "text-sky-400" : "text-tech-gold"}`}>{row.payout}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-600">Reward to referrer after successful payment.</p>
            </div>
          </div>

          {/* Right form */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-lg">Your Details</h2>

            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Full Name *</Label>
                <Input
                  placeholder="John Doe"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-tech-gold/40"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Phone Number *</Label>
                <Input
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-tech-gold/40"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Email</Label>
                <Input
                  type="email"
                  placeholder="john@company.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-tech-gold/40"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Company / Brand Name</Label>
                <Input
                  placeholder="Acme Corp"
                  value={form.company}
                  onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-tech-gold/40"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">What do you need?</Label>
                <Input
                  placeholder="e.g. E-commerce website, Portfolio, Mobile app..."
                  value={form.project_type}
                  onChange={e => setForm(p => ({ ...p, project_type: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-tech-gold/40"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Anything else we should know?</Label>
                <Textarea
                  placeholder="Budget range, timeline, special requirements..."
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-tech-gold/40 resize-none"
                />
              </div>
            </div>

            <Button
              className="w-full h-12 text-base font-bold bg-gradient-to-r from-tech-gold to-amber-500 hover:from-amber-500 hover:to-tech-gold text-black shadow-lg shadow-tech-gold/20"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Submitting...</>
              ) : (
                <><CheckCircle2 className="w-5 h-5 mr-2" /> Submit My Details</>
              )}
            </Button>

            <p className="text-[10px] text-gray-600 text-center">
              By submitting, you agree to be contacted by VAW Technologies about your project.
            </p>
          </div>
        </main>
      </div>
    </>
  );
};

export default ReferralFormPage;
