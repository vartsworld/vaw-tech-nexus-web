import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/context/UserContext";

interface PartnerBrand {
  id: string;
  name: string;
  logo_url: string;
}

const DEFAULT_BRANDS: PartnerBrand[] = [
  { id: "microsoft", name: "Microsoft", logo_url: "https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg" },
  { id: "google", name: "Google", logo_url: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" },
  { id: "aws", name: "Amazon Web Services", logo_url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg" },
  { id: "oracle", name: "Oracle", logo_url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/oracle/oracle-original.svg" },
  { id: "ibm", name: "IBM", logo_url: "https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg" },
  { id: "salesforce", name: "Salesforce", logo_url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/salesforce/salesforce-original.svg" },
  { id: "adobe", name: "Adobe", logo_url: "https://upload.wikimedia.org/wikipedia/commons/a/af/Adobe_Photoshop_CC_icon.svg" },
  { id: "shopify", name: "Shopify", logo_url: "https://upload.wikimedia.org/wikipedia/commons/0/0e/Shopify_logo_2018.svg" }
];

const Partners = () => {
  const [brands, setBrands] = useState<PartnerBrand[]>(DEFAULT_BRANDS);
  const { userName } = useUser();

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const { data, error } = await supabase
          .from("partners")
          .select("*")
          .eq("featured", true)
          .order("display_order", { ascending: true });

        if (!error && data && data.length > 0) {
          // Filter valid logo_urls and merge with fallbacks
          const dbBrands = (data as PartnerBrand[]).filter((p) => p.logo_url && p.logo_url.trim() !== "");
          if (dbBrands.length > 0) {
            setBrands(dbBrands);
          }
        }
      } catch (err) {
        console.warn("Using default partner logos:", err);
      }
    };

    fetchPartners();
  }, []);

  // Triple the items for continuous seamless loop
  const marqueeItems = [...brands, ...brands, ...brands];

  return (
    <section className="py-8 bg-muted/10 border-y border-border/30 overflow-hidden">
      <div className="container mx-auto px-4 mb-6 text-center">
        <h3 className="text-xl md:text-2xl font-bold font-['Space_Grotesk'] text-foreground">
          {userName
            ? `${userName}, We're Trusted by Industry Leaders`
            : "Trusted by Industry Leaders"
          }
        </h3>
        <p className="text-xs md:text-sm text-muted-foreground font-['Outfit'] mt-1">
          Powering innovation alongside world-class organizations
        </p>
      </div>

      {/* Small Marquee Slider */}
      <div className="relative w-full overflow-hidden py-4 before:absolute before:left-0 before:top-0 before:z-10 before:w-20 before:h-full before:bg-gradient-to-r before:from-background before:to-transparent after:absolute after:right-0 after:top-0 after:z-10 after:w-20 after:h-full after:bg-gradient-to-l after:from-background after:to-transparent">
        <div className="flex items-center gap-12 w-max animate-[scroll_25s_linear_infinite] hover:[animation-play-state:paused]">
          {marqueeItems.map((brand, idx) => (
            <div key={`${brand.id}-${idx}`} className="flex items-center justify-center shrink-0 px-4">
              <img
                src={brand.logo_url}
                alt={brand.name}
                className="h-7 md:h-9 max-w-[110px] object-contain filter grayscale hover:grayscale-0 opacity-80 hover:opacity-100 transition-all duration-300"
                onError={(e) => {
                  // Fallback on error to text badge
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent && !parent.querySelector('.fallback-badge')) {
                    const span = document.createElement('span');
                    span.className = 'fallback-badge text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 py-1 bg-muted/40 rounded';
                    span.innerText = brand.name;
                    parent.appendChild(span);
                  }
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Partners;
