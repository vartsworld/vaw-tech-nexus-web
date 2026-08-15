
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
        title="VAW Technologies | Best Website Development & Digital Marketing Agency in Kerala"
        description="VAW Technologies (Varts World) is the best website development and digital marketing agency in Kerala. We build high-converting websites, web apps, AI tools & ROI-driven marketing campaigns."
        keywords="best website development agency in kerala, best digital marketing agency in kerala, web development Kerala, digital marketing agency Kerala, website design Kerala, VAW Technologies, Varts World, web app development Kerala, SEO agency Kerala"
        ogImage="/og/home.png"
        ogImageAlt="VAW Technologies - Best Website Development & Digital Marketing Agency in Kerala"
      />
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
