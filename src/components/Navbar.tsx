import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "@/hooks/use-theme";

const navigationItems = [
  { name: "Home", href: "/" },
  { name: "About", href: "/#about" },
  { name: "Portfolio", href: "/#portfolio" },
  { name: "Pricing", href: "/pricing" },
  { name: "Contact", href: "/#contact" },
  { name: "Request Service", href: "/service-request" },
  { name: "Internship", href: "/internship" },
  { name: "Intern Experience", href: "/intern-experience" }
];

const servicesItems = [
  { name: "All Our Services", href: "/pricing" },
  { name: "Website Development", href: "/website-development" },
  { name: "WebApp Development", href: "/webapp-development" },
  { name: "AI Solutions", href: "/ai-solutions" },
  { name: "VR/AR Development", href: "/vr-ar-development" },
  { name: "Digital Marketing", href: "/digital-marketing" },
  { name: "Digital Design", href: "/digital-design" }
];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`hidden md:block fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? "bg-card/95 backdrop-blur-md shadow-lg py-3 rounded-b-[2rem] mx-4 border border-border/50" : "bg-transparent py-5"
    }`}>
      <div className="container mx-auto flex justify-between items-center px-[147px]">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/19a7ca2f-acf3-4596-a5c2-1a5ef9ece92b.png" 
              alt="VAW Technologies Logo" 
              className="h-28 w-auto" 
            />
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="flex items-center gap-8">
          {navigationItems.map((item, index) => (
            <a 
              key={index} 
              href={item.href} 
              className="text-foreground/80 hover:text-accent transition-colors"
            >
              {item.name}
            </a>
          ))}
          
          {/* Services Dropdown */}
          <div 
            className="relative" 
            onMouseEnter={() => setIsServicesOpen(true)} 
            onMouseLeave={() => setIsServicesOpen(false)}
          >
            <button className="text-foreground/80 hover:text-accent transition-colors flex items-center gap-1">
              Services
              <ChevronDown size={16} className={`transition-transform ${isServicesOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isServicesOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-background/95 backdrop-blur-md border border-border rounded-lg shadow-lg py-2 z-50">
                {servicesItems.map((service, index) => (
                  <a 
                    key={index} 
                    href={service.href} 
                    className="block px-4 py-2 text-foreground/80 hover:text-accent hover:bg-muted/50 transition-colors"
                  >
                    {service.name}
                  </a>
                ))}
              </div>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")} 
            className="mr-2"
          >
            {theme === "dark" ? <Sun size={20} className="text-accent" /> : <Moon size={20} className="text-accent" />}
          </Button>
          
          <Button className="bg-primary hover:bg-primary/80 text-primary-foreground">
            Get a Quote
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;