
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type Partner } from "@/types/partners";
import { useUser } from "@/context/UserContext";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious 
} from "@/components/ui/carousel";
import { toast } from "@/hooks/use-toast";

interface PartnerLogoProps {
  src: string;
  alt: string;
}

const PartnerLogo: React.FC<PartnerLogoProps> = ({ src, alt }) => {
  return (
    <div className="flex items-center justify-center p-4">
      <img 
        src={src} 
        alt={alt} 
        className="h-16 w-auto object-contain hover:opacity-100 transition-all duration-300"
      />
    </div>
  );
};

const Partners = () => {
  const [featuredPartners, setFeaturedPartners] = useState<Partner[]>([]);
  const [partnerCount, setPartnerCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { userName } = useUser();
  
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        setLoading(true);
        
        // Fetch featured partners
        const { data: featuredData, error: featuredError } = await supabase
          .from('partners')
          .select('*')
          .eq('featured', true)
          .order('display_order', { ascending: true });
        
        if (featuredError) {
          throw new Error(featuredError.message);
        }
        
        // Count all partners
        const { count, error: countError } = await supabase
          .from('partners')
          .select('*', { count: 'exact', head: true });
        
        if (countError) {
          throw new Error(countError.message);
        }
        
        setFeaturedPartners(featuredData as Partner[]);
        setPartnerCount(count || 0);
      } catch (err) {
        console.error('Error fetching partners:', err);
        setError(err instanceof Error ? err.message : 'Failed to load partners');
        toast({
          title: "Error loading partners",
          description: "There was a problem loading partner information",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchPartners();
  }, []);
  
  // Show skeleton loader while loading
  if (loading) {
    return (
      <section className="py-12 bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2">Trusted by Industry Leaders</h3>
            <p className="text-muted-foreground">Loading partners...</p>
          </div>
          <div className="flex justify-center space-x-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-24 h-12 bg-muted/30 animate-pulse rounded"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  
  if (error) {
    return (
      <section className="py-8 bg-background/50">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground">Unable to load partner information</p>
        </div>
      </section>
    );
  }

  if (featuredPartners.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold mb-2 font-['Space_Grotesk']">
            {userName 
              ? `${userName}, We're Trusted by Industry Leaders` 
              : 'Trusted by Industry Leaders'
            }
          </h3>
          <p className="text-muted-foreground font-['Outfit']">
            Working with {partnerCount}+ organizations worldwide
          </p>
        </div>
        
        {/* Desktop view: Standard display */}
        <div className="hidden md:flex justify-center items-center space-x-12">
          {featuredPartners.map((partner) => (
            <PartnerLogo 
              key={partner.id} 
              src={partner.logo_url} 
              alt={partner.name} 
            />
          ))}
        </div>
        
        {/* Mobile view: Carousel */}
        <div className="md:hidden">
          <Carousel className="w-full max-w-xs mx-auto">
            <CarouselContent>
              {featuredPartners.map((partner) => (
                <CarouselItem key={partner.id} className="flex justify-center">
                  <PartnerLogo src={partner.logo_url} alt={partner.name} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-center mt-4">
              <CarouselPrevious className="relative static translate-y-0 mr-2" />
              <CarouselNext className="relative static translate-y-0" />
            </div>
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default Partners;
