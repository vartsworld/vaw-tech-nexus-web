import { useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import MobileHeader from "@/components/MobileHeader";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  ArrowLeft, 
  Compass, 
  Sparkles, 
  Laptop, 
  GraduationCap, 
  Briefcase, 
  HelpCircle,
  ArrowUpRight,
  ShieldAlert
} from "lucide-react";

const quickLinks = [
  {
    title: "Our Services & Pricing",
    description: "Explore web development, AI solutions, digital marketing, and design packages.",
    href: "/pricing",
    icon: Laptop,
    badge: "Popular"
  },
  {
    title: "VAW Academy",
    description: "Industry-grade technical training and real-world project experience.",
    href: "/academy",
    icon: GraduationCap,
    badge: "Programs"
  },
  {
    title: "Internship Opportunities",
    description: "Join our active student and graduate cohort programs across domains.",
    href: "/internship",
    icon: Briefcase,
    badge: "Hiring"
  },
  {
    title: "Request a Project / Consultation",
    description: "Initiate your custom digital engineering or AI requirements with us.",
    href: "/service-request",
    icon: Sparkles,
    badge: "Direct"
  }
];

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    console.warn(
      `[404 Route Encountered] Path "${location.pathname}" does not exist in the route registry.`
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#050508] text-foreground flex flex-col justify-between selection:bg-violet-500/30 selection:text-white relative overflow-hidden font-sans">
      <SEO
        title="404 - Page Not Found | VAW Technologies"
        description="The sector or page coordinates you requested do not exist in the VAW Technologies Nexus. Return home or browse our services."
      />
      <Navbar />
      <MobileHeader />

      {/* Futuristic Background Atmospheric Mesh & Grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Ambient Top & Center Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-violet-600/15 via-purple-600/20 to-cyan-500/15 rounded-full blur-[140px] opacity-75" />
        <div className="absolute -bottom-20 right-10 w-[500px] h-[400px] bg-gradient-to-br from-fuchsia-600/10 to-indigo-600/15 rounded-full blur-[120px] opacity-60" />

        {/* Subtle Cyber Grid Texture */}
        <div 
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '48px 48px'
          }}
        />
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-20 sm:py-28 max-w-5xl mx-auto w-full">
        
        {/* Animated Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md shadow-inner mb-6"
        >
          <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-semibold tracking-wide text-zinc-300 uppercase">
            Error 404 • Signal Lost In Nexus
          </span>
        </motion.div>

        {/* Holographic Glowing 404 Number */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative select-none text-center"
        >
          <span className="text-8xl sm:text-9xl md:text-[14rem] font-black tracking-tighter leading-none bg-gradient-to-b from-white via-zinc-200 to-zinc-600/30 bg-clip-text text-transparent drop-shadow-[0_20px_50px_rgba(139,92,246,0.25)]">
            404
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-cyan-500/20 blur-3xl -z-10 opacity-70" />
        </motion.div>

        {/* Headings & Path Info */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center max-w-xl mx-auto space-y-3 mt-2"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Looks like you’ve wandered off the grid.
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            The page coordinate or asset you requested does not exist in this sector, or has been relocated to another dimension.
          </p>

          {/* Requested Path Box */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-white/10 text-xs text-zinc-400 font-mono mt-2">
            <span className="text-zinc-500">Target:</span>
            <span className="text-violet-300 font-bold truncate max-w-[280px] sm:max-w-md">
              {location.pathname}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] font-semibold">
              UNRESOLVED
            </span>
          </div>
        </motion.div>

        {/* Primary Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-3 mt-8"
        >
          <Button
            asChild
            size="lg"
            className="h-12 px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-violet-600/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-violet-400/20 flex items-center gap-2"
          >
            <Link to="/">
              <Home className="w-4 h-4" />
              Return to Safety (Home)
            </Link>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate(-1)}
            className="h-12 px-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 hover:text-white border-white/10 hover:border-white/20 transition-all duration-300 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>

          <Button
            asChild
            variant="ghost"
            size="lg"
            className="h-12 px-5 rounded-2xl text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors flex items-center gap-2"
          >
            <Link to="/pricing">
              <Compass className="w-4 h-4" />
              Explore All Services
            </Link>
          </Button>
        </motion.div>

        {/* Suggested Quick Links Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="w-full mt-14 pt-10 border-t border-white/[0.07]"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-violet-400" />
              Recommended Waypoints
            </h2>
            <span className="text-xs text-zinc-500">Popular destination links</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className="group relative p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-violet-500/30 transition-all duration-300 flex flex-col justify-between hover:-translate-y-0.5 shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:bg-violet-500 group-hover:text-white transition-all duration-300">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/[0.04] text-zinc-400 border border-white/5">
                        {link.badge}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-200 group-hover:text-violet-300 transition-colors flex items-center gap-1">
                        {link.title}
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-0.5 -translate-y-0 group-hover:-translate-y-0.5" />
                      </h3>
                      <p className="text-xs text-zinc-500 leading-snug line-clamp-2 mt-1">
                        {link.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* Support Callout Footnote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-10 text-center"
        >
          <p className="text-xs text-zinc-500 flex items-center justify-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
            Think this page is missing due to a broken link? Let us know at{" "}
            <a 
              href="mailto:contact@vawtechnologies.com" 
              className="text-violet-400 hover:text-violet-300 underline underline-offset-2 font-medium"
            >
              contact@vawtechnologies.com
            </a>
          </p>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
