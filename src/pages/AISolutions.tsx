
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Bot, Brain, MessageSquare, TrendingUp, FileText, Mic } from "lucide-react";
import { Link } from "react-router-dom";

const AISolutions = () => {
  const solutions = [
    {
      icon: MessageSquare,
      title: "AI Character Chatbots",
      description: "Intelligent conversational agents with personality",
      features: ["Natural conversations", "Personality customization", "Multi-language support", "Integration ready"]
    },
    {
      icon: Mic,
      title: "Voice Assistants",
      description: "Smart voice-enabled applications and interfaces",
      features: ["Speech recognition", "Natural language understanding", "Voice synthesis", "Custom commands"]
    },
    {
      icon: TrendingUp,
      title: "Predictive Analytics Tools",
      description: "Data-driven insights for better decision making",
      features: ["Trend analysis", "Forecasting models", "Real-time insights", "Custom dashboards"]
    },
    {
      icon: Brain,
      title: "Content Recommendation Systems",
      description: "Personalized content delivery algorithms",
      features: ["User behavior analysis", "Personalization engine", "A/B testing", "Performance metrics"]
    },
    {
      icon: FileText,
      title: "Natural Language Processing Apps",
      description: "Text analysis and language understanding solutions",
      features: ["Sentiment analysis", "Text classification", "Entity extraction", "Language translation"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 bg-gradient-to-br from-tech-dark via-tech-gray to-background">
        <div className="absolute inset-0 bg-cyber-grid opacity-30"></div>
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-tech-blue/10 blur-3xl animate-pulse-gentle"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-tech-purple/10 blur-3xl animate-float"></div>
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-tech-blue/10 px-4 py-2 rounded-full mb-6 animate-slide-in">
              <Bot className="h-5 w-5 text-tech-blue" />
              <span className="text-tech-blue font-medium">AI Solutions</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 font-['Space_Grotesk'] animate-slide-in" style={{ animationDelay: '0.2s' }}>
              Leveraging <span className="text-gradient bg-gradient-to-r from-tech-blue to-tech-purple bg-clip-text text-transparent">Artificial Intelligence</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 animate-slide-in" style={{ animationDelay: '0.4s' }}>
              Creating smart, innovative digital products that transform your business operations
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-in" style={{ animationDelay: '0.6s' }}>
              <Button size="lg" className="bg-tech-blue hover:bg-tech-blue/80 text-white group">
                <Link to="/service-request" className="flex items-center">
                  Get AI Consultation
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-tech-purple text-tech-purple hover:bg-tech-purple/10">
                View AI Portfolio
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* AI Image Section */}
      <section className="py-16 bg-gradient-to-r from-tech-dark/50 to-tech-gray/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 font-['Space_Grotesk']">
                The Future of <span className="text-tech-blue">Intelligence</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Our AI solutions combine cutting-edge machine learning algorithms with intuitive user experiences 
                to deliver intelligent systems that learn, adapt, and evolve with your business needs.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-tech-blue/5 rounded-lg">
                  <div className="text-2xl font-bold text-tech-blue">98%</div>
                  <div className="text-sm text-muted-foreground">Accuracy Rate</div>
                </div>
                <div className="text-center p-4 bg-tech-purple/5 rounded-lg">
                  <div className="text-2xl font-bold text-tech-purple">24/7</div>
                  <div className="text-sm text-muted-foreground">AI Availability</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video bg-gradient-to-br from-tech-blue/20 to-tech-purple/20 rounded-2xl overflow-hidden relative">
                <img 
                  src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=600&h=400&fit=crop" 
                  alt="AI Technology" 
                  className="w-full h-full object-cover animate-float"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-tech-dark/50 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="text-lg font-semibold">AI-Powered Innovation</div>
                  <div className="text-sm opacity-80">Transforming ideas into intelligent solutions</div>
                </div>
              </div>
              {/* Floating AI Elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-tech-blue/20 rounded-full flex items-center justify-center animate-bounce-subtle">
                <Brain className="h-8 w-8 text-tech-blue" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-tech-purple/20 rounded-full flex items-center justify-center animate-pulse-gentle">
                <Bot className="h-6 w-6 text-tech-purple" />
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
              Our <span className="text-gradient">AI Solutions</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive artificial intelligence services designed to revolutionize your business processes
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {solutions.map((solution, index) => (
              <Card key={index} className="group hover:shadow-cyber transition-all duration-500 animate-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-tech-blue/20 to-tech-purple/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <solution.icon className="h-6 w-6 text-tech-blue" />
                    </div>
                    <div>
                      <CardTitle className="text-xl group-hover:text-tech-blue transition-colors">
                        {solution.title}
                      </CardTitle>
                    </div>
                  </div>
                  <CardDescription className="text-base">
                    {solution.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {solution.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-tech-blue rounded-full"></div>
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

      {/* Process Section */}
      <section className="py-20 bg-gradient-to-r from-tech-dark/30 to-tech-gray/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-['Space_Grotesk']">
              Our AI Development <span className="text-tech-purple">Process</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Data Analysis", desc: "Understanding your data and requirements" },
              { step: "02", title: "Model Design", desc: "Creating custom AI architectures" },
              { step: "03", title: "Training", desc: "Machine learning model development" },
              { step: "04", title: "Deployment", desc: "Integration and ongoing optimization" }
            ].map((item, index) => (
              <div key={index} className="text-center group animate-slide-in" style={{ animationDelay: `${index * 0.2}s` }}>
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-tech-blue to-tech-purple rounded-full flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-tech-blue transition-colors">
                  {item.title}
                </h3>
                <p className="text-muted-foreground">{item.desc}</p>
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
              Ready to Transform Your Business with <span className="text-gradient">AI?</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Let's discuss how our AI solutions can revolutionize your operations and drive unprecedented growth.
            </p>
            <Button size="lg" className="bg-gradient-to-r from-tech-blue to-tech-purple hover:from-tech-blue/80 hover:to-tech-purple/80 text-white">
              <Link to="/service-request" className="flex items-center">
                Start Your AI Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AISolutions;
