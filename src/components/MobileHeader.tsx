import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Moon, Sun, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "@/hooks/use-theme";

const navigationItems = [
  { name: "Home", href: "/" },
  { name: "About", href: "/#about" },
  { name: "Portfolio", href: "/#portfolio" },
  { name: "Pricing", href: "/pricing" },
  { name: "Contact", href: "/#contact" },
  { name: "Request Service", href: "/service-request" },
  { name: "Internship", href: "/internship" }
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

const MobileHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <div className="md:hidden">
      {/* Mobile Header Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Menu Button - Left */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="h-10 w-10"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>

          {/* Logo - Center */}
          <Link to="/" className="flex-1 flex justify-center">
            <img 
              src="/lovable-uploads/19a7ca2f-acf3-4596-a5c2-1a5ef9ece92b.png" 
              alt="VAW Technologies Logo" 
              className="h-12 w-auto"
            />
          </Link>

          {/* Theme Toggle - Right */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-10 w-10"
          >
            {theme === "dark" ? <Sun size={20} className="text-accent" /> : <Moon size={20} className="text-accent" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
      )}

      {/* Mobile Menu Drawer */}
      <div className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-background/98 backdrop-blur-md border-r border-border z-50 transform transition-transform duration-300 ${
        isMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <img 
              src="/lovable-uploads/19a7ca2f-acf3-4596-a5c2-1a5ef9ece92b.png" 
              alt="VAW Technologies Logo" 
              className="h-10 w-auto"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(false)}
              className="h-8 w-8"
            >
              <X size={16} />
            </Button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-2 px-4">
              {navigationItems.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className="block py-3 px-3 text-foreground/80 hover:text-accent hover:bg-muted/50 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}

              {/* Services Dropdown */}
              <div className="py-2">
                <button
                  className="flex items-center justify-between w-full py-3 px-3 text-foreground/80 hover:text-accent hover:bg-muted/50 rounded-lg transition-colors"
                  onClick={() => setIsServicesOpen(!isServicesOpen)}
                >
                  <span>Services</span>
                  <ChevronDown size={16} className={`transition-transform ${isServicesOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isServicesOpen && (
                  <div className="ml-4 mt-2 space-y-1">
                    {servicesItems.map((service, index) => (
                      <a
                        key={index}
                        href={service.href}
                        className="block py-2 px-3 text-sm text-foreground/70 hover:text-accent hover:bg-muted/30 rounded-lg transition-colors"
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsServicesOpen(false);
                        }}
                      >
                        {service.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              Get a Quote
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileHeader;