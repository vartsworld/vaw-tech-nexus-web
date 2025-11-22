import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Coffee, Megaphone, Truck, Leaf, Gift, ShoppingCart, Sparkles, ArrowRight } from "lucide-react";
import heroImage from "@/assets/vaw-cups-hero.png";
import charactersImage from "@/assets/vaw-cups-characters.png";

const VAWCups = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left space-y-6 animate-fade-in">
              <div className="inline-block">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                  <Sparkles className="w-4 h-4" />
                  Eco-Friendly Marketing Solution
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Free Branded Cups
                </span>
                <br />
                <span className="text-foreground">For Your Business</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-xl">
                Get free branded paper cups & tissues while earning rewards for recycling. Join the sustainable marketing revolution!
              </p>
              <div className="flex gap-4 justify-center lg:justify-start flex-wrap pt-4">
                <Button size="lg" onClick={() => navigate("/vaw-cups/vendor")} className="gap-2 shadow-lg hover:shadow-xl transition-all">
                  <ShoppingCart className="w-5 h-5" />
                  Order Your Cups Now
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/vaw-cups/sponsor")} className="gap-2">
                  <Megaphone className="w-5 h-5" />
                  Advertise With Us
                </Button>
              </div>
            </div>
            <div className="relative animate-scale-in">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-3xl"></div>
              <img src={heroImage} alt="VAW Cups Mascot" className="relative w-full max-w-md mx-auto drop-shadow-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Characters Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Vendors, sponsors, and eco-warriors working together for a sustainable future
          </p>
          <img src={charactersImage} alt="VAW Community" className="w-full max-w-2xl mx-auto drop-shadow-xl rounded-2xl" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Simple, sustainable, and rewarding for everyone
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader>
                <Coffee className="w-12 h-12 text-primary mb-4 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-2xl">For Vendors</CardTitle>
                <CardDescription>Tea shops, cafés, events</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <Gift className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span>Get free branded cups & tissues</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ShoppingCart className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span>Place orders easily online</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Leaf className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span>Earn recycling points</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span>Redeem exciting rewards</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 hover:border-secondary/50">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-secondary/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader>
                <Megaphone className="w-12 h-12 text-secondary mb-4 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-2xl">For Sponsors</CardTitle>
                <CardDescription>Advertisers & brands</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-secondary mt-1 flex-shrink-0" />
                    <span>Print your ads on cups & tissues</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Coffee className="w-4 h-4 text-secondary mt-1 flex-shrink-0" />
                    <span>Target specific locations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-secondary mt-1 flex-shrink-0" />
                    <span>Track impressions & reach</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Leaf className="w-4 h-4 text-secondary mt-1 flex-shrink-0" />
                    <span>Show sustainability impact</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 hover:border-green-500/50">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader>
                <Leaf className="w-12 h-12 text-green-500 mb-4 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-2xl">Sustainability</CardTitle>
                <CardDescription>Eco-friendly initiative</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <Truck className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                    <span>Cup recycling system</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Gift className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                    <span>Waste collection tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                    <span>CO₂ savings metrics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Leaf className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                    <span>Reward eco-warriors</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Impact</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center p-6 rounded-2xl bg-card hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Coffee className="w-8 h-8 text-primary" />
              </div>
              <div className="text-4xl font-bold text-primary mb-2">10,000+</div>
              <div className="text-muted-foreground">Cups Distributed</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-card hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/10 mb-4">
                <ShoppingCart className="w-8 h-8 text-secondary" />
              </div>
              <div className="text-4xl font-bold text-secondary mb-2">500+</div>
              <div className="text-muted-foreground">Happy Vendors</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-card hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
                <Leaf className="w-8 h-8 text-green-500" />
              </div>
              <div className="text-4xl font-bold text-green-500 mb-2">2,000kg</div>
              <div className="text-muted-foreground">Recycled</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-card hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/10 mb-4">
                <Megaphone className="w-8 h-8 text-orange-500" />
              </div>
              <div className="text-4xl font-bold text-orange-500 mb-2">50+</div>
              <div className="text-muted-foreground">Active Sponsors</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default VAWCups;
