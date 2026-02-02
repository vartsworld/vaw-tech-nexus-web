
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Eye, Smartphone, PlayCircle, Building, Gamepad2 } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

const VRARDevelopment = () => {
  const solutions = [
    {
      icon: Building,
      title: "Virtual Product Showcases",
      description: "Immersive 3D product demonstrations",
      features: ["360° product views", "Interactive features", "Realistic rendering", "Cross-platform support"]
    },
    {
      icon: PlayCircle,
      title: "AR Marketing Campaigns",
      description: "Engaging augmented reality marketing experiences",
      features: ["Brand activation", "Social media integration", "Viral marketing", "User engagement tracking"]
    },
    {
      icon: Gamepad2,
      title: "Interactive Training Simulations",
      description: "Safe, cost-effective training environments",
      features: ["Scenario-based learning", "Progress tracking", "Multi-user support", "Performance analytics"]
    },
    {
      icon: Eye,
      title: "Virtual Tours & Exhibitions",
      description: "Immersive virtual experiences for any space",
      features: ["Real estate tours", "Museum exhibitions", "Event showcases", "Remote accessibility"]
    },
    {
      icon: Smartphone,
      title: "AR Mobile Applications",
      description: "Mobile-first augmented reality solutions",
      features: ["iOS & Android", "Real-time tracking", "Social sharing", "Cloud integration"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Immersive VR & AR Development"
        description="Premium VR and AR development services. We create interactive 3D simulations, augmented reality marketing campaigns, and immersive virtual tours. Innovating with Unity and Unreal Engine."
        keywords="VR development, AR development, augmented reality, virtual reality, 3D simulations, Unity 3D, Unreal Engine, VAW, Varts, Kerala tech"
      />
      <Navbar />
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 bg-gradient-to-br from-tech-purple via-tech-dark to-background">
        <div className="absolute inset-0 bg-cyber-grid opacity-20"></div>
        <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-tech-purple/20 blur-3xl animate-morph"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-tech-cyan/10 blur-3xl animate-float"></div>

        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-tech-purple/10 px-4 py-2 rounded-full mb-6 animate-slide-in">
              <Eye className="h-5 w-5 text-tech-purple" />
              <span className="text-tech-purple font-medium">VR/AR Development</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 font-['Space_Grotesk'] animate-slide-in" style={{ animationDelay: '0.2s' }}>
              Creating <span className="text-gradient bg-gradient-to-r from-tech-purple to-tech-cyan bg-clip-text text-transparent">Immersive</span> Experiences
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-8 animate-slide-in" style={{ animationDelay: '0.4s' }}>
              Virtual and augmented reality solutions that engage, inspire, and transform user interactions
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-in" style={{ animationDelay: '0.6s' }}>
              <Button size="lg" className="bg-tech-purple hover:bg-tech-purple/80 text-white group">
                <Link to="/service-request" className="flex items-center">
                  Explore VR/AR Solutions
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-tech-cyan text-tech-cyan hover:bg-tech-cyan/10">
                View Demo Reel
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* VR/AR Showcase */}
      <section className="py-16 bg-gradient-to-r from-tech-dark/50 to-tech-purple/20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="aspect-video bg-gradient-to-br from-tech-purple/30 to-tech-cyan/20 rounded-2xl overflow-hidden relative group">
                <img
                  src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=600&h=400&fit=crop"
                  alt="VR Development"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-tech-dark/60 to-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                    <PlayCircle className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>

              {/* Floating VR Elements */}
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-tech-purple/20 rounded-full flex items-center justify-center animate-spin-slow">
                <Eye className="h-10 w-10 text-tech-purple" />
              </div>
              <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-tech-cyan/20 rounded-full flex items-center justify-center animate-bounce-subtle">
                <Smartphone className="h-8 w-8 text-tech-cyan" />
              </div>
            </div>

            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 font-['Space_Grotesk']">
                Beyond Reality, Into <span className="text-tech-purple">Innovation</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Our VR and AR solutions push the boundaries of what's possible, creating experiences that blur
                the line between digital and physical worlds. From virtual product showcases to immersive training
                simulations, we bring your vision to life.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-tech-purple/5 rounded-lg">
                  <div className="text-2xl font-bold text-tech-purple">50+</div>
                  <div className="text-sm text-muted-foreground">VR Projects</div>
                </div>
                <div className="text-center p-4 bg-tech-cyan/5 rounded-lg">
                  <div className="text-2xl font-bold text-tech-cyan">95%</div>
                  <div className="text-sm text-muted-foreground">User Satisfaction</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-['Space_Grotesk']">
              Our <span className="text-gradient">VR/AR Solutions</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive virtual and augmented reality services that transform how users interact with digital content
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {solutions.map((solution, index) => (
              <Card key={index} className="group hover:shadow-cyber transition-all duration-500 animate-slide-in overflow-hidden" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="absolute inset-0 bg-gradient-to-br from-tech-purple/5 to-tech-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardHeader className="relative">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-tech-purple/20 to-tech-cyan/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <solution.icon className="h-6 w-6 text-tech-purple" />
                    </div>
                    <div>
                      <CardTitle className="text-xl group-hover:text-tech-purple transition-colors">
                        {solution.title}
                      </CardTitle>
                    </div>
                  </div>
                  <CardDescription className="text-base">
                    {solution.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <ul className="space-y-2">
                    {solution.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-tech-purple rounded-full"></div>
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

      {/* Technology Stack */}
      <section className="py-20 bg-gradient-to-r from-tech-purple/10 to-tech-cyan/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-['Space_Grotesk']">
              Our <span className="text-tech-cyan">Technology Stack</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: "Unity 3D", category: "Game Engine", icon: "🎮" },
              { name: "Unreal Engine", category: "Development", icon: "🚀" },
              { name: "ARKit/ARCore", category: "Mobile AR", icon: "📱" },
              { name: "WebXR", category: "Web VR/AR", icon: "🌐" }
            ].map((tech, index) => (
              <div key={index} className="text-center group animate-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-tech-purple/20 to-tech-cyan/20 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  {tech.icon}
                </div>
                <h3 className="text-lg font-semibold mb-1 group-hover:text-tech-purple transition-colors">
                  {tech.name}
                </h3>
                <p className="text-sm text-muted-foreground">{tech.category}</p>
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
              Ready to Step Into the <span className="text-gradient">Future?</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Let's create immersive experiences that captivate your audience and revolutionize user engagement.
            </p>
            <Button size="lg" className="bg-gradient-to-r from-tech-purple to-tech-cyan hover:from-tech-purple/80 hover:to-tech-cyan/80 text-white">
              <Link to="/service-request" className="flex items-center">
                Start Your VR/AR Project
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

export default VRARDevelopment;
