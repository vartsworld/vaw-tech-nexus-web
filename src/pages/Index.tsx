
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import About from "@/components/About";
import Portfolio from "@/components/Portfolio";
import TechStack from "@/components/TechStack";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import ParticleBackground from "@/components/ParticleBackground";
import Partners from "@/components/Partners";
import { useUser } from "@/context/UserContext";

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
      <ParticleBackground />
      <Navbar />
      {/* Tight grouping of Hero and Partners with no gap */}
      <div className="flex flex-col">
        <Hero />
        <Partners />
      </div>
      <Services />
      <TechStack />
      <About />
      <Portfolio />
      <Contact />
      <Footer />
    </div>
  );
};

export default Index;
