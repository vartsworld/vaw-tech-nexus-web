
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ConversationalForm from "@/components/ConversationalForm";
import ParticleBackground from "@/components/ParticleBackground";
import { useUser } from "@/context/UserContext";

const ServiceRequest = () => {
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
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 font-['Space_Grotesk']">
              Request Our <span className="text-gradient">Services</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-['Outfit']">
              Tell us about your project needs, and we'll help bring your vision to reality.
            </p>
          </div>
          
          <ConversationalForm />
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default ServiceRequest;
