import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "@/context/UserContext";

/** Counts up once the element scrolls into view (respects reduced-motion). */
const useCounter = (target: number, duration = 1400, start = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCount(target);
      return;
    }
    let raf = 0;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (startTime === null) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setCount(Math.round((1 - Math.pow(1 - progress, 3)) * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return count;
};

const Stat = ({ value, suffix, label, started }: { value: number; suffix: string; label: string; started: boolean }) => {
  const count = useCounter(value, 1400, started);
  return (
    <div className="space-y-1">
      <p className="text-3xl md:text-4xl font-bold tabular-nums text-foreground">
        {count}
        {suffix}
      </p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
};

const stats = [
  { value: 150, suffix: "+", label: "Projects delivered" },
  { value: 10, suffix: "+", label: "Industries served" },
  { value: 5, suffix: "+", label: "Countries served" },
];

const Hero = () => {
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const { userName } = useUser();

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative bg-background border-b border-border">
      <div className="container mx-auto px-4 sm:px-8 pt-32 md:pt-40 pb-16 md:pb-24">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-[hsl(var(--brand-text))] mb-5">
            {userName ? `Welcome back, ${userName}` : "Web, apps, AI & marketing studio · Kerala, India"}
          </p>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] text-foreground mb-6">
            We design and build digital products that help businesses grow.
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            VAW Technologies delivers websites, web apps, AI tools and marketing campaigns, from first sketch to launch
            and beyond. Pick a package, add what you need, and tell us about your project.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg" className="font-semibold">
              <Link to="/pricing">
                Build your plan
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="font-semibold">
              <Link to="/contact">Talk to us</Link>
            </Button>
          </div>
        </div>

        <div ref={statsRef} className="mt-16 md:mt-20 pt-8 border-t border-border grid grid-cols-3 gap-6 max-w-2xl">
          {stats.map((s) => (
            <Stat key={s.label} {...s} started={statsVisible} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
