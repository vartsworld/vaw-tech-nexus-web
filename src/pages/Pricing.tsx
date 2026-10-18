import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Check, Clock, Star, Shield, Zap, Globe, TrendingUp, Bot, Package,
  Sparkles, Plus, Search, X, Copy, CheckCircle2, ShieldCheck, Server,
  Headphones, ArrowRight, ArrowUpRight, HelpCircle, AlertCircle
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PricingInquiryForm from "@/components/PricingInquiryForm";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PricingTier {
  id: string;
  name: string;
  slug?: string;
  originalPrice: number;
  discountPrice: number;
  icon_name?: string;
  popular?: boolean;
  features: string[];
  description: string;
  category?: string;
}

interface PricingAddon {
  id: string;
  name: string;
  slug?: string;
  description: string;
  price: number;
}

interface PromotionalOffer {
  is_enabled: boolean;
  badge_text: string;
  title: string;
  discount_label: string;
  description: string;
  coupon_code: string;
  end_date: string;
  button_text: string;
  highlights: string[];
}

const IconComponent = ({ name, className }: { name?: string; className?: string }) => {
  const props = { className: className || "h-7 w-7" };
  switch (name) {
    case "Zap": return <Zap {...props} />;
    case "Shield": return <Shield {...props} />;
    case "Star": return <Star {...props} />;
    case "TrendingUp": return <TrendingUp {...props} />;
    case "Bot": return <Bot {...props} />;
    case "Package": return <Package {...props} />;
    case "Sparkles": return <Sparkles {...props} />;
    default: return <Globe {...props} />;
  }
};

const ICON_COLOR_MAP: Record<string, string> = {
  Globe: "text-tech-blue",
  Zap: "text-tech-purple",
  Shield: "text-amber-400",
  Star: "text-tech-red",
  TrendingUp: "text-tech-purple",
  Bot: "text-emerald-400",
  Package: "text-tech-blue",
  Sparkles: "text-amber-400",
};

// Auto-categorize packages for user-friendly filtering
const inferCategory = (name: string, description: string): string => {
  const text = `${name} ${description}`.toLowerCase();
  if (text.includes("e-commerce") || text.includes("store") || text.includes("cart") || text.includes("catalog")) {
    return "E-Commerce";
  }
  if (text.includes("ai") || text.includes("bot") || text.includes("machine learning") || text.includes("automation")) {
    return "AI & Automation";
  }
  if (text.includes("news") || text.includes("social") || text.includes("media") || text.includes("feed")) {
    return "Media & News";
  }
  return "Web Development";
};

const CATEGORIES = ["All Plans", "Web Development", "E-Commerce", "AI & Automation", "Media & News"];

