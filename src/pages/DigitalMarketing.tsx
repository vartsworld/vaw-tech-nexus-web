import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Check, ArrowRight, Megaphone, Target, TrendingUp, Users, Mail, Phone, MapPin,
  BarChart3, Lightbulb, Calendar, ShieldCheck, Sparkles, FileText, Handshake,
  FileSearch, ClipboardList, Clock, MapPinned, Crosshair
} from "lucide-react";
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

  const rightAdsPillars = [
    {
      icon: Crosshair,
      title: "Right Ads",
      desc: "Creatives crafted around real customer language, pain points and proof — not generic templates."
    },
    {
      icon: Clock,
      title: "Right Time",
      desc: "We deploy when your audience is actually scrolling, searching and ready to decide."
    },
    {
      icon: MapPinned,
      title: "Right Place",
      desc: "On the exact platforms your buyers trust — Meta, Google, YouTube, Instagram or local channels."
    },
    {
      icon: Target,
      title: "Right Audience",
      desc: "Tightly defined audience segments, not broad guesses, so every rupee works harder."
    }
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
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { y: 24, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" as const } }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SEO
        title="Digital Marketing Case Study & Strategy Consulting | VAW"
        description="No random ad packages. We do a real case study of your brand & market, then build a 3–6 month digital marketing strategy — Right Ads, Right Time, Right Place."
        keywords="digital marketing consulting, brand case study, marketing strategy Kerala, marketing audit, VAW Technologies, Varts"
        ogImage="/og/digital-marketing.png"
      />
      <ParticleBackground />
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-tech-purple/[0.04] via-transparent to-transparent"></div>
        <div className="container mx-auto px-4 relative">
          <motion.div
            className="max-w-5xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-tech-gold/30 bg-tech-gold/5 text-tech-gold text-xs font-medium mb-8 tracking-wider uppercase">
              <Sparkles className="h-3.5 w-3.5" />
              Strategy First · Spend Later
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 font-['Space_Grotesk'] leading-[1.05] tracking-tight">
              Digital Marketing
              <br />
              <span className="bg-gradient-to-r from-tech-gold via-tech-red to-tech-purple bg-clip-text text-transparent">
                Built On A Real Case Study
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed font-['Outfit']">
              We don't sell pre-packaged ad bundles. We do a complete case study on your business, brand
              and market — then deliver a focused <span className="text-foreground font-semibold">3 to 6 month strategy</span>,
              plan and budget that actually fits you.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 font-semibold px-8 h-12 rounded-full" asChild>
                <Link to="/service-request">
                  Book Case Study & Consulting
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="lg" className="font-medium px-6 h-12 rounded-full text-muted-foreground hover:text-foreground" asChild>
                <a href="#how-it-works">See How It Works →</a>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-8">
              Case study preparation charge <span className="text-foreground font-semibold">₹999</span> · Already have a recent one? We'll start with it.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Brands strip */}
      <section className="py-10 border-y border-muted/20">
        <div className="container mx-auto px-4">
          <p className="text-center text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
            Brands we're currently building with
          </p>
        </div>
        <ClientLogos />
      </section>

      {/* Right Ads, Right Time, Right Place */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants} className="text-center mb-16 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tech-blue/10 text-tech-blue text-xs font-medium mb-4 uppercase tracking-wider">
                <Target className="h-3.5 w-3.5" />
                Our Marketing Principle
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-5 font-['Space_Grotesk'] tracking-tight">
                Right Ads. Right Time.<br />
                <span className="text-gradient">Right Place.</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Marketing only works when all three line up. Anything less is just spending.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
              {rightAdsPillars.map((p, i) => {
                const Icon = p.icon;
                return (
                  <motion.div key={i} variants={itemVariants}>
                    <Card className="h-full bg-card border-muted/30 hover:border-tech-gold/40 hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="w-11 h-11 rounded-xl bg-foreground/5 border border-muted/20 flex items-center justify-center mb-5">
                          <Icon className="h-5 w-5 text-tech-gold" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2 font-['Space_Grotesk']">{p.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works / Case Study */}
      <section id="how-it-works" className="py-24 bg-muted/20 border-y border-muted/20">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants} className="text-center mb-14 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tech-purple/10 text-tech-purple text-xs font-medium mb-4 uppercase tracking-wider">
                <ClipboardList className="h-3.5 w-3.5" />
                The Case Study Process
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-5 font-['Space_Grotesk'] tracking-tight">
                What Goes Into Your <span className="text-gradient">Case Study</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                A documented breakdown of your brand, your market and a clear path forward — before a single rupee goes into ads.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {caseStudySteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.div key={index} variants={itemVariants}>
                    <Card className="h-full bg-background border-muted/30 hover:border-tech-gold/40 transition-all duration-300 relative overflow-hidden group">
                      <CardContent className="p-6 relative">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-tech-purple/15 to-tech-blue/15 border border-muted/20 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-tech-purple" />
                          </div>
                          <span className="text-xs font-mono text-muted-foreground/60">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold mb-2 font-['Space_Grotesk']">
                          {step.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust + Pricing */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto"
          >
            <motion.div variants={itemVariants}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tech-blue/10 text-tech-blue text-xs font-medium mb-4 uppercase tracking-wider">
                <ShieldCheck className="h-3.5 w-3.5" />
                Why Brands Trust Us
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-5 font-['Space_Grotesk'] tracking-tight">
                Honest Marketing.<br />
                <span className="text-gradient">No Cookie-Cutter Packages.</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Most agencies push you into a fixed monthly plan on day one. We do the opposite —
                we earn the right to spend your money by first proving we understand your business.
              </p>

              <div className="space-y-3">
                {trustPoints.map((p, i) => {
                  const Icon = p.icon;
                  return (
                    <div key={i} className="flex gap-4 p-4 rounded-xl bg-card border border-muted/20 hover:border-tech-gold/30 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-foreground/5 border border-muted/20 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4 w-4 text-tech-gold" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-0.5 text-sm">{p.title}</h4>
                        <p className="text-sm text-muted-foreground">{p.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="relative overflow-hidden bg-card border-muted/30">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-tech-gold via-tech-red to-tech-purple"></div>
                <CardContent className="p-8 md:p-10">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6">
                    <ClipboardList className="h-3.5 w-3.5" />
                    Case Study & Consulting
                  </div>
                  <h3 className="text-2xl font-bold mb-1 font-['Space_Grotesk']">
                    Start With A Real Plan
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    One-time case study preparation charge.
                  </p>

                  <div className="flex items-baseline gap-2 mb-8 pb-8 border-b border-muted/20">
                    <span className="text-6xl font-bold font-['Space_Grotesk'] tracking-tight">₹999</span>
                    <span className="text-sm text-muted-foreground">one-time</span>
                  </div>

                  <div className="space-y-3 mb-8">
                    {[
                      "Complete brand & market case study",
                      "3 to 6 month strategy document",
                      "Channel-wise plan & budget breakdown",
                      "1-on-1 consulting session"
                    ].map((f) => (
                      <div key={f} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-tech-gold/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="h-3 w-3 text-tech-gold" />
                        </div>
                        <span className="text-sm">{f}</span>
                      </div>
                    ))}
                  </div>

                  <Button size="lg" className="w-full bg-foreground text-background hover:bg-foreground/90 h-12 rounded-full font-semibold" asChild>
                    <Link to="/service-request">
                      Book Case Study Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>

                  <div className="mt-6 pt-6 border-t border-muted/20">
                    <p className="text-sm text-muted-foreground">
                      <span className="text-foreground font-semibold">Already have a recent case study?</span>{" "}
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
      <section className="py-24 bg-muted/20 border-y border-muted/20">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-5xl mx-auto"
          >
            <motion.div variants={itemVariants} className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 font-['Space_Grotesk'] tracking-tight">
                What We <span className="text-gradient">Deliver After</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Once your strategy is locked, our team executes it end-to-end.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {whatWeDo.map((service, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="flex items-center gap-4 p-4 rounded-xl bg-background border border-muted/20 hover:border-tech-gold/40 transition-all duration-300 group"
                >
                  <div className="w-9 h-9 rounded-lg bg-foreground/5 border border-muted/20 flex items-center justify-center flex-shrink-0 group-hover:bg-tech-gold/10 transition-colors">
                    <Check className="h-4 w-4 text-tech-gold" />
                  </div>
                  <span className="text-base font-medium">
                    {service}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <Megaphone className="h-12 w-12 text-tech-gold mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-bold mb-5 font-['Space_Grotesk'] tracking-tight">
              Ready For A Marketing Plan
              <br />
              <span className="text-gradient">That Actually Fits You?</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Book your case study and consulting call. We'll do the homework — you decide the next step.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 font-semibold px-8 h-12 rounded-full" asChild>
                <Link to="/service-request">
                  Book Case Study & Consulting
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="border-muted-foreground/30 font-medium px-8 h-12 rounded-full" asChild>
                <a href="tel:+919946882478">
                  <Phone className="mr-2 h-4 w-4" />
                  +91 9946882478
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 border-t border-muted/20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-3xl font-bold text-center mb-12 font-['Space_Grotesk'] tracking-tight">Get In Touch</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
              {[
                { icon: Phone, title: "Call Us", lines: ["+91 9946882478"] },
                { icon: Mail, title: "Email Us", lines: ["admin@varts.org", "info.virtualarts@gmail.com"] },
                { icon: MapPin, title: "Visit Us", lines: ["E-schoolbooks / Virtual Arts", "Kundara, Kollam"] },
              ].map((c, i) => {
                const Icon = c.icon;
                return (
                  <Card key={i} className="bg-card border-muted/30 hover:border-tech-gold/40 transition-all duration-300 group">
                    <CardContent className="p-6">
                      <div className="w-11 h-11 rounded-xl bg-foreground/5 border border-muted/20 flex items-center justify-center mb-4 group-hover:bg-tech-gold/10 transition-colors">
                        <Icon className="h-5 w-5 text-tech-gold" />
                      </div>
                      <h4 className="font-semibold text-base mb-2 font-['Space_Grotesk']">{c.title}</h4>
                      {c.lines.map((l) => (
                        <p key={l} className="text-sm text-muted-foreground">{l}</p>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DigitalMarketing;
