import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Code, Database, Server, Cpu } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { supabase } from "@/integrations/supabase/client";
import { ClientLogo } from "@/types/client-logos";
interface TechItem {
  name: string;
  icon: React.ReactNode;
  description: string;
  category: string;
}
interface ClientLogoProps {
  src: string;
  alt: string;
}
const ClientLogoComponent: React.FC<ClientLogoProps> = ({
  src,
  alt
}) => {
  return <div className="flex items-center justify-center p-6 min-w-[200px]">
      <img src={src} alt={alt} className="h-20 w-auto object-contain hover:opacity-100 transition-all duration-300 filter grayscale hover:grayscale-0" />
    </div>;
};
const TechStack = () => {
  const [animatedIndex, setAnimatedIndex] = useState(0);
  const [clientLogos, setClientLogos] = useState<ClientLogo[]>([]);
  const {
    userName
  } = useUser();
  const isMobile = useIsMobile();
  const techItems: TechItem[] = [{
    name: "React",
    icon: <Code className="h-8 w-8 text-tech-blue" />,
    description: "Modern frontend development with React and Next.js",
    category: "Frontend"
  }, {
    name: "Node.js",
    icon: <Server className="h-8 w-8 text-tech-purple" />,
    description: "Scalable server-side solutions with Node.js",
    category: "Backend"
  }, {
    name: "Python",
    icon: <Code className="h-8 w-8 text-tech-blue" />,
    description: "AI & data processing with Python libraries",
    category: "AI & Data"
  }, {
    name: "AWS",
    icon: <Server className="h-8 w-8 text-tech-purple" />,
    description: "Cloud infrastructure with AWS services",
    category: "Cloud"
  }, {
    name: "MongoDB",
    icon: <Database className="h-8 w-8 text-tech-blue" />,
    description: "NoSQL database solutions for modern applications",
    category: "Database"
  }, {
    name: "WebXR",
    icon: <Cpu className="h-8 w-8 text-tech-purple" />,
    description: "Immersive AR/VR experiences with WebXR",
    category: "XR"
  }, {
    name: "TensorFlow",
    icon: <Cpu className="h-8 w-8 text-tech-blue" />,
    description: "AI & ML solutions with TensorFlow",
    category: "AI"
  }, {
    name: "Blockchain",
    icon: <Database className="h-8 w-8 text-tech-purple" />,
    description: "Blockchain development for web3 applications",
    category: "Web3"
  }];
  const techLogos = [{
    name: "Angular",
    logo: "/angular.png"
  }, {
    name: "WordPress",
    logo: "/wordpress.png"
  }, {
    name: "Flutter",
    logo: "/flutter.png"
  }, {
    name: "Laravel",
    logo: "/laravel.png"
  }, {
    name: "Java",
    logo: "/java.png"
  }, {
    name: "Ionic",
    logo: "/ionic.png"
  }, {
    name: "Salesforce",
    logo: "/salesforce.png"
  }, {
    name: "SharePoint",
    logo: "/sharepoint.png"
  }, {
    name: "Shopify",
    logo: "/shopify.png"
  }, {
    name: "Magento",
    logo: "/magento.png"
  }, {
    name: "Node.js",
    logo: "/nodejs.png"
  }, {
    name: ".NET",
    logo: "/dotnet.png"
  }];
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedIndex(prev => (prev + 1) % techItems.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [techItems.length]);
  useEffect(() => {
    fetchClientLogos();
  }, []);
  const fetchClientLogos = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('client_logos').select('*').eq('is_active', true).order('display_order', {
        ascending: true
      });
      if (error) {
        console.error('Error fetching client logos:', error);
        return;
      }
      if (data && data.length > 0) {
        setClientLogos(data as ClientLogo[]);
      }
    } catch (error) {
      console.error('Error fetching client logos:', error);
    }
  };
  return <section id="tech-stack" className="relative overflow-hidden py-0">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-['Space_Grotesk']">
            Our <span className="text-gradient">Tech Stack</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-['Outfit']">
            {userName ? `${userName}, we work with future-proof technologies to build optimal software solutions tailored for your needs.` : `We work with future-proof technologies for optimal software solutions and strategies.`}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {techItems.map((tech, index) => <Card key={index} className={`tech-card hover:-translate-y-2 transition-all duration-300 ${index === animatedIndex ? 'ring-2 ring-tech-purple/50' : ''}`}>
              <AspectRatio ratio={1 / 1} className="w-full">
                <CardContent className="flex flex-col items-center p-4 text-center h-full justify-center">
                  <div className="mb-2 bg-muted/30 p-3 rounded-full">
                    {tech.icon}
                  </div>
                  <h3 className="font-bold text-lg mb-1">{tech.name}</h3>
                  <p className="hidden md:block text-muted-foreground text-sm">{tech.description}</p>
                  <span className="mt-2 px-2 py-1 bg-muted/20 rounded-full text-xs font-medium">
                    {tech.category}
                  </span>
                </CardContent>
              </AspectRatio>
            </Card>)}
        </div>

        <div className="mb-6">
          <h3 className="text-2xl text-center font-bold mb-4 font-['Space_Grotesk']">
            {userName ? `${userName}, Our Expertise Includes` : 'Our Technical Expertise'}
          </h3>
          
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {techLogos.map((tech, index) => <div key={index} className="flex flex-col items-center justify-center py-2">
                <div className="h-8 md:h-10 w-12 md:w-16 flex items-center justify-center">
                  <img src={tech.logo} alt={tech.name} className="max-h-8 md:max-h-10 w-auto object-contain" onError={e => {
                console.error(`Failed to load image: ${tech.logo}`);
                e.currentTarget.style.display = 'none';
              }} />
                </div>
                <span className="text-xs mt-1">{tech.name}</span>
              </div>)}
          </div>
        </div>

        {clientLogos.length > 0 && <div className="mb-10">
            <h3 className="text-2xl text-center font-bold mb-8 font-['Space_Grotesk']">
              Loved by <span className="text-gradient">Our Clients</span>
            </h3>
            
            <div className="relative overflow-hidden py-12 before:absolute before:left-0 before:top-0 before:z-10 before:w-32 before:h-full before:bg-gradient-to-r before:from-background before:to-transparent after:absolute after:right-0 after:top-0 after:z-10 after:w-32 after:h-full after:bg-gradient-to-l after:from-background after:to-transparent">
              <div className="flex animate-[scroll_30s_linear_infinite] items-center">
                {/* Triple the logos for seamless loop */}
                {[...clientLogos, ...clientLogos, ...clientLogos].map((client, index) => <ClientLogoComponent key={`${client.id}-${index}`} src={client.logo_url} alt={client.name} />)}
              </div>
            </div>
          </div>}
      </div>
    </section>;
};
export default TechStack;