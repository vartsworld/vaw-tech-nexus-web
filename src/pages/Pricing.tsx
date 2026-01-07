import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Clock, Star, Shield, Zap, Globe, TrendingUp, Bot } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ParticleBackground from "@/components/ParticleBackground";
import PricingInquiryForm from "@/components/PricingInquiryForm";

interface PricingTier {
  name: string;
  originalPrice: number;
  discountPrice: number;
  icon: React.ReactNode;
  popular?: boolean;
  features: string[];
  description: string;
}
const Pricing = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 3,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  useEffect(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3);
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;
      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor(distance % (1000 * 60 * 60 * 24) / (1000 * 60 * 60)),
          minutes: Math.floor(distance % (1000 * 60 * 60) / (1000 * 60)),
          seconds: Math.floor(distance % (1000 * 60) / 1000)
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const pricingTiers: PricingTier[] = [{
    name: "Basic Design Website",
    originalPrice: 16999,
    discountPrice: 8599,
    icon: <Globe className="h-8 w-8 text-tech-blue" />,
    description: "Perfect for small businesses and startups",
    features: ["Professional Website Design", "Free Domain for 1 Year", "Web Hosting Included", "SSL Certificate", "Mobile Responsive", "SEO Optimized", "Contact Form", "Social Media Integration"]
  }, {
    name: "Interactive & Creative Website",
    originalPrice: 28999,
    discountPrice: 19999,
    icon: <Zap className="h-8 w-8 text-tech-purple" />,
    popular: true,
    description: "Enhanced features for growing businesses",
    features: ["All Basic Features", "Interactive Elements", "Custom Animations", "Advanced Design", "Malware Security", "Performance Optimization", "Analytics Integration", "Email Setup", "Priority Support"]
  }, {
    name: "E-commerce Platform",
    originalPrice: 80000,
    discountPrice: 49999,
    icon: <Shield className="h-8 w-8 text-tech-gold" />,
    description: "Complete online store solution",
    features: ["Full E-commerce Setup", "Product Catalog", "Shopping Cart", "Payment Gateway", "Inventory Management", "Order Management", "Customer Dashboard", "Advanced Security", "Multi-currency Support"]
  }, {
    name: "Portfolio Showcase",
    originalPrice: 18999,
    discountPrice: 9999,
    icon: <Star className="h-8 w-8 text-tech-red" />,
    description: "Professional portfolio websites",
    features: ["Creative Portfolio Design", "Gallery Management", "Project Showcase", "Client Testimonials", "Blog Integration", "Custom Branding", "Performance Optimized", "SEO Enhanced"]
  }, {
    name: "Crypto Trending Portal",
    originalPrice: 500000,
    discountPrice: 500000,
    icon: <TrendingUp className="h-8 w-8 text-tech-purple" />,
    description: "Advanced cryptocurrency platforms",
    features: ["Real-time Crypto Data", "Trading Interface", "Portfolio Tracking", "News Integration", "Market Analytics", "User Authentication", "Advanced Security", "API Integrations", "Custom Dashboard"]
  }, {
    name: "AI-Integrated Website",
    originalPrice: 300000,
    discountPrice: 199999,
    icon: <Bot className="h-8 w-8 text-tech-gold" />,
    description: "Cutting-edge AI-powered websites",
    features: ["AI Chatbot Integration", "Machine Learning Features", "Personalization Engine", "Automated Content", "Smart Analytics", "Voice Integration", "Advanced AI Tools", "Custom AI Models", "Future-ready Technology"]
  }, {
    name: "Social Media-Based News Website",
    originalPrice: 15999,
    discountPrice: 7999,
    icon: <Globe className="h-8 w-8 text-tech-blue" />,
    description: "Perfect for news channels, vlogs & social media platforms",
    features: ["7 Days Development - Go Live Fast!", "Automatic Content Fetching", "1 Year Hosting Included", "Free Domain (.com / .in)", "SSL Certificate for Security", "Malware Protection & Security Suite", "Fully Managed Setup", "Social Media Integration"]
  }];
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };
  return <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <ParticleBackground />
      <Navbar />
      
      <section className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 font-['Space_Grotesk']">
              Choose Your <span className="text-gradient">Perfect Plan</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Professional web solutions tailored to your business needs with unbeatable pricing
            </p>
            
            {/* Countdown Timer */}
            <div className="bg-gradient-to-r from-tech-red/20 to-tech-gold/20 rounded-xl p-6 max-w-md mx-auto mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-tech-red animate-pulse" />
                <span className="text-lg font-semibold text-tech-red">Limited Time Offer!</span>
              </div>
              <div className="flex justify-center gap-4 text-center">
                <div className="bg-background/50 rounded-lg p-3 min-w-[60px]">
                  <div className="text-2xl font-bold text-tech-red">{timeLeft.days}</div>
                  <div className="text-xs text-muted-foreground">Days</div>
                </div>
                <div className="bg-background/50 rounded-lg p-3 min-w-[60px]">
                  <div className="text-2xl font-bold text-tech-red">{timeLeft.hours}</div>
                  <div className="text-xs text-muted-foreground">Hours</div>
                </div>
                <div className="bg-background/50 rounded-lg p-3 min-w-[60px]">
                  <div className="text-2xl font-bold text-tech-red">{timeLeft.minutes}</div>
                  <div className="text-xs text-muted-foreground">Minutes</div>
                </div>
                <div className="bg-background/50 rounded-lg p-3 min-w-[60px]">
                  <div className="text-2xl font-bold text-tech-red">{timeLeft.seconds}</div>
                  <div className="text-xs text-muted-foreground">Seconds</div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => <Card key={index} className={`tech-card relative ${tier.popular ? 'ring-2 ring-tech-gold/50 scale-105' : ''}`}>
                {tier.popular && <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-tech-gold to-tech-red text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>}
                
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className="bg-muted/30 p-3 rounded-full">
                      {tier.icon}
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                  <p className="text-muted-foreground text-sm">{tier.description}</p>
                  
                  <div className="py-4">
                    {tier.originalPrice !== tier.discountPrice && <div className="text-lg text-muted-foreground line-through">
                        {formatPrice(tier.originalPrice)}
                      </div>}
                    <div className="text-3xl font-bold text-tech-red">
                      {formatPrice(tier.discountPrice)}
                    </div>
                    {tier.originalPrice !== tier.discountPrice && <div className="text-sm text-tech-green font-medium">
                        Save {formatPrice(tier.originalPrice - tier.discountPrice)}
                      </div>}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, featureIndex) => <li key={featureIndex} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-tech-gold flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>)}
                  </ul>
                  
                  <PricingInquiryForm 
                    packageName={tier.name}
                    packagePrice={tier.discountPrice}
                  >
                    <Button className={`w-full ${tier.popular ? 'bg-gradient-to-r from-tech-gold to-tech-red hover:shadow-lg hover:shadow-tech-gold/50' : 'bg-primary hover:bg-primary/90'} text-white`}>
                      Get Started
                    </Button>
                  </PricingInquiryForm>
                </CardContent>
              </Card>)}
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <h3 className="text-2xl font-bold mb-4">
              Need a Custom Solution?
            </h3>
            <p className="text-muted-foreground mb-6">
              Contact us for enterprise solutions and custom development projects
            </p>
            <PricingInquiryForm 
              packageName="Custom Solution"
              packagePrice={0}
            >
              <Button size="lg" className="bg-gradient-to-r from-tech-purple to-tech-blue text-white">
                Contact Our Experts
              </Button>
            </PricingInquiryForm>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>;
};
export default Pricing;
