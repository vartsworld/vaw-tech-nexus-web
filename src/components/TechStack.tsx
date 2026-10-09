import { useUser } from "@/context/UserContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Cpu, Database } from "lucide-react";

interface TechItem {
  name: string;
  logo?: string;
  icon?: React.ReactNode;
}

const ALL_TECH_ITEMS: TechItem[] = [
  { name: "React", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" },
  { name: "Node.js", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" },
  { name: "Python", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" },
  { name: "AWS", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg" },
  { name: "MongoDB", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg" },
  { name: "WebXR", icon: <Cpu className="h-10 w-10 text-tech-purple" /> },
  { name: "TensorFlow", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tensorflow/tensorflow-original.svg" },
  { name: "Blockchain", icon: <Database className="h-10 w-10 text-tech-gold" /> },
  { name: "Angular", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angularjs/angularjs-original.svg" },
  { name: "WordPress", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/wordpress/wordpress-plain.svg" },
  { name: "Flutter", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg" },
  { name: "Laravel", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/laravel/laravel-original.svg" },
  { name: "Java", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg" },
  { name: "Ionic", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ionic/ionic-original.svg" },
  { name: "Salesforce", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/salesforce/salesforce-original.svg" },
  { name: "Shopify", logo: "https://upload.wikimedia.org/wikipedia/commons/0/0e/Shopify_logo_2018.svg" },
  { name: "Magento", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/magento/magento-original.svg" },
  { name: ".NET", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/dotnetcore/dotnetcore-original.svg" },
];

const TechStack = () => {
  const { userName } = useUser();

  // Duplicate list for smooth seamless continuous looping marquee
  const marqueeItems = [...ALL_TECH_ITEMS, ...ALL_TECH_ITEMS, ...ALL_TECH_ITEMS];

  return (
    <section id="tech-stack" className="relative overflow-hidden py-16 bg-muted/5 border-y border-border/30">
      <div className="container mx-auto px-4 text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 font-['Space_Grotesk']">
          Our Tech Stack & <span className="text-gradient">Expertise</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-['Outfit']">
          {userName
            ? `${userName}, we work with cutting-edge technologies to build future-proof software and digital solutions.`
            : "We work with future-proof technologies to deliver robust, scalable digital solutions."
          }
        </p>
      </div>

      {/* Unified Tech Stack Marquee */}
      <TooltipProvider>
        <div className="relative w-full overflow-hidden py-8 before:absolute before:left-0 before:top-0 before:z-10 before:w-28 before:h-full before:bg-gradient-to-r before:from-background before:to-transparent after:absolute after:right-0 after:top-0 after:z-10 after:w-28 after:h-full after:bg-gradient-to-l after:from-background after:to-transparent">
          <div className="flex items-center gap-12 w-max animate-[scroll_35s_linear_infinite] hover:[animation-play-state:paused]">
            {marqueeItems.map((item, index) => (
              <Tooltip key={`${item.name}-${index}`}>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center p-4 rounded-2xl bg-card border border-border/60 hover:border-primary/50 hover:scale-110 shadow-md hover:shadow-primary/20 transition-all duration-300 cursor-pointer shrink-0 w-20 h-20 md:w-24 md:h-24">
                    {item.logo ? (
                      <img
                        src={item.logo}
                        alt={item.name}
                        className="max-h-12 max-w-12 md:max-h-14 md:max-w-14 object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.fallback-tech-text')) {
                            const span = document.createElement('span');
                            span.className = 'fallback-tech-text text-sm font-bold text-primary';
                            span.innerText = item.name;
                            parent.appendChild(span);
                          }
                        }}
                      />
                    ) : (
                      item.icon
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-popover text-popover-foreground font-semibold px-3 py-1.5 text-xs shadow-lg rounded-md">
                  <p>{item.name}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      </TooltipProvider>
    </section>
  );
};

export default TechStack;
