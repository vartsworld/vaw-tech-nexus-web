import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle, Code, Palette, Smartphone, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const WebsiteDevelopment = () => {
  const features = [
    {
      icon: <Code className="h-8 w-8 text-tech-gold" />,
      title: "Custom Development",
      description: "Tailored solutions built from scratch to meet your specific business requirements."
    },
    {
      icon: <Smartphone className="h-8 w-8 text-tech-gold" />,
      title: "Responsive Design",
      description: "Websites that look and work perfectly on all devices, from desktop to mobile."
    },
    {
      icon: <Zap className="h-8 w-8 text-tech-gold" />,
      title: "Fast Performance",
      description: "Optimized for speed and SEO to ensure your website loads quickly and ranks well."
    },
    {
      icon: <Palette className="h-8 w-8 text-tech-gold" />,
      title: "Modern UI/UX",
      description: "Beautiful, intuitive interfaces that provide exceptional user experiences."
    }
  ];

  const services = [
    "Creative business websites",
    "E-commerce platforms", 
    "Portfolio showcases",
    "Crypto trending portals",
    "AI-integrated websites"
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 font-['Space_Grotesk']">
              Website <span className="text-gradient">Development</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8 font-['Outfit']">
              Creating stunning, responsive websites that deliver exceptional user experiences.
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/80 text-primary-foreground" asChild>
              <Link to="/pricing">
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Services We Offer */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-['Space_Grotesk']">
              What We <span className="text-gradient">Build</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From simple business websites to complex web applications
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {services.map((service, index) => (
              <Card key={index} className="bg-card border-muted/20 hover:border-primary/50 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-tech-gold flex-shrink-0" />
                    <span className="text-foreground font-medium">{service}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-['Space_Grotesk']">
              Why Choose <span className="text-gradient">Our Development</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We combine cutting-edge technology with creative design to deliver exceptional results
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card border-muted/20 hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    {feature.icon}
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 font-['Space_Grotesk']">
            Ready to Build Your <span className="text-gradient">Dream Website?</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Let's discuss your project and create a website that perfectly represents your brand and drives results.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/80 text-primary-foreground" asChild>
              <Link to="/pricing">
                View Pricing
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/service-request">
                Request Quote
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default WebsiteDevelopment;