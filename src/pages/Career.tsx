import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Rocket, Zap, HeartHandshake, Code2, Megaphone, ArrowRight, Sparkles, Target, Trophy, Users } from "lucide-react";

const Career = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SEO
        title="Careers | Join VAW Technologies"
        description="Join our energetic team at VAW Technologies. Build groundbreaking AI, Web3, and digital marketing campaigns with total creative freedom."
        keywords="careers, jobs, software engineer jobs, digital marketing jobs, tech jobs Kerala, VAW careers, work with us"
      />
      <Navbar />

      {/* Hero Section */}
      <section className="pt-36 pb-20 px-4 relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-tech-gold/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-sm mb-6 animate-pulse">
            <Sparkles className="w-4 h-4 text-tech-gold" />
            <span>We're Hiring Young Innovators & Tech Mavericks!</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black font-['Space_Grotesk'] tracking-tight mb-6 leading-tight">
            Build The Future.<br />
            <span className="text-gradient">Unleash Your Potential.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto font-['Outfit'] mb-8">
            Tired of boring 9-to-5s and endless bureaucracy? At VAW Technologies, we build real-world products, run viral campaigns, and push the boundaries of AI, Web, and Marketing with total creative freedom.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-tech-gold/20 transition-all duration-300 group" asChild>
              <Link to="/team-application">
                <span>Apply Now</span>
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary/30 hover:bg-primary/10 font-medium text-lg px-8 py-6 rounded-xl" asChild>
              <a href="#why-us">Why Work With Us</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Work With Us Section */}
      <section id="why-us" className="py-20 px-4 bg-muted/5">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-['Space_Grotesk'] mb-4">
              Why Work <span className="text-gradient">With Us?</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We empower young creators, developers, and marketers to take ownership from Day 1.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-card border-border/60 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-tech-gold/10 text-tech-gold flex items-center justify-center mb-4">
                  <Rocket className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl font-bold font-['Space_Grotesk']">Zero Micromanagement</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                We focus on impact, output, and creativity—not clocking hours. You own your project and have the autonomy to make big decisions.
              </CardContent>
            </Card>

            <Card className="bg-card border-border/60 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-tech-purple/10 text-tech-purple flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl font-bold font-['Space_Grotesk']">Bleeding-Edge Tech</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Work directly with AI LLM agents, WebXR, modern full-stack frameworks, Web3 systems, and high-converting marketing tools.
              </CardContent>
            </Card>

            <Card className="bg-card border-border/60 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-tech-red/10 text-tech-red flex items-center justify-center mb-4">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl font-bold font-['Space_Grotesk']">Vibrant & Fun Culture</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                An energetic, high-octane environment with hackathons, game arcades, mentorship, dynamic rewards, and zero legacy toxicity.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What We Do In Tech & Marketing */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-['Space_Grotesk'] mb-4">
              What We Do <span className="text-gradient">In Tech & Marketing</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A high-impact fusion of futuristic software engineering and growth-focused marketing strategy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Tech Wing */}
            <div className="p-8 rounded-2xl bg-card border border-primary/20 hover:border-primary/40 transition-all shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <Code2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold font-['Space_Grotesk']">Tech & Engineering</h3>
                  <p className="text-sm text-muted-foreground">Building scalable digital experiences</p>
                </div>
              </div>
              <ul className="space-y-3 text-muted-foreground mb-8">
                <li className="flex items-start gap-2">
                  <span className="text-tech-gold font-bold">✓</span>
                  <span><strong className="text-foreground">Full-Stack Web Applications:</strong> High-performance React, Node, Python, and cloud infrastructure.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-tech-gold font-bold">✓</span>
                  <span><strong className="text-foreground">AI & Machine Learning:</strong> Custom LLM workflows, automated AI agents, and intelligent chatbots.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-tech-gold font-bold">✓</span>
                  <span><strong className="text-foreground">Immersive Tech (VR/AR):</strong> WebXR spatial experiences and interactive 3D product showcases.</span>
                </li>
              </ul>
            </div>

            {/* Marketing Wing */}
            <div className="p-8 rounded-2xl bg-card border border-accent/20 hover:border-accent/40 transition-all shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-accent/10 text-accent">
                  <Megaphone className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold font-['Space_Grotesk']">Digital Marketing</h3>
                  <p className="text-sm text-muted-foreground">Driving exponential ROI & brand growth</p>
                </div>
              </div>
              <ul className="space-y-3 text-muted-foreground mb-8">
                <li className="flex items-start gap-2">
                  <span className="text-tech-gold font-bold">✓</span>
                  <span><strong className="text-foreground">Performance Marketing:</strong> Precision ad campaigns across Meta, Google, and LinkedIn with high conversion metrics.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-tech-gold font-bold">✓</span>
                  <span><strong className="text-foreground">Viral Content & Branding:</strong> Modern short-form videos, motion design, and brand storytelling.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-tech-gold font-bold">✓</span>
                  <span><strong className="text-foreground">SEO & Growth Hacking:</strong> Data-driven organic reach strategies for tech and e-commerce leaders.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 border-y border-primary/20">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-black font-['Space_Grotesk'] mb-4">
            Ready to Take the Leap?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            We are constantly looking for talented developers, designers, content creators, and growth hackers. Join our mission at VAW Technologies!
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-10 py-6 rounded-xl shadow-xl hover:scale-105 transition-all duration-300" asChild>
            <Link to="/team-application">
              Apply Now For Team Roles
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Career;
