
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-20 pb-20">
      <div className="container mx-auto px-4 z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight font-['Space_Grotesk']">
            <span className="text-gradient">Transforming Ideas</span><br />
            Into Digital Excellence
          </h1>
          
          <p className="text-xl md:text-2xl text-foreground/80 mb-10 max-w-3xl mx-auto font-['Outfit']">
            VAW Technologies delivers premium digital solutions that merge innovation with creativity, 
            from stunning websites to immersive AR/VR experiences.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/80 text-primary-foreground group">
              Our Services 
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" className="border-accent text-accent hover:bg-accent/10">
              Get in Touch
            </Button>
          </div>
          
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center">
              <span className="text-4xl font-bold text-accent">150+</span>
              <span className="text-muted-foreground">Projects Delivered</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-4xl font-bold text-accent">95%</span>
              <span className="text-muted-foreground">Client Satisfaction</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-4xl font-bold text-accent">10+</span>
              <span className="text-muted-foreground">Industries Served</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-4xl font-bold text-accent">24/7</span>
              <span className="text-muted-foreground">Support</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10"></div>
    </section>
  );
};

export default Hero;
