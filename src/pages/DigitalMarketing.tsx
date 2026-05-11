import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Megaphone, Target, TrendingUp, Users, Mail, Phone, MapPin, BarChart3, Globe, Zap, Shield, Award, PlayCircle, FileSearch, ClipboardList, Lightbulb, Calendar, ShieldCheck, Sparkles, FileText, Handshake } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ParticleBackground from "@/components/ParticleBackground";
import ClientLogos from "@/components/ClientLogos";
import { motion } from "framer-motion";
import SEO from "@/components/SEO";

const DigitalMarketing = () => {
  const caseStudySteps = [
    { icon: FileSearch, title: "Deep Brand Audit", desc: "We study your brand DNA, positioning, current presence and customer perception." },
    { icon: BarChart3, title: "Market & Competitor Analysis", desc: "Industry trends, competitor playbooks, gaps and opportunities mapped clearly." },
    { icon: Users, title: "Audience Research", desc: "Who actually buys from you, where they hang out, what makes them act." },
    { icon: Lightbulb, title: "Strategy Blueprint", desc: "A 3 to 6 month digital marketing roadmap with channels, content & campaigns." },
    { icon: Calendar, title: "Budget & Timeline Plan", desc: "Realistic spend, monthly targets and a clear execution calendar." },
    { icon: TrendingUp, title: "Growth Forecast", desc: "Projected reach, lead flow and ROI based on real data, not guesses." }
  ];

  const trustPoints = [
    { icon: ShieldCheck, title: "No Random Packages", desc: "Every plan is built only after we understand your business." },
    { icon: FileText, title: "Documented Strategy", desc: "You walk away with a real case study document, not a sales pitch." },
    { icon: Handshake, title: "Honest Budgeting", desc: "We tell you what to spend, where, and why — even if it's less." },
    { icon: Sparkles, title: "Use Your Existing Research", desc: "Already have a recent case study? We start from there. No double charge." }
  ];

  const whatWeDo = [
    "Digital Marketing Consultation",
    "Brand & Market Case Study",
    "Social Media Strategy",
    "SEO Consulting & Optimization",
    "Paid Advertising Planning",
    "Video & Content Strategy",
    "Event & Launch Planning",
    "Sales Boost Programs"
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" as const } }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SEO
        title="Digital Marketing Case Study & Strategy Consulting | VAW"
        description="We don't sell random marketing packages. We start with a deep case study of your brand & market, then build a 3–6 month digital marketing strategy, plan and budget."
        keywords="digital marketing consulting, brand case study, marketing strategy Kerala, marketing audit, VAW Technologies, Varts"
        ogImage="/og/digital-marketing.png"
      />
      <ParticleBackground />
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-tech-purple/5 via-tech-blue/5 to-tech-gold/5"></div>
        <div className="container mx-auto px-4 relative">
          <motion.div
            className="text-center max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-tech-purple via-tech-blue to-tech-gold rounded-full blur-lg opacity-30 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-tech-purple to-tech-blue p-6 rounded-full">
                  <Megaphone className="h-16 w-16 text-white" />
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-tech-gold/30 bg-tech-gold/5 text-tech-gold text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Strategy First. Spend Later.
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 font-['Space_Grotesk'] leading-tight">
              Digital Marketing
              <br />
              <span className="bg-gradient-to-r from-tech-gold via-tech-red to-tech-purple bg-clip-text text-transparent">
                Built On A Real Case Study
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
              We don't sell pre-packaged ad bundles. We do a complete case study on your business, brand
              and market potential — then prepare a focused <span className="text-tech-gold font-semibold">3 to 6 month digital marketing strategy</span>,
              plan and budget that actually fits you.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-tech-purple to-tech-blue hover:from-tech-blue hover:to-tech-purple text-white font-semibold px-8 py-4 rounded-full shadow-lg" asChild>
                <Link to="/service-request">
                  Book Case Study & Consulting
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="border-tech-gold text-tech-gold hover:bg-tech-gold hover:text-black font-semibold px-8 py-4 rounded-full" asChild>
                <a href="#how-it-works">See How It Works</a>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-6">
              Case study preparation charge <span className="text-foreground font-semibold">₹999</span> · Already have a recent case study? We'll start with it.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Brands We're Currently Working With */}
      <section className="py-12 border-y border-muted/20 bg-muted/10">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm uppercase tracking-[0.3em] text-muted-foreground mb-2">
            Brands we're currently building with
          </p>
        </div>
        <ClientLogos />
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants} className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 font-['Space_Grotesk']">
                What Goes Into Your <span className="text-gradient">Case Study</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                A complete, documented breakdown of your brand, your market and a marketing path forward —
                before a single rupee goes into ads.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {caseStudySteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.div key={index} variants={itemVariants} whileHover={{ y: -6 }}>
                    <Card className="h-full bg-card/50 backdrop-blur-sm border-muted/20 hover:border-tech-gold/50 transition-all duration-500 hover:shadow-xl hover:shadow-tech-gold/10 relative overflow-hidden group">
                      <div className="absolute top-4 right-4 text-6xl font-bold text-muted/10 group-hover:text-tech-gold/10 transition-colors">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <CardContent className="p-6 relative">
                        <div className="w-12 h-12 bg-gradient-to-r from-tech-purple to-tech-blue rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 group-hover:text-tech-gold transition-colors">
                          {step.title}
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <motion.div variants={itemVariants}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tech-blue/10 text-tech-blue text-sm font-medium mb-4">
                <ShieldCheck className="h-4 w-4" />
                Why Brands Trust Us
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 font-['Space_Grotesk']">
                Honest Marketing.<br />
                <span className="text-gradient">No Cookie-Cutter Packages.</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Most agencies push you into a fixed monthly plan on day one. We do the opposite —
                we earn the right to spend your money by first proving we understand your business.
              </p>

              <div className="space-y-4">
                {trustPoints.map((p, i) => {
                  const Icon = p.icon;
                  return (
                    <div key={i} className="flex gap-4 p-4 rounded-xl bg-card/50 border border-muted/20 hover:border-tech-gold/30 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-tech-gold to-tech-red flex items-center justify-center flex-shrink-0">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">{p.title}</h4>
                        <p className="text-sm text-muted-foreground">{p.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="relative overflow-hidden bg-gradient-to-br from-tech-purple/15 via-tech-blue/15 to-tech-gold/15 border-tech-gold/30">
                <div className="absolute inset-0 bg-gradient-to-br from-tech-gold/5 to-tech-red/5 animate-gradient-x"></div>
                <CardContent className="relative p-8 md:p-10 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tech-gold/15 text-tech-gold text-xs font-semibold mb-6 uppercase tracking-wider">
                    <ClipboardList className="h-3.5 w-3.5" />
                    Case Study & Consulting
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4">
                    Start With A Real Plan
                  </h3>
                  <div className="text-6xl md:text-7xl font-bold text-transparent bg-gradient-to-r from-tech-gold to-tech-red bg-clip-text mb-2">
                    ₹999
                  </div>
                  <p className="text-muted-foreground mb-6">
                    One-time case study preparation charge.
                  </p>

                  <div className="text-left space-y-3 mb-8 bg-background/40 rounded-xl p-5 border border-muted/20">
                    {[
                      "Complete brand & market case study",
                      "3 to 6 month strategy document",
                      "Channel-wise plan & budget",
                      "1-on-1 consulting session"
                    ].map((f) => (
                      <div key={f} className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-gradient-to-r from-tech-gold to-tech-red rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-sm">{f}</span>
                      </div>
                    ))}
                  </div>

                  <Button size="lg" className="w-full bg-gradient-to-r from-tech-gold to-tech-red text-white hover:shadow-lg hover:shadow-tech-gold/50 py-3 rounded-full font-semibold" asChild>
                    <Link to="/service-request">
                      Book Case Study Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>

                  <div className="mt-6 pt-6 border-t border-muted/20">
                    <p className="text-sm text-muted-foreground">
                      <span className="text-foreground font-semibold">Already have a recent case study?</span><br />
                      Share it with us — we'll skip the ₹999 and start straight from your existing research.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* What We Deliver */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-5xl mx-auto"
          >
            <motion.div variants={itemVariants} className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 font-['Space_Grotesk']">
                What We <span className="text-gradient">Deliver After</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Once your strategy is locked, our team executes it end-to-end.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {whatWeDo.map((service, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-tech-gold/10 to-transparent hover:from-tech-gold/20 transition-all duration-300 group cursor-pointer"
                  whileHover={{ x: 8 }}
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-tech-gold to-tech-red rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-base md:text-lg font-medium group-hover:text-tech-gold transition-colors">
                    {service}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-tech-purple/10 via-tech-blue/10 to-tech-gold/10">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 font-['Space_Grotesk']">
              Ready For A Marketing Plan
              <br />
              <span className="text-gradient">That Actually Fits You?</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Book your case study and consulting call. We'll do the homework, you decide the next step.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-tech-purple via-tech-blue to-tech-gold text-white font-semibold px-8 py-4 rounded-full hover:shadow-lg hover:shadow-tech-purple/50" asChild>
                <Link to="/service-request">
                  Book Case Study & Consulting
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="border-tech-gold text-tech-gold hover:bg-tech-gold hover:text-black font-semibold px-8 py-4 rounded-full" asChild>
                <a href="tel:+919946882478">
                  <Phone className="mr-2 h-4 w-4" />
                  Call +91 9946882478
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h3 className="text-3xl md:text-4xl font-bold text-center mb-12 font-['Space_Grotesk']">Get In Touch</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <Card className="text-center hover:shadow-lg hover:shadow-tech-gold/20 transition-all duration-300 group">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-tech-gold to-tech-red rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Phone className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="font-bold text-xl mb-4">Call Us</h4>
                  <p className="text-muted-foreground text-lg">+91 9946882478</p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg hover:shadow-tech-blue/20 transition-all duration-300 group">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-tech-blue to-tech-purple rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Mail className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="font-bold text-xl mb-4">Email Us</h4>
                  <p className="text-muted-foreground">admin@varts.org</p>
                  <p className="text-muted-foreground">info.virtualarts@gmail.com</p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg hover:shadow-tech-red/20 transition-all duration-300 group">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-tech-red to-tech-purple rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <MapPin className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="font-bold text-xl mb-4">Visit Us</h4>
                  <p className="text-muted-foreground">E-schoolbooks / Virtual Arts</p>
                  <p className="text-muted-foreground">Kundara, Kollam</p>
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
