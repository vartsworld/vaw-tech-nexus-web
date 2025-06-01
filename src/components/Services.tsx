
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface ServiceCardProps {
  title: string;
  description: string;
  examples: string[];
  className?: string;
  style?: React.CSSProperties;
  linkTo?: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  description,
  examples,
  className = "",
  style,
  linkTo = "/service-request"
}) => {
  const [isHovered, setIsHovered] = useState(false);
  return <Card className={`bg-card border-muted/20 hover:border-primary/50 transition-all duration-500 shadow-lg hover:shadow-tech-gold/20 h-full ${className} relative group overflow-hidden`} style={style} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      {/* Decorative corner lines */}
      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-tech-gold/0 group-hover:border-tech-gold/30 transition-all duration-500"></div>
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-tech-gold/0 group-hover:border-tech-gold/30 transition-all duration-500"></div>
      
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-tech-gold/0 via-tech-red/0 to-tech-purple/0 group-hover:from-tech-gold/5 group-hover:via-tech-red/5 group-hover:to-tech-purple/5 transition-all duration-700 opacity-0 group-hover:opacity-100"></div>
      
      <CardHeader>
        <CardTitle className="text-xl font-semibold relative">
          <span className="relative z-10 inline-block transform transition-transform duration-300 group-hover:translate-x-1">{title}</span>
          <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-tech-gold/30 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 delay-100"></span>
        </CardTitle>
        <CardDescription className="text-muted-foreground">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <ul className="list-none space-y-1">
          {examples.map((example, index) => <li key={index} className="text-foreground/80 flex items-start group" style={{
          transform: isHovered ? 'translateX(5px)' : 'none',
          opacity: isHovered ? 1 : 0.8,
          transition: `transform 0.3s ease, opacity 0.3s ease`,
          transitionDelay: `${index * 0.05}s`
        }}>
              <div className="mr-2 flex-shrink-0 h-5 w-5 bg-tech-gold/10 rounded-full flex items-center justify-center text-[10px] text-tech-gold group-hover:bg-tech-gold/20 transition-colors">
                <span>✓</span>
              </div>
              <span>{example}</span>
            </li>)}
        </ul>
      </CardContent>
      <CardFooter>
        <Button variant="ghost" className="text-accent hover:text-accent/80 hover:bg-accent/10 px-0 group" asChild>
          <Link to={linkTo}>
            <span>Learn more</span>
            <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-300 transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>;
};

const Services = () => {
  const services = [{
    title: "Website Development",
    description: "Creating stunning, responsive websites that deliver exceptional user experiences.",
    examples: ["Creative business websites", "E-commerce platforms", "Portfolio showcases", "Crypto trending portals", "AI-integrated websites"]
  }, {
    title: "WebApp Development",
    description: "Building robust, scalable web applications tailored to your business needs.",
    examples: ["Custom CRM systems", "Inventory management apps", "Project management platforms", "Online learning portals", "Booking and reservation systems"]
  }, {
    title: "AI Solutions",
    description: "Leveraging artificial intelligence to create smart, innovative digital products.",
    examples: ["AI character chatbots", "Voice assistants", "Predictive analytics tools", "Content recommendation systems", "Natural language processing apps"]
  }, {
    title: "VR/AR Development",
    description: "Creating immersive virtual and augmented reality experiences that engage and inspire.",
    examples: ["Virtual product showcases", "AR marketing campaigns", "Interactive training simulations", "Virtual tours and exhibitions", "AR mobile applications"]
  }, {
    title: "Digital Marketing",
    description: "Strategic marketing solutions to boost your online presence and drive growth.",
    examples: ["SEO optimization", "Social media marketing", "Content marketing strategies", "Email campaigns", "Analytics and performance tracking"],
    linkTo: "/digital-marketing"
  }, {
    title: "Digital Design",
    description: "Creative digital designs that captivate audience attention and strengthen brand identity.",
    examples: ["Digital posters & advertisements", "E-books & catalogues", "Digital albums", "Brand identity packages", "NFC digital card solutions"]
  }];

  return <section id="services" className="relative overflow-hidden py-0">
      {/* Background decorative elements */}
      <div className="absolute top-40 left-10 w-64 h-64 rounded-full bg-tech-gold/5 blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-tech-red/5 blur-3xl"></div>
      
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-['Space_Grotesk'] relative inline-block">
            Our <span className="text-gradient">Premium Services</span>
            <div className="absolute -bottom-4 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-tech-gold/50 to-transparent"></div>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-['Outfit']">
            Comprehensive digital solutions designed to elevate your brand and streamline your operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 staggered-fade-in">
          {services.map((service, index) => <ServiceCard key={index} title={service.title} description={service.description} examples={service.examples} className="tech-hover-card" style={{
          animationDelay: `${index * 0.1}s`
        } as React.CSSProperties} linkTo={service.linkTo} />)}
        </div>
      </div>
      
      <div className="mt-16 text-center">
        <Button size="lg" className="btn-3d bg-primary hover:bg-primary/80 text-primary-foreground group relative overflow-hidden" asChild>
          <Link to="/service-request">
            <span className="relative z-10">Request Custom Service</span>
            <span className="absolute inset-0 bg-gradient-to-r from-tech-red to-tech-gold opacity-0 group-hover:opacity-20 transition-opacity duration-500"></span>
          </Link>
        </Button>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 tech-divider w-1/2"></div>
    </section>;
};

export default Services;
