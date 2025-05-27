import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Testimonial } from "@/types/database";
const Testimonials = () => {
  const [allTestimonials, setAllTestimonials] = useState<Testimonial[]>([]);
  const [featuredTestimonials, setFeaturedTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetchTestimonials();
  }, []);
  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await (supabase as any).from("testimonials").select("*").order("display_order", {
        ascending: true
      });
      if (error) {
        throw error;
      }
      if (data) {
        setAllTestimonials(data as Testimonial[]);
        const featured = (data as Testimonial[]).filter(testimonial => testimonial.is_featured);
        setFeaturedTestimonials(featured);
      }
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      setError("Failed to load testimonials");
    } finally {
      setLoading(false);
    }
  };
  const testimonialVariants = {
    hidden: {
      opacity: 0,
      x: -50
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: "easeInOut"
      }
    },
    exit: {
      opacity: 0,
      x: 50,
      transition: {
        duration: 0.3
      }
    }
  };
  if (loading) {
    return <section className="py-16 bg-background/50">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">What Our Clients Say</h2>
          <p className="text-muted-foreground">Loading testimonials...</p>
        </div>
      </section>;
  }
  if (error) {
    return <section className="py-16 bg-background/50">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">What Our Clients Say</h2>
          <p className="text-muted-foreground">
            Failed to load testimonials. Please try again later.
          </p>
        </div>
      </section>;
  }
  return <section className="bg-background/50 py-0">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8 font-['Space_Grotesk']">
          What Our Clients <span className="text-gradient">Say</span>
        </h2>
        
        {featuredTestimonials.length === 0 ? <div className="text-center">
            <p className="text-muted-foreground">No testimonials available.</p>
          </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredTestimonials.map(testimonial => <motion.div key={testimonial.id} className="bg-card rounded-lg shadow-md p-6 border border-muted/20" variants={testimonialVariants} initial="hidden" animate="visible" exit="exit">
                <div className="flex items-center mb-4">
                  {testimonial.image_url && <img src={testimonial.image_url} alt={testimonial.client_name} className="w-12 h-12 rounded-full object-cover mr-4" />}
                  <div>
                    <h3 className="text-lg font-semibold">{testimonial.client_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.client_position}{" "}
                      {testimonial.client_company && `at ${testimonial.client_company}`}
                    </p>
                  </div>
                </div>
                <div className="mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => <svg key={i} className="w-5 h-5 text-yellow-500 inline-block" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 0l2.928 6.028L20 6.951l-4.572 4.477L16.291 20 10 16.291 3.709 20l.863-8.572L0 6.951l7.072-.923L10 0z" clipRule="evenodd" />
                    </svg>)}
                </div>
                <p className="text-muted-foreground italic">
                  "{testimonial.message}"
                </p>
              </motion.div>)}
          </div>}
      </div>
    </section>;
};
export default Testimonials;