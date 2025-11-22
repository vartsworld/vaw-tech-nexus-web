import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Coffee, Megaphone, Truck, Leaf, Gift, ShoppingCart, Sparkles, ArrowRight } from "lucide-react";
import heroImage from "@/assets/vaw-cups-hero.png";
import charactersImage from "@/assets/vaw-cups-characters.png";

const VAWCups = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white light">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden bg-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-orange-200 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-green-200 rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left space-y-6 animate-fade-in">
              <div className="inline-block">
                <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-yellow-400/20 to-green-400/20 border-2 border-yellow-400/30 text-yellow-700 text-sm font-semibold mb-4 shadow-lg">
                  <Sparkles className="w-4 h-4" />
                  ✨ Spread Joy, Earn Rewards ✨
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="block text-orange-600 mb-2">WELCOME TO</span>
                <span className="block bg-gradient-to-r from-yellow-500 via-orange-500 to-green-500 bg-clip-text text-transparent drop-shadow-sm">
                  VAW CUPS & TISSUES
                </span>
              </h1>
              <p className="text-xl text-gray-700 max-w-xl leading-relaxed">
                🌟 Bringing smiles to your customers with free branded cups & tissues! 🌿 Earn amazing rewards while making our planet greener 🌍
              </p>
              <div className="flex gap-4 justify-center lg:justify-start flex-wrap pt-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate("/vaw-cups/vendor")} 
                  className="gap-2 shadow-lg hover:shadow-2xl transition-all bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white border-0 text-lg px-8 py-6 rounded-full"
                >
                  <ShoppingCart className="w-6 h-6" />
                  Order Your Cups Now! 🎉
                  <ArrowRight className="w-6 h-6" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => navigate("/vaw-cups/sponsor")} 
                  className="gap-2 border-2 border-green-500 text-green-700 hover:bg-green-50 text-lg px-8 py-6 rounded-full"
                >
                  <Megaphone className="w-6 h-6" />
                  Advertise With Us 📢
                </Button>
              </div>
            </div>
            <div className="relative animate-scale-in">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-300/30 to-green-300/30 rounded-full blur-3xl animate-pulse"></div>
              <img src={heroImage} alt="VAW Cups Happy Mascot" className="relative w-full max-w-md mx-auto drop-shadow-2xl hover:scale-105 transition-transform duration-300" />
            </div>
          </div>
        </div>
      </section>

      {/* Characters Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Join Our Happy Community! 🌈
          </h2>
          <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
            Vendors, sponsors, and eco-warriors working together for a brighter, greener future! 💚
          </p>
          <div className="relative">
            <div className="absolute inset-0 bg-orange-100/30 rounded-3xl blur-2xl"></div>
            <img src={charactersImage} alt="VAW Happy Community" className="relative w-full max-w-2xl mx-auto drop-shadow-2xl rounded-3xl border-4 border-gray-100" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-orange-500 to-green-500 bg-clip-text text-transparent">
            How It Works ✨
          </h2>
          <p className="text-center text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            Simple, sustainable, and super rewarding for everyone! 🎯
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-orange-400 bg-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/30 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader>
                <Coffee className="w-14 h-14 text-orange-600 mb-4 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
                <CardTitle className="text-2xl text-orange-800">For Vendors 🏪</CardTitle>
                <CardDescription className="text-orange-600">Tea shops, cafés, events</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <Gift className="w-4 h-4 text-orange-500 mt-1 flex-shrink-0" />
                    <span>Get free branded cups & tissues</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ShoppingCart className="w-4 h-4 text-orange-500 mt-1 flex-shrink-0" />
                    <span>Place orders easily online</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Leaf className="w-4 h-4 text-orange-500 mt-1 flex-shrink-0" />
                    <span>Earn recycling points</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-orange-500 mt-1 flex-shrink-0" />
                    <span>Redeem exciting rewards</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-blue-400 bg-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/30 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader>
                <Megaphone className="w-14 h-14 text-blue-600 mb-4 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
                <CardTitle className="text-2xl text-blue-800">For Sponsors 📢</CardTitle>
                <CardDescription className="text-blue-600">Advertisers & brands</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                    <span>Print your ads on cups & tissues</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Coffee className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                    <span>Target specific locations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                    <span>Track impressions & reach</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Leaf className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                    <span>Show sustainability impact</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-green-400 bg-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/30 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader>
                <Leaf className="w-14 h-14 text-green-600 mb-4 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
                <CardTitle className="text-2xl text-green-800">Sustainability 🌿</CardTitle>
                <CardDescription className="text-green-600">Eco-friendly initiative</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-gray-700">
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
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent">
            Our Amazing Impact! 🎉
          </h2>
          <p className="text-center text-lg text-gray-700 mb-12">Making a difference, one cup at a time! 🌍</p>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center p-8 rounded-3xl bg-white hover:shadow-2xl transition-all hover:-translate-y-2 border border-gray-200">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-yellow-400 mb-4 shadow-lg">
                <Coffee className="w-10 h-10 text-white" />
              </div>
              <div className="text-5xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent mb-2">10,000+</div>
              <div className="text-gray-700 font-medium">Cups Distributed 🎉</div>
            </div>
            <div className="text-center p-8 rounded-3xl bg-white hover:shadow-2xl transition-all hover:-translate-y-2 border border-gray-200">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 mb-4 shadow-lg">
                <ShoppingCart className="w-10 h-10 text-white" />
              </div>
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">500+</div>
              <div className="text-gray-700 font-medium">Happy Vendors 😊</div>
            </div>
            <div className="text-center p-8 rounded-3xl bg-white hover:shadow-2xl transition-all hover:-translate-y-2 border border-gray-200">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 mb-4 shadow-lg">
                <Leaf className="w-10 h-10 text-white" />
              </div>
              <div className="text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">2,000kg</div>
              <div className="text-gray-700 font-medium">Recycled 🌿</div>
            </div>
            <div className="text-center p-8 rounded-3xl bg-white hover:shadow-2xl transition-all hover:-translate-y-2 border border-gray-200">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 mb-4 shadow-lg">
                <Megaphone className="w-10 h-10 text-white" />
              </div>
              <div className="text-5xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">50+</div>
              <div className="text-gray-700 font-medium">Active Sponsors 📢</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default VAWCups;
