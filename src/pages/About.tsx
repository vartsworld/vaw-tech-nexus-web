import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Building2, Sparkles, Target, Lightbulb, Users2, ShieldCheck, Heart, Award } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SEO
        title="About Us | VAW Technologies"
        description="Learn about VAW Technologies, a premier subsidiary of V Arts World Pvt. Ltd., uniting human-centric art with technological innovation."
        keywords="about VAW Technologies, V Arts World Pvt Ltd, digital agency Kerala, human-centric innovation, software development, creative design"
      />
      <Navbar />

      {/* Hero Section */}
      <section className="pt-36 pb-20 px-4 relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-sm mb-6">
            <Building2 className="w-4 h-4 text-tech-gold" />
            <span>A Subsidiary of V Arts World Pvt. Ltd.</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black font-['Space_Grotesk'] tracking-tight mb-6 leading-tight">
            Human-Centric Art &<br />
            <span className="text-gradient">Technological Innovation</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto font-['Outfit']">
            VAW Technologies brings together artistic elegance and enterprise-grade software engineering to craft extraordinary digital products for businesses worldwide.
          </p>
        </div>
      </section>

      {/* Overview & Parentage */}
      <section className="py-16 px-4 bg-muted/5 border-y border-border/40">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold font-['Space_Grotesk'] mb-6">
                Our Parentage & Legacy
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                VAW Technologies operates as the digital technology and innovation arm of <strong className="text-foreground">V ARTS WORLD PVT. LTD.</strong> Established with a vision to redefine digital experiences, our philosophy centers on <span className="text-red-500 font-semibold">H</span>uman-centric <span className="text-red-500 font-semibold">A</span>rt and <span className="text-red-500 font-semibold">I</span>nnovations.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                We believe technology without art lacks soul, and art without technology lacks reach. By combining both, we construct digital platforms, AI tools, and marketing campaigns that resonate with users on a human level.
              </p>
              <div className="p-4 rounded-xl bg-card border border-primary/20 flex items-center gap-4">
                <img
                  src="/lovable-uploads/f3a836cc-e5eb-4f70-bc65-a5d8ea72f726.png"
                  alt="V Arts World Logo"
                  className="h-14 w-auto object-contain"
                />
                <div>
                  <h4 className="font-bold text-sm">V ARTS WORLD PVT. LTD.</h4>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-red-500 font-bold">H</span>uman-centric
                    <span className="text-red-500 font-bold"> A</span>rt and
                    <span className="text-red-500 font-bold"> I</span>nnovations
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-primary/20 shadow-2xl relative">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80"
                  alt="VAW Tech Collaboration"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="text-lg font-semibold text-white">"Empowering businesses through thoughtful code and inspiring design."</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars / Values */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-['Space_Grotesk'] mb-4">
              Our Core <span className="text-gradient">Pillars</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              The fundamental principles that guide every line of code we write and design we build.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-card border border-border/60 hover:border-primary/40 transition-all shadow-md">
              <div className="w-12 h-12 rounded-xl bg-tech-gold/10 text-tech-gold flex items-center justify-center mb-6">
                <Lightbulb className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-['Space_Grotesk'] mb-3">Relentless Innovation</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We stay ahead of technology curves—leveraging modern AI agents, WebXR spatial computing, and serverless architectures to deliver future-proof solutions.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-card border border-border/60 hover:border-primary/40 transition-all shadow-md">
              <div className="w-12 h-12 rounded-xl bg-tech-purple/10 text-tech-purple flex items-center justify-center mb-6">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-['Space_Grotesk'] mb-3">Human-Centric Focus</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Technology exists to serve human needs. Every user interface, workflow, and system architecture is optimized for intuitive simplicity and human delight.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-card border border-border/60 hover:border-primary/40 transition-all shadow-md">
              <div className="w-12 h-12 rounded-xl bg-tech-red/10 text-tech-red flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-['Space_Grotesk'] mb-3">Uncompromising Quality</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                From high-security web applications to precision marketing funnels, we adhere to rigorous enterprise standards and seamless delivery timelines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-muted/10 border-t border-border/40">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold font-['Space_Grotesk'] mb-4">
            Want to Collaborate or Work With Us?
          </h2>
          <p className="text-muted-foreground mb-8">
            Whether you need a custom digital transformation or want to join our team, we'd love to connect.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 rounded-xl" asChild>
              <Link to="/contact">Contact Our Team</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary/30 hover:bg-primary/10 font-semibold px-8 py-6 rounded-xl" asChild>
              <Link to="/careers">Explore Careers</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
