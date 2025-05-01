
import React from "react";

interface ClientLogoProps {
  src: string;
  alt: string;
}

const ClientLogo: React.FC<ClientLogoProps> = ({ src, alt }) => {
  return (
    <div className="flex items-center justify-center px-8">
      <img 
        src={src} 
        alt={alt} 
        className="h-12 w-auto object-contain transition-all duration-300 transform hover:scale-110" 
      />
    </div>
  );
};

const ClientLogos = () => {
  const clients = [
    {
      name: "Google",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/1200px-Google_2015_logo.svg.png"
    },
    {
      name: "Amazon",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/1024px-Amazon_logo.svg.png"
    },
    {
      name: "Microsoft",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/1200px-Microsoft_logo.svg.png"
    },
    {
      name: "Meta",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platforms_Inc._logo.svg/1200px-Meta_Platforms_Inc._logo.svg.png"
    },
    {
      name: "Apple",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/1200px-Apple_logo_black.svg.png"
    },
    {
      name: "Tesla",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Tesla_Motors.svg/1200px-Tesla_Motors.svg.png"
    }
  ];

  return (
    <section className="relative overflow-hidden py-10 my-0 px-0">
      <div className="container mx-auto px-4 pt-6 mt-0 pb-4 transition-all duration-300 smooth-scroll">
        <h2 className="text-3xl md:text-4xl font-bold font-['Space_Grotesk'] text-center mb-12 animate-pulse-gentle">
          <span className="bg-gradient-to-r from-tech-blue via-[#33C3F0] to-[#0FA0CE] bg-clip-text text-transparent animate-gradient-x">
            Trusted &amp; Partnered with Industry Leaders
          </span>
        </h2>
        
        <div className="relative overflow-hidden before:absolute before:left-0 before:top-0 before:z-10 before:w-24 before:h-full before:bg-gradient-to-r before:from-background before:to-transparent after:absolute after:right-0 after:top-0 after:z-10 after:w-24 after:h-full after:bg-gradient-to-l after:from-background after:to-transparent">
          <div className="logo-carousel">
            <div className="logo-slide">
              {clients.map((client, index) => (
                <ClientLogo key={`original-${index}`} src={client.logo} alt={client.name} />
              ))}
            </div>
            <div className="logo-slide">
              {clients.map((client, index) => (
                <ClientLogo key={`duplicate-${index}`} src={client.logo} alt={client.name} />
              ))}
            </div>
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
    </section>
  );
};

export default ClientLogos;
