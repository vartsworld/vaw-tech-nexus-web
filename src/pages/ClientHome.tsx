import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Sparkles,
  Globe,
  CalendarClock,
  Smartphone,
  Palette,
  TrendingUp,
  Megaphone,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 21) return "Good Evening";
  return "Good Night";
};

const servicePackages = [
  {
    title: "Website Development",
    description: "Beautiful, responsive websites crafted with care",
    icon: Globe,
    color: "text-blue-400",
    bg: "bg-blue-500/8",
  },
  {
    title: "App Development",
    description: "Native & cross-platform mobile experiences",
    icon: Smartphone,
    color: "text-emerald-400",
    bg: "bg-emerald-500/8",
  },
  {
    title: "Digital Design",
    description: "Brand identity & UI/UX that resonates",
    icon: Palette,
    color: "text-violet-400",
    bg: "bg-violet-500/8",
  },
  {
    title: "Digital Marketing",
    description: "SEO, social media & growth strategies",
    icon: Megaphone,
    color: "text-amber-400",
    bg: "bg-amber-500/8",
  },
  {
    title: "AI Solutions",
    description: "Intelligent automation & AI integration",
    icon: Bot,
    color: "text-rose-400",
    bg: "bg-rose-500/8",
  },
  {
    title: "SEO & Analytics",
    description: "Data-driven insights for growth",
    icon: TrendingUp,
    color: "text-cyan-400",
    bg: "bg-cyan-500/8",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const ClientHome = ({ profile }: { profile: any }) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [renewalItems, setRenewalItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGreeting, setShowGreeting] = useState(false);
  const [showContent, setShowContent] = useState(false);

  const firstName = profile?.contact_person?.split(" ")[0] || "there";

  useEffect(() => {
    const t1 = setTimeout(() => setShowGreeting(true), 200);
    const t2 = setTimeout(() => setShowContent(true), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (profile?.id) {
      fetchProjects();
      fetchRenewals();
    }
  }, [profile]);

  const fetchProjects = async () => {
    if (!profile?.id) return;
    try {
      const { data: crmClient } = await supabase
        .from("clients")
        .select("id")
        .eq("email", profile.email)
        .maybeSingle();

      const crmId = crmClient?.id;
      const clientFilter = `client_id.eq.${profile.id},client_id.eq.${crmId || profile.id}`;

      const { data } = await supabase
        .from("client_projects")
        .select("*")
        .or(clientFilter)
        .neq("status", "completed")
        .neq("status", "cancel")
        .order("updated_at", { ascending: false })
        .limit(4);

      setProjects(data || []);
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRenewals = async () => {
    const billingId = profile?.billing_sync_id;
    if (!billingId) return;

    try {
      // Load API credentials
      const { data: settings } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", ["billing_api_url", "billing_api_key", "billing_api_secret"]);

      const creds: any = {};
      (settings || []).forEach((s: any) => {
        const val = typeof s.value === "string" ? s.value.replace(/^"|"$/g, "") : String(s.value);
        if (s.key === "billing_api_url") creds.url = val;
        if (s.key === "billing_api_key") creds.key = val;
        if (s.key === "billing_api_secret") creds.secret = val;
      });

      const url = creds.url || localStorage.getItem("vaw_external_api_url") || "";
      const key = creds.key || localStorage.getItem("vaw_external_api_key") || "";
      const secret = creds.secret || localStorage.getItem("vaw_external_api_secret") || "";

      if (!key || !secret || !url) return;

      const res = await fetch(`${url}/recurring-invoices?limit=500`, {
        headers: { "x-api-key": key, "x-api-secret": secret },
      });

      if (!res.ok) return;
      const raw = await res.json();
      const allRecurring = Array.isArray(raw) ? raw : raw?.data || [];

      // Filter by client's billing_sync_id
      const matchId = billingId.toLowerCase();
      const clientRecurring = allRecurring.filter((r: any) => {
        const code = String(r.client_code || r.client_id || r.client_sync_id || r.customer_id || "").toLowerCase();
        return code === matchId;
      });

      // Calculate next renewal date for each recurring invoice
      const withDates = clientRecurring
        .filter((r: any) => r.status?.toLowerCase() !== "paused" && r.status?.toLowerCase() !== "stopped")
        .map((r: any) => {
          const nextDate = r.next_billing_date || r.next_invoice_date || r.next_date;
          let calculatedNext = nextDate;

          if (!calculatedNext) {
            const freq = (r.frequency || r.recurrence_frequency || "monthly").toLowerCase();
            const created = new Date(r.created_at || r.date || r.start_date || Date.now());
            const now = new Date();
            let d = new Date(created);
            while (d <= now) {
              if (freq === "yearly" || freq === "annual") d.setFullYear(d.getFullYear() + 1);
              else if (freq === "quarterly") d.setMonth(d.getMonth() + 3);
              else d.setMonth(d.getMonth() + 1);
            }
            calculatedNext = d.toISOString();
          }

          return { ...r, _nextDate: calculatedNext };
        })
        .sort((a: any, b: any) => new Date(a._nextDate).getTime() - new Date(b._nextDate).getTime());

      setRenewalItems(withDates);
    } catch (err) {
      console.error("Error fetching recurring invoices:", err);
    }
  };

  const statusLabel: Record<string, { text: string; cls: string }> = {
    planning: { text: "Planning", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    in_progress: { text: "In Progress", cls: "bg-primary/10 text-primary border-primary/20" },
    review: { text: "Review", cls: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
    review_pending: { text: "Pending Review", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    on_hold: { text: "On Hold", cls: "bg-muted text-muted-foreground border-border" },
    at_risk: { text: "Needs Attention", cls: "bg-destructive/10 text-destructive border-destructive/20" },
  };

  return (
    <div className="max-w-3xl mx-auto pb-32 space-y-16">
      {/* Centered Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex justify-center pt-4"
      >
        <img
          src="/lovable-uploads/0d3e4545-c80e-401b-82f1-3319db5155b4.png"
          alt="VAW Logo"
          className="w-12 h-12 rounded-2xl opacity-60"
        />
      </motion.div>

      {/* Greeting Section */}
      <div className="text-center space-y-3">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={showGreeting ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-sm tracking-[0.2em] uppercase text-muted-foreground/60 font-medium"
        >
          {getGreeting()}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={showGreeting ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
          className="text-3xl md:text-4xl font-light tracking-tight text-foreground"
        >
          Hi <span className="font-semibold text-primary">{firstName}</span>, welcome back
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={showGreeting ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 0.4 }}
          className="text-sm text-muted-foreground/50 font-light"
        >
          Everything is running smoothly
        </motion.p>
      </div>

      {/* Active Projects */}
      {showContent && (
        <motion.section
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="space-y-6"
        >
          <motion.div variants={fadeUp} custom={0} className="flex items-center justify-between">
            <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground/60 font-medium">
              Your products with us
            </h2>
            <Button
              variant="ghost"
              className="text-xs text-muted-foreground/50 hover:text-primary h-auto p-0 font-normal"
              onClick={() => (window.location.href = "/client/dashboard/projects")}
            >
              View all
            </Button>
          </motion.div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-card/50 animate-pulse" />
              ))}
            </div>
          ) : projects.length > 0 ? (
            <div className="space-y-3">
              {projects.map((project, idx) => {
                const status = statusLabel[project.status] || statusLabel.in_progress;
                return (
                  <motion.div
                    key={project.id}
                    variants={fadeUp}
                    custom={idx + 1}
                    className="group cursor-pointer"
                    onClick={() => (window.location.href = `/client/dashboard/projects/${project.id}`)}
                  >
                    <div className="p-5 rounded-2xl bg-card/40 border border-border/40 hover:border-border/80 hover:bg-card/60 transition-all duration-500">
                      <div className="flex items-start justify-between mb-3">
                        <div className="space-y-1">
                          <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-300">
                            {project.title}
                          </h3>
                          <p className="text-xs text-muted-foreground/50 font-light">
                            {project.project_type}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] font-normal border", status.cls)}
                        >
                          {status.text}
                        </Badge>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] text-muted-foreground/40">
                          <span>Progress</span>
                          <span>{project.progress || 0}%</span>
                        </div>
                        <div className="h-1 w-full bg-muted/50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${project.progress || 0}%` }}
                            transition={{ duration: 1.2, delay: 0.3 + idx * 0.1, ease: "easeOut" }}
                            className="h-full bg-primary/60 rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <motion.div variants={fadeUp} custom={1}>
              <div className="text-center py-12 rounded-2xl border border-dashed border-border/30">
                <p className="text-sm text-muted-foreground/40 font-light">No active projects yet</p>
              </div>
            </motion.div>
          )}
        </motion.section>
      )}

      {/* Upcoming Renewals */}
      {showContent && (
        <motion.section
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="space-y-6"
        >
          <motion.div variants={fadeUp} custom={0} className="flex items-center justify-between">
            <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground/60 font-medium">
              Upcoming Renewals
            </h2>
          </motion.div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-card/50 animate-pulse" />
              ))}
            </div>
          ) : renewalItems.length > 0 ? (
              <div className="space-y-3">
                {renewalItems.map((item: any, idx: number) => {
                  const date = new Date(item._nextDate);
                  const now = new Date();
                  const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  const isUrgent = daysUntil <= 7;
                  const isSoon = daysUntil <= 30;
                  const freq = (item.frequency || item.recurrence_frequency || "monthly").toLowerCase();
                  const amount = Number(item.total || item.amount || 0);

                  return (
                    <motion.div
                      key={item.id || idx}
                      variants={fadeUp}
                      custom={idx + 1}
                      className="group cursor-pointer"
                      onClick={() => (window.location.href = "/client/dashboard/financials")}
                    >
                      <div className="p-5 rounded-2xl bg-card/40 border border-border/40 hover:border-border/80 hover:bg-card/60 transition-all duration-500">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-300">
                              {item.name || item.invoice_name || item.title || "Recurring Invoice"}
                            </h3>
                            <p className="text-xs text-muted-foreground/50 font-light capitalize">
                              {freq} · {amount > 0 ? `₹${amount.toLocaleString("en-IN")}` : ""}
                            </p>
                          </div>
                          <div className="text-right space-y-1">
                            <p className={cn(
                              "text-sm font-medium",
                              isUrgent ? "text-destructive" : isSoon ? "text-amber-400" : "text-foreground"
                            )}>
                              {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] font-normal border",
                                isUrgent
                                  ? "bg-destructive/10 text-destructive border-destructive/20"
                                  : isSoon
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              )}
                            >
                              {daysUntil < 0 ? "Overdue" : daysUntil === 0 ? "Today" : `${daysUntil}d left`}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <motion.div variants={fadeUp} custom={1}>
                <div className="text-center py-10 rounded-2xl border border-dashed border-border/30">
                  <CalendarClock className="w-5 h-5 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground/40 font-light">No upcoming renewals</p>
                </div>
              </motion.div>
            )}

        </motion.section>
      )}

      {/* Services / Packages */}
      {showContent && (
        <motion.section
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="space-y-6"
        >
          <motion.div variants={fadeUp} custom={0} className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary/50" />
              <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground/60 font-medium">
                Explore our services
              </h2>
            </div>
            <p className="text-sm text-muted-foreground/40 font-light">
              Grow your business with our premium solutions
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {servicePackages.map((pkg, idx) => (
              <motion.div
                key={pkg.title}
                variants={fadeUp}
                custom={idx + 1}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="group cursor-pointer"
                onClick={() => (window.location.href = "/pricing")}
              >
                <div className="p-5 rounded-2xl bg-card/30 border border-border/30 hover:border-border/60 hover:bg-card/50 transition-all duration-500 text-center space-y-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl mx-auto flex items-center justify-center transition-transform duration-500 group-hover:scale-110",
                      pkg.bg
                    )}
                  >
                    <pkg.icon className={cn("w-5 h-5", pkg.color)} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-medium text-foreground">{pkg.title}</h3>
                    <p className="text-[10px] text-muted-foreground/40 font-light leading-relaxed">
                      {pkg.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div variants={fadeUp} custom={7} className="flex justify-center pt-2">
            <Button
              variant="ghost"
              className="text-xs text-muted-foreground/50 hover:text-primary font-normal gap-1.5 h-auto py-2"
              onClick={() => (window.location.href = "/pricing")}
            >
              View all packages
              <ArrowRight className="w-3 h-3" />
            </Button>
          </motion.div>
        </motion.section>
      )}

      {/* Promo / Ad Section */}
      {showContent && (
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.8, ease: "easeOut" }}
          className="space-y-4"
        >
          <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground/60 font-medium text-center">
            What's new
          </h2>

          <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/5 via-card/30 to-violet-500/5 border border-primary/10 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 mx-auto flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary/70" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-medium text-foreground">AI-Powered Solutions</h3>
              <p className="text-xs text-muted-foreground/50 font-light max-w-sm mx-auto leading-relaxed">
                Transform your business with our new AI integration services.
                Automate workflows, enhance customer experiences, and unlock insights.
              </p>
            </div>
            <Button
              className="bg-primary/10 hover:bg-primary/20 text-primary border-0 text-xs font-normal h-9 px-5 rounded-xl transition-all duration-300"
              onClick={() => (window.location.href = "/ai-solutions")}
            >
              Learn more
            </Button>
          </div>

          <div className="p-6 rounded-3xl bg-card/30 border border-border/30 text-center space-y-4">
            <div className="space-y-2">
              <h3 className="text-base font-medium text-foreground">Digital Marketing Internship</h3>
              <p className="text-xs text-muted-foreground/50 font-light max-w-sm mx-auto leading-relaxed">
                Know someone who wants to kickstart their career? Share our internship program with them.
              </p>
            </div>
            <Button
              variant="ghost"
              className="text-xs text-muted-foreground/50 hover:text-primary font-normal gap-1.5 h-auto py-2"
              onClick={() => (window.location.href = "/digital-marketing-internship")}
            >
              Share with a friend
              <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </motion.section>
      )}

      {/* Gentle footer message */}
      {showContent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 1 }}
          className="text-center py-8"
        >
          <p className="text-[10px] text-muted-foreground/30 tracking-[0.15em] uppercase font-light">
            Crafted with care by VAW Technologies
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default ClientHome;
