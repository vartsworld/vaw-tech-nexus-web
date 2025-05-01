
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/90 backdrop-blur-md shadow-lg py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/8a3ad1d1-fa8e-4a28-819d-ad6fc9fd461b.png" 
              alt="V Logo" 
              className="h-8 w-auto mr-2"
            />
            <span className="font-bold text-2xl font-['Space_Grotesk'] text-gradient">
              VAW<span className="text-accent">tech</span>
            </span>
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#services" className="text-foreground/80 hover:text-accent transition-colors">
            Services
          </a>
          <a href="#about" className="text-foreground/80 hover:text-accent transition-colors">
            About
          </a>
          <a href="#portfolio" className="text-foreground/80 hover:text-accent transition-colors">
            Portfolio
          </a>
          <a href="#contact" className="text-foreground/80 hover:text-accent transition-colors">
            Contact
          </a>
          <Button className="bg-accent hover:bg-accent/80 text-accent-foreground">
            Get a Quote
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-foreground" onClick={toggleMenu}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-md absolute top-full left-0 w-full py-4 shadow-lg">
          <div className="container mx-auto px-4 flex flex-col gap-4">
            <a 
              href="#services" 
              className="text-foreground/80 hover:text-accent transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Services
            </a>
            <a 
              href="#about" 
              className="text-foreground/80 hover:text-accent transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </a>
            <a 
              href="#portfolio" 
              className="text-foreground/80 hover:text-accent transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Portfolio
            </a>
            <a 
              href="#contact" 
              className="text-foreground/80 hover:text-accent transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </a>
            <Button className="bg-accent hover:bg-accent/80 text-accent-foreground w-full">
              Get a Quote
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
