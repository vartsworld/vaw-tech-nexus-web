import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import ContactForm from "@/components/ContactForm";
import { Mail, Phone, MapPin, Globe, ExternalLink, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const Contact = () => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SEO
        title="Contact Us | VAW Technologies"
        description="Get in touch with VAW Technologies. Connect with our engineering and digital marketing teams for your custom solution."
        keywords="contact VAW Technologies, hello@vawtech.in, tech inquiry Kerala, web development contact, marketing agency contact"
      />
      <Navbar />

      <section className="pt-36 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-5xl font-bold font-['Space_Grotesk'] mb-4">
              Get In <span className="text-gradient">Touch</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-['Outfit']">
              Have a project in mind, need a custom software solution, or want to discuss digital strategy? Reach out to our team today.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Form Container */}
            <div className="lg:col-span-2">
              <div className="bg-card border border-border/60 rounded-2xl p-8 shadow-xl">
                <h2 className="text-2xl font-bold mb-6 font-['Space_Grotesk']">Send Us A Message</h2>
                <ContactForm />
              </div>
            </div>

            {/* Contact Info Sidebar */}
            <div>
              <div className="bg-card border border-border/60 rounded-2xl p-8 shadow-xl h-full flex flex-col justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-8 font-['Space_Grotesk']">Contact Info</h2>

                  <div className="space-y-8">
                    {/* Email */}
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1">Email Us</h3>
                        <a href="mailto:hello@vawtech.in" className="text-foreground font-semibold hover:text-primary transition-colors block">
                          hello@vawtech.in
                        </a>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1">Phone / WhatsApp</h3>
                        <p className="text-foreground font-semibold mb-2">+91 8281543610</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 border-green-500/50 text-green-600 dark:text-green-400 hover:bg-green-500 hover:text-white"
                          onClick={() => window.open("https://wa.me/918281543610", "_blank")}
                        >
                          <MessageSquare className="w-4 h-4" />
                          Chat on WhatsApp
                        </Button>
                      </div>
                    </div>

                    {/* Marketing Site */}
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-accent/10 text-accent shrink-0">
                        <Globe className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1">Marketing Portal</h3>
                        <a
                          href="https://marketing.vawtech.in"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-accent font-semibold hover:underline"
                        >
                          marketing.vawtech.in
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1">Office Address</h3>
                        <p className="text-foreground text-sm leading-relaxed">
                          V Arts World Pvt. Ltd.<br />
                          Kerala, India
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Working Hours */}
                <div className="mt-10 pt-6 border-t border-border/40">
                  <h3 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-2">Working Hours</h3>
                  <p className="text-sm text-foreground">Monday - Saturday: 9:00 AM - 6:00 PM IST</p>
                  <p className="text-sm text-muted-foreground">Sunday: Closed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
