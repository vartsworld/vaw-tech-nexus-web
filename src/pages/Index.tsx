
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import MobileHeader from "@/components/MobileHeader";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import About from "@/components/About";
import Portfolio from "@/components/Portfolio";
import TechStack from "@/components/TechStack";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import ParticleBackground from "@/components/ParticleBackground";
import Partners from "@/components/Partners";
import Testimonials from "@/components/Testimonials";
import { useUser } from "@/context/UserContext";
import SEO from "@/components/SEO";

const Index = () => {
  const { hasCompletedIntro } = useUser();

  useEffect(() => {
    // Scroll to top on page load
    window.scrollTo(0, 0);
  }, []);

  // Don't render the page content until intro is completed
  if (!hasCompletedIntro) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SEO
        title="Premium Tech Solutions & Web Development"
        description="VAW Technologies (V Arts World) - Your partner for premium website development, AI solutions, digital marketing, and app development in Kerala, India. Expert in Varts, VAW, and Virtual Arts."
        keywords="VAW, Varts, virtual arts, Kerala dev, Kerala hackathon, india dev, web development, designing, marketing, App development, Ai tool development, Advertisement, tech agency kerala, VAW Technologies"
      />
      <ParticleBackground />
      <Navbar />
      <MobileHeader />
      {/* Tight grouping of Hero and Partners with no gap */}
      <div className="flex flex-col">
        <Hero />
        <Partners />
      </div>
      <Services />
      <TechStack />
      <Testimonials />
      <About />
      <Portfolio />
      <Contact />
      <Footer />
    </div>
  );
};

export default Index;