const Pricing = () => {
  const { toast } = useToast();
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [addons, setAddons] = useState<PricingAddon[]>([]);
  const [promotionalOffer, setPromotionalOffer] = useState<PromotionalOffer | null>(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Plans");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc">("featured");
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  // Load public pricing and offer data
  const fetchAllData = async () => {
    try {
      const [pkgRes, addonRes, offerRes] = await Promise.all([
        supabase
          .from("pricing_packages")
          .select("*")
          .eq("is_enabled", true)
          .order("sort_order"),
        supabase
          .from("pricing_addons")
          .select("*")
          .eq("is_enabled", true)
          .order("sort_order"),
        supabase
          .from("app_settings")
          .select("value")
          .eq("key", "pricing_promotional_offer")
          .maybeSingle(),
      ]);

      if (pkgRes.data) {
        setPricingTiers(
          pkgRes.data.map(pkg => ({
            id: pkg.id,
            name: pkg.name,
            slug: pkg.slug,
            originalPrice: pkg.original_price,
            discountPrice: pkg.discount_price,
            icon_name: pkg.icon_name,
            popular: pkg.is_popular,
            features: pkg.features || [],
            description: pkg.description || "",
            category: inferCategory(pkg.name, pkg.description || ""),
          }))
        );
      }

      if (addonRes.data) {
        setAddons(addonRes.data);
      }

      if (offerRes.data?.value) {
        setPromotionalOffer(offerRes.data.value as unknown as PromotionalOffer);
      } else {
        const cached = localStorage.getItem("pricing_promotional_offer");
        if (cached) {
          try {
            setPromotionalOffer(JSON.parse(cached));
          } catch {}
        }
      }
    } catch (err) {
      console.error("Error fetching pricing data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    // Real-time synchronization so changes made by HR in /hr take effect immediately
    const channel = supabase
      .channel("public-pricing-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "pricing_packages" }, fetchAllData)
      .on("postgres_changes", { event: "*", schema: "public", table: "pricing_addons" }, fetchAllData)
      .on("postgres_changes", { event: "*", schema: "public", table: "app_settings" }, fetchAllData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Update countdown timer whenever promotional offer changes
  useEffect(() => {
    if (!promotionalOffer?.is_enabled || !promotionalOffer?.end_date) {
      setTimeLeft(null);
      return;
    }

    const calculateTime = () => {
      const end = new Date(promotionalOffer.end_date).getTime();
      // Assume end of day if only date is specified
      const targetTime = end + 24 * 60 * 60 * 1000 - 1000;
      const now = new Date().getTime();
      const distance = targetTime - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft(null);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [promotionalOffer]);

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(true);
    toast({
      title: "Coupon Copied!",
      description: `Coupon "${code}" copied to clipboard. Mention it during inquiry!`,
    });
    setTimeout(() => setCopiedCoupon(false), 2500);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);

  // Filter & sort tiers
  const filteredTiers = useMemo(() => {
    let result = [...pricingTiers];

    // Category filter
    if (selectedCategory !== "All Plans") {
      result = result.filter(t => t.category === selectedCategory);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        t =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.features.some(f => f.toLowerCase().includes(q))
      );
    }

    // Sort order
    if (sortBy === "price-asc") {
      result.sort((a, b) => a.discountPrice - b.discountPrice);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.discountPrice - a.discountPrice);
    } else {
      // Featured / Default: popular items first
      result.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
    }

    return result;
  }, [pricingTiers, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-[#0A0A0E] text-foreground overflow-x-hidden selection:bg-indigo-500/30 selection:text-white">
      <SEO
        title="Pricing & Investment Packages | VAW Technologies"
        description="Transparent and value-driven pricing for custom web development, AI integration, high-growth e-commerce platforms, and digital enterprise software at VAW Technologies."
        keywords="web development pricing, web app cost, AI website cost, e-commerce development pricing, VAW Technologies packages, Kerala IT agency rates"
        ogImage="/og/pricing.png"
      />
      <Navbar />

      {/* ── HERO SECTION ── */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        {/* Cyberpunk Glow Background Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-indigo-600/15 via-purple-600/10 to-transparent blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute -top-10 left-10 w-96 h-96 bg-tech-blue/10 blur-[130px] pointer-events-none rounded-full" />
        <div className="absolute top-40 right-10 w-80 h-80 bg-amber-500/10 blur-[140px] pointer-events-none rounded-full" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md shadow-lg shadow-indigo-500/5">
              <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                Transparent &amp; Value-Driven Pricing
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight font-['Space_Grotesk'] leading-[1.15]">
              Engineering Scalable Digital Experiences With{" "}
              <span className="text-gradient">Predictable Pricing</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              No hidden fees, no ambiguity. Full-cycle development backed by enterprise architecture, high-speed hosting, and post-launch technical support.
            </p>

            {/* Trust Highlights Grid */}
            <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-left">
                <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-white">100% IP Ownership</div>
                  <div className="text-[10px] text-gray-500">Full source code & rights</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-left">
                <Server className="h-5 w-5 text-tech-blue shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-white">Free 1-Yr Cloud Hosting</div>
                  <div className="text-[10px] text-gray-500">Domain + SSL Included</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-left">
                <Zap className="h-5 w-5 text-amber-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-white">7-14 Days Delivery</div>
                  <div className="text-[10px] text-gray-500">Rapid agile deployment</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-left">
                <Headphones className="h-5 w-5 text-tech-purple shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-white">Dedicated Tech Lead</div>
                  <div className="text-[10px] text-gray-500">Priority SLA support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROMOTIONAL OFFER BANNER (Configured by HR) ── */}
      {promotionalOffer?.is_enabled && (
        <section className="pb-12">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A132B]/90 via-[#12111E]/95 to-[#0F172A]/90 border border-amber-500/30 p-6 sm:p-8 shadow-2xl shadow-amber-500/10 backdrop-blur-xl">
              {/* Decorative radial flare */}
              <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left: Offer Details */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/40 text-xs px-3 py-1 font-semibold flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      {promotionalOffer.badge_text || "Special Limited Offer"}
                    </Badge>
                    {promotionalOffer.discount_label && (
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        {promotionalOffer.discount_label}
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight font-['Space_Grotesk']">
                    {promotionalOffer.title}
                  </h3>

                  <p className="text-sm text-gray-300 leading-relaxed">
                    {promotionalOffer.description}
                  </p>

                  {/* Highlights Checklist */}
                  {promotionalOffer.highlights && promotionalOffer.highlights.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                      {promotionalOffer.highlights.map((highlight, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-gray-200">
                          <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                          <span>{highlight}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Countdown & Action */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-4 bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                  {/* Countdown Timer */}
                  {timeLeft && (
                    <div className="w-full text-center space-y-2">
                      <div className="flex items-center justify-center gap-1.5 text-xs text-amber-300/90 font-medium">
                        <Clock className="h-3.5 w-3.5 animate-pulse text-amber-400" />
                        <span>Offer Valid Until Countdown Ends:</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: "Days", val: timeLeft.days },
                          { label: "Hours", val: timeLeft.hours },
                          { label: "Mins", val: timeLeft.minutes },
                          { label: "Secs", val: timeLeft.seconds },
                        ].map(({ label, val }) => (
                          <div key={label} className="bg-black/40 border border-white/5 rounded-xl p-2.5">
                            <div className="text-xl sm:text-2xl font-mono font-bold text-amber-300">
                              {String(val).padStart(2, "0")}
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-gray-400">{label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Coupon Code Pill */}
                  {promotionalOffer.coupon_code && (
                    <div className="w-full flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      <div className="text-left pl-1">
                        <div className="text-[9px] uppercase tracking-widest text-amber-300/80">Coupon Code</div>
                        <div className="text-sm font-mono font-bold text-white tracking-wide">
                          {promotionalOffer.coupon_code}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyCouponCode(promotionalOffer.coupon_code)}
                        className="text-xs text-amber-300 hover:text-white hover:bg-amber-500/20 gap-1.5 h-8 px-3"
                      >
                        {copiedCoupon ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" /> Copy Code
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Claim Offer CTA */}
                  <PricingInquiryForm
                    packageName={`Promotional Offer: ${promotionalOffer.title}`}
                    packagePrice={0}
                  >
                    <Button className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-bold py-5 shadow-lg shadow-amber-500/20 text-sm">
                      <Sparkles className="h-4 w-4 mr-2" />
                      {promotionalOffer.button_text || "Claim Offer Now"}
                    </Button>
                  </PricingInquiryForm>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── PACKAGES & CATALOG SECTION ── */}
      <section className="py-8 pb-24">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Search & Filter Toolbar */}
          <div className="mb-12 space-y-6">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search packages, features, technologies..."
                  className="pl-10 pr-9 bg-[#121218] border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-indigo-500 h-11 rounded-xl text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-2 self-end md:self-auto">
                <span className="text-xs text-gray-400 shrink-0">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-[#121218] border border-white/10 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="featured">Featured / Popular</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-xs px-4 py-2 rounded-xl font-medium transition-all shrink-0 ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500"
                        : "bg-white/[0.03] text-gray-400 hover:text-white hover:bg-white/[0.06] border border-white/5"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Counter */}
            <div className="flex items-center justify-between text-xs text-gray-500 px-1">
              <span>
                Showing <strong className="text-white">{filteredTiers.length}</strong> available package{filteredTiers.length === 1 ? "" : "s"}
              </span>
              {(selectedCategory !== "All Plans" || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedCategory("All Plans");
                    setSearchQuery("");
                  }}
                  className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>

          {/* ── PACKAGES GRID ── */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-[#111116] border-white/10 p-6 space-y-6">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-2xl bg-white/5" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-3/4 bg-white/5" />
                      <Skeleton className="h-3 w-1/2 bg-white/5" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-full bg-white/5" />
                  <div className="space-y-3 pt-4">
                    <Skeleton className="h-4 w-full bg-white/5" />
                    <Skeleton className="h-4 w-5/6 bg-white/5" />
                    <Skeleton className="h-4 w-4/5 bg-white/5" />
                    <Skeleton className="h-4 w-2/3 bg-white/5" />
                  </div>
                  <Skeleton className="h-11 w-full rounded-xl bg-white/5" />
                </Card>
              ))}
            </div>
          ) : filteredTiers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
              {filteredTiers.map((tier) => {
                const hasDiscount = tier.originalPrice > tier.discountPrice;
                const savings = tier.originalPrice - tier.discountPrice;
                const discountPercentage = hasDiscount
                  ? Math.round((savings / tier.originalPrice) * 100)
                  : 0;

                return (
                  <Card
                    key={tier.id}
                    className={`relative flex flex-col justify-between bg-gradient-to-b from-[#13131B] to-[#0D0D14] transition-all duration-300 rounded-3xl overflow-hidden group ${
                      tier.popular
                        ? "border-indigo-500/50 shadow-2xl shadow-indigo-500/10 scale-[1.02] ring-1 ring-indigo-500/30"
                        : "border-white/10 hover:border-white/20 hover:shadow-xl"
                    }`}
                  >
                    {/* Popular Pill */}
                    {tier.popular && (
                      <div className="absolute top-0 right-0">
                        <span className="bg-gradient-to-r from-amber-500 to-indigo-600 text-white text-[11px] font-bold px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider shadow-md">
                          ⭐ Most Popular
                        </span>
                      </div>
                    )}

                    <div>
                      <CardHeader className="p-6 pb-4">
                        {/* Icon & Category */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 group-hover:border-indigo-500/30 transition-colors">
                            <IconComponent
                              name={tier.icon_name}
                              className={`h-7 w-7 ${ICON_COLOR_MAP[tier.icon_name || "Globe"] || "text-indigo-400"}`}
                            />
                          </div>
                          {tier.category && (
                            <Badge variant="outline" className="text-[10px] text-gray-400 border-white/10">
                              {tier.category}
                            </Badge>
                          )}
                        </div>

                        {/* Title & Description */}
                        <CardTitle className="text-xl sm:text-2xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {tier.name}
                        </CardTitle>
                        <p className="text-xs sm:text-sm text-gray-400 mt-2 min-h-[40px] leading-relaxed">
                          {tier.description}
                        </p>

                        {/* Pricing Block */}
                        <div className="pt-6 pb-2 border-b border-white/5">
                          <div className="flex items-baseline gap-2.5">
                            <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                              {formatPrice(tier.discountPrice)}
                            </span>
                            {hasDiscount && (
                              <span className="text-sm sm:text-base text-gray-500 line-through">
                                {formatPrice(tier.originalPrice)}
                              </span>
                            )}
                          </div>

                          {/* Savings Badge */}
                          {hasDiscount && (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                Save {formatPrice(savings)} ({discountPercentage}% OFF)
                              </span>
                              <span className="text-[10px] text-gray-500">• One-time price</span>
                            </div>
                          )}
                        </div>
                      </CardHeader>

                      {/* Features List */}
                      <CardContent className="p-6 pt-2">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
                          What's Included:
                        </div>
                        <ul className="space-y-2.5">
                          {tier.features.map((feature, fi) => (
                            <li key={fi} className="flex items-start gap-2.5 text-xs text-gray-300">
                              <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                              <span className="leading-snug">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </div>

                    {/* Card Footer CTA */}
                    <div className="p-6 pt-0">
                      <PricingInquiryForm packageName={tier.name} packagePrice={tier.discountPrice}>
                        <Button
                          className={`w-full font-semibold rounded-xl h-11 text-sm shadow-md transition-all ${
                            tier.popular
                              ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/20 hover:shadow-indigo-600/40"
                              : "bg-white/10 hover:bg-white/20 text-white"
                          }`}
                        >
                          Select This Plan
                          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </PricingInquiryForm>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 px-4 rounded-3xl bg-[#111116] border border-white/5 max-w-lg mx-auto">
              <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">No Packages Found</h3>
              <p className="text-xs text-gray-400 mb-6">
                We couldn't find any packages matching "{searchQuery}". Try searching with different keywords or reset your filters.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All Plans");
                }}
                className="border-white/10 text-white hover:bg-white/5"
              >
                Reset All Filters
              </Button>
            </div>
          )}

          {/* ── ADDONS SECTION ── */}
          {addons.length > 0 && !loading && (
            <div className="mt-28">
              <div className="text-center mb-12 space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tech-purple/10 border border-tech-purple/20 text-tech-purple text-xs font-semibold">
                  <Plus className="h-3.5 w-3.5" /> Modular Inclusions
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-['Space_Grotesk']">
                  Addon <span className="text-gradient">Services &amp; Upgrades</span>
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
                  Customize and enhance your project with high-impact extras and security modules
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {addons.map((addon) => (
                  <Card
                    key={addon.id}
                    className="bg-[#121218] border-white/5 hover:border-indigo-500/30 transition-all rounded-2xl group flex flex-col justify-between"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <h3 className="font-bold text-base text-white group-hover:text-indigo-400 transition-colors">
                            {addon.name}
                          </h3>
                          <p className="text-xs text-gray-400 leading-relaxed">
                            {addon.description}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 whitespace-nowrap">
                            {addon.price > 0 ? formatPrice(addon.price) : "Custom Quote"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-end">
                        <PricingInquiryForm packageName={`Addon: ${addon.name}`} packagePrice={addon.price}>
                          <Button size="sm" variant="ghost" className="text-xs text-indigo-400 hover:text-white p-0 h-auto gap-1">
                            Add to Project <ArrowUpRight className="h-3 w-3" />
                          </Button>
                        </PricingInquiryForm>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ── CUSTOM ARCHITECTURE / ENTERPRISE CTA ── */}
          <div className="mt-28 relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-[#0F172A]/70 border border-white/10 p-8 sm:p-12 text-center backdrop-blur-md">
            <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
            <div className="max-w-2xl mx-auto space-y-4">
              <Badge className="bg-white/10 text-white border-white/20 text-xs px-3 py-1">
                Enterprise &amp; Bespoke Builds
              </Badge>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white font-['Space_Grotesk']">
                Have a Complex or Custom Architecture Requirement?
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                Whether you need a full-scale SaaS platform, specialized AI model integration, high-frequency cryptocurrency gateway, or bespoke cloud microservices, our technical architects can prepare an exhaustive scope of work.
              </p>
              <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
                <PricingInquiryForm packageName="Custom Enterprise Architecture" packagePrice={0}>
                  <Button size="lg" className="bg-white text-black hover:bg-gray-200 font-bold px-8 rounded-xl h-12 shadow-xl">
                    Schedule Architecture Call
                  </Button>
                </PricingInquiryForm>
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center text-xs font-semibold text-gray-300 hover:text-white px-5 py-3 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
                >
                  General Contact <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
