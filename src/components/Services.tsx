
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ServiceCardProps {
  title: string;
  description: string;
  examples: string[];
  className?: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ title, description, examples, className = "" }) => {
  return (
    <Card className={`bg-card border-muted/20 hover:border-primary/50 transition-colors shadow-lg hover:shadow-primary/20 h-full ${className}`}>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        <CardDescription className="text-muted-foreground">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <ul className="list-disc pl-5 space-y-1">
          {examples.map((example, index) => (
            <li key={index} className="text-foreground/80">{example}</li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button variant="ghost" className="text-accent hover:text-accent/80 hover:bg-accent/10 px-0">
          Learn more
        </Button>
      </CardFooter>
    </Card>
  );
};

const Services = () => {
  const services = [
    {
      title: "Website Development",
      description: "Creating stunning, responsive websites that deliver exceptional user experiences.",
      examples: [
        "Creative business websites",
        "E-commerce platforms",
        "Portfolio showcases",
        "Crypto trending portals",
        "AI-integrated websites"
      ]
    },
    {
      title: "WebApp Development",
      description: "Building robust, scalable web applications tailored to your business needs.",
      examples: [
        "Custom CRM systems",
        "Inventory management apps",
        "Project management platforms",
        "Online learning portals",
        "Booking and reservation systems"
      ]
    },
    {
      title: "AI Solutions",
      description: "Leveraging artificial intelligence to create smart, innovative digital products.",
      examples: [
        "AI character chatbots",
        "Voice assistants",
        "Predictive analytics tools",
        "Content recommendation systems",
        "Natural language processing apps"
      ]
    },
    {
      title: "VR/AR Development",
      description: "Creating immersive virtual and augmented reality experiences that engage and inspire.",
      examples: [
        "Virtual product showcases",
        "AR marketing campaigns",
        "Interactive training simulations",
        "Virtual tours and exhibitions",
        "AR mobile applications"
      ]
    },
    {
      title: "Digital Marketing",
      description: "Strategic marketing solutions to boost your online presence and drive growth.",
      examples: [
        "SEO optimization",
        "Social media marketing",
        "Content marketing strategies",
        "Email campaigns",
        "Analytics and performance tracking"
      ]
    },
    {
      title: "Digital Design",
      description: "Creative digital designs that captivate audience attention and strengthen brand identity.",
      examples: [
        "Digital posters & advertisements",
        "E-books & catalogues",
        "Digital albums",
        "Brand identity packages",
        "NFC digital card solutions"
      ]
    },
  ];

  return (
    <section id="services" className="py-20 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-['Space_Grotesk']">
            Our <span className="text-gradient">Premium Services</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-['Outfit']">
            Comprehensive digital solutions designed to elevate your brand and streamline your operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <ServiceCard
              key={index}
              title={service.title}
              description={service.description}
              examples={service.examples}
              className="animate-float"
              // Stagger the animation slightly
              style={{ animationDelay: `${index * 0.1}s` } as React.CSSProperties}
            />
          ))}
        </div>
      </div>
      
      <div className="mt-16 text-center">
        <Button size="lg" className="bg-primary hover:bg-primary/80 text-primary-foreground">
          Request Custom Service
        </Button>
      </div>
    </section>
  );
};

export default Services;
