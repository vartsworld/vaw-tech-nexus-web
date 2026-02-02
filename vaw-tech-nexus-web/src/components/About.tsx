
import { Button } from "@/components/ui/button";

const About = () => {
  return (
    <section id="about" className="py-20 bg-muted/10 relative">
      <div className="container mx-auto px-4">
        <div className="flex flex-col-reverse md:flex-row gap-12 items-center">
          <div className="md:w-1/2">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold font-['Space_Grotesk']">
                About <span className="text-gradient">VAW Technologies</span>
              </h2>
              
              <p className="text-lg text-foreground/80">
                VAW Technologies is a premium digital solutions provider and a proud subsidiary of 
                V Arts World Pvt Ltd. We blend cutting-edge technology with creative excellence 
                to deliver transformative digital experiences that help businesses thrive in the digital age.
              </p>
              
              <p className="text-lg text-foreground/80">
                Our expert team of developers, designers, and strategists work collaboratively
                to bring your vision to life, creating tailor-made solutions that align with your 
                business goals and exceed expectations.
              </p>
              
              <div className="pt-4">
                <h3 className="text-xl font-semibold mb-3">Why Choose Us?</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3 mt-0.5">✓</div>
                    <span className="text-foreground/80">Industry-leading expertise across multiple technology domains</span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3 mt-0.5">✓</div>
                    <span className="text-foreground/80">Commitment to innovation and cutting-edge solutions</span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3 mt-0.5">✓</div>
                    <span className="text-foreground/80">Client-focused approach with dedicated support</span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3 mt-0.5">✓</div>
                    <span className="text-foreground/80">Proven track record of successful project deliveries</span>
                  </li>
                </ul>
              </div>
              
              <div className="pt-4">
                <Button className="bg-primary hover:bg-primary/80 text-primary-foreground">
                  Learn More About Us
                </Button>
              </div>
            </div>
          </div>
          
          <div className="md:w-1/2 relative">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 border border-primary/20">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 z-0"></div>
              <img 
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158" 
                alt="Team at VAW Technologies" 
                className="w-full h-full object-cover rounded-2xl mix-blend-luminosity opacity-80"
              />
              
              <div className="absolute top-6 right-6 bg-background/80 backdrop-blur-sm p-3 rounded-lg shadow-lg">
                <p className="font-semibold">Established</p>
                <p className="text-2xl font-bold text-accent">2019</p>
              </div>
            </div>
            
            <div className="absolute -bottom-5 -left-5 bg-card p-4 rounded-lg shadow-lg border border-accent/20 max-w-xs">
              <p className="text-foreground/80 text-sm">
                "Our mission is to bridge the gap between technological innovation and creative excellence."
              </p>
              <p className="text-accent font-semibold mt-2">— Founder, VAW Technologies</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
