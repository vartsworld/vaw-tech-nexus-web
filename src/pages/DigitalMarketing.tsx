import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Megaphone, Target, TrendingUp, Users, Mail, Phone, MapPin, Star, BarChart3, Globe, Zap, Shield, Award, PlayCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ParticleBackground from "@/components/ParticleBackground";
import { motion } from "framer-motion";

const DigitalMarketing = () => {
  const [activePackage, setActivePackage] = useState(null);

  const marketingServices = [
    { icon: Users, title: "Page Management", desc: "Complete social media management across platforms" },
    { icon: Target, title: "Content Planning", desc: "Strategic weekly content planning and scheduling" },
    { icon: Globe, title: "Visual Designs", desc: "Professional graphic design and visual content" },
    { icon: Award, title: "Special Days", desc: "Custom campaigns for holidays and events" },
    { icon: Mail, title: "Community Management", desc: "Active comment replies and engagement" },
    { icon: BarChart3, title: "Campaign Creation", desc: "Data-driven advertising campaigns" },
    { icon: PlayCircle, title: "Video Content", desc: "Video and GIF content production" },
    { icon: TrendingUp, title: "Analytics", desc: "Comprehensive data tracking and analysis" },
    { icon: Shield, title: "Audience Optimization", desc: "Targeted audience research and optimization" },
    { icon: Zap, title: "Ad Management", desc: "Professional advertising campaign management" },
    { icon: Star, title: "Reporting", desc: "Detailed performance reports and insights" }
  ];

  const whatWeDo = [
    "Digital Marketing Consultation",
    "Social Media Management", 
    "Website Design & Development",
    "SEO Consulting & Optimization",
    "Paid Advertising Management",
    "Video Marketing Production",
    "Event Planning For Sales Boost",
    "Sales Boost Programs & Strategies"
  ];

  const pricingPackages = [
    {
      name: "Basic",
      price: "₹12,999",
      period: "/ month",
      description: "Perfect for small businesses starting their digital journey",
      features: [
        "3 Boosted Ad campaigns",
        "20km radius targeting", 
        "3-day ad duration each",
        "Facebook & Instagram ads",
        "Google Ads basic setup",
        "Monthly performance report"
      ],
      popular: false,
      color: "from-blue-500 to-purple-600"
    },
    {
      name: "Basic Plus",
      price: "₹16,999", 
      period: "/ month",
      description: "Most popular choice for growing businesses",
      features: [
        "4 Boosted Ad campaigns",
        "30km radius targeting",
        "3-day ad duration each", 
        "Facebook, Instagram & Messenger",
        "Google Search Ads included",
        "Bi-weekly performance reports",
        "Basic social media management"
      ],
      popular: true,
      color: "from-purple-600 to-pink-600"
    },
    {
      name: "Standard",
      price: "₹29,999",
      period: "/ month", 
      description: "Comprehensive solution for established businesses",
      features: [
        "5 Boosted Ad campaigns",
        "Custom radius targeting",
        "5-day ad duration each",
        "Complete Meta platform coverage",
        "Google Ads + YouTube advertising",
        "Weekly detailed reports",
        "Advanced social media strategy",
        "Dedicated account manager"
      ],
      popular: false,
      color: "from-pink-600 to-red-600"
    }
  ];

  const otherPackages = [
    {
      name: "Basic Social Media Managing",
      description: "Facebook, Instagram, Messenger management",
      price: "₹2,000",
      period: "monthly",
      features: ["3 platforms", "Basic posting", "Community management"]
    },
    {
      name: "Advanced Social Media Managing", 
      description: "Complete social media ecosystem management",
      price: "₹3,000",
      period: "monthly", 
      features: ["5 platforms", "Content strategy", "Analytics", "Google Business"]
    },
    {
      name: "Premium Add-on Package",
      description: "Twitter(X) + Complete setup for all platforms",
      price: "₹500",
      period: "monthly + ₹1,000 setup",
      features: ["Twitter management", "Complete setup", "Brand optimization"]
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <ParticleBackground />
      <Navbar />
      
      {/* Hero Section - Enhanced with Golden Rule */}
      <section className="pt-32 pb-20 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-tech-purple/5 via-tech-blue/5 to-tech-gold/5"></div>
        <div className="container mx-auto px-4 relative">
          <motion.div 
            className="text-center max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex justify-center mb-8">
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-tech-purple via-tech-blue to-tech-gold rounded-full blur-lg opacity-30 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-tech-purple to-tech-blue p-6 rounded-full">
                  <Megaphone className="h-16 w-16 text-white" />
                </div>
              </motion.div>
            </div>
            
            <motion.h1 
              className="text-5xl md:text-7xl font-bold mb-6 font-['Space_Grotesk']"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              Digital <span className="bg-gradient-to-r from-tech-gold via-tech-red to-tech-purple bg-clip-text text-transparent">Marketing</span>
            </motion.h1>
            
            <motion.div 
              className="space-y-4 mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <p className="text-xl md:text-2xl text-muted-foreground font-medium">
                Virtual Arts Organization
              </p>
            </motion.div>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <Button size="lg" className="bg-gradient-to-r from-tech-purple to-tech-blue hover:from-tech-blue hover:to-tech-purple text-white font-semibold px-8 py-4 rounded-full transform transition-all duration-300 hover:scale-105 shadow-lg">
                Get Started Today
              </Button>
              <Button variant="outline" size="lg" className="border-tech-gold text-tech-gold hover:bg-tech-gold hover:text-black font-semibold px-8 py-4 rounded-full transform transition-all duration-300 hover:scale-105">
                View Our Work
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Golden Rule Section - New Prominent Section */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-tech-gold/10 via-transparent to-tech-purple/10 animate-gradient-x"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-tech-gold/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-tech-purple/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative">
          <motion.div
            className="text-center max-w-6xl mx-auto"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <motion.div
              className="inline-block mb-8"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            >
              <div className="bg-gradient-to-r from-tech-gold/20 to-tech-red/20 rounded-full p-4 backdrop-blur-sm border border-tech-gold/30">
                <Target className="h-12 w-12 text-tech-gold mx-auto" />
              </div>
            </motion.div>

            <motion.h2 
              className="text-3xl md:text-4xl font-bold mb-4 text-white"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              The Most Important Rule in Digital Marketing
            </motion.h2>

            <motion.div
              className="relative bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-tech-gold/30 shadow-2xl"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.8 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-tech-gold/5 via-tech-red/5 to-tech-purple/5 rounded-3xl animate-pulse"></div>
              
              <div className="relative">
                <motion.p 
                  className="text-lg md:text-xl text-gray-300 mb-6 font-medium"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                >
                  To present the
                </motion.p>
                
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-8 text-center"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1, duration: 0.8 }}
                >
                  {[
                    { text: "Right Offer", color: "from-tech-gold to-yellow-400" },
                    { text: "Right Person", color: "from-tech-blue to-cyan-400" },
                    { text: "Right Time", color: "from-tech-red to-pink-400" },
                    { text: "Right Place", color: "from-tech-purple to-violet-400" }
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      className="group"
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1.2 + index * 0.1, duration: 0.5 }}
                      whileHover={{ scale: 1.1 }}
                    >
                      <div className={`bg-gradient-to-r ${item.color} p-1 rounded-2xl group-hover:shadow-lg group-hover:shadow-current/50 transition-all duration-300`}>
                        <div className="bg-slate-800 rounded-xl px-4 py-6">
                          <h3 className={`text-2xl md:text-3xl font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent mb-2`}>
                            {item.text}
                          </h3>
                        </div>
                      </div>
                      {index < 3 && (
                        <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                          <motion.div
                            animate={{ x: [0, 5, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          >
                            <ArrowRight className="h-6 w-6 text-tech-gold" />
                          </motion.div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div
                  className="mt-8 text-center"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1.6, duration: 0.6 }}
                >
                  <p className="text-xl md:text-2xl font-bold text-tech-gold">
                    at the right time, at the right place!
                  </p>
                </motion.div>
              </div>
            </motion.div>

            <motion.p
              className="text-lg text-gray-400 mt-8 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1.8, duration: 0.6 }}
            >
              This fundamental principle guides every strategy we develop, every campaign we create, and every result we deliver. 
              Our data-driven approach ensures your message reaches the perfect audience when they're most receptive.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Services Grid - Redesigned */}
      <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 font-['Space_Grotesk']">
                Our <span className="text-gradient">Premium Services</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Comprehensive digital marketing solutions designed to elevate your brand and drive measurable results
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {marketingServices.map((service, index) => {
                const Icon = service.icon;
                return (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    whileHover={{ y: -10, scale: 1.02 }}
                    className="group"
                  >
                    <Card className="h-full bg-card/50 backdrop-blur-sm border-muted/20 hover:border-tech-gold/50 transition-all duration-500 hover:shadow-xl hover:shadow-tech-gold/20">
                      <CardContent className="p-6">
                        <div className="mb-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-tech-purple to-tech-blue rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <h3 className="text-xl font-bold mb-2 group-hover:text-tech-gold transition-colors">
                            {service.title}
                          </h3>
                          <p className="text-muted-foreground">
                            {service.desc}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* What We Do - Enhanced */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <motion.div variants={itemVariants}>
              <h2 className="text-4xl md:text-5xl font-bold mb-8 font-['Space_Grotesk']">
                What We <span className="text-gradient">Deliver</span>
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {whatWeDo.map((service, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-tech-gold/10 to-transparent hover:from-tech-gold/20 transition-all duration-300 group cursor-pointer"
                    whileHover={{ x: 10 }}
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-tech-gold to-tech-red rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-lg font-medium group-hover:text-tech-gold transition-colors">
                      {service}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="relative overflow-hidden bg-gradient-to-br from-tech-purple/20 via-tech-blue/20 to-tech-gold/20 border-tech-gold/30">
                <div className="absolute inset-0 bg-gradient-to-br from-tech-gold/5 to-tech-red/5 animate-gradient-x"></div>
                <CardContent className="relative p-8 text-center">
                  <div className="mb-6">
                    <TrendingUp className="h-16 w-16 text-tech-gold mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Special Launch Offer</h3>
                    <p className="text-muted-foreground">Limited time opportunity for new clients</p>
                  </div>
                  <div className="text-6xl font-bold text-transparent bg-gradient-to-r from-tech-gold to-tech-red bg-clip-text mb-4">
                    ₹49,999
                  </div>
                  <p className="text-xl text-muted-foreground mb-6">For 3 Months Complete Package</p>
                  <Button size="lg" className="bg-gradient-to-r from-tech-gold to-tech-red text-white hover:shadow-lg hover:shadow-tech-gold/50 px-8 py-3 rounded-full font-semibold">
                    Claim This Offer
                  </Button>
                  <p className="text-sm text-muted-foreground mt-4">*Limited spots available</p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Packages - Professional Redesign */}
      <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 font-['Space_Grotesk']">
                Digital Marketing <span className="text-gradient">Packages</span>
              </h2>
              <p className="text-xl text-tech-blue mb-4 font-semibold">Transparent Pricing • No Hidden Fees</p>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We recommend a minimum 3-month commitment for optimal results and measurable ROI
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
              {pricingPackages.map((pkg, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05, y: -10 }}
                  className={`relative group ${pkg.popular ? 'transform scale-105 z-10' : ''}`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20">
                      <div className="bg-gradient-to-r from-tech-gold to-tech-red text-white px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg">
                        <Star className="h-4 w-4" />
                        Most Popular
                      </div>
                    </div>
                  )}
                  
                  <Card className={`h-full relative overflow-hidden ${pkg.popular ? 'ring-2 ring-tech-gold shadow-2xl shadow-tech-gold/20' : 'hover:shadow-xl'} transition-all duration-500`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${pkg.color} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
                    
                    <CardHeader className="relative text-center pb-6">
                      <CardTitle className="text-2xl font-bold mb-2">{pkg.name}</CardTitle>
                      <p className="text-muted-foreground text-sm mb-6">{pkg.description}</p>
                      <div className="space-y-2">
                        <div className={`text-5xl font-bold bg-gradient-to-r ${pkg.color} bg-clip-text text-transparent`}>
                          {pkg.price}
                        </div>
                        <div className="text-muted-foreground">{pkg.period}</div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="relative">
                      <ul className="space-y-4 mb-8">
                        {pkg.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start gap-3">
                            <div className="w-5 h-5 bg-gradient-to-r from-tech-gold to-tech-green rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-sm text-foreground/90">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <Button 
                        className={`w-full ${pkg.popular ? 'bg-gradient-to-r from-tech-gold to-tech-red hover:shadow-lg hover:shadow-tech-gold/50' : 'bg-gradient-to-r from-tech-purple to-tech-blue hover:shadow-lg'} text-white font-semibold py-3 rounded-full transition-all duration-300 hover:scale-105`}
                        onClick={() => setActivePackage(pkg.name)}
                      >
                        Choose {pkg.name}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Additional Packages */}
            <motion.div variants={itemVariants}>
              <h3 className="text-3xl font-bold text-center mb-12">Additional Services</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {otherPackages.map((pkg, index) => (
                  <Card key={index} className="hover:shadow-lg hover:shadow-tech-blue/20 transition-all duration-300 group">
                    <CardContent className="p-6">
                      <h4 className="font-bold text-lg mb-2 group-hover:text-tech-blue transition-colors">{pkg.name}</h4>
                      <p className="text-muted-foreground text-sm mb-4">{pkg.description}</p>
                      <div className="text-2xl font-bold text-tech-blue mb-4">{pkg.price}<span className="text-sm text-muted-foreground"> {pkg.period}</span></div>
                      <ul className="space-y-2 text-sm">
                        {pkg.features.map((feature, fIndex) => (
                          <li key={fIndex} className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-tech-gold" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Custom Package Section - Enhanced */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h3 className="text-4xl font-bold mb-8">VA Custom Solutions</h3>
            <div className="bg-gradient-to-br from-tech-purple/10 via-tech-blue/10 to-tech-gold/10 rounded-3xl p-8 md:p-12 backdrop-blur-sm border border-tech-gold/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-tech-purple/5 to-tech-blue/5 animate-gradient-x"></div>
              <div className="relative">
                <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                  VAWs offers completely customized digital marketing packages, featuring solutions based on your specific priorities and needs. We develop <span className="font-bold text-tech-gold">Custom Software</span>, <span className="font-bold text-tech-blue">Advanced WebApps</span>, and <span className="font-bold text-tech-red">Innovative Physical Solutions</span> to supercharge your marketing events and campaigns.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="bg-gradient-to-r from-tech-purple via-tech-blue to-tech-gold text-white font-semibold px-8 py-4 rounded-full hover:shadow-lg hover:shadow-tech-purple/50">
                    Request Custom Package
                  </Button>
                  <Button variant="outline" size="lg" className="border-tech-gold text-tech-gold hover:bg-tech-gold hover:text-black font-semibold px-8 py-4 rounded-full">
                    Schedule Consultation
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section - Professional */}
      <section className="py-20 bg-gradient-to-br from-tech-purple/5 via-tech-blue/5 to-tech-gold/5">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h3 className="text-4xl font-bold text-center mb-16">Get In Touch</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <motion.div whileHover={{ y: -5 }}>
                <Card className="text-center hover:shadow-lg hover:shadow-tech-gold/20 transition-all duration-300 group">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-tech-gold to-tech-red rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                      <Phone className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="font-bold text-xl mb-4">Call Us</h4>
                    <p className="text-muted-foreground text-lg">9946882478</p>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div whileHover={{ y: -5 }}>
                <Card className="text-center hover:shadow-lg hover:shadow-tech-blue/20 transition-all duration-300 group">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-tech-blue to-tech-purple rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                      <Mail className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="font-bold text-xl mb-4">Email Us</h4>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">admin@varts.org</p>
                      <p className="text-muted-foreground">info.virtualarts@gmail.com</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div whileHover={{ y: -5 }}>
                <Card className="text-center hover:shadow-lg hover:shadow-tech-red/20 transition-all duration-300 group">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-tech-red to-tech-purple rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                      <MapPin className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="font-bold text-xl mb-4">Visit Us</h4>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">E-schoolbooks / Virtual Arts</p>
                      <p className="text-muted-foreground">Kundara, Kollam</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DigitalMarketing;
