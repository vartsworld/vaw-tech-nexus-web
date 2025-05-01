
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { useUser } from "@/context/UserContext";

const Hero = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { userName } = useUser();

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
      elements.forEach((el) => {
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

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center pt-20 pb-20 overflow-hidden">
      <div className="absolute -left-20 -top-20 w-64 h-64 rounded-full bg-tech-gold/10 filter blur-3xl opacity-70 parallax-element" data-speed="0.08"></div>
      <div className="absolute -right-10 top-40 w-80 h-80 rounded-full bg-tech-red/10 filter blur-3xl opacity-70 parallax-element" data-speed="0.06"></div>
      <div className="absolute right-40 bottom-20 w-60 h-60 rounded-full bg-tech-purple/10 filter blur-3xl opacity-70 parallax-element" data-speed="0.04"></div>
      
      <div className="container mx-auto px-4 z-10 relative">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6 relative">
            <div className="absolute inset-0 flex items-center justify-center scale-110 opacity-30 blur-sm parallax-element" data-speed="0.03">
              <h1 className="text-4xl md:text-7xl font-bold leading-tight font-['Space_Grotesk']">
                <span className="text-gradient">Transforming Ideas</span>
              </h1>
            </div>
            <h1 className="text-4xl md:text-7xl font-bold mb-2 leading-tight font-['Space_Grotesk'] relative z-10">
              <span className="text-gradient">
                {userName ? `Welcome, ${userName}` : 'Transforming Ideas'}
              </span>
            </h1>
          </div>
          
          <div className="relative">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight font-['Space_Grotesk'] relative z-10">
              Into Digital <span className="relative inline-block">
                <span className="relative z-10">Excellence</span>
                <span className="absolute -bottom-2 left-0 right-0 h-3 bg-tech-gold/30 skew-x-12 z-0 parallax-element" data-speed="0.02"></span>
              </span>
            </h1>
          </div>
          
          <p className="text-xl md:text-2xl text-foreground/80 mb-10 max-w-3xl mx-auto font-['Outfit'] neo-border p-6 glass-panel">
            {userName 
              ? `${userName}, we deliver premium digital solutions that merge innovation with creativity, crafted just for you.` 
              : `VAW Technologies delivers premium digital solutions that merge innovation with creativity, 
              from stunning websites to immersive AR/VR experiences.`
            }
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/80 text-primary-foreground group relative overflow-hidden">
              <span className="relative z-10 flex items-center">
                Our Services 
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <span className="absolute inset-0 bg-tech-red/90 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
            </Button>
            <Button size="lg" variant="outline" className="border-accent text-accent hover:bg-accent/10 relative overflow-hidden group">
              <span className="relative z-10">Get in Touch</span>
              <span className="absolute inset-0 bg-accent/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
            </Button>
          </div>
          
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center transform hover:scale-110 transition-transform duration-300 cursor-default">
              <span className="text-4xl font-bold text-gradient">150+</span>
              <span className="text-muted-foreground">Projects Delivered</span>
            </div>
            <div className="flex flex-col items-center transform hover:scale-110 transition-transform duration-300 cursor-default">
              <span className="text-4xl font-bold text-gradient">95%</span>
              <span className="text-muted-foreground">Client Satisfaction</span>
            </div>
            <div className="flex flex-col items-center transform hover:scale-110 transition-transform duration-300 cursor-default">
              <span className="text-4xl font-bold text-gradient">10+</span>
              <span className="text-muted-foreground">Industries Served</span>
            </div>
            <div className="flex flex-col items-center transform hover:scale-110 transition-transform duration-300 cursor-default">
              <span className="text-4xl font-bold text-gradient">24/7</span>
              <span className="text-muted-foreground">Support</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10"></div>
      
      {/* Animated geometric elements */}
      <div className="absolute left-10 top-1/3 w-16 h-16 border-2 border-tech-gold/30 animate-float opacity-40 parallax-element" data-speed="0.07" style={{animationDelay: '0.5s'}}></div>
      <div className="absolute right-10 top-1/4 w-12 h-12 border-2 border-tech-red/30 rotate-45 animate-float opacity-40 parallax-element" data-speed="0.05" style={{animationDelay: '1s'}}></div>
      <div className="absolute left-1/4 bottom-1/4 w-20 h-20 border-2 border-tech-purple/30 rounded-full animate-float opacity-40 parallax-element" data-speed="0.06" style={{animationDelay: '1.5s'}}></div>
    </section>
  );
};

export default Hero;
