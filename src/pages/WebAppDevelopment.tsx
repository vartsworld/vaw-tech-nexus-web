
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Code,
  Database,
  Globe,
  Zap,
  Shield,
  Users,
  BarChart3,
  Calendar,
  ShoppingCart,
  GraduationCap,
  Building2,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Layers,
  Smartphone,
  Clock
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

const WebAppDevelopment = () => {
  const [activeService, setActiveService] = useState(0);

  const services = [
    {
      title: "Custom CRM Systems",
      description: "Streamline your customer relationships with tailored CRM solutions",
      icon: Users,
      features: ["Customer Data Management", "Sales Pipeline Tracking", "Automated Workflows", "Analytics Dashboard"],
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Inventory Management Apps",
      description: "Optimize your inventory with real-time tracking and analytics",
      icon: Database,
      features: ["Real-time Stock Tracking", "Automated Reordering", "Multi-location Support", "Barcode Integration"],
      color: "from-green-500 to-emerald-500"
    },
    {
      title: "Project Management Platforms",
      description: "Enhance team collaboration and project delivery",
      icon: BarChart3,
      features: ["Task Management", "Team Collaboration", "Time Tracking", "Progress Analytics"],
      color: "from-purple-500 to-violet-500"
    },
    {
      title: "Online Learning Portals",
      description: "Create engaging educational experiences for your learners",
      icon: GraduationCap,
      features: ["Course Management", "Interactive Content", "Progress Tracking", "Certification System"],
      color: "from-orange-500 to-red-500"
    },
    {
      title: "Booking & Reservation Systems",
      description: "Simplify appointments and bookings for your business",
      icon: Calendar,
      features: ["Real-time Availability", "Automated Confirmations", "Payment Integration", "Calendar Sync"],
      color: "from-pink-500 to-rose-500"
    }
  ];

  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Optimized performance for seamless user experience"
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with 99.9% uptime guarantee"
    },
    {
      icon: Smartphone,
      title: "Mobile Responsive",
      description: "Perfect experience across all devices and screen sizes"
    },
    {
      icon: Layers,
      title: "Scalable Architecture",
      description: "Built to grow with your business needs"
    },
    {
      icon: Clock,
      title: "Real-time Updates",
      description: "Live data synchronization and instant notifications"
    },
    {
      icon: Code,
      title: "Clean Code",
      description: "Maintainable, well-documented, and future-proof code"
    }
  ];

  const techStack = [
    { name: "React", category: "Frontend" },
    { name: "Node.js", category: "Backend" },
    { name: "PostgreSQL", category: "Database" },
    { name: "AWS", category: "Cloud" },
    { name: "TypeScript", category: "Language" },
    { name: "GraphQL", category: "API" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveService((prev) => (prev + 1) % services.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [services.length]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Scalable Web App Development"
        description="Custom web application development services. We build CRM systems, inventory management apps, and complex project platforms. Scalable, secure, and modern web apps by VAW Technologies."
        keywords="web app development, custom software, CRM development, inventory management systems, SaaS development, VAW, Varts, Kerala tech agency"
      />
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-tech-gold/10 blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-tech-red/10 blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-tech-purple/5 blur-3xl animate-pulse delay-2000"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-tech-gold/20 text-tech-gold hover:bg-tech-gold/30 animate-fade-in">
                  <Sparkles className="w-4 h-4 mr-2" />
                  WebApp Development
                </Badge>
                <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                  Building <span className="text-gradient">Robust</span> &
                  <br />
                  <span className="text-gradient">Scalable</span> Web Apps
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Transform your business with custom web applications tailored to your unique needs.
                  From concept to deployment, we deliver solutions that drive growth and efficiency.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="btn-3d bg-primary hover:bg-primary/80 group" asChild>
                  <Link to="/service-request">
                    Start Your Project
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-tech-gold/30 hover:bg-tech-gold/10">
                  View Portfolio
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-8 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-tech-gold">50+</div>
                  <div className="text-sm text-muted-foreground">Projects Delivered</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-tech-gold">99.9%</div>
                  <div className="text-sm text-muted-foreground">Uptime SLA</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-tech-gold">24/7</div>
                  <div className="text-sm text-muted-foreground">Support</div>
                </div>
              </div>
            </div>

            <div className="relative">
              {/* Main App Mockup */}
              <div className="relative transform hover:scale-105 transition-transform duration-700">
                <div className="bg-gradient-to-br from-card via-card/80 to-card/60 rounded-2xl shadow-2xl p-8 backdrop-blur-sm border border-tech-gold/20">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>

                  <img
                    src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=600&h=400&fit=crop"
                    alt="Web Application Development"
                    className="w-full h-64 object-cover rounded-lg mb-6"
                  />

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Dashboard Analytics</h3>
                      <Badge className="bg-green-500/20 text-green-400">Live</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-tech-gold/10 rounded-lg p-3">
                        <div className="text-2xl font-bold text-tech-gold">2.4k</div>
                        <div className="text-sm text-muted-foreground">Active Users</div>
                      </div>
                      <div className="bg-tech-red/10 rounded-lg p-3">
                        <div className="text-2xl font-bold text-tech-red">98%</div>
                        <div className="text-sm text-muted-foreground">Performance</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-tech-gold/20 rounded-full flex items-center justify-center animate-bounce">
                <Code className="w-8 h-8 text-tech-gold" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-tech-red/20 rounded-full flex items-center justify-center animate-pulse">
                <Database className="w-6 h-6 text-tech-red" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Showcase */}
      <section className="py-20 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our <span className="text-gradient">WebApp Solutions</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive web application development services designed to transform your business operations
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {services.map((service, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all duration-500 ${activeService === index
                      ? 'border-tech-gold/50 shadow-lg shadow-tech-gold/20 scale-105'
                      : 'hover:border-tech-gold/30'
                    }`}
                  onClick={() => setActiveService(index)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${service.color} flex items-center justify-center`}>
                        <service.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{service.title}</CardTitle>
                        <CardDescription>{service.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  {activeService === index && (
                    <CardContent className="pt-0 animate-fade-in">
                      <div className="grid grid-cols-2 gap-2">
                        {service.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            <div className="relative">
              <div className="relative bg-gradient-to-br from-card to-card/80 rounded-2xl p-8 shadow-2xl border border-tech-gold/20">
                <img
                  src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=400&fit=crop"
                  alt="Custom Web Application"
                  className="w-full h-80 object-cover rounded-lg mb-6"
                />

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">
                    {services[activeService].title}
                  </h3>
                  <p className="text-muted-foreground">
                    {services[activeService].description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {services[activeService].features.map((feature, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose Our <span className="text-gradient">WebApp Development</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We deliver cutting-edge web applications with the latest technologies and best practices
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg hover:shadow-tech-gold/20 transition-all duration-300 tech-hover-card">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-tech-gold/20 to-tech-red/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-tech-gold" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-20 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our <span className="text-gradient">Technology Stack</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We use cutting-edge technologies to build robust and scalable web applications
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {techStack.map((tech, index) => (
              <div
                key={index}
                className="bg-card rounded-lg p-6 text-center hover:shadow-lg hover:shadow-tech-gold/20 transition-all duration-300 group"
              >
                <div className="text-lg font-semibold mb-2 group-hover:text-tech-gold transition-colors">
                  {tech.name}
                </div>
                <Badge variant="outline" className="text-xs">
                  {tech.category}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-tech-gold/10 via-transparent to-tech-red/10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Build Your <span className="text-gradient">Dream WebApp</span>?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Let's discuss your project requirements and create a custom solution that drives your business forward.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="btn-3d bg-primary hover:bg-primary/80 group" asChild>
                <Link to="/service-request">
                  Start Your Project
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-tech-gold/30 hover:bg-tech-gold/10" asChild>
                <Link to="/#contact">
                  Schedule Consultation
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default WebAppDevelopment;
