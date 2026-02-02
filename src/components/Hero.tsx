

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useUser } from "@/context/UserContext";
const Hero = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const {
    userName
  } = useUser();
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Calculate the percentage of mouse position in the element
      const xPercent = x / rect.width;
      const yPercent = y / rect.height;

      // Use this to create a subtle parallax effect
      const elements = heroRef.current.querySelectorAll(".parallax-element");
      elements.forEach(el => {
        const speed = parseFloat((el as HTMLElement).dataset.speed || "0.05");
        const xOffset = (xPercent - 0.5) * speed * 100;
        const yOffset = (yPercent - 0.5) * speed * 100;
        (el as HTMLElement).style.transform = `translate(${xOffset}px, ${yOffset}px)`;
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);
  return <section ref={heroRef} className="relative min-h-screen flex items-center pt-32 md:pt-40 pb-20 overflow-hidden">

    <div className="container mx-auto px-4 z-10 relative">
      <div className="max-w-4xl mx-auto text-center">
        {/* Welcome Badge/Chip */}
        {userName && (
          <div className="inline-flex items-center justify-center mb-6">
            <div className="px-6 py-3 bg-gradient-to-r from-tech-gold/20 via-tech-red/20 to-tech-purple/20 backdrop-blur-sm border border-tech-gold/30 rounded-full">
              <span className="text-xl md:text-2xl font-bold text-gradient font-['Space_Grotesk']">
                Welcome, {userName}
              </span>
            </div>
          </div>
        )}

        {/* Main Hero Text */}
        <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight font-['Space_Grotesk']">
          <span className="text-gradient">Transforming Ideas</span>
          <br />
          <span className="relative inline-block mt-2">
            <span className="relative z-10">Into Digital Excellence</span>
            <span className="absolute -bottom-2 left-0 right-0 h-3 bg-tech-gold/30 skew-x-12 z-0"></span>
          </span>
        </h1>

        {/* Description */}
        <p className="text-lg md:text-xl text-foreground/80 mb-12 max-w-3xl mx-auto font-['Outfit'] p-8 glass-panel rounded-2xl">
          {userName
            ? `${userName}, we deliver premium digital solutions that merge innovation with creativity, crafted just for you.`
            : `VAW Technologies delivers premium digital solutions that merge innovation with creativity, from stunning websites to immersive AR/VR experiences.`}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
          <Link to="/pricing">
            <Button size="lg" className="bg-primary hover:bg-primary/80 text-primary-foreground group relative overflow-hidden px-8">
              <span className="relative z-10 flex items-center">
                Our Services
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <span className="absolute inset-0 bg-tech-red/90 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
            </Button>
          </Link>
          <Link to="/#contact">
            <Button size="lg" variant="outline" className="border-accent text-accent hover:bg-accent/10 relative overflow-hidden group px-8">
              <span className="relative z-10">Get in Touch</span>
              <span className="absolute inset-0 bg-accent/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-6">
          <div className="flex flex-col items-center transform hover:scale-110 transition-transform duration-300 cursor-default p-4">
            <span className="text-4xl md:text-5xl font-bold text-gradient mb-2">150+</span>
            <span className="text-sm md:text-base text-muted-foreground">Projects Delivered</span>
          </div>
          <div className="flex flex-col items-center transform hover:scale-110 transition-transform duration-300 cursor-default p-4">
            <span className="text-4xl md:text-5xl font-bold text-gradient mb-2">95%</span>
            <span className="text-sm md:text-base text-muted-foreground">Client Satisfaction</span>
          </div>
          <div className="flex flex-col items-center transform hover:scale-110 transition-transform duration-300 cursor-default p-4">
            <span className="text-4xl md:text-5xl font-bold text-gradient mb-2">10+</span>
            <span className="text-sm md:text-base text-muted-foreground">Industries Served</span>
          </div>
          <div className="flex flex-col items-center transform hover:scale-110 transition-transform duration-300 cursor-default p-4">
            <span className="text-4xl md:text-5xl font-bold text-gradient mb-2">5+</span>
            <span className="text-sm md:text-base text-muted-foreground">Countries Served</span>
          </div>
          <div className="flex flex-col items-center col-span-2 md:col-span-1 transform hover:scale-110 transition-transform duration-300 cursor-default p-4">
            <span className="text-4xl md:text-5xl font-bold text-gradient mb-2">24/7</span>
            <span className="text-sm md:text-base text-muted-foreground">Support</span>
          </div>
        </div>
      </div>
    </div>
  </section>;
};
export default Hero;
