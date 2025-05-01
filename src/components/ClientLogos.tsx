import React, { useEffect, useRef } from "react";
interface ClientLogoProps {
  src: string;
  alt: string;
}
const ClientLogo: React.FC<ClientLogoProps> = ({
  src,
  alt
}) => {
  return <div className="flex items-center justify-center p-4 group">
      <img src={src} alt={alt} className="h-16 w-auto object-contain grayscale hover:grayscale-0 opacity-70 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110" />
    </div>;
};
const ClientLogos = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const clients = [{
    name: "Google",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/1200px-Google_2015_logo.svg.png"
  }, {
    name: "Amazon",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/1024px-Amazon_logo.svg.png"
  }, {
    name: "Microsoft",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/1200px-Microsoft_logo.svg.png"
  }, {
    name: "Meta",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platforms_Inc._logo.svg/1200px-Meta_Platforms_Inc._logo.svg.png"
  }, {
    name: "Apple",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/1200px-Apple_logo_black.svg.png"
  }, {
    name: "Tesla",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Tesla_Motors.svg/1200px-Tesla_Motors.svg.png"
  }];
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const {
        left,
        width
      } = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - left;
      const mousePercentX = mouseX / width;

      // Pause animation when hovering
      if (mousePercentX >= 0 && mousePercentX <= 1) {
        const scrollers = containerRef.current.querySelectorAll<HTMLDivElement>('.scroller');
        const scrollPercentage = (mousePercentX - 0.5) * 2; // -1 to 1

        scrollers.forEach(scroller => {
          // Slow down or speed up based on mouse position
          const baseSpeed = scroller.dataset.direction === 'right' ? 25 : -25;
          const speedFactor = 1 - Math.abs(scrollPercentage) * 0.8;
          scroller.style.animationDuration = `${baseSpeed / speedFactor}s`;

          // Pause when mouse is in the middle
          if (Math.abs(scrollPercentage) < 0.1) {
            scroller.style.animationPlayState = 'paused';
          } else {
            scroller.style.animationPlayState = 'running';
          }
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  return <section ref={containerRef} className="relative overflow-hidden py-12 my-0 px-0">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-['Space_Grotesk']">
            Trusted &amp; Partnered by <span className="text-gradient text-blue-700">Industry Leaders</span>
          </h2>
        </div>
        
        <div className="relative overflow-hidden py-10 before:absolute before:left-0 before:top-0 before:z-10 before:w-24 before:h-full before:bg-gradient-to-r before:from-background before:to-transparent after:absolute after:right-0 after:top-0 after:z-10 after:w-24 after:h-full after:bg-gradient-to-l after:from-background after:to-transparent">
          <div className="flex scroller" data-direction="right" style={{
          animation: 'scroll 25s linear infinite'
        }}>
            {[...clients, ...clients].map((client, index) => <ClientLogo key={index} src={client.logo} alt={client.name} />)}
          </div>
          
          <div className="flex scroller mt-8" data-direction="left" style={{
          animation: 'scroll 25s linear infinite reverse'
        }}>
            {[...clients.slice().reverse(), ...clients.slice().reverse()].map((client, index) => <ClientLogo key={index + 100} src={client.logo} alt={client.name} />)}
          </div>
        </div>
        
        <div className="mt-10 flex justify-center">
          <div className="inline-flex items-center cyber-corner bg-card border border-tech-gold/20 px-6 py-3">
            <span className="text-gradient font-bold mr-2">+30</span>
            <span className="text-muted-foreground">More Global Partners</span>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute -left-16 bottom-0 w-32 h-32 border border-tech-gold/10 rounded-full opacity-30"></div>
      <div className="absolute right-20 top-10 w-16 h-16 border-2 border-tech-red/20 transform rotate-45 opacity-30 animate-float" style={{
      animationDelay: '0.5s'
    }}></div>
    </section>;
};
export default ClientLogos;