
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Palette, FileImage, Book, CreditCard, Sparkles, Layers } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

const DigitalDesign = () => {
  const designServices = [
    {
      icon: FileImage,
      title: "Digital Posters & Advertisements",
      description: "Eye-catching visual marketing materials",
      features: ["Social media graphics", "Banner designs", "Print-ready formats", "Brand consistency"],
      color: "tech-gold"
    },
    {
      icon: Book,
      title: "E-books & Catalogues",
      description: "Professional digital publications",
      features: ["Interactive layouts", "Mobile-responsive", "PDF optimization", "Custom typography"],
      color: "tech-red"
    },
    {
      icon: Layers,
      title: "Digital Albums",
      description: "Stunning photo and portfolio collections",
      features: ["Gallery layouts", "Animation effects", "Social sharing", "Cloud integration"],
      color: "tech-purple"
    },
    {
      icon: Sparkles,
      title: "Brand Identity Packages",
      description: "Complete visual identity solutions",
      features: ["Logo design", "Color palettes", "Typography", "Brand guidelines"],
      color: "tech-blue"
    },
    {
      icon: CreditCard,
      title: "NFC Digital Card Solutions",
      description: "Modern digital business card experiences",
      features: ["NFC technology", "QR code integration", "Contact sharing", "Analytics tracking"],
      color: "tech-cyan"
    }
  ];

  const designShowcase = [
    {
      title: "Brand Identity",
      image: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=400&h=300&fit=crop",
      category: "Branding"
    },
    {
      title: "Digital Marketing",
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=300&fit=crop",
      category: "Marketing"
    },
    {
      title: "Web Design",
      image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop",
      category: "Web"
    },
    {
      title: "Mobile App UI",
      image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=300&fit=crop",
      category: "Mobile"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Creative Digital Design & Branding"
        description="Professional digital design services. We create eye-catching posters, advertisements, e-books, brand identities, and NFC digital cards. Elevate your brand with VAW Technologies."
        keywords="digital design, branding, logo design, graphic design, posters, advertisements, e-books, NFC cards, brand identity, VAW, Varts"
      />
      <Navbar />
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 bg-gradient-to-br from-tech-gold/20 via-tech-dark to-background">
        <div className="absolute inset-0 bg-cyber-grid opacity-30"></div>
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-tech-gold/20 blur-3xl animate-pulse-gentle"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-tech-red/10 blur-3xl animate-float"></div>

        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-tech-gold/10 px-4 py-2 rounded-full mb-6 animate-slide-in">
              <Palette className="h-5 w-5 text-tech-gold" />
              <span className="text-tech-gold font-medium">Digital Design</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 font-['Space_Grotesk'] animate-slide-in" style={{ animationDelay: '0.2s' }}>
              Creative <span className="text-gradient bg-gradient-to-r from-tech-gold to-tech-red bg-clip-text text-transparent">Digital Designs</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-8 animate-slide-in" style={{ animationDelay: '0.4s' }}>
              Captivating audience attention and strengthening brand identity through innovative design solutions
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-in" style={{ animationDelay: '0.6s' }}>
              <Button size="lg" className="bg-tech-gold hover:bg-tech-gold/80 text-tech-dark group">
                <Link to="/service-request" className="flex items-center">
                  Start Design Project
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-tech-red text-tech-red hover:bg-tech-red/10">
                View Portfolio
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Design Showcase Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-['Space_Grotesk']">
              Our Design <span className="text-tech-gold">Showcase</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              A glimpse of our creative excellence across various design disciplines
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {designShowcase.map((item, index) => (
              <div key={index} className="group cursor-pointer animate-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="relative overflow-hidden rounded-2xl aspect-[4/3] bg-gradient-to-br from-tech-gold/10 to-tech-red/10">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-tech-dark/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-4 left-4 right-4 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <div className="text-sm text-tech-gold font-medium">{item.category}</div>
                    <div className="text-lg font-semibold">{item.title}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gradient-to-r from-tech-dark/30 to-tech-gray/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-['Space_Grotesk']">
              Our Design <span className="text-gradient">Services</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive digital design solutions that elevate your brand and engage your audience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {designServices.map((service, index) => (
              <Card key={index} className="group hover:shadow-neon transition-all duration-500 animate-slide-in relative overflow-hidden" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className={`absolute inset-0 bg-gradient-to-br from-${service.color}/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                <CardHeader className="relative">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br from-${service.color}/20 to-${service.color}/5 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <service.icon className={`h-6 w-6 text-${service.color}`} />
                    </div>
                    <div>
                      <CardTitle className={`text-xl group-hover:text-${service.color} transition-colors`}>
                        {service.title}
                      </CardTitle>
                    </div>
                  </div>
                  <CardDescription className="text-base">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <ul className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <div className={`w-1.5 h-1.5 bg-${service.color} rounded-full`}></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Design Process */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-['Space_Grotesk']">
              Our Creative <span className="text-tech-red">Process</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-5 gap-8">
            {[
              { step: "01", title: "Brief", desc: "Understanding your vision and requirements", icon: "💡" },
              { step: "02", title: "Research", desc: "Market analysis and inspiration gathering", icon: "🔍" },
              { step: "03", title: "Concept", desc: "Initial design concepts and ideation", icon: "✏️" },
              { step: "04", title: "Design", desc: "Detailed design development and refinement", icon: "🎨" },
              { step: "05", title: "Deliver", desc: "Final delivery and ongoing support", icon: "🚀" }
            ].map((item, index) => (
              <div key={index} className="text-center group animate-slide-in" style={{ animationDelay: `${index * 0.2}s` }}>
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-tech-gold/20 to-tech-red/20 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  {item.icon}
                </div>
                <div className="w-8 h-8 mx-auto mb-2 bg-gradient-to-r from-tech-gold to-tech-red rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-tech-gold transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Design Tools */}
      <section className="py-20 bg-gradient-to-r from-tech-gold/10 to-tech-red/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-['Space_Grotesk']">
              Our Design <span className="text-tech-purple">Toolkit</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {[
              { name: "Adobe Creative Suite", icon: "🎨" },
              { name: "Figma", icon: "🔷" },
              { name: "Sketch", icon: "💎" },
              { name: "Procreate", icon: "🖌️" },
              { name: "Canva Pro", icon: "📐" },
              { name: "After Effects", icon: "🎬" }
            ].map((tool, index) => (
              <div key={index} className="text-center group animate-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-tech-gold/20 to-tech-red/20 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  {tool.icon}
                </div>
                <p className="text-sm font-medium group-hover:text-tech-gold transition-colors">{tool.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 font-['Space_Grotesk']">
              Ready to Transform Your <span className="text-gradient">Brand?</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Let's create stunning digital designs that captivate your audience and strengthen your brand identity.
            </p>
            <Button size="lg" className="bg-gradient-to-r from-tech-gold to-tech-red hover:from-tech-gold/80 hover:to-tech-red/80 text-white">
              <Link to="/service-request" className="flex items-center">
                Start Your Design Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default DigitalDesign;
