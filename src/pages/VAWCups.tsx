import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Coffee, Megaphone, ShieldCheck, Truck, Leaf, Gift } from "lucide-react";

const VAWCups = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            VAW Marketing Portal
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Free branded paper cups & tissues distribution with sustainability rewards
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" onClick={() => navigate("/vaw-cups/vendor")} className="gap-2">
              <Coffee className="w-5 h-5" />
              Vendor Portal
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate("/vaw-cups/sponsor")} className="gap-2">
              <Megaphone className="w-5 h-5" />
              Sponsor Portal
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/vaw-cups/admin")} className="gap-2">
              <ShieldCheck className="w-5 h-5" />
              Admin Portal
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Coffee className="w-12 h-12 text-primary mb-4" />
                <CardTitle>For Vendors</CardTitle>
                <CardDescription>Tea shops, cafés, events</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Get free branded cups & tissues</li>
                  <li>• Place orders easily</li>
                  <li>• Earn recycling points</li>
                  <li>• Redeem rewards</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Megaphone className="w-12 h-12 text-secondary mb-4" />
                <CardTitle>For Sponsors</CardTitle>
                <CardDescription>Advertisers & brands</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Print your ads on cups</li>
                  <li>• Target specific locations</li>
                  <li>• Track impressions</li>
                  <li>• Sustainability impact</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Leaf className="w-12 h-12 text-green-500 mb-4" />
                <CardTitle>Sustainability</CardTitle>
                <CardDescription>Eco-friendly initiative</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Cup recycling system</li>
                  <li>• Waste collection tracking</li>
                  <li>• CO₂ savings metrics</li>
                  <li>• Reward eco-warriors</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10,000+</div>
              <div className="text-muted-foreground">Cups Distributed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-secondary mb-2">500+</div>
              <div className="text-muted-foreground">Vendors</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-500 mb-2">2,000kg</div>
              <div className="text-muted-foreground">Recycled</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-500 mb-2">50+</div>
              <div className="text-muted-foreground">Sponsors</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default VAWCups;
