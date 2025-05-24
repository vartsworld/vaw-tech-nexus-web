
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ClientLogo } from "@/types/client-logos";

interface ClientLogoProps {
  src: string;
  alt: string;
}

const ClientLogoComponent: React.FC<ClientLogoProps> = ({ src, alt }) => {
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
  const [clientLogos, setClientLogos] = useState<ClientLogo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClientLogos();
  }, []);

  const fetchClientLogos = async () => {
    try {
      const { data, error } = await supabase
        .from("client_logos")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Error fetching client logos:", error);
        return;
      }

      setClientLogos(data || []);
    } catch (error) {
      console.error("Error fetching client logos:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="relative overflow-hidden my-0 px-0 py-0">
        <div className="container mx-auto px-4 pt-6 mt-0 pb-4 transition-all duration-300 smooth-scroll py-0">
          <h2 className="text-3xl md:text-4xl font-bold font-['Space_Grotesk'] text-center mb-12 animate-pulse-gentle">
            <span className="bg-gradient-to-r from-tech-blue via-[#33C3F0] to-[#0FA0CE] bg-clip-text text-transparent animate-gradient-x py-0 my-0">
              Trusted & Partnered with Industry Leaders
            </span>
          </h2>
          <div className="text-center py-8">
            <p>Loading client logos...</p>
          </div>
        </div>
      </section>
    );
  }

  if (clientLogos.length === 0) {
    return (
      <section className="relative overflow-hidden my-0 px-0 py-0">
        <div className="container mx-auto px-4 pt-6 mt-0 pb-4 transition-all duration-300 smooth-scroll py-0">
          <h2 className="text-3xl md:text-4xl font-bold font-['Space_Grotesk'] text-center mb-12 animate-pulse-gentle">
            <span className="bg-gradient-to-r from-tech-blue via-[#33C3F0] to-[#0FA0CE] bg-clip-text text-transparent animate-gradient-x py-0 my-0">
              Trusted & Partnered with Industry Leaders
            </span>
          </h2>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Client logos will appear here once added.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden my-0 px-0 py-0">
      <div className="container mx-auto px-4 pt-6 mt-0 pb-4 transition-all duration-300 smooth-scroll py-0">
        <h2 className="text-3xl md:text-4xl font-bold font-['Space_Grotesk'] text-center mb-12 animate-pulse-gentle">
          <span className="bg-gradient-to-r from-tech-blue via-[#33C3F0] to-[#0FA0CE] bg-clip-text text-transparent animate-gradient-x py-0 my-0">
            Trusted & Partnered with Industry Leaders
          </span>
        </h2>
        
        <div className="relative overflow-hidden before:absolute before:left-0 before:top-0 before:z-10 before:w-24 before:h-full before:bg-gradient-to-r before:from-background before:to-transparent after:absolute after:right-0 after:top-0 after:z-10 after:w-24 after:h-full after:bg-gradient-to-l after:from-background after:to-transparent">
          <div className="logo-carousel">
            <div className="logo-slide">
              {clientLogos.map((client, index) => (
                <ClientLogoComponent key={`original-${index}`} src={client.logo_url} alt={client.name} />
              ))}
            </div>
            <div className="logo-slide">
              {clientLogos.map((client, index) => (
                <ClientLogoComponent key={`duplicate-${index}`} src={client.logo_url} alt={client.name} />
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-10 flex justify-center my-[79px]">
          <div className="inline-flex items-center cyber-corner bg-card border border-tech-gold/20 px-6 py-3">
            <span className="text-gradient font-bold mr-2">+{clientLogos.length > 0 ? Math.max(30 - clientLogos.length, 0) : 30}</span>
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
