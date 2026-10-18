import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "@/hooks/use-theme";
import vawLogoDark from "@/assets/vaw-logo-dark.png";

const navigationItems = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Pricing", href: "/pricing" },
  { name: "Contact", href: "/contact" },
  { name: "Request Service", href: "/service-request" },
];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 50;
      setIsScrolled(prev => prev !== scrolled ? scrolled : prev);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`hidden md:block fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? "bg-card/95 backdrop-blur-md shadow-lg py-3 rounded-b-[2rem] mx-4 border border-border/50" : "bg-transparent py-6"
    }`}>
      <div className="container mx-auto px-8">
        <div className="flex justify-between items-center">
          {/* Logo - Left Corner */}
          <Link to="/" className="flex items-center mr-12">
            <img
              src={theme === "dark" ? vawLogoDark : "/lovable-uploads/19a7ca2f-acf3-4596-a5c2-1a5ef9ece92b.png"}
              alt="VAW Technologies Logo"
              className="h-10 w-auto"
            />
          </Link>

          {/* Center Navigation */}
          <div className="flex items-center gap-8 flex-1 justify-center">
            {navigationItems.map((item, index) => (
              <Link
                key={index}
                to={item.href}
                className="text-foreground/80 hover:text-accent transition-colors font-medium px-2 text-sm"
                data-cuelume-hover="tick"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hover:bg-muted/50 hover:border hover:border-accent/30"
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun size={20} className="text-accent" /> : <Moon size={20} className="text-accent" />}
            </Button>

            <Link to="/contact">
              <Button className="bg-primary hover:bg-primary/80 text-primary-foreground px-6 font-semibold">
                Get a Quote
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
