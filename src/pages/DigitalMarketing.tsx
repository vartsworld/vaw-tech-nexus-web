import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Megaphone, Target, TrendingUp, Users, Mail, Phone, MapPin, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ParticleBackground from "@/components/ParticleBackground";
import { motion } from "framer-motion";

const DigitalMarketing = () => {
  const [activePackage, setActivePackage] = useState(null);

  const marketingServices = [
    "Page Management in Social Media Channels",
    "Weekly Content Planning", 
    "Preparation of Visual Designs",
    "Celebration of Special Days",
    "Comment Reply and Notification",
    "Campaign Planning and Creation",
    "Planning and Preparation of Video and GIF Content",
    "Data Tracking and Analysis",
    "Audience Optimization",
    "Advertising Management",
    "Reporting"
  ];

  const whatWeDo = [
    "Digital Marketing Consultation",
    "Social Media Management",
    "Website Design",
    "SEO Consulting",
    "Advertising Management",
    "Video Marketing",
    "Event Planning For Sales Boost",
    "Sales Boost Programs"
  ];

  const pricingPackages = [
    {
      name: "Basic",
      price: "₹12,999",
      period: "/ month",
      description: "Boosted 3 Ads",
      features: [
        "Each of 3 days Ad run within 20km",
        "Google Ads basic marketing",
        "Ads platform Facebook, Instagram, Google Search"
      ],
      popular: false
    },
    {
      name: "Basic Plus",
      price: "₹16,999", 
      period: "/ month",
      description: "Boosted 4 Poster",
      features: [
        "Each of 3 days Ad run within 30km",
        "Google Ads basic marketing",
        "Ads platform Facebook, Instagram, Messenger, Google Search"
      ],
      popular: true
    },
    {
      name: "Standard",
      price: "₹29,999",
      period: "/ month", 
      description: "Boosted 5 Poster",
      features: [
        "Each of 5 days Ad run",
        "Custom Radius Ads range",
        "Google Ads Standard",
        "Ads Complete Meta platform and Google Ads + Youtube"
      ],
      popular: false
    }
  ];

  const otherPackages = [
    {
      name: "Basic Social Media Managing",
      description: "(Facebook, Instagram, Messenger)",
      price: "₹2000 / monthly"
    },
    {
      name: "Advanced Social Media Managing", 
      description: "(Facebook, Instagram, Messenger, Google Business, Youtube)",
      price: "₹3000 / monthly"
    },
    {
      name: "Extra Addon",
      description: "twitter(X) page Managing + Social media and Business page setup",
      price: "₹500/ monthly + ₹1000 for 4 platforms"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <ParticleBackground />
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 relative">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-tech-purple to-tech-blue p-4 rounded-full">
                <Megaphone className="h-16 w-16 text-white animate-pulse" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 font-['Space_Grotesk']">
              Digital <span className="text-gradient">Marketing</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
              Virtual Arts org
            </p>
            <p className="text-2xl font-semibold text-tech-gold mb-8">
              Presentation and Bid File
            </p>
            <div className="bg-gradient-to-r from-tech-red/20 to-tech-purple/20 rounded-xl p-6 max-w-2xl mx-auto">
              <p className="text-lg font-medium">
                The most important rule in Digital Marketing:
              </p>
              <p className="text-tech-gold text-xl font-bold mt-2">
                To present the right offer to the right person at the right time, at the right place!
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.h2 
              variants={itemVariants}
              className="text-3xl md:text-4xl font-bold text-center mb-12 font-['Space_Grotesk']"
            >
              Social Media <span className="text-gradient">Management</span>
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {marketingServices.map((service, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="bg-card p-6 rounded-lg border hover:border-tech-gold/50 transition-all duration-300 hover:shadow-lg hover:shadow-tech-gold/20"
                >
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-tech-gold flex-shrink-0 mt-1" />
                    <span className="text-foreground">{service}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.h2 
              variants={itemVariants}
              className="text-3xl md:text-4xl font-bold text-center mb-12 font-['Space_Grotesk']"
            >
              What We Will Do <span className="text-gradient">For You</span>
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div variants={itemVariants}>
                <Card className="tech-card h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Target className="h-8 w-8 text-tech-blue" />
                      Our Services
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {whatWeDo.map((service, index) => (
                        <li key={index} className="flex items-center gap-3">
                          <ArrowRight className="h-4 w-4 text-tech-gold" />
                          <span>{service}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="tech-card h-full bg-gradient-to-br from-tech-gold/10 to-tech-red/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <TrendingUp className="h-8 w-8 text-tech-red" />
                      Special Offer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="text-6xl font-bold text-tech-gold mb-4">
                      49,999
                      <span className="text-2xl text-muted-foreground">/-</span>
                    </div>
                    <p className="text-lg text-muted-foreground mb-6">For 3 Months</p>
                    <Button className="bg-gradient-to-r from-tech-gold to-tech-red text-white hover:shadow-lg hover:shadow-tech-gold/50">
                      Get Started Now
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Packages Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.h2 
              variants={itemVariants}
              className="text-3xl md:text-4xl font-bold text-center mb-4 font-['Space_Grotesk']"
            >
              Digital Marketing <span className="text-gradient">Catalog</span>
            </motion.h2>
            <motion.p 
              variants={itemVariants}
              className="text-center text-xl text-tech-blue mb-8 font-semibold"
            >
              No hidden fees.
            </motion.p>
            <motion.p 
              variants={itemVariants}
              className="text-center text-muted-foreground mb-12"
            >
              We recommend giving it 3 months to see effective marketing results.
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {pricingPackages.map((pkg, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  className={`relative ${pkg.popular ? 'transform scale-105' : ''}`}
                >
                  <Card className={`tech-card h-full ${pkg.popular ? 'ring-2 ring-tech-gold/50' : ''}`}>
                    {pkg.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-tech-gold to-tech-red text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          Most Popular
                        </span>
                      </div>
                    )}
                    
                    <CardHeader className="text-center">
                      <CardTitle className="text-2xl font-bold">{pkg.name}</CardTitle>
                      <p className="text-muted-foreground">{pkg.description}</p>
                      <div className="py-4">
                        <div className="text-4xl font-bold text-tech-red">
                          {pkg.price}
                          <span className="text-lg text-muted-foreground">{pkg.period}</span>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <ul className="space-y-3 mb-6">
                        {pkg.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start gap-3">
                            <Check className="h-4 w-4 text-tech-gold flex-shrink-0 mt-1" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <Button 
                        className={`w-full ${pkg.popular ? 'bg-gradient-to-r from-tech-gold to-tech-red hover:shadow-lg hover:shadow-tech-gold/50' : 'bg-primary hover:bg-primary/90'} text-white`}
                        onClick={() => setActivePackage(pkg.name)}
                      >
                        Choose Plan
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Other Packages */}
            <motion.div variants={itemVariants}>
              <h3 className="text-2xl font-bold text-center mb-8">Other Packages</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {otherPackages.map((pkg, index) => (
                  <Card key={index} className="tech-card">
                    <CardContent className="p-6">
                      <h4 className="font-bold text-lg mb-2">{pkg.name}</h4>
                      <p className="text-muted-foreground text-sm mb-4">{pkg.description}</p>
                      <div className="text-xl font-bold text-tech-blue">{pkg.price}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Custom Package Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-3xl font-bold mb-6">V A Custom Package</h3>
            <div className="bg-gradient-to-br from-tech-purple/20 to-tech-blue/20 rounded-xl p-8 max-w-4xl mx-auto">
              <p className="text-lg mb-6">
                VAWs offers a custom digital marketing package, featuring based on priorities and 
                understanding specific needs of yours and we developed <span className="font-bold">Softwares</span>, <span className="font-bold">WebApps</span> And <span className="font-bold">Physical Objects</span> to enhance your marketing events
              </p>
              <Button size="lg" className="bg-gradient-to-r from-tech-purple to-tech-blue text-white">
                Request Custom Package
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gradient-to-br from-tech-purple/10 to-tech-blue/10">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-3xl font-bold mb-8">Contact Us</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <Card className="tech-card">
                <CardContent className="p-6 text-center">
                  <Phone className="h-8 w-8 text-tech-gold mx-auto mb-4" />
                  <h4 className="font-bold mb-2">Telephone</h4>
                  <p className="text-muted-foreground">9946882478</p>
                </CardContent>
              </Card>
              
              <Card className="tech-card">
                <CardContent className="p-6 text-center">
                  <Mail className="h-8 w-8 text-tech-blue mx-auto mb-4" />
                  <h4 className="font-bold mb-2">Contact Us</h4>
                  <p className="text-muted-foreground text-sm">admin@varts.org</p>
                  <p className="text-muted-foreground text-sm">info.virtualarts@gmail.com</p>
                </CardContent>
              </Card>
              
              <Card className="tech-card">
                <CardContent className="p-6 text-center">
                  <MapPin className="h-8 w-8 text-tech-red mx-auto mb-4" />
                  <h4 className="font-bold mb-2">Address</h4>
                  <p className="text-muted-foreground text-sm">E-schoolbooks/ Virtual Arts</p>
                  <p className="text-muted-foreground text-sm">Kundara, Kollam</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DigitalMarketing;
