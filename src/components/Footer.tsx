import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-muted/20 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand & Parentage */}
          <div className="col-span-1">
            <Link to="/" className="inline-block mb-4">
              <span className="font-bold text-2xl font-['Space_Grotesk'] text-gradient">
                VAW<span className="text-accent">tech</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              Premium digital solutions for businesses looking to innovate and excel in the digital landscape.
            </p>
            <div className="mb-6">
              <p className="text-xs text-muted-foreground mb-2">A subsidiary of:</p>
              <div className="flex items-center gap-3">
                <img 
                  src="/lovable-uploads/f3a836cc-e5eb-4f70-bc65-a5d8ea72f726.png" 
                  alt="V Arts World Logo" 
                  className="h-12 w-auto object-contain"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                <span className="font-semibold text-foreground">V ARTS WORLD PVT. LTD.</span><br/>
                <span className="text-xs">
                  <span className="text-red-500 font-bold">H</span>uman-centric
                  <span className="text-red-500 font-bold"> A</span>rt and
                  <span className="text-red-500 font-bold"> I</span>nnovations
                </span>
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} VAW Technologies.<br />
              All rights reserved.
            </p>
          </div>
          
          {/* Services */}
          <div>
            <h3 className="font-semibold text-base mb-4 text-foreground">Services</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/website-development" className="text-muted-foreground hover:text-accent transition-colors">Website Development</Link></li>
              <li><Link to="/webapp-development" className="text-muted-foreground hover:text-accent transition-colors">WebApp Development</Link></li>
              <li><Link to="/ai-solutions" className="text-muted-foreground hover:text-accent transition-colors">AI Solutions</Link></li>
              <li><Link to="/vr-ar-development" className="text-muted-foreground hover:text-accent transition-colors">VR/AR Development</Link></li>
              <li><Link to="/digital-marketing" className="text-muted-foreground hover:text-accent transition-colors">Digital Marketing</Link></li>
              <li><Link to="/digital-design" className="text-muted-foreground hover:text-accent transition-colors">Digital Design</Link></li>
            </ul>
          </div>
          
          {/* Company & Programs */}
          <div>
            <h3 className="font-semibold text-base mb-4 text-foreground">Company</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/about" className="text-muted-foreground hover:text-accent transition-colors">About Us</Link></li>
              <li><Link to="/careers" className="text-muted-foreground hover:text-accent transition-colors">Careers</Link></li>
              <li><Link to="/internship" className="text-muted-foreground hover:text-accent transition-colors">Internship</Link></li>
              <li><Link to="/academy" className="text-muted-foreground hover:text-accent transition-colors">Academy</Link></li>
              <li><Link to="/team" className="text-muted-foreground hover:text-accent transition-colors">Our Team</Link></li>
              <li><Link to="/terms-of-service" className="text-muted-foreground hover:text-accent transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy-policy" className="text-muted-foreground hover:text-accent transition-colors">Privacy Policy</Link></li>
              <li><Link to="/data-deletion" className="text-muted-foreground hover:text-accent transition-colors">Data Deletion</Link></li>
            </ul>
          </div>
          
          {/* Quick Links & Contact */}
          <div>
            <h3 className="font-semibold text-base mb-4 text-foreground">Connect</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/contact" className="text-muted-foreground hover:text-accent transition-colors">Contact Us</Link></li>
              <li><Link to="/pricing" className="text-muted-foreground hover:text-accent transition-colors">Pricing & Plans</Link></li>
              <li><Link to="/service-request" className="text-muted-foreground hover:text-accent transition-colors">Request Service</Link></li>
              <li>
                <a
                  href="https://marketing.vawtech.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-accent transition-colors"
                >
                  Marketing Site
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li className="pt-2 text-xs text-muted-foreground">
                Email: <a href="mailto:hello@vawtech.in" className="text-foreground hover:text-accent">hello@vawtech.in</a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-muted/20 flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground">
          <p className="mb-4 md:mb-0">
            Designed with ♥ by VAW Technologies
          </p>
          <p>
            V ARTS WORLD PVT. LTD.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
