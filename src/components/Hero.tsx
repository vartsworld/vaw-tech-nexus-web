import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Globe, Code2, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import SideRays from "@/components/SideRays";

// Animated counter hook
const useCounter = (target: number, duration = 2000, start = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
};

const StatCard = ({
  value,
  suffix,
  label,
  icon: Icon,
  delay,
  started,
}: {
  value: number;
  suffix: string;
  label: string;
  icon: React.ElementType;
  delay: number;
  started: boolean;
}) => {
  const count = useCounter(value, 1800, started);
  return (
    <div
      className="flex flex-col items-center gap-1 group cursor-default"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-tech-gold/70 group-hover:text-tech-gold transition-colors" />
      </div>
      <span className="text-3xl md:text-4xl font-extrabold text-gradient font-['Space_Grotesk'] tabular-nums">
        {count}
        {suffix}
      </span>
      <span className="text-xs md:text-sm text-muted-foreground/80 font-['Outfit'] tracking-wide text-center">
        {label}
      </span>
    </div>
  );
};

const Hero = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const { userName } = useUser();

  // Trigger entrance animation shortly after mount
  useEffect(() => {
    const t = setTimeout(() => setContentVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  // IntersectionObserver to start counters when stats enter viewport
  useEffect(() => {
    if (!statsRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const stats = [
    { value: 150, suffix: "+", label: "Projects Delivered", icon: Code2, delay: 0 },
    { value: 95, suffix: "%", label: "Client Satisfaction", icon: Sparkles, delay: 100 },
    { value: 10, suffix: "+", label: "Industries Served", icon: Globe, delay: 200 },
    { value: 5, suffix: "+", label: "Countries Served", icon: Zap, delay: 300 },
  ];

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background"
    >
      {/* ── SideRays WebGL Background ── */}
      <div className="absolute inset-0 z-0">
        <SideRays
          speed={1.8}
          rayColor1="#FFD700"
          rayColor2="#ea384c"
          intensity={2.2}
          spread={2.4}
          origin="top-right"
          tilt={-8}
          saturation={1.6}
          blend={0.55}
          falloff={1.4}
          opacity={0.9}
        />
      </div>

      {/* Secondary rays from opposite corner for depth */}
      <div className="absolute inset-0 z-0 opacity-40">
        <SideRays
          speed={1.2}
          rayColor1="#9b87f5"
          rayColor2="#1EAEDB"
          intensity={1.5}
          spread={1.8}
          origin="bottom-left"
          tilt={12}
          saturation={1.2}
          blend={0.6}
          falloff={1.8}
          opacity={0.6}
        />
      </div>

      {/* Dark vignette overlay so text stays readable */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-background/60 via-background/30 to-background/80 pointer-events-none" />

      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 z-[2] opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,215,0,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.4) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── Main Content ── */}
      <div className="relative z-10 container mx-auto px-4 pt-36 pb-24 flex flex-col items-center text-center">

        {/* Welcome pill */}
        {userName && (
          <div
            className={`mb-6 transition-all duration-700 ${
              contentVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-tech-gold/40 bg-tech-gold/10 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-tech-gold animate-pulse" />
              <span className="text-sm font-semibold text-tech-gold font-['Space_Grotesk']">
                Welcome back, {userName}
              </span>
            </div>
          </div>
        )}

        {/* Service badge */}
        {!userName && (
          <div
            className={`mb-6 transition-all duration-700 ${
              contentVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-tech-gold/40 bg-tech-gold/10 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-tech-gold animate-pulse" />
              <span className="text-sm font-semibold text-tech-gold/90 font-['Space_Grotesk'] tracking-widest uppercase">
                Kerala's #1 Digital Agency
              </span>
            </div>
          </div>
        )}

        {/* Headline */}
        <h1
          className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-[1.05] mb-6 transition-all duration-700 delay-100 font-['Space_Grotesk'] ${
            contentVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <span className="text-gradient">Transforming Ideas</span>
          <br />
          <span className="relative inline-block text-foreground mt-2">
            Into Digital
            {/* Animated underline accent */}
            <span className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-gradient-to-r from-tech-gold via-tech-red to-tech-gold animate-shimmer bg-[length:200%_100%]" />
          </span>
          <br />
          <span className="text-gradient">Excellence</span>
        </h1>

        {/* Sub-heading */}
        <p
          className={`text-base sm:text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto mb-10 font-['Outfit'] leading-relaxed transition-all duration-700 delay-200 ${
            contentVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          {userName
            ? `${userName}, we craft premium digital solutions — from blazing-fast websites to immersive AR/VR experiences — built just for you.`
            : `VAW Technologies crafts premium digital solutions — stunning websites, powerful web apps, AI tools & ROI-driven marketing, all under one roof.`}
        </p>

        {/* CTA Buttons */}
        <div
          className={`flex flex-col sm:flex-row gap-4 justify-center mb-20 transition-all duration-700 delay-300 ${
            contentVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <Link to="/pricing">
            <Button
              size="lg"
              className="relative group overflow-hidden bg-tech-gold text-black hover:bg-tech-gold/90 font-bold px-8 py-6 text-base rounded-xl shadow-lg shadow-tech-gold/30 hover:shadow-tech-gold/50 transition-all duration-300"
            >
              <span className="relative z-10 flex items-center gap-2">
                Explore Services
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-tech-gold via-yellow-300 to-tech-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Button>
          </Link>

          <Link to="/#contact">
            <Button
              size="lg"
              variant="outline"
              className="relative group overflow-hidden border-2 border-foreground/20 hover:border-tech-gold/60 text-foreground/80 hover:text-foreground font-semibold px-8 py-6 text-base rounded-xl backdrop-blur-sm bg-background/20 hover:bg-tech-gold/5 transition-all duration-300"
            >
              <span className="relative z-10">Get a Free Quote</span>
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div
          ref={statsRef}
          className={`grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 w-full max-w-2xl mx-auto transition-all duration-700 delay-500 ${
            contentVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} started={statsVisible} />
          ))}
        </div>

        {/* 24/7 support badge */}
        <div
          className={`mt-8 flex items-center gap-2 px-4 py-2 rounded-full border border-border/40 bg-card/30 backdrop-blur-sm transition-all duration-700 delay-700 ${
            contentVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-muted-foreground font-['Outfit']">
            24 / 7 Support — Always here when you need us
          </span>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-50">
        <span className="text-xs text-muted-foreground font-['Outfit'] tracking-widest uppercase">Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-tech-gold/60 to-transparent animate-bounce-subtle" />
      </div>
    </section>
  );
};

export default Hero;
