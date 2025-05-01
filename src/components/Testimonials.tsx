
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";
import { Star } from "lucide-react";

interface Testimonial {
  id: string;
  client_name: string;
  client_position: string | null;
  client_company: string | null;
  message: string;
  rating: number;
  image_url: string | null;
  is_featured: boolean;
}

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const { data, error } = await supabase
          .from("testimonials")
          .select("*")
          .order("display_order", { ascending: true });

        if (error) {
          throw error;
        }

        // Filter out non-featured testimonials if there are featured ones
        const featuredTestimonials = data.filter((t) => t.is_featured);
        
        if (featuredTestimonials.length > 0) {
          setTestimonials(featuredTestimonials);
        } else {
          setTestimonials(data);
        }
      } catch (error) {
        console.error("Error fetching testimonials:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  // If no testimonials found and not loading, don't render the component
  if (testimonials.length === 0 && !loading) {
    return null;
  }

  const renderRatingStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <section id="testimonials" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-['Space_Grotesk']">
            Client <span className="text-gradient">Testimonials</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-['Outfit']">
            See what our clients have to say about working with us
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <p>Loading testimonials...</p>
            </div>
          ) : (
            <Carousel className="w-full">
              <CarouselContent>
                {testimonials.map((testimonial) => (
                  <CarouselItem key={testimonial.id}>
                    <div className="bg-card border border-muted/20 rounded-xl p-8 shadow-lg mb-1">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center">
                          {testimonial.image_url ? (
                            <img
                              src={testimonial.image_url}
                              alt={testimonial.client_name}
                              className="h-14 w-14 rounded-full object-cover mr-4"
                            />
                          ) : (
                            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                              <span className="text-xl font-bold text-primary">
                                {testimonial.client_name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div>
                            <h4 className="text-lg font-semibold">
                              {testimonial.client_name}
                            </h4>
                            <p className="text-muted-foreground">
                              {testimonial.client_position &&
                                `${testimonial.client_position}${
                                  testimonial.client_company ? " at " : ""
                                }`}
                              {testimonial.client_company}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {renderRatingStars(testimonial.rating)}
                        </div>
                      </div>

                      <blockquote className="text-lg italic relative">
                        <span className="text-4xl text-primary/20 font-serif absolute -top-4 -left-2">
                          "
                        </span>
                        <p className="relative z-10 pl-4">{testimonial.message}</p>
                        <span className="text-4xl text-primary/20 font-serif absolute bottom-0 right-0">
                          "
                        </span>
                      </blockquote>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex justify-center gap-4 mt-8">
                <CarouselPrevious className="relative inset-auto" />
                <CarouselNext className="relative inset-auto" />
              </div>
            </Carousel>
          )}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
